import { Database } from 'sqlite';
import { notifyUser } from './notify';

export const SERVICE_FEES: Record<string, { label: string; amount: number }> = {
  company_incorporation: { label: 'Company Incorporation', amount: 150000 },
  business_registration: { label: 'Business Name Registration', amount: 45000 },
  incorporated_trustee: { label: 'Incorporated Trustee', amount: 120000 },
  annual_returns: { label: 'Annual Returns Filing', amount: 35000 },
  post_incorporation: { label: 'Post-Incorporation Service', amount: 40000 },
  compliance: { label: 'Compliance Service', amount: 55000 },
  other_services: { label: 'Other Professional Service', amount: 30000 }
};

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

export async function nextDocNumber(db: Database, docType: 'invoice' | 'receipt') {
  const prefix = docType === 'invoice' ? 'INV' : 'RCT';
  const year = new Date().getFullYear();
  const row = await db.get<{ c: number }>(
    `SELECT COUNT(*) as c FROM invoices WHERE doc_type = ? AND strftime('%Y', created_at) = ?`,
    [docType, String(year)]
  );
  const seq = String((row?.c || 0) + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

export async function createBillingDocument(
  db: Database,
  opts: {
    applicationId: number | null;
    clientId: number;
    docType: 'invoice' | 'receipt';
    mode: 'automated' | 'manual';
    amount: number;
    tax?: number;
    description?: string;
    lineItems?: { label: string; amount: number }[];
    issuedBy: number;
  }
) {
  const number = await nextDocNumber(db, opts.docType);
  const tax = opts.tax ?? 0;
  const items = JSON.stringify(opts.lineItems || [{ label: opts.description || 'Professional fees', amount: opts.amount }]);
  const result = await db.run(
    `INSERT INTO invoices (
      application_id, client_id, doc_type, generation_mode, number, amount, tax, currency, description, line_items, status, issued_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'NGN', ?, ?, 'issued', ?)`,
    [
      opts.applicationId,
      opts.clientId,
      opts.docType,
      opts.mode,
      number,
      opts.amount,
      tax,
      opts.description || '',
      items,
      opts.issuedBy
    ]
  );
  const record = await db.get('SELECT * FROM invoices WHERE id = ?', [result.lastID]);
  await notifyUser(db, {
    userId: opts.clientId,
    title: opts.docType === 'invoice' ? 'New invoice issued' : 'New receipt issued',
    message: `${opts.docType === 'invoice' ? 'Invoice' : 'Receipt'} ${number} is in your portal. You can view or download it now.`,
    linkType: 'invoice',
    linkId: record?.id || null
  });
  return record;
}

export async function autoInvoiceForApplication(db: Database, application: any, issuedBy: number) {
  const existing = await db.get(
    'SELECT id FROM invoices WHERE application_id = ? AND doc_type = "invoice"',
    [application.id]
  );
  if (existing) return existing;

  const fee = SERVICE_FEES[application.service_type] || { label: 'Professional service', amount: 25000 };
  return createBillingDocument(db, {
    applicationId: application.id,
    clientId: application.client_id,
    docType: 'invoice',
    mode: 'automated',
    amount: fee.amount,
    description: `${fee.label} — Application #${application.id}`,
    lineItems: [{ label: fee.label, amount: fee.amount }],
    issuedBy
  });
}
