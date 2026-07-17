import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateJWT, AuthRequest, requireRole, requirePermission } from '../middleware/auth';

const router = Router();

// GET SYSTEM STATISTICS (Admins and Staff)
router.get('/stats', authenticateJWT as any, requireRole(['admin', 'operations_officer', 'compliance_officer']) as any, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();

    // 1. Total counts
    const totalClients = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = "client"');
    const totalApps = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM applications');
    const completedApps = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM applications WHERE status = "completed"');
    const pendingApps = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM applications WHERE status != "completed" AND status != "rejected"');

    // 2. Count by service type
    const byServiceType = await db.all<any[]>(
      'SELECT service_type, COUNT(*) as count FROM applications GROUP BY service_type'
    );

    // 3. Count by status
    const byStatus = await db.all<any[]>(
      'SELECT status, COUNT(*) as count FROM applications GROUP BY status'
    );

    // 4. Monthly application submissions (for charts)
    // In SQLite, strftime('%Y-%m', created_at) groups by year and month
    const monthlySubmissions = await db.all<any[]>(
      `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count 
       FROM applications 
       GROUP BY month 
       ORDER BY month ASC 
       LIMIT 12`
    );

    // 5. Recent audit actions
    const recentAudits = await db.all<any[]>(
      `SELECT l.*, u.name as user_name, u.role as user_role 
       FROM audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC 
       LIMIT 15`
    );

     res.status(200).json({
      metrics: {
        totalClients: totalClients?.count || 0,
        totalApplications: totalApps?.count || 0,
        completedApplications: completedApps?.count || 0,
        pendingApplications: pendingApps?.count || 0
      },
      byServiceType,
      byStatus,
      monthlySubmissions,
      recentAudits
    });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ALL USERS (Admin and authorized Supervisors)
router.get('/users', authenticateJWT as any, requirePermission('can_view_users') as any, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const users = await db.all(
      'SELECT id, name, email, role, status, permissions, created_at FROM users ORDER BY role ASC, name ASC'
    );
    const parsed = users.map((u: any) => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : null
    }));
     res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE USER STATUS (Admin and authorized Supervisors)
router.put('/users/:id/status', authenticateJWT as any, requirePermission('can_update_user_status') as any, async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id as string);
  const { status } = req.body; // 'active' or 'pending'

  if (!status || !['active', 'pending'].includes(status)) {
     res.status(400).json({ error: 'Invalid user status' });
     return;
  }

  try {
    const db = await getDb();
    
    // Prevent self-deactivation
    if (userId === req.user?.id) {
       res.status(400).json({ error: 'You cannot suspend your own account' });
       return;
    }

    const user = await db.get('SELECT name, status FROM users WHERE id = ?', [userId]);
    if (!user) {
       res.status(404).json({ error: 'User not found' });
       return;
    }

    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    // Log audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.user?.id, 'USER_STATUS_CHANGE', `Suspended/Activated user ${user.name} (ID: ${userId}) to status: ${status}`, req.ip]
    );

     res.status(200).json({ message: 'User status updated successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET FULL SYSTEM AUDIT LOGS (Admin and authorized Supervisors)
router.get('/logs', authenticateJWT as any, requirePermission('can_view_logs') as any, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const logs = await db.all(
      `SELECT l.*, u.name as user_name, u.role as user_role 
       FROM audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC`
    );
     res.status(200).json(logs);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE USER (Admin and authorized Supervisors)
router.delete('/users/:id', authenticateJWT as any, requirePermission('can_delete_users') as any, async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id as string);

  if (userId === req.user?.id) {
     res.status(400).json({ error: 'You cannot delete your own account' });
     return;
  }

  try {
    const db = await getDb();
    const user = await db.get('SELECT name, email FROM users WHERE id = ?', [userId]);
    if (!user) {
       res.status(404).json({ error: 'User not found' });
       return;
    }

    // Delete user (cascade will delete profiles, etc.)
    await db.run('DELETE FROM users WHERE id = ?', [userId]);

    // Log audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.user?.id, 'USER_DELETE', `Deleted user account ${user.name} (${user.email}) (ID: ${userId})`, req.ip]
    );

     res.status(200).json({ message: 'User account deleted successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE APPLICATION (Admin and authorized Supervisors)
router.delete('/applications/:id', authenticateJWT as any, requirePermission('can_delete_applications') as any, async (req: AuthRequest, res) => {
  const appId = parseInt(req.params.id as string);

  try {
    const db = await getDb();
    const app = await db.get('SELECT service_type, client_id FROM applications WHERE id = ?', [appId]);
    if (!app) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }

    // Delete application (cascade handles docs, messages, etc.)
    await db.run('DELETE FROM applications WHERE id = ?', [appId]);

    // Log audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.user?.id, 'APPLICATION_DELETE', `Deleted application #${appId} of type ${app.service_type}`, req.ip]
    );

     res.status(200).json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
