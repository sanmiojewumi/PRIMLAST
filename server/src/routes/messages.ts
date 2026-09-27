import { Router, Response } from 'express';
import { getDb, sendNotificationEmail } from '../db';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';
import { notifyUser } from '../lib/notify';

const router = Router();

const staffChatRoles = ['admin', 'supervisor', 'operations_officer', 'compliance_officer'] as const;

const staffOnly = requireRole([...staffChatRoles]) as any;

async function searchClients(req: AuthRequest, res: Response) {
  const q = String(req.query.q || '').trim().slice(0, 80);
  try {
    const db = await getDb();
    const like = `%${q.replace(/[%_]/g, '')}%`;
    const params: any[] = [];
    let where = `u.role = 'client' AND u.status = 'active'`;
    if (q) {
      where += ` AND (u.name LIKE ? COLLATE NOCASE OR u.email LIKE ? COLLATE NOCASE OR IFNULL(p.phone,'') LIKE ?)`;
      params.push(like, like, like);
    }
    const clients = await db.all(
      `SELECT u.id, u.name, u.email, u.status, u.created_at, p.phone,
              (SELECT COUNT(*) FROM applications a WHERE a.client_id = u.id) as app_count,
              (SELECT a.id FROM applications a WHERE a.client_id = u.id ORDER BY a.updated_at DESC LIMIT 1) as latest_app_id
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE ${where}
       ORDER BY u.name ASC
       LIMIT 40`,
      params
    );
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not search clients' });
  }
}

async function openClientChat(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const clientId = parseInt(String(req.body?.client_id ?? req.query.client_id ?? ''), 10);
  if (!Number.isFinite(clientId)) {
    res.status(400).json({ error: 'Client is required' });
    return;
  }
  try {
    const db = await getDb();
    const client = await db.get<{ id: number; name: string; email: string }>(
      `SELECT id, name, email FROM users WHERE id = ? AND role = 'client' AND status = 'active'`,
      [clientId]
    );
    if (!client) {
      res.status(404).json({ error: 'Registered client account not found' });
      return;
    }

    let app = await db.get(
      `SELECT a.*, u.name as client_name, staff.name as assignee_name
       FROM applications a
       LEFT JOIN users u ON a.client_id = u.id
       LEFT JOIN users staff ON a.assigned_to = staff.id
       WHERE a.client_id = ?
       ORDER BY a.updated_at DESC
       LIMIT 1`,
      [clientId]
    );

    if (!app) {
      const details = JSON.stringify({
        consultation: true,
        title: 'General consultation',
        opened_by: req.user.id
      });
      const created = await db.run(
        `INSERT INTO applications (client_id, service_type, details, status, assigned_to)
         VALUES (?, 'other_services', ?, 'in_progress', ?)`,
        [clientId, details, req.user.id]
      );
      const newId = created.lastID;
      app = await db.get(
        `SELECT a.*, u.name as client_name, staff.name as assignee_name
         FROM applications a
         LEFT JOIN users u ON a.client_id = u.id
         LEFT JOIN users staff ON a.assigned_to = staff.id
         WHERE a.id = ?`,
        [newId]
      );
      try {
        await notifyUser(db, {
          userId: clientId,
          title: 'Consultation started',
          message: `${req.user.name} opened a consultation chat with you.`,
          linkType: 'chat',
          linkId: newId || null
        });
      } catch (e) {
        console.error(e);
      }
    }

    res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not open consultation' });
  }
}

router.get('/', authenticateJWT as any, staffOnly, searchClients);
router.get('/clients', authenticateJWT as any, staffOnly, searchClients);
router.post('/open-client', authenticateJWT as any, staffOnly, openClientChat);
router.put('/open-client', authenticateJWT as any, staffOnly, openClientChat);

// GET CONVERSATION HISTORY FOR APPLICATION
router.get('/:appId', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const appId = parseInt(req.params.appId as string, 10);
  if (!Number.isFinite(appId)) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  const { id: userId, role } = req.user;

  try {
    const db = await getDb();

    // Verify application existence and user permission
    const app = await db.get('SELECT client_id, assigned_to FROM applications WHERE id = ?', [appId]);
    if (!app) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }

    if (role === 'client' && app.client_id !== userId) {
       res.status(403).json({ error: 'Forbidden: You do not have access to this chat' });
       return;
    }

    // Mark messages as read where current user is receiver
    await db.run(
      'UPDATE messages SET is_read = 1 WHERE application_id = ? AND receiver_id = ?',
      [appId, userId]
    );

    // Get messages with sender names
    const messages = await db.all(
      `SELECT m.*, sender.name as sender_name, sender.role as sender_role 
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       WHERE m.application_id = ?
       ORDER BY m.created_at ASC`,
      [appId]
    );

     res.status(200).json(messages);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// SEND MESSAGE
router.post('/', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  if (req.body?.client_id && !req.body?.application_id) {
    return staffOnly(req, res, () => openClientChat(req, res));
  }

  const { application_id, message_text, file_url, filename } = req.body;
  const senderId = req.user.id;

  if (!application_id || (!message_text?.trim() && !file_url)) {
     res.status(400).json({ error: 'Application ID and message text or file are required' });
     return;
  }

  const appId = parseInt(application_id);

  try {
    const db = await getDb();

    // Check application and get counterpart receiver
    const app = await db.get(
      'SELECT client_id, assigned_to FROM applications WHERE id = ?',
      [appId]
    );

    if (!app) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }

    // Access control
    if (req.user.role === 'client' && app.client_id !== senderId) {
       res.status(403).json({ error: 'Forbidden: You cannot send messages for this application' });
       return;
    }

    // Determine receiver
    let receiverId = 0;
    if (req.user.role === 'client') {
      // Receiver is the assigned staff member, or falls back to admin (ID 1) if not assigned yet
      receiverId = app.assigned_to || 1; 
    } else {
      // Sender is staff, receiver is the client
      receiverId = app.client_id;
    }

    const result = await db.run(
      'INSERT INTO messages (sender_id, receiver_id, application_id, message_text, file_url, filename) VALUES (?, ?, ?, ?, ?, ?)',
      [senderId, receiverId, appId, message_text ? message_text.trim() : '', file_url || null, filename || null]
    );

    const messageId = result.lastID;

    if (req.user.role !== 'client') {
      const emailMsg = message_text ? `"${message_text.trim()}"` : `Sent you a file attachment: ${filename || 'document'}`;
      await sendNotificationEmail(db, receiverId, 'New Message from PrimeFlow Advisor', emailMsg);
    } else {
      // Client sent a message / responded to admin query — Alert system admins & staff
      try {
        const admins = await db.all("SELECT id FROM users WHERE role IN ('admin', 'supervisor', 'operations_officer', 'compliance_officer')");
        for (const adminUser of admins) {
          await notifyUser(db, {
            userId: adminUser.id,
            title: 'Client Response Received',
            message: `Client ${req.user.name} responded to query/message on Application Ref #${appId}.`,
            linkType: 'chat',
            linkId: appId
          });
        }
        console.log(`[OFFICIAL EMAIL ALERT] Sent email alert to official mailbox (primeflowconsultingservices@gmail.com / admin@primeflow.com): Client ${req.user.name} (${req.user.email}) responded to admin query on Application #${appId}. Message: "${message_text || filename || 'file attachment'}"`);
      } catch (e) {
        console.error('Failed to notify admins of client response:', e);
      }
    }
    
    // Fetch the newly inserted message with sender name to return
    const newMessage = await db.get(
      `SELECT m.*, sender.name as sender_name, sender.role as sender_role 
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       WHERE m.id = ?`,
      [messageId]
    );

     res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
