import { Router } from 'express';
import { getDb } from '../db';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

function windowFor(period: string, column: string) {
  const start =
    period === 'day'
      ? `datetime(${column}) >= datetime('now', 'start of day')`
      : period === 'week'
        ? `datetime(${column}) >= datetime('now', '-6 days', 'start of day')`
        : period === 'year'
          ? `datetime(${column}) >= datetime('now', '-11 months', 'start of month')`
          : `datetime(${column}) >= datetime('now', 'start of month')`;

  const bucket =
    period === 'day'
      ? `strftime('%H:00', ${column})`
      : period === 'year'
        ? `strftime('%Y-%m', ${column})`
        : `strftime('%Y-%m-%d', ${column})`;

  const label = period === 'day' ? 'Hour' : period === 'year' ? 'Month' : 'Day';
  return { start, bucket, label };
}

router.get('/tracker', authenticateJWT as any, requireRole(['admin', 'supervisor', 'operations_officer', 'compliance_officer']) as any, async (req: AuthRequest, res) => {
  const period = String(req.query.period || 'month');
  const created = windowFor(period, 'created_at');
  const updated = windowFor(period, 'updated_at');
  const logCreated = windowFor(period, 'l.created_at');

  try {
    const db = await getDb();

    const submissions = await db.all(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM applications WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );
    const completions = await db.all(
      `SELECT ${updated.bucket} as bucket, COUNT(*) as count FROM applications
       WHERE status = 'completed' AND ${updated.start}
       GROUP BY bucket ORDER BY bucket`
    );
    const audits = await db.all(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM audit_logs WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );
    const documents = await db.all(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM documents WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );
    const invoices = await db.all(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM invoices WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );

    const kpis = {
      submissions: (await db.get<{ c: number }>(`SELECT COUNT(*) as c FROM applications WHERE ${created.start}`))?.c || 0,
      completions: (await db.get<{ c: number }>(
        `SELECT COUNT(*) as c FROM applications WHERE status = 'completed' AND ${updated.start}`
      ))?.c || 0,
      documents: (await db.get<{ c: number }>(`SELECT COUNT(*) as c FROM documents WHERE ${created.start}`))?.c || 0,
      signatures: (await db.get<{ c: number }>(
        `SELECT COUNT(*) as c FROM documents WHERE ${created.start} AND kind = 'signature'`
      ))?.c || 0,
      invoices: (await db.get<{ c: number }>(`SELECT COUNT(*) as c FROM invoices WHERE ${created.start}`))?.c || 0,
      activities: (await db.get<{ c: number }>(`SELECT COUNT(*) as c FROM audit_logs WHERE ${created.start}`))?.c || 0
    };

    const byStatus = await db.all(`SELECT status, COUNT(*) as count FROM applications GROUP BY status`);
    const byService = await db.all(
      `SELECT service_type, COUNT(*) as count FROM applications WHERE ${created.start} GROUP BY service_type`
    );
    const byAction = await db.all(
      `SELECT action, COUNT(*) as count FROM audit_logs WHERE ${created.start} GROUP BY action ORDER BY count DESC LIMIT 8`
    );
    const recent = await db.all(
      `SELECT l.*, u.name as user_name, u.role as user_role
       FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id
       WHERE ${logCreated.start}
       ORDER BY l.created_at DESC LIMIT 40`
    );

    res.json({
      period,
      bucketLabel: created.label,
      kpis,
      series: { submissions, completions, audits, documents, invoices },
      byStatus,
      byService,
      byAction,
      recent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
