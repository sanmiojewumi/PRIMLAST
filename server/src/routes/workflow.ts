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

    const countSafe = async (sql: string) => {
      try {
        return (await db.get<{ c: number }>(sql))?.c || 0;
      } catch {
        return 0;
      }
    };

    const seriesSafe = async (sql: string) => {
      try {
        return await db.all(sql);
      } catch {
        return [];
      }
    };

    const submissions = await seriesSafe(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM applications WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );
    const completions = await seriesSafe(
      `SELECT ${updated.bucket} as bucket, COUNT(*) as count FROM applications
       WHERE status = 'completed' AND ${updated.start}
       GROUP BY bucket ORDER BY bucket`
    );
    const audits = await seriesSafe(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM audit_logs WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );
    const documents = await seriesSafe(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM documents WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );
    const invoices = await seriesSafe(
      `SELECT ${created.bucket} as bucket, COUNT(*) as count FROM invoices WHERE ${created.start} GROUP BY bucket ORDER BY bucket`
    );

    const kpis = {
      submissions: await countSafe(`SELECT COUNT(*) as c FROM applications WHERE ${created.start}`),
      completions: await countSafe(
        `SELECT COUNT(*) as c FROM applications WHERE status = 'completed' AND ${updated.start}`
      ),
      documents: await countSafe(`SELECT COUNT(*) as c FROM documents WHERE ${created.start}`),
      signatures: await countSafe(
        `SELECT COUNT(*) as c FROM documents WHERE ${created.start} AND IFNULL(kind,'file') = 'signature'`
      ),
      invoices: await countSafe(`SELECT COUNT(*) as c FROM invoices WHERE ${created.start}`),
      activities: await countSafe(`SELECT COUNT(*) as c FROM audit_logs WHERE ${created.start}`)
    };

    const byStatus = await seriesSafe(`SELECT status, COUNT(*) as count FROM applications GROUP BY status`);
    const byService = await seriesSafe(
      `SELECT service_type, COUNT(*) as count FROM applications WHERE ${created.start} GROUP BY service_type`
    );
    const byAction = await seriesSafe(
      `SELECT action, COUNT(*) as count FROM audit_logs WHERE ${created.start} GROUP BY action ORDER BY count DESC LIMIT 8`
    );
    const recent = await seriesSafe(
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

const staffOnly = requireRole(['admin', 'supervisor', 'operations_officer', 'compliance_officer']);

router.get('/details', authenticateJWT as any, staffOnly as any, async (req: AuthRequest, res) => {
  const period = String(req.query.period || 'month');
  const kind = String(req.query.kind || 'submissions');
  const bucket = String(req.query.bucket || '');
  const status = String(req.query.status || '');
  const service = String(req.query.service || '');
  const action = String(req.query.action || '');
  const created = windowFor(period, 'a.created_at');
  const updated = windowFor(period, 'a.updated_at');
  const docCreated = windowFor(period, 'd.created_at');
  const invCreated = windowFor(period, 'i.created_at');
  const logCreated = windowFor(period, 'l.created_at');
  const bucketSql = (alias: string) =>
    period === 'day' ? `strftime('%H:00', ${alias})` : period === 'year' ? `strftime('%Y-%m', ${alias})` : `strftime('%Y-%m-%d', ${alias})`;

  try {
    const db = await getDb();
    const allSafe = async (sql: string, params: any[] = []) => {
      try {
        return await db.all(sql, params);
      } catch (err) {
        console.error(err);
        return [];
      }
    };
    let title = 'Breakdown';
    let items: any[] = [];

    const appSelect = `SELECT a.id, a.service_type, a.status, a.created_at, a.updated_at, a.client_id, a.assigned_to,
      u.name as client_name, staff.name as assignee_name
      FROM applications a
      LEFT JOIN users u ON a.client_id = u.id
      LEFT JOIN users staff ON a.assigned_to = staff.id`;

    if (kind === 'submissions' || kind === 'completions' || kind === 'status' || kind === 'service') {
      const clauses: string[] = [];
      const params: any[] = [];
      if (kind === 'completions') clauses.push(`a.status = 'completed' AND ${updated.start}`);
      else if (kind === 'status' && status) {
        clauses.push('a.status = ?');
        params.push(status);
      } else if (kind === 'service' && service) {
        clauses.push(`${created.start} AND a.service_type = ?`);
        params.push(service);
      } else {
        clauses.push(created.start);
      }
      if (bucket) {
        clauses.push(`${bucketSql(kind === 'completions' ? 'a.updated_at' : 'a.created_at')} = ?`);
        params.push(bucket);
      }
      title = kind === 'completions' ? 'Completed filings' : kind === 'status' ? `Filings · ${status.replace(/_/g, ' ')}` : kind === 'service' ? `Filings · ${service.replace(/_/g, ' ')}` : 'Submitted filings';
      if (bucket) title += ` · ${bucket}`;
      items = await allSafe(
        `${appSelect} WHERE ${clauses.join(' AND ')} ORDER BY a.updated_at DESC LIMIT 250`,
        params
      );
      items = items.map((row) => ({ ...row, recordType: 'application' }));
    } else if (kind === 'documents' || kind === 'signatures') {
      const extra = kind === 'signatures' ? `AND IFNULL(d.kind,'file') = 'signature'` : '';
      const params: any[] = [];
      let where = `${docCreated.start} ${extra}`;
      if (bucket) {
        where += ` AND ${bucketSql('d.created_at')} = ?`;
        params.push(bucket);
      }
      title = kind === 'signatures' ? 'Signatures' : 'Documents';
      items = await allSafe(
        `SELECT d.id, d.application_id, d.original_name, d.mime_type, d.size, d.kind, d.created_at,
                a.service_type, a.status, u.name as client_name
         FROM documents d
         LEFT JOIN applications a ON a.id = d.application_id
         LEFT JOIN users u ON a.client_id = u.id
         WHERE ${where}
         ORDER BY d.created_at DESC LIMIT 250`,
        params
      );
      items = items.map((row) => ({ ...row, recordType: 'document' }));
    } else if (kind === 'invoices') {
      const params: any[] = [];
      let where = invCreated.start;
      if (bucket) {
        where += ` AND ${bucketSql('i.created_at')} = ?`;
        params.push(bucket);
      }
      title = 'Invoices & receipts';
      items = await allSafe(
        `SELECT i.id, i.application_id, i.number, i.doc_type, i.amount, i.status, i.payment_status, i.created_at,
                u.name as client_name, a.service_type
         FROM invoices i
         LEFT JOIN users u ON i.client_id = u.id
         LEFT JOIN applications a ON a.id = i.application_id
         WHERE ${where}
         ORDER BY i.created_at DESC LIMIT 250`,
        params
      );
      items = items.map((row) => ({ ...row, recordType: 'invoice' }));
    } else {
      const params: any[] = [];
      let where = logCreated.start;
      if (action) {
        where += ' AND l.action = ?';
        params.push(action);
      }
      if (bucket) {
        where += ` AND ${bucketSql('l.created_at')} = ?`;
        params.push(bucket);
      }
      title = action ? `Activity · ${action.replace(/_/g, ' ')}` : 'Activity log';
      items = await allSafe(
        `SELECT l.id, l.action, l.details, l.created_at, l.ip_address, u.name as user_name, u.role as user_role
         FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id
         WHERE ${where}
         ORDER BY l.created_at DESC LIMIT 250`,
        params
      );
      items = items.map((row) => ({ ...row, recordType: 'audit' }));
    }

    res.json({ kind, title, period, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load breakdown' });
  }
});

router.get('/record/:type/:id', authenticateJWT as any, staffOnly as any, async (req: AuthRequest, res) => {
  const type = String(req.params.type);
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || !['application', 'document', 'invoice', 'audit'].includes(type)) {
    res.status(400).json({ error: 'Invalid record' });
    return;
  }
  try {
    const db = await getDb();
    if (type === 'application') {
      const app = await db.get(
        `SELECT a.*, u.name as client_name, u.email as client_email, staff.name as assignee_name
         FROM applications a
         LEFT JOIN users u ON a.client_id = u.id
         LEFT JOIN users staff ON a.assigned_to = staff.id
         WHERE a.id = ?`,
        [id]
      );
      if (!app) {
        res.status(404).json({ error: 'Filing not found' });
        return;
      }
      const documents = await db.all(
        `SELECT id, original_name, mime_type, size, kind, created_at FROM documents WHERE application_id = ? ORDER BY created_at DESC`,
        [id]
      ).catch(() => []);
      const invoices = await db.all(
        `SELECT id, number, doc_type, amount, status, payment_status, created_at FROM invoices WHERE application_id = ? ORDER BY created_at DESC`,
        [id]
      ).catch(() => []);
      const audits = await db.all(
        `SELECT l.id, l.action, l.details, l.created_at, u.name as user_name
         FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id
         WHERE l.details LIKE ?
         ORDER BY l.created_at DESC LIMIT 50`,
        [`%${id}%`]
      ).catch(() => []);
      res.json({ recordType: 'application', app, documents, invoices, audits });
      return;
    }
    if (type === 'document') {
      const doc = await db.get(
        `SELECT d.*, a.service_type, a.status, u.name as client_name
         FROM documents d
         LEFT JOIN applications a ON a.id = d.application_id
         LEFT JOIN users u ON a.client_id = u.id
         WHERE d.id = ?`,
        [id]
      );
      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      res.json({ recordType: 'document', doc });
      return;
    }
    if (type === 'invoice') {
      const invoice = await db.get(
        `SELECT i.*, u.name as client_name, a.service_type, a.status as app_status
         FROM invoices i
         LEFT JOIN users u ON i.client_id = u.id
         LEFT JOIN applications a ON a.id = i.application_id
         WHERE i.id = ?`,
        [id]
      );
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      res.json({ recordType: 'invoice', invoice });
      return;
    }
    const audit = await db.get(
      `SELECT l.*, u.name as user_name, u.role as user_role
       FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id WHERE l.id = ?`,
      [id]
    );
    if (!audit) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json({ recordType: 'audit', audit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load record' });
  }
});

export default router;
