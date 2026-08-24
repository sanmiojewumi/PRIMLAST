export function printBillingDocument(row: {
  number: string;
  doc_type: string;
  client_name?: string;
  client_id?: number;
  application_id?: number | null;
  service_type?: string;
  generation_mode?: string;
  created_at: string;
  amount: number;
  tax?: number;
  description?: string;
  line_items?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  payment_status?: string;
}) {
  let items: { label: string; amount: number }[] = [];
  try { items = JSON.parse(row.line_items || '[]'); } catch { items = []; }
  const total = Number(row.amount) + Number(row.tax || 0);
  const bank = row.bank_name
    ? `<p class="muted"><strong>Pay by bank transfer</strong><br/>${row.bank_name}<br/>${row.bank_account_name || ''}<br/>${row.bank_account_number || ''}</p>`
    : '';
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${row.number}</title>
    <style>
      body{font-family:Inter,Arial,sans-serif;color:#0D1B2A;padding:32px}
      .brand{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #D71920;padding-bottom:12px}
      h1{margin:0;font-size:22px} .muted{color:#546e8a;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:24px}
      th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}
      .total{font-size:18px;font-weight:800}
    </style></head><body>
    <div class="brand">
      <div><h1>PRIME<span style="color:#D71920">FLOW</span></h1>
      <div class="muted">PrimeFlow Consulting Services</div></div>
      <div style="text-align:right"><strong>${row.doc_type.toUpperCase()}</strong><br/>${row.number}<br/>${row.payment_status || ''}</div>
    </div>
    <p class="muted">Client: <strong>${row.client_name || row.client_id || ''}</strong><br/>
    ${row.application_id ? `Application #${row.application_id}` : ''} ${row.service_type ? ' · ' + String(row.service_type).replace(/_/g, ' ') : ''}<br/>
    Issued ${new Date(row.created_at).toLocaleString()} · ${row.generation_mode || ''}</p>
    <table><thead><tr><th>Description</th><th>Amount (NGN)</th></tr></thead><tbody>
    ${(items.length ? items : [{ label: row.description || 'Professional fees', amount: row.amount }]).map(i => `<tr><td>${i.label}</td><td>${Number(i.amount).toLocaleString()}</td></tr>`).join('')}
    <tr><td>Tax</td><td>${Number(row.tax || 0).toLocaleString()}</td></tr>
    <tr><td class="total">Total</td><td class="total">${total.toLocaleString()}</td></tr>
    </tbody></table>
    ${bank}
    <p class="muted">Thank you for choosing PrimeFlow Consulting.</p>
    </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function navFromNotification(n: { link_type?: string | null; link_id?: number | null; title?: string; message?: string }, role?: string) {
  const type = n.link_type || '';
  const id = n.link_id || undefined;
  const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();

  if (type === 'invoice' || type === 'billing' || type === 'payment_confirm') {
    return { tab: 'billing', invoiceId: id };
  }
  if (type === 'chat') {
    return { tab: 'chat', appId: id };
  }
  if (type === 'application' || type === 'kanban') {
    if (role === 'client') return { tab: 'dashboard', appId: id };
    return { tab: 'kanban', appId: id };
  }
  if (text.includes('invoice') || text.includes('receipt') || text.includes('payment')) {
    return { tab: 'billing', invoiceId: id };
  }
  if (text.includes('chat') || text.includes('message') || text.includes('responded')) {
    return { tab: 'chat', appId: id };
  }
  if (text.includes('application') || text.includes('ref #') || text.includes('filing')) {
    if (role === 'client') return { tab: 'dashboard', appId: id };
    return { tab: 'kanban', appId: id };
  }
  return { tab: role === 'client' ? 'dashboard' : 'kanban', appId: id };
}
