import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';

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

// GET ALL OR FILTERED APPLICATIONS
router.get('/applications', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const { id, role } = req.user;

  try {
    const db = await getDb();
    let applications;

    if (role === 'client') {
      // Clients only see their own applications
      applications = await db.all(
        `SELECT a.*, u.name as client_name, staff.name as assignee_name 
         FROM applications a
         LEFT JOIN users u ON a.client_id = u.id
         LEFT JOIN users staff ON a.assigned_to = staff.id
         WHERE a.client_id = ? 
         ORDER BY a.updated_at DESC`,
        [id]
      );
    } else if (role === 'operations_officer' || role === 'compliance_officer') {
      // Staff see all applications or their assigned ones. Let's return all, so they can assign them to themselves, but flag assigned.
      applications = await db.all(
        `SELECT a.*, u.name as client_name, staff.name as assignee_name 
         FROM applications a
         LEFT JOIN users u ON a.client_id = u.id
         LEFT JOIN users staff ON a.assigned_to = staff.id
         ORDER BY a.updated_at DESC`
      );
    } else if (role === 'admin') {
      // Admins see everything
      applications = await db.all(
        `SELECT a.*, u.name as client_name, staff.name as assignee_name 
         FROM applications a
         LEFT JOIN users u ON a.client_id = u.id
         LEFT JOIN users staff ON a.assigned_to = staff.id
         ORDER BY a.updated_at DESC`
      );
    }

     res.status(200).json(applications);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET APPLICATION BY ID
router.get('/applications/:id', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const { id: userId, role } = req.user;
  const appId = parseInt(req.params.id as string);

  try {
    const db = await getDb();
    const app = await db.get(
      `SELECT a.*, u.name as client_name, staff.name as assignee_name 
       FROM applications a
       LEFT JOIN users u ON a.client_id = u.id
       LEFT JOIN users staff ON a.assigned_to = staff.id
       WHERE a.id = ?`,
      [appId]
    );

    if (!app) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }

    // Access control: client can only see their own application
    if (role === 'client' && app.client_id !== userId) {
       res.status(403).json({ error: 'Forbidden: You do not have access to this application' });
       return;
    }

     res.status(200).json(app);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// SUBMIT APPLICATION
router.post('/applications', authenticateJWT as any, requireRole(['client']) as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const { service_type, details } = req.body;
  const clientId = req.user.id;

  if (!service_type || !details) {
     res.status(400).json({ error: 'Service type and details are required' });
     return;
  }

  const allowedTypes = ['company_incorporation', 'business_registration', 'incorporated_trustee', 'annual_returns', 'post_incorporation', 'compliance', 'other_services'];
  if (!allowedTypes.includes(service_type)) {
     res.status(400).json({ error: 'Invalid service type' });
     return;
  }

  try {
    const db = await getDb();
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

    const result = await db.run(
      'INSERT INTO applications (client_id, service_type, details, status) VALUES (?, ?, ?, ?)',
      [clientId, service_type, detailsStr, 'submitted']
    );

    const newAppId = result.lastID;
    await logAudit(clientId, 'APPLICATION_SUBMIT', `Submitted new application ${newAppId} of type ${service_type}`, req.ip);

     res.status(201).json({ id: newAppId, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE STATUS
router.put('/applications/:id/status', authenticateJWT as any, requireRole(['admin', 'operations_officer', 'compliance_officer']) as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const appId = parseInt(req.params.id as string);
  const { status } = req.body;

  const allowedStatuses = ['submitted', 'under_review', 'add_info_required', 'processing', 'completed', 'rejected'];
  if (!status || !allowedStatuses.includes(status)) {
     res.status(400).json({ error: 'Invalid application status' });
     return;
  }

  try {
    const db = await getDb();

    // Check if application exists
    const app = await db.get('SELECT id, status, client_id, service_type FROM applications WHERE id = ?', [appId]);
    if (!app) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }

    await db.run(
      'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, appId]
    );

    // Insert status notification for the client
    await db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        app.client_id,
        'Application Status Update',
        `Your application for ${app.service_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} (Ref: #${appId}) status has been updated to "${status.replace(/_/g, ' ')}".`
      ]
    );

    await logAudit(
      req.user.id,
      'STATUS_CHANGE',
      `Changed application ${appId} status from ${app.status} to ${status}`,
      req.ip
    );

     res.status(200).json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// ASSIGN APPLICATION
router.put('/applications/:id/assign', authenticateJWT as any, requireRole(['admin', 'operations_officer', 'compliance_officer']) as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const appId = parseInt(req.params.id as string);
  const { assigned_to } = req.body; // Can be user ID, or null to unassign

  try {
    const db = await getDb();

    // Check application
    const app = await db.get('SELECT id FROM applications WHERE id = ?', [appId]);
    if (!app) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }

    // If assigned_to is provided, verify they are a staff member
    if (assigned_to) {
      const staffUser = await db.get('SELECT role FROM users WHERE id = ?', [assigned_to]);
      if (!staffUser || staffUser.role === 'client') {
         res.status(400).json({ error: 'User is not a valid staff member' });
         return;
      }
    }

    await db.run(
      'UPDATE applications SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [assigned_to || null, appId]
    );

    await logAudit(
      req.user.id,
      'APPLICATION_ASSIGN',
      `Assigned application ${appId} to user ID ${assigned_to || 'unassigned'}`,
      req.ip
    );

     res.status(200).json({ message: 'Application assigned successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET NOTIFICATIONS (Client only)
router.get('/notifications', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  try {
    const db = await getDb();
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
     res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// MARK NOTIFICATION AS READ
router.put('/notifications/:id/read', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const notificationId = parseInt(req.params.id as string);

  try {
    const db = await getDb();
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );
     res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.put('/notifications/read-all', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  try {
    const db = await getDb();
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
     res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /survey — submit feedback survey
router.post('/survey', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  const { usability, speed, clarity, suggestions } = req.body;
  try {
    await logAudit(
      req.user.id, 
      'APPLICATION_SURVEY', 
      `Submitted survey response. Usability: ${usability}/5, Speed: ${speed}/5, Clarity: ${clarity}, Suggestions: ${suggestions || 'None'}`, 
      req.ip
    );
     res.status(200).json({ message: 'Survey saved successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET UNREAD SUMMARY FOR POPUPS ON LOGIN
router.get('/unread-summary', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }

  const userId = req.user.id;

  try {
    const db = await getDb();
    
    // 1. Fetch unread notifications
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
      [userId]
    );

    // 2. Fetch unread messages
    const messages = await db.all(
      `SELECT m.*, sender.name as sender_name, sender.role as sender_role, app.service_type
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       JOIN applications app ON m.application_id = app.id
       WHERE m.receiver_id = ? AND m.is_read = 0
       ORDER BY m.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      notifications,
      messages
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
