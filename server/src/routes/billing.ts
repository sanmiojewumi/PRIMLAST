import { Router } from 'express';
import { getDb } from '../db';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';
import { SERVICE_FEES, autoInvoiceForApplication, createBillingDocument } from '../lib/billing';
import { notifyAdmins, notifyUser } from '../lib/notify';

const router = Router();
const staff = ['admin', 'supervisor'] as const;

async function logAudit(userId: number | null, action: string, details: string, ip?: string) {
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

router.get('/fees', authenticateJWT as any, requireRole([...staff, 'operations_officer', 'compliance_officer', 'client']) as any, (_req, res) => {
  res.json(SERVICE_FEES);
});

router.get('/settings', authenticateJWT as any, async (_req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const row = await db.get('SELECT * FROM billing_settings WHERE id = 1');
    res.json(row || { id: 1, auto_invoice_on_complete: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/settings', authenticateJWT as any, requireRole([...staff]) as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const auto = req.body?.auto_invoice_on_complete ? 1 : 0;
  const gateway = req.body?.gateway_enabled ? 1 : 0;
  const bank_name = req.body?.bank_name ?? null;
  const bank_account_name = req.body?.bank_account_name ?? null;
  const bank_account_number = req.body?.bank_account_number ?? null;
  const paystack_public_key = req.body?.paystack_public_key ?? null;
  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO billing_settings (id, auto_invoice_on_complete, gateway_enabled, bank_name, bank_account_name, bank_account_number, paystack_public_key, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         auto_invoice_on_complete = excluded.auto_invoice_on_complete,
         gateway_enabled = excluded.gateway_enabled,
         bank_name = excluded.bank_name,
         bank_account_name = excluded.bank_account_name,
         bank_account_number = excluded.bank_account_number,
         paystack_public_key = excluded.paystack_public_key,
         updated_at = CURRENT_TIMESTAMP`,
      [auto, gateway, bank_name, bank_account_name, bank_account_number, paystack_public_key]
    );
    await logAudit(req.user.id, 'BILLING_SETTINGS', `Updated billing settings`, req.ip);
    const row = await db.get('SELECT * FROM billing_settings WHERE id = 1');
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/invoices', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const db = await getDb();
    const isStaff = req.user.role !== 'client';
    const rows = await db.all(
      `SELECT i.*, u.name as client_name, a.service_type, issuer.name as issuer_name
       FROM invoices i
       LEFT JOIN users u ON u.id = i.client_id
       LEFT JOIN applications a ON a.id = i.application_id
       LEFT JOIN users issuer ON issuer.id = i.issued_by
       WHERE (? = 1 OR i.client_id = ?)
       ORDER BY i.created_at DESC`,
      [isStaff ? 1 : 0, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/generate', authenticateJWT as any, requireRole([...staff]) as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const {
    application_id,
    client_id,
    doc_type,
    mode,
    amount,
    tax,
    description,
    line_items
  } = req.body || {};

  if (!['invoice', 'receipt'].includes(doc_type)) {
    res.status(400).json({ error: 'doc_type must be invoice or receipt' });
    return;
  }
  if (!['automated', 'manual'].includes(mode)) {
    res.status(400).json({ error: 'mode must be automated or manual' });
    return;
  }

  try {
    const db = await getDb();
    let clientId = client_id ? parseInt(client_id, 10) : null;
    let application: any = null;
    if (application_id) {
      application = await db.get('SELECT * FROM applications WHERE id = ?', [parseInt(application_id, 10)]);
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      clientId = application.client_id;
    }
    if (!clientId) {
      res.status(400).json({ error: 'client_id or application_id is required' });
      return;
    }

    let record;
    if (mode === 'automated') {
      if (!application) {
        res.status(400).json({ error: 'Automated billing requires an application' });
        return;
      }
      if (doc_type === 'invoice') {
        record = await autoInvoiceForApplication(db, application, req.user.id);
      } else {
        const fee = SERVICE_FEES[application.service_type] || { label: 'Professional service', amount: 25000 };
        record = await createBillingDocument(db, {
          applicationId: application.id,
          clientId: application.client_id,
          docType: 'receipt',
          mode: 'automated',
          amount: fee.amount,
          description: `Receipt — ${fee.label} (Application #${application.id})`,
          lineItems: [{ label: fee.label, amount: fee.amount }],
          issuedBy: req.user.id
        });
      }
    } else {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Manual billing requires a valid amount' });
        return;
      }
      record = await createBillingDocument(db, {
        applicationId: application ? application.id : null,
        clientId,
        docType: doc_type,
        mode: 'manual',
        amount: parsedAmount,
        tax: Number(tax) || 0,
        description: description || '',
        lineItems: Array.isArray(line_items) && line_items.length
          ? line_items
          : [{ label: description || 'Manual charge', amount: parsedAmount }],
        issuedBy: req.user.id
      });
    }

    await logAudit(
      req.user.id,
      'BILLING_GENERATE',
      `Issued ${doc_type} ${record.number} (${mode})`,
      req.ip
    );
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/invoices/:id', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const db = await getDb();
    const row = await db.get(
      `SELECT i.*, u.name as client_name, u.email as client_email, a.service_type, issuer.name as issuer_name
       FROM invoices i
       LEFT JOIN users u ON u.id = i.client_id
       LEFT JOIN applications a ON a.id = i.application_id
       LEFT JOIN users issuer ON issuer.id = i.issued_by
       WHERE i.id = ?`,
      [parseInt(req.params.id as string, 10)]
    );
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (req.user.role === 'client' && row.client_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const settings = await db.get('SELECT * FROM billing_settings WHERE id = 1');
    res.json({
      ...row,
      bank: {
        bank_name: settings?.bank_name,
        bank_account_name: settings?.bank_account_name,
        bank_account_number: settings?.bank_account_number
      },
      gateway: {
        enabled: Boolean(settings?.gateway_enabled && process.env.PAYSTACK_SECRET_KEY),
        public_key: settings?.gateway_enabled ? settings?.paystack_public_key : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/application/:appId', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const db = await getDb();
    const appId = parseInt(req.params.appId as string, 10);
    const app = await db.get('SELECT client_id FROM applications WHERE id = ?', [appId]);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    if (req.user.role === 'client' && app.client_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const rows = await db.all(
      'SELECT * FROM invoices WHERE application_id = ? ORDER BY created_at DESC',
      [appId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pay/bank', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const invoiceId = parseInt(req.body?.invoice_id, 10);
  const note = String(req.body?.note || '').slice(0, 300);
  try {
    const db = await getDb();
    const inv = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    if (req.user.role === 'client' && inv.client_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (inv.doc_type !== 'invoice') {
      res.status(400).json({ error: 'Only invoices can be paid' });
      return;
    }
    if (inv.payment_status === 'paid') {
      res.status(400).json({ error: 'Already paid' });
      return;
    }
    await db.run(
      `UPDATE invoices SET payment_status = 'reported', payment_method = 'bank_transfer', payment_reference = ?, status = 'payment_reported' WHERE id = ?`,
      [note || `Bank transfer reported by ${req.user.name}`, invoiceId]
    );
    await notifyAdmins(db, {
      title: 'Confirm client payment',
      message: `${req.user.name} reported a bank transfer for ${inv.number}. Confirm when funds arrive.`,
      linkType: 'payment_confirm',
      linkId: invoiceId
    });
    await logAudit(req.user.id, 'PAYMENT_REPORTED', `Bank transfer reported for ${inv.number}`, req.ip);
    res.json({ message: 'Payment reported. Admin will confirm when received.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pay/initialize', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    res.status(400).json({ error: 'Online gateway is not configured. Use bank transfer or ask admin to set PAYSTACK_SECRET_KEY.' });
    return;
  }
  const invoiceId = parseInt(req.body?.invoice_id, 10);
  try {
    const db = await getDb();
    const settings = await db.get('SELECT gateway_enabled FROM billing_settings WHERE id = 1');
    if (!settings?.gateway_enabled) {
      res.status(400).json({ error: 'Admin has not enabled the online gateway.' });
      return;
    }
    const inv = await db.get(
      `SELECT i.*, u.email as client_email FROM invoices i JOIN users u ON u.id = i.client_id WHERE i.id = ?`,
      [invoiceId]
    );
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    if (req.user.role === 'client' && inv.client_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const amountKobo = Math.round((Number(inv.amount) + Number(inv.tax || 0)) * 100);
    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: inv.client_email,
        amount: amountKobo,
        reference: `PF-${inv.number}-${Date.now()}`,
        metadata: { invoice_id: inv.id }
      })
    });
    const data: any = await initRes.json();
    if (!initRes.ok || !data?.status) {
      res.status(400).json({ error: data?.message || 'Could not start online payment' });
      return;
    }
    await db.run(
      `UPDATE invoices SET payment_method = 'gateway', payment_reference = ? WHERE id = ?`,
      [data.data.reference, invoiceId]
    );
    res.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pay/verify', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const reference = String(req.body?.reference || '');
  const invoiceId = parseInt(req.body?.invoice_id, 10);
  if (!secret || !reference) {
    res.status(400).json({ error: 'Reference required' });
    return;
  }
  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const data: any = await verifyRes.json();
    if (data?.data?.status !== 'success') {
      res.status(400).json({ error: 'Payment not successful yet' });
      return;
    }
    const db = await getDb();
    const inv = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    await db.run(
      `UPDATE invoices SET payment_status = 'paid', payment_method = 'gateway', payment_reference = ?, paid_at = CURRENT_TIMESTAMP, status = 'paid' WHERE id = ?`,
      [reference, invoiceId]
    );
    await notifyAdmins(db, {
      title: 'Online payment received',
      message: `Gateway payment confirmed for ${inv.number}. You can issue a receipt.`,
      linkType: 'payment_confirm',
      linkId: invoiceId
    });
    await notifyUser(db, {
      userId: inv.client_id,
      title: 'Payment received',
      message: `We received your payment for ${inv.number}.`,
      linkType: 'invoice',
      linkId: invoiceId
    });
    res.json({ message: 'Payment verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pay/confirm', authenticateJWT as any, requireRole([...staff]) as any, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const invoiceId = parseInt(req.body?.invoice_id, 10);
  const issueReceipt = req.body?.issue_receipt !== false;
  try {
    const db = await getDb();
    const inv = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    await db.run(
      `UPDATE invoices SET payment_status = 'paid', paid_at = CURRENT_TIMESTAMP, status = 'paid' WHERE id = ?`,
      [invoiceId]
    );
    let receipt = null;
    if (issueReceipt && inv.doc_type === 'invoice') {
      receipt = await createBillingDocument(db, {
        applicationId: inv.application_id,
        clientId: inv.client_id,
        docType: 'receipt',
        mode: inv.generation_mode === 'automated' ? 'automated' : 'manual',
        amount: inv.amount,
        tax: inv.tax,
        description: `Receipt for ${inv.number}`,
        lineItems: [{ label: `Payment received — ${inv.number}`, amount: inv.amount }],
        issuedBy: req.user.id
      });
    }
    await notifyUser(db, {
      userId: inv.client_id,
      title: 'Payment confirmed',
      message: `Admin confirmed payment for ${inv.number}. ${receipt ? `Receipt ${receipt.number} is in your portal.` : ''}`,
      linkType: 'invoice',
      linkId: receipt?.id || invoiceId
    });
    await logAudit(req.user.id, 'PAYMENT_CONFIRMED', `Confirmed payment for ${inv.number}`, req.ip);
    res.json({ message: 'Payment confirmed', receipt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
