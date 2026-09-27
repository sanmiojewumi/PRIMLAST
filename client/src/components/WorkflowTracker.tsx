import React, { useEffect, useMemo, useState } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Activity, BarChart3, ChevronRight, Lightbulb, LineChart, Table2, X } from 'lucide-react';

type Period = 'day' | 'week' | 'month' | 'year';
type ViewMode = 'charts' | 'analytics' | 'insights';

interface TrackerData {
  period: string;
  bucketLabel: string;
  kpis: {
    submissions: number;
    completions: number;
    documents: number;
    signatures: number;
    invoices: number;
    activities: number;
  };
  series: Record<string, { bucket: string; count: number }[]>;
  byStatus: { status: string; count: number }[];
  byService: { service_type: string; count: number }[];
  byAction: { action: string; count: number }[];
  recent: { id: number; action: string; details: string; created_at: string; user_name?: string }[];
}

const KPI_COLORS = ['#D71920', '#1A6FE8', '#F5A623', '#22c55e', '#60a5fa', '#f87171'];
const KPI_KINDS = ['submissions', 'completions', 'documents', 'signatures', 'invoices', 'activities'] as const;

const fmt = (value?: string | number | null) => {
  if (value == null || value === '') return '—';
  const s = String(value);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(s)) return d.toLocaleString();
  return s.replace(/_/g, ' ');
};

