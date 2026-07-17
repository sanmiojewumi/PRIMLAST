import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// ─── Default compliance items seeded for a new user ───────────────────────────
const DEFAULT_ITEMS = [
  { key: 'cac',       title: 'CAC Annual Returns',      agency: 'CAC',    status: 'due_soon',        dueDate: 'August 15, 2026', details: 'Your annual returns are due soon. File early to avoid penalties.', priority: 'high' },
  { key: 'nrs',       title: 'NRS Tax Clearance',       agency: 'NRS',    status: 'compliant',       dueDate: 'Dec 31, 2026',    details: 'Company Income Tax filed and Tax Clearance Certificate active.', priority: 'medium' },
  { key: 'scuml',     title: 'SCUML Registration',      agency: 'SCUML',  status: 'compliant',       dueDate: null,              details: 'SCUML certificate active and up to date.', priority: 'medium' },
  { key: 'pencom',    title: 'PENCOM Compliance',       agency: 'PENCOM', status: 'compliant',       dueDate: null,              details: 'Pension remittances up to date. Next remittance: July 31, 2026.', priority: 'medium' },
  { key: 'nsitf',     title: 'NSITF Registration',      agency: 'NSITF',  status: 'not_registered',  dueDate: null,              details: 'Your business has not registered with NSITF. Required for government contracts.', priority: 'low' },
  { key: 'itf',       title: 'ITF Compliance',          agency: 'ITF',    status: 'pending',         dueDate: null,              details: 'ITF registration application submitted, awaiting confirmation.', priority: 'low' },
  { key: 'tcc',       title: 'TCC (Tax Clearance Certificate)', agency: 'NRS', status: 'compliant', dueDate: 'Dec 31, 2026',    details: 'Tax Clearance Certificate issued by NRS.', priority: 'medium' },
  { key: 'bpp',       title: 'BPP Federal Contractor Registration', agency: 'BPP', status: 'not_registered', dueDate: null,      details: 'Bureau of Public Procurement contractor registration is required for federal bids.', priority: 'low' },
  { key: 'vat',       title: 'VAT Monthly Filing',        agency: 'NRS',    status: 'due_soon',        dueDate: 'July 21, 2026',   details: 'June VAT return is due on July 21, 2026. Prepare your VAT schedule now.', priority: 'high' },
  { key: 'trademark', title: 'Trademark Registration',    agency: 'IPONL',  status: 'not_registered',  dueDate: null,              details: 'Protect your brand with trademark registration. Contact Primeflow to get started.', priority: 'low' },
];

// ─── Ensure compliance rows exist for a user ─────────────────────────────────
async function ensureComplianceItems(db: any, userId: number) {
  // Clean up legacy FIRS rows if they exist
  await db.run('DELETE FROM compliance_items WHERE user_id = ? AND item_key = ?', [userId, 'firs']);
  
  for (const item of DEFAULT_ITEMS) {
    const exists = await db.get(
      'SELECT id FROM compliance_items WHERE user_id = ? AND item_key = ?',
      [userId, item.key]
    );
    if (!exists) {
      await db.run(
        `INSERT INTO compliance_items (user_id, item_key, title, agency, status, due_date, details, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, item.key, item.title, item.agency, item.status, item.dueDate, item.details, item.priority]
      );
    }
  }
}

// GET /api/compliance — fetch all compliance items for authenticated user
router.get('/', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const userId = (req as any).user.id;

    // Seed defaults if needed
    await ensureComplianceItems(db, userId);

    const items = await db.all(
      'SELECT * FROM compliance_items WHERE user_id = ? ORDER BY id ASC',
      [userId]
    );

    res.json(items);
  } catch (err: any) {
    console.error('Compliance GET error:', err);
    res.status(500).json({ error: 'Failed to fetch compliance data' });
  }
});

// PUT /api/compliance/:key — update status of a specific compliance item
router.put('/:key', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const userId = (req as any).user.id;
    const { key } = req.params;
    const { status, due_date, details } = req.body;

    const allowed = ['compliant', 'due_soon', 'overdue', 'not_registered', 'pending'];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    await db.run(
      `UPDATE compliance_items SET status = ?, due_date = ?, details = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND item_key = ?`,
      [status, due_date || null, details || null, userId, key]
    );

    const updated = await db.get(
      'SELECT * FROM compliance_items WHERE user_id = ? AND item_key = ?',
      [userId, key]
    );

    res.json(updated);
  } catch (err: any) {
    console.error('Compliance PUT error:', err);
    res.status(500).json({ error: 'Failed to update compliance item' });
  }
});

export default router;
