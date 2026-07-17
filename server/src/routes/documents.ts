import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { uploadSecure } from '../middleware/upload';

const router = Router();
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

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
      'INSERT INTO documents (application_id, user_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)',
      [appId, req.user.id, file.filename, file.originalname, file.mimetype, file.size]
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
  } catch (err) {
    console.error(err);
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
     res.status(500).json({ error: 'Internal server error' });
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
      'SELECT id, application_id, user_id, original_name, mime_type, size, is_approved, created_at FROM documents WHERE application_id = ? ORDER BY created_at DESC',
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

    const filePath = path.join(UPLOADS_DIR, doc.filename);
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

export default router;