const BarSet: React.FC<{
  data: { bucket: string; count: number }[];
  color: string;
  onBar?: (bucket: string) => void;
}> = ({ data, color, onBar }) => {
  const max = Math.max(...data.map((d) => Number(d.count) || 0), 1);
  if (!data.length) {
    return <div className="workflow-empty">No activity in this period.</div>;
  }
  return (
    <div className="workflow-bars">
      {data.map((d) => (
        <button
          key={d.bucket}
          type="button"
          className="workflow-bar-col workflow-clickable"
          onClick={() => onBar?.(d.bucket)}
          title={`${d.bucket}: ${d.count} — open breakdown`}
        >
          <div className="workflow-bar-track">
            <div
              className="workflow-bar"
              style={{
                height: `${Math.max(8, (Number(d.count) / max) * 100)}%`,
                background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`
              }}
            />
          </div>
          <span className="workflow-bar-label">{String(d.bucket).slice(-5)}</span>
          <span className="workflow-bar-count">{d.count}</span>
        </button>
      ))}
    </div>
  );
};

const WorkflowTracker: React.FC = () => {
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [view, setView] = useState<ViewMode>('charts');
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('Breakdown');
  const [drillItems, setDrillItems] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<{ title: string; mode: 'list' | 'record'; params?: Record<string, string>; record?: { type: string; id: number } }[]>([]);
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/workflow/tracker?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body?.kpis) {
          throw new Error(body?.error || 'Could not load workflow tracker');
        }
        setData(body);
      })
      .catch((err) => {
        console.error(err);
        setData(null);
        setError(err.message || 'Could not load workflow tracker');
      })
      .finally(() => setLoading(false));
  }, [token, period]);

  const kpiCards = useMemo(() => {
    if (!data?.kpis) return [];
    return [
      ['Submissions', data.kpis.submissions, 'submissions'],
      ['Completions', data.kpis.completions, 'completions'],
      ['Documents', data.kpis.documents, 'documents'],
      ['Signatures', data.kpis.signatures, 'signatures'],
      ['Invoices', data.kpis.invoices, 'invoices'],
      ['Activities', data.kpis.activities, 'activities']
    ] as [string, number, (typeof KPI_KINDS)[number]][];
  }, [data]);

  const insights = useMemo(() => {
    if (!data) return [];
    const { kpis, byStatus, byService, byAction } = data;
    const rate = kpis.submissions ? Math.round((kpis.completions / kpis.submissions) * 100) : 0;
    const pending = (byStatus || []).filter((s) => !['completed', 'rejected'].includes(s.status)).reduce((n, s) => n + Number(s.count), 0);
    const topService = [...(byService || [])].sort((a, b) => Number(b.count) - Number(a.count))[0];
    const topAction = [...(byAction || [])].sort((a, b) => Number(b.count) - Number(a.count))[0];
    const docsPer = kpis.submissions ? (kpis.documents / kpis.submissions).toFixed(1) : '0';
    return [
      {
        label: 'Completion rate',
        value: `${rate}%`,
        note: `${kpis.completions} of ${kpis.submissions} filings completed in this period.`,
        kind: 'completions' as const
      },
      {
        label: 'Open pipeline',
        value: String(pending),
        note: 'Filings not yet completed or rejected (all time).',
        kind: 'status' as const,
        extra: { status: (byStatus || []).find((s) => !['completed', 'rejected'].includes(s.status))?.status || 'submitted' }
      },
      {
        label: 'Busiest service',
        value: topService ? fmt(topService.service_type) : 'None',
        note: topService ? `${topService.count} filings this period.` : 'No filings in this period.',
        kind: 'service' as const,
        extra: topService ? { service: topService.service_type } : undefined
      },
      {
        label: 'Top staff action',
        value: topAction ? fmt(topAction.action) : 'None',
        note: topAction ? `${topAction.count} logged events.` : 'No staff actions logged.',
        kind: 'activities' as const,
        extra: topAction ? { action: topAction.action } : undefined
      },
      {
        label: 'Documents per filing',
        value: String(docsPer),
        note: `${kpis.documents} documents and ${kpis.signatures} signatures captured.`,
        kind: 'documents' as const
      },
      {
        label: 'Billing volume',
        value: String(kpis.invoices),
        note: 'Invoices and receipts generated this period.',
        kind: 'invoices' as const
      }
    ];
  }, [data]);

  const loadList = async (title: string, params: Record<string, string>, push = true) => {
    if (!token) return;
    setDrillOpen(true);
    setDrillLoading(true);
    setDrillError(null);
    setRecord(null);
    setDrillTitle(title);
    const qs = new URLSearchParams({ period, ...params });
    try {
      const r = await fetch(`${API_BASE}/workflow/details?${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.error || 'Could not load breakdown');
      setDrillTitle(body.title || title);
      setDrillItems(body.items || []);
      if (push) {
        setCrumbs((prev) => [...prev, { title: body.title || title, mode: 'list', params }]);
      }
    } catch (err: any) {
      setDrillError(err.message || 'Could not load breakdown');
      setDrillItems([]);
    } finally {
      setDrillLoading(false);
    }
  };

  const loadRecord = async (type: string, id: number, title: string, push = true) => {
    if (!token) return;
    setDrillOpen(true);
    setDrillLoading(true);
    setDrillError(null);
    try {
      const r = await fetch(`${API_BASE}/workflow/record/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.error || 'Could not load record');
      setRecord(body);
      setDrillTitle(title);
      if (push) setCrumbs((prev) => [...prev, { title, mode: 'record', record: { type, id } }]);
    } catch (err: any) {
      setDrillError(err.message || 'Could not load record');
    } finally {
      setDrillLoading(false);
    }
  };

  const openKind = (kind: string, extra: Record<string, string> = {}, title?: string) => {
    setCrumbs([]);
    loadList(title || fmt(kind), { kind, ...extra }, true);
  };

  const openItem = (item: any) => {
    const type = item.recordType;
    if (type === 'application') loadRecord('application', item.id, `Filing #${item.id} · ${fmt(item.service_type)}`);
    else if (type === 'document') loadRecord('document', item.id, item.original_name || `Document #${item.id}`);
    else if (type === 'invoice') loadRecord('invoice', item.id, item.number || `Invoice #${item.id}`);
    else if (type === 'audit') loadRecord('audit', item.id, fmt(item.action));
  };

  const jumpCrumb = async (index: number) => {
    const crumb = crumbs[index];
    setCrumbs(crumbs.slice(0, index + 1));
    if (crumb.mode === 'list' && crumb.params) {
      await loadList(crumb.title, crumb.params, false);
    } else if (crumb.record) {
      await loadRecord(crumb.record.type, crumb.record.id, crumb.title, false);
    }
  };

  const closeDrill = () => {
    setDrillOpen(false);
    setCrumbs([]);
    setRecord(null);
    setDrillItems([]);
  };

  const openOnBoard = (appId: number) => {
    window.dispatchEvent(new CustomEvent('primeflow-navigate', { detail: { tab: 'kanban', appId } }));
  };

  const openInvoice = (invoiceId: number) => {
    window.dispatchEvent(new CustomEvent('primeflow-navigate', { detail: { tab: 'billing', invoiceId } }));
  };

  const itemPrimary = (item: any) => {
    if (item.recordType === 'application') return `${fmt(item.service_type)} · ${item.client_name || 'Client'}`;
    if (item.recordType === 'document') return item.original_name || `Document #${item.id}`;
    if (item.recordType === 'invoice') return `${item.number} · ${item.doc_type}`;
    return fmt(item.action);
  };

  const itemMeta = (item: any) => {
    if (item.recordType === 'application') return `${fmt(item.status)} · ${fmt(item.created_at)}`;
    if (item.recordType === 'document') return `${fmt(item.kind)} · filing #${item.application_id} · ${fmt(item.created_at)}`;
    if (item.recordType === 'invoice') return `${fmt(item.status)} · ₦${Number(item.amount || 0).toLocaleString()} · ${fmt(item.created_at)}`;
    return `${item.user_name || 'System'} · ${fmt(item.created_at)}`;
  };

  return (
    <div className="animate-fade-in theme-colored page-theme-glow page-container workflow-tracker">
      <div className="glass-panel workflow-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-red)" />
            <h3 style={{ color: '#fff', margin: 0 }}>Workflow Tracker</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0' }}>
            Click any metric for a breakdown, then drill into the filing, document, invoice, or activity.
          </p>
        </div>
        <div className="workflow-toolbar">
          <div className="workflow-period-tabs">
            {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={period === p ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 12px', textTransform: 'capitalize' }}
              >
                {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : p === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
          <div className="workflow-view-tabs">
            {([
              ['charts', 'Charts', BarChart3],
              ['analytics', 'Analytics', Table2],
              ['insights', 'Insights', Lightbulb]
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                className={view === id ? 'workflow-view-tab active' : 'workflow-view-tab'}
                onClick={() => setView(id)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading tracker…</div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', color: '#f87171', borderColor: 'rgba(215,25,32,0.35)' }}>{error}</div>
      ) : data ? (
        <>
          <div className="workflow-kpi-grid">
            {kpiCards.map(([label, value, kind], i) => (
              <button
                key={label}
                type="button"
                className="glass-panel workflow-kpi workflow-clickable"
                onClick={() => openKind(kind, {}, label)}
              >
                <div className="workflow-kpi-label">{label}</div>
                <div className="workflow-kpi-value" style={{ color: KPI_COLORS[i] }}>{value}</div>
                <div className="workflow-kpi-hint">View breakdown</div>
              </button>
            ))}
          </div>

          {view === 'charts' && (
            <>
              <div className="dashboard-layout-container">
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BarChart3 size={18} color="var(--accent-red)" />
                    <h4 style={{ color: '#fff', margin: 0 }}>Submissions by {data.bucketLabel.toLowerCase()}</h4>
                  </div>
                  <BarSet data={data.series?.submissions || []} color="var(--accent-red)" onBar={(bucket) => openKind('submissions', { bucket }, `Submissions · ${bucket}`)} />
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '12px' }}>Completions</h4>
                  <BarSet data={data.series?.completions || []} color="#22c55e" onBar={(bucket) => openKind('completions', { bucket }, `Completions · ${bucket}`)} />
                </div>
              </div>
              <div className="dashboard-layout-container">
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '12px' }}>Documents</h4>
                  <BarSet data={data.series?.documents || []} color="#1A6FE8" onBar={(bucket) => openKind('documents', { bucket }, `Documents · ${bucket}`)} />
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '12px' }}>Invoices</h4>
                  <BarSet data={data.series?.invoices || []} color="#F5A623" onBar={(bucket) => openKind('invoices', { bucket }, `Invoices · ${bucket}`)} />
                </div>
              </div>
              <div className="dashboard-layout-container">
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '12px' }}>Status mix</h4>
                  {(data.byStatus || []).length === 0 ? (
                    <div className="workflow-empty">No filings yet.</div>
                  ) : (data.byStatus || []).map((s) => (
                    <button key={s.status} type="button" className="workflow-row workflow-clickable" onClick={() => openKind('status', { status: s.status }, fmt(s.status))}>
                      <span>{fmt(s.status)}</span>
                      <strong>{s.count}</strong>
                    </button>
                  ))}
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '12px' }}>Staff actions this period</h4>
                  {(data.byAction || []).length === 0 ? (
                    <div className="workflow-empty">No staff actions in this period.</div>
                  ) : (data.byAction || []).map((s) => (
                    <button key={s.action} type="button" className="workflow-row workflow-clickable" onClick={() => openKind('activities', { action: s.action }, fmt(s.action))}>
                      <span>{fmt(s.action)}</span>
                      <strong>{s.count}</strong>
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ color: '#fff', marginBottom: '12px' }}>Recent activity</h4>
                <div className="workflow-activity-list">
                  {(data.recent || []).length === 0 ? (
                    <div className="workflow-empty">No recent activity.</div>
                  ) : (data.recent || []).map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="workflow-activity workflow-clickable"
                      onClick={() => {
                        setCrumbs([]);
                        loadRecord('audit', row.id, fmt(row.action), true);
                      }}
                    >
                      <div className="workflow-activity-title">{fmt(row.action)} · {row.user_name || 'System'}</div>
                      <div className="workflow-activity-meta">{row.details}</div>
                      <div className="workflow-activity-meta">{fmt(row.created_at)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === 'analytics' && (
            <div className="dashboard-layout-container">
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Table2 size={16} color="var(--accent-red)" />
                  <h4 style={{ color: '#fff', margin: 0 }}>By service this period</h4>
                </div>
                {(data.byService || []).length === 0 ? (
                  <div className="workflow-empty">No filings in this period.</div>
                ) : (data.byService || []).map((s) => (
                  <button key={s.service_type} type="button" className="workflow-row workflow-clickable" onClick={() => openKind('service', { service: s.service_type }, fmt(s.service_type))}>
                    <span>{fmt(s.service_type)}</span>
                    <strong>{s.count}</strong>
                  </button>
                ))}
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ color: '#fff', marginBottom: 12 }}>By status (all time)</h4>
                {(data.byStatus || []).map((s) => (
                  <button key={s.status} type="button" className="workflow-row workflow-clickable" onClick={() => openKind('status', { status: s.status }, fmt(s.status))}>
                    <span>{fmt(s.status)}</span>
                    <strong>{s.count}</strong>
                  </button>
                ))}
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ color: '#fff', marginBottom: 12 }}>By staff action</h4>
                {(data.byAction || []).map((s) => (
                  <button key={s.action} type="button" className="workflow-row workflow-clickable" onClick={() => openKind('activities', { action: s.action }, fmt(s.action))}>
                    <span>{fmt(s.action)}</span>
                    <strong>{s.count}</strong>
                  </button>
                ))}
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <LineChart size={16} color="var(--accent-red)" />
                  <h4 style={{ color: '#fff', margin: 0 }}>Period totals</h4>
                </div>
                {kpiCards.map(([label, value, kind]) => (
                  <button key={label} type="button" className="workflow-row workflow-clickable" onClick={() => openKind(kind, {}, label)}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'insights' && (
            <div className="workflow-insight-grid">
              {insights.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  className="glass-panel workflow-insight workflow-clickable"
                  onClick={() => openKind(card.kind, card.extra || {}, card.label)}
                >
                  <div className="workflow-kpi-label">{card.label}</div>
                  <div className="workflow-kpi-value" style={{ color: '#fff' }}>{card.value}</div>
                  <p className="workflow-insight-note">{card.note}</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}

      {drillOpen && (
        <div className="workflow-drill-overlay" onClick={closeDrill}>
          <div className="glass-panel workflow-drill" onClick={(e) => e.stopPropagation()}>
            <div className="workflow-drill-head">
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>{drillTitle}</h3>
                <div className="workflow-crumbs">
                  <button type="button" onClick={closeDrill}>Tracker</button>
                  {crumbs.map((c, i) => (
                    <span key={`${c.title}-${i}`}>
                      <ChevronRight size={12} />
                      <button type="button" onClick={() => jumpCrumb(i)}>{c.title}</button>
                    </span>
                  ))}
                </div>
              </div>
              <button type="button" className="btn-secondary" onClick={closeDrill} style={{ padding: 8 }} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {drillLoading ? (
              <div className="workflow-empty">Loading…</div>
            ) : drillError ? (
              <div className="workflow-empty" style={{ color: '#f87171' }}>{drillError}</div>
            ) : record?.recordType === 'application' ? (
              <div className="workflow-record">
                <dl className="workflow-dl">
                  <div><dt>Client</dt><dd>{record.app.client_name || '—'} {record.app.client_email ? `· ${record.app.client_email}` : ''}</dd></div>
                  <div><dt>Service</dt><dd>{fmt(record.app.service_type)}</dd></div>
                  <div><dt>Status</dt><dd>{fmt(record.app.status)}</dd></div>
                  <div><dt>Assignee</dt><dd>{record.app.assignee_name || 'Unassigned'}</dd></div>
                  <div><dt>Submitted</dt><dd>{fmt(record.app.created_at)}</dd></div>
                  <div><dt>Updated</dt><dd>{fmt(record.app.updated_at)}</dd></div>
                </dl>
                <button type="button" className="btn-primary" onClick={() => openOnBoard(record.app.id)}>Open on Kanban</button>
                <h4>Documents</h4>
                {(record.documents || []).length === 0 ? <div className="workflow-empty">No documents.</div> : record.documents.map((d: any) => (
                  <button key={d.id} type="button" className="workflow-row workflow-clickable" onClick={() => loadRecord('document', d.id, d.original_name)}>
                    <span>{d.original_name} · {fmt(d.kind)}</span>
                    <strong>#{d.id}</strong>
                  </button>
                ))}
                <h4>Invoices</h4>
                {(record.invoices || []).length === 0 ? <div className="workflow-empty">No invoices.</div> : record.invoices.map((inv: any) => (
                  <button key={inv.id} type="button" className="workflow-row workflow-clickable" onClick={() => loadRecord('invoice', inv.id, inv.number)}>
                    <span>{inv.number} · {inv.doc_type} · ₦{Number(inv.amount || 0).toLocaleString()}</span>
                    <strong>{fmt(inv.status)}</strong>
                  </button>
                ))}
                <h4>Related activity</h4>
                {(record.audits || []).length === 0 ? <div className="workflow-empty">No related activity.</div> : record.audits.map((a: any) => (
                  <button key={a.id} type="button" className="workflow-row workflow-clickable" onClick={() => loadRecord('audit', a.id, fmt(a.action))}>
                    <span>{fmt(a.action)} · {a.user_name || 'System'}</span>
                    <strong>{fmt(a.created_at)}</strong>
                  </button>
                ))}
              </div>
            ) : record?.recordType === 'document' ? (
              <div className="workflow-record">
                <dl className="workflow-dl">
                  <div><dt>File</dt><dd>{record.doc.original_name}</dd></div>
                  <div><dt>Kind</dt><dd>{fmt(record.doc.kind)}</dd></div>
                  <div><dt>Client</dt><dd>{record.doc.client_name || '—'}</dd></div>
                  <div><dt>Filing</dt><dd>#{record.doc.application_id} · {fmt(record.doc.service_type)} · {fmt(record.doc.status)}</dd></div>
                  <div><dt>Size</dt><dd>{record.doc.size ? `${Math.round(record.doc.size / 1024)} KB` : '—'}</dd></div>
                  <div><dt>Uploaded</dt><dd>{fmt(record.doc.created_at)}</dd></div>
                </dl>
                {record.doc.application_id && (
                  <button type="button" className="btn-primary" onClick={() => loadRecord('application', record.doc.application_id, `Filing #${record.doc.application_id}`)}>
                    Open parent filing
                  </button>
                )}
              </div>
            ) : record?.recordType === 'invoice' ? (
              <div className="workflow-record">
                <dl className="workflow-dl">
                  <div><dt>Number</dt><dd>{record.invoice.number}</dd></div>
                  <div><dt>Type</dt><dd>{fmt(record.invoice.doc_type)}</dd></div>
                  <div><dt>Amount</dt><dd>₦{Number(record.invoice.amount || 0).toLocaleString()}</dd></div>
                  <div><dt>Status</dt><dd>{fmt(record.invoice.status)} · {fmt(record.invoice.payment_status)}</dd></div>
                  <div><dt>Client</dt><dd>{record.invoice.client_name || '—'}</dd></div>
                  <div><dt>Created</dt><dd>{fmt(record.invoice.created_at)}</dd></div>
                </dl>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {record.invoice.application_id && (
                    <button type="button" className="btn-primary" onClick={() => loadRecord('application', record.invoice.application_id, `Filing #${record.invoice.application_id}`)}>
                      Open parent filing
                    </button>
                  )}
                  <button type="button" className="btn-secondary" onClick={() => openInvoice(record.invoice.id)}>Open in billing</button>
                </div>
              </div>
            ) : record?.recordType === 'audit' ? (
              <div className="workflow-record">
                <dl className="workflow-dl">
                  <div><dt>Action</dt><dd>{fmt(record.audit.action)}</dd></div>
                  <div><dt>User</dt><dd>{record.audit.user_name || 'System'} {record.audit.user_role ? `· ${fmt(record.audit.user_role)}` : ''}</dd></div>
                  <div><dt>When</dt><dd>{fmt(record.audit.created_at)}</dd></div>
                  <div><dt>IP</dt><dd>{record.audit.ip_address || '—'}</dd></div>
                  <div><dt>Details</dt><dd>{record.audit.details}</dd></div>
                </dl>
              </div>
            ) : (
              <div className="workflow-activity-list">
                {drillItems.length === 0 ? (
                  <div className="workflow-empty">Nothing in this slice.</div>
                ) : drillItems.map((item) => (
                  <button key={`${item.recordType}-${item.id}`} type="button" className="workflow-activity workflow-clickable" onClick={() => openItem(item)}>
                    <div className="workflow-activity-title">{itemPrimary(item)}</div>
                    <div className="workflow-activity-meta">{itemMeta(item)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTracker;
