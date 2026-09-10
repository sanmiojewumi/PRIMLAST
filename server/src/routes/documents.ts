import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getDb } from '../db';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { uploadSecure } from '../middleware/upload';
import { getUploadsDir } from '../uploadsPath';

const router = Router();

// Log audit helper
async function logAudit(userId: number | null, action: string, details: string, ip: string | undefined) {
  try {
    const db = await getDb();
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, details, ip || 'unknown']
    );
  } catch (err) {
    console.error(err);
  }
}

// UPLOAD DOCUMENT
router.post('/upload', authenticateJWT as any, (req, res, next) => {
  // Use multer upload wrapper
  uploadSecure.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const { application_id } = req.body;
  const file = req.file;

  if (!application_id || !file) {
     res.status(400).json({ error: 'Application ID and file are required' });
     return;
  }

  const appId = parseInt(application_id);

  try {
    const db = await getDb();
    
    // Check if application exists
    const app = await db.get('SELECT client_id FROM applications WHERE id = ?', [appId]);
    if (!app) {
      // Remove file if database record fails
      fs.unlinkSync(file.path);
       res.status(404).json({ error: 'Associated application not found' });
       return;
    }

    // Auth check: Clients can only upload to their own applications
    if (req.user.role === 'client' && app.client_id !== req.user.id) {
      fs.unlinkSync(file.path);
       res.status(403).json({ error: 'Forbidden: You cannot upload files for this application' });
       return;
    }

    // Save metadata to DB
    const result = await db.run(
      'INSERT INTO documents (application_id, user_id, filename, original_name, mime_type, size, kind) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [appId, req.user.id, file.filename, file.originalname, file.mimetype || 'application/octet-stream', file.size, 'file']
    );

    const docId = result.lastID;
    await logAudit(
      req.user.id,
      'DOCUMENT_UPLOAD',
      `Uploaded document ${docId} (${file.originalname}) for application ${appId}`,
      req.ip
    );

     res.status(201).json({
      id: docId,
      filename: file.filename,
      originalName: file.originalname,
      message: 'File uploaded successfully'
    });
  } catch (err: any) {
    console.error('Document upload failed:', err);
    try {
      const db = await getDb();
      const result = await db.run(
        'INSERT INTO documents (application_id, user_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)',
        [appId, req.user.id, file.filename, file.originalname, file.mimetype || 'application/octet-stream', file.size]
      );
      res.status(201).json({
        id: result.lastID,
        filename: file.filename,
        originalName: file.originalname,
        message: 'File uploaded successfully'
      });
      return;
    } catch (fallbackErr) {
      console.error('Document upload fallback failed:', fallbackErr);
    }
    if (file && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    }
    res.status(500).json({ error: 'Could not save the uploaded file. Please try a JPG, PNG, or PDF under 15MB.' });
  }
});

// LIST DOCUMENTS FOR APPLICATION
router.get('/application/:appId', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const appId = parseInt(req.params.appId as string);
  const { id: userId, role } = req.user;

  try {
    const db = await getDb();
    
    // Check app ownership
    const app = await db.get('SELECT client_id FROM applications WHERE id = ?', [appId]);
    if (!app) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }

    if (role === 'client' && app.client_id !== userId) {
       res.status(403).json({ error: 'Forbidden: You cannot access documents for this application' });
       return;
    }

    const docs = await db.all(
      'SELECT id, application_id, user_id, filename, original_name, mime_type, size, is_approved, kind, created_at FROM documents WHERE application_id = ? ORDER BY created_at DESC',
      [appId]
    );

     res.status(200).json(docs);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// DOWNLOAD DOCUMENT
router.get('/download/:id', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const docId = parseInt(req.params.id as string);
  const { id: userId, role } = req.user;

  try {
    const db = await getDb();
    const doc = await db.get('SELECT * FROM documents WHERE id = ?', [docId]);

    if (!doc) {
       res.status(404).json({ error: 'Document not found' });
       return;
    }

    // Verify application access
    const app = await db.get('SELECT client_id FROM applications WHERE id = ?', [doc.application_id]);
    if (!app) {
       res.status(404).json({ error: 'Associated application not found' });
       return;
    }

    if (role === 'client' && app.client_id !== userId) {
       res.status(403).json({ error: 'Forbidden: You do not have access to this document' });
       return;
    }

    const filePath = path.join(getUploadsDir(), doc.filename);
    if (!fs.existsSync(filePath)) {
       res.status(410).json({ error: 'File is no longer available on the server' });
       return;
    }

    await logAudit(
      req.user.id,
      'DOCUMENT_DOWNLOAD',
      `Downloaded document ID ${docId} (original name: ${doc.original_name})`,
      req.ip
    );

    // Secure file delivery: Set Content-Disposition and send the file
    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// APPROVE/REJECT DOCUMENT (For staff review)
router.put('/:id/approve', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user || req.user.role === 'client') {
     res.status(403).json({ error: 'Forbidden: Staff access only' });
     return;
  }

  const docId = parseInt(req.params.id as string);
  const { approved } = req.body; // 0 or 1

  try {
    const db = await getDb();
    const doc = await db.get('SELECT id FROM documents WHERE id = ?', [docId]);

    if (!doc) {
       res.status(404).json({ error: 'Document not found' });
       return;
    }

    await db.run('UPDATE documents SET is_approved = ? WHERE id = ?', [approved ? 1 : 0, docId]);
    await logAudit(
      req.user.id,
      'DOCUMENT_APPROVE',
      `Document ID ${docId} approved status set to: ${approved}`,
      req.ip
    );

     res.status(200).json({ message: 'Document approval status updated' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// SAVE CLIENT SIGNATURE (PNG data URL) alongside application documents
router.post('/signature', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const applicationId = parseInt(req.body?.application_id, 10);
  const image = String(req.body?.image || '');
  const match = image.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);

  if (!applicationId || !match) {
    res.status(400).json({ error: 'Application ID and PNG signature are required' });
    return;
  }

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length < 80 || buffer.length > 2 * 1024 * 1024) {
    res.status(400).json({ error: 'Signature image is invalid or too large' });
    return;
  }

  try {
    const db = await getDb();
    const app = await db.get('SELECT client_id FROM applications WHERE id = ?', [applicationId]);
    if (!app) {
      res.status(404).json({ error: 'Associated application not found' });
      return;
    }

    if (req.user.role === 'client' && app.client_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: You cannot sign this application' });
      return;
    }

    const filename = `${crypto.randomUUID()}.png`;
    const filePath = path.join(getUploadsDir(), filename);
    fs.writeFileSync(filePath, buffer);

    const result = await db.run(
      'INSERT INTO documents (application_id, user_id, filename, original_name, mime_type, size, kind) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [applicationId, req.user.id, filename, 'Client Signature.png', 'image/png', buffer.length, 'signature']
    );

    await db.run(
      'INSERT INTO signatures (application_id, user_id, document_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [applicationId, req.user.id, result.lastID]
    );

    await logAudit(
      req.user.id,
      'SIGNATURE_CAPTURE',
      `Captured client signature for application ${applicationId}`,
      req.ip
    );

    res.status(201).json({
      id: result.lastID,
      filename,
      originalName: 'Client Signature.png',
      message: 'Signature saved'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
