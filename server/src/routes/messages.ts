import { Router, Response } from 'express';
import { getDb, sendNotificationEmail } from '../db';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// GET CONVERSATION HISTORY FOR APPLICATION
router.get('/:appId', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const appId = parseInt(req.params.appId as string);
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
