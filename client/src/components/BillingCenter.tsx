import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Receipt, Printer, RefreshCw } from 'lucide-react';
import type { Application } from '../types';
import { printBillingDocument } from '../utils/notifications';

interface InvoiceRow {
  id: number;
  application_id: number | null;
  client_id: number;
  client_name?: string;
  service_type?: string;
  issuer_name?: string;
  doc_type: 'invoice' | 'receipt';
  generation_mode: 'automated' | 'manual';
  number: string;
  amount: number;
  tax: number;
  description: string;
  line_items: string;
  created_at: string;
  payment_status?: string;
  payment_method?: string;
}

interface BillingCenterProps {
  focusInvoiceId?: number | null;
}

const BillingCenter: React.FC<BillingCenterProps> = ({ focusInvoiceId = null }) => {
  const { token, user } = useAuth();
  const isStaff = user?.role !== 'client';
  const [apps, setApps] = useState<Application[]>([]);
  const [records, setRecords] = useState<InvoiceRow[]>([]);
  const [autoOnComplete, setAutoOnComplete] = useState(false);
  const [mode, setMode] = useState<'automated' | 'manual'>('automated');
  const [docType, setDocType] = useState<'invoice' | 'receipt'>('invoice');
  const [applicationId, setApplicationId] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('0');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [paystackKey, setPaystackKey] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState<any>(null);

  const load = async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [appRes, invRes, setRes] = await Promise.all([
      fetch(`${API_BASE}/services/applications`, { headers }),
      fetch(`${API_BASE}/billing/invoices`, { headers }),
      fetch(`${API_BASE}/billing/settings`, { headers })
    ]);
    if (appRes.ok) setApps(await appRes.json());
    if (invRes.ok) setRecords(await invRes.json());
    if (setRes.ok) {
      const data = await setRes.json();
      setSettingsLoaded(data);
      setAutoOnComplete(Boolean(data.auto_invoice_on_complete));
      setGatewayEnabled(Boolean(data.gateway_enabled));
      setBankName(data.bank_name || '');
      setBankAccountName(data.bank_account_name || '');
      setBankAccountNumber(data.bank_account_number || '');
      setPaystackKey(data.paystack_public_key || '');
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, [token]);

  const flash = (ok: string | null, err: string | null) => {
    setNotice(ok);
    setError(err);
    setTimeout(() => { setNotice(null); setError(null); }, 4000);
  };

  const persistSettings = async (patch: Record<string, unknown>) => {
    const body = {
      auto_invoice_on_complete: autoOnComplete,
      gateway_enabled: gatewayEnabled,
      bank_name: bankName,
      bank_account_name: bankAccountName,
      bank_account_number: bankAccountNumber,
      paystack_public_key: paystackKey,
      ...patch
    };
    const res = await fetch(`${API_BASE}/billing/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) flash(null, 'Could not save billing settings.');
    else flash('Billing settings saved.', null);
  };

  const saveSettings = async (value: boolean) => {
    setAutoOnComplete(value);
    await persistSettings({ auto_invoice_on_complete: value });
  };

  const generate = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        doc_type: docType,
        mode,
        application_id: applicationId || undefined,
        amount: mode === 'manual' ? Number(amount) : undefined,
        tax: mode === 'manual' ? Number(tax) : 0,
        description: mode === 'manual' ? description : undefined
      };
      const res = await fetch(`${API_BASE}/billing/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      flash(`${docType === 'invoice' ? 'Invoice' : 'Receipt'} ${data.number} issued.`, null);
      setAmount('');
      setDescription('');
      await load();
    } catch (err: any) {
      flash(null, err.message);
    } finally {
      setSaving(false);
    }
  };

  const printRecord = (row: InvoiceRow) => {
    printBillingDocument({
      ...row,
      bank_name: bankName,
      bank_account_name: bankAccountName,
      bank_account_number: bankAccountNumber
    });
  };

  const reportBankPay = async (invoiceId: number) => {
    const res = await fetch(`${API_BASE}/billing/pay/bank`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, note: 'Paid by bank transfer' })
    });
    const data = await res.json();
    if (!res.ok) flash(null, data.error || 'Could not report payment');
    else {
      flash('Told admin you paid by bank transfer. They will confirm when funds arrive.', null);
      await load();
    }
  };

  const startGateway = async (invoiceId: number) => {
    const res = await fetch(`${API_BASE}/billing/pay/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId })
    });
    const data = await res.json();
    if (!res.ok) {
      flash(null, data.error || 'Online payment unavailable');
      return;
    }
    if (data.authorization_url) window.open(data.authorization_url, '_blank');
    const ref = window.prompt('After paying online, paste the Paystack reference here to verify:') || data.reference;
    if (!ref) return;
    const verify = await fetch(`${API_BASE}/billing/pay/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, reference: ref })
    });
    const v = await verify.json();
    if (!verify.ok) flash(null, v.error || 'Could not verify');
    else {
      flash('Online payment verified.', null);
      await load();
    }
  };

  const confirmPay = async (invoiceId: number) => {
    const res = await fetch(`${API_BASE}/billing/pay/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, issue_receipt: true })
    });
    const data = await res.json();
    if (!res.ok) flash(null, data.error || 'Could not confirm');
    else {
      flash(`Payment confirmed${data.receipt ? ` · receipt ${data.receipt.number} sent to client` : ''}.`, null);
      await load();
    }
  };

  return (
    <div className="animate-fade-in page-container">
      <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-red)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Receipt size={20} color="var(--accent-red)" />
          <h3 style={{ color: '#fff', margin: 0 }}>Invoices & Receipts</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {isStaff
            ? 'Generate invoices and receipts for any filing. Clients receive them in this portal to view, download, and pay by bank transfer or optional gateway.'
            : 'View and download invoices and receipts for your filings. Pay by bank transfer, or online if admin has enabled a gateway.'}
        </p>
      </div>

      {(notice || error) && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem',
          background: error ? 'rgba(215,25,32,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${error ? '#fc8181' : '#22c55e'}`,
          color: error ? '#fc8181' : '#4ade80'
        }}>{error || notice}</div>
      )}

      {!isStaff && (bankName || bankAccountNumber) && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>Pay through bank</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {bankName}<br />{bankAccountName}<br />{bankAccountNumber}
          </div>
        </div>
      )}

      {isStaff && (
        <>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700 }}>Automated on completion</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Issue an invoice from the service fee schedule when a case is marked completed.</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoOnComplete} onChange={(e) => saveSettings(e.target.checked)} />
          Enable auto-invoice
        </label>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ color: '#fff', margin: 0 }}>Generate document</h4>
        <div className="billing-generate-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={docType} onChange={(e) => setDocType(e.target.value as 'invoice' | 'receipt')}>
              <option value="invoice">Invoice</option>
              <option value="receipt">Receipt</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Generation</label>
            <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value as 'automated' | 'manual')}>
              <option value="automated">Automated (fee schedule)</option>
              <option value="manual">Manual entry</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Application</label>
            <select className="form-select" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
              <option value="">Select a filing</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} · {a.client_name || 'Client'} · {a.service_type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
        {mode === 'manual' && (
          <div className="billing-generate-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Amount (NGN)</label>
              <input className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="75000" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax (NGN)</label>
              <input className="form-input" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Professional consulting fee" />
            </div>
          </div>
        )}
        <button className="btn-primary" onClick={generate} disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Generating…' : `Generate ${docType}`}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ color: '#fff', margin: 0 }}>How you get paid</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
          Bank transfer is always available. Online gateway is optional and only works if PAYSTACK_SECRET_KEY is set on the server.
        </p>
        <div className="billing-generate-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
          <input className="form-input" placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          <input className="form-input" placeholder="Account name" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
          <input className="form-input" placeholder="Account number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
          <input className="form-input" placeholder="Paystack public key (optional)" value={paystackKey} onChange={(e) => setPaystackKey(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <input type="checkbox" checked={gatewayEnabled} onChange={(e) => setGatewayEnabled(e.target.checked)} />
          Enable optional online gateway
        </label>
        <button className="btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => persistSettings({})}>Save payment details</button>
      </div>
        </>
      )}

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ color: '#fff', margin: 0 }}>Issued documents</h4>
          <button onClick={() => load()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <RefreshCw size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {records.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No invoices or receipts yet.</div>}
          {records.map((row) => (
            <div key={row.id} id={`invoice-${row.id}`} style={{
              display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start',
              padding: '12px', border: `1px solid ${focusInvoiceId === row.id ? 'var(--accent-red)' : 'var(--border-color)'}`,
              borderRadius: '8px', background: focusInvoiceId === row.id ? 'rgba(215,25,32,0.08)' : undefined,
              flexWrap: 'wrap', minWidth: 0
            }}>
              <div style={{ minWidth: 0, flex: '1 1 180px', overflowWrap: 'anywhere' }}>
                <div style={{ color: '#fff', fontWeight: 700 }}>{row.number} · {row.doc_type}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {row.client_name} · {row.generation_mode} · NGN {Number(row.amount).toLocaleString()} · {row.payment_status || 'unpaid'}
                  {row.application_id ? ` · App #${row.application_id}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => printRecord(row)} style={{ padding: '6px 10px' }}>
                  <Printer size={14} /> View / Download
                </button>
                {!isStaff && row.doc_type === 'invoice' && row.payment_status !== 'paid' && (
                  <>
                    <button className="btn-primary" style={{ padding: '6px 10px' }} onClick={() => reportBankPay(row.id)}>I paid by bank</button>
                    {settingsLoaded?.gateway_enabled ? (
                      <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => startGateway(row.id)}>Pay online</button>
                    ) : null}
                  </>
                )}
                {isStaff && row.doc_type === 'invoice' && row.payment_status !== 'paid' && (
                  <button className="btn-primary" style={{ padding: '6px 10px' }} onClick={() => confirmPay(row.id)}>
                    Confirm payment received
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BillingCenter;
