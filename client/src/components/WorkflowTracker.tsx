import React, { useEffect, useMemo, useState } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Activity, BarChart3 } from 'lucide-react';

type Period = 'day' | 'week' | 'month' | 'year';

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

const BarSet: React.FC<{ data: { bucket: string; count: number }[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data.map((d) => Number(d.count) || 0), 1);
  if (!data.length) {
    return <div className="workflow-empty">No activity in this period.</div>;
  }
  return (
    <div className="workflow-bars">
      {data.map((d) => (
        <div key={d.bucket} className="workflow-bar-col">
          <div className="workflow-bar-track">
            <div
              className="workflow-bar"
              style={{
                height: `${Math.max(8, (Number(d.count) / max) * 100)}%`,
                background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`
              }}
              title={`${d.bucket}: ${d.count}`}
            />
          </div>
          <span className="workflow-bar-label">{String(d.bucket).slice(-5)}</span>
          <span className="workflow-bar-count">{d.count}</span>
        </div>
      ))}
    </div>
  );
};

const WorkflowTracker: React.FC = () => {
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      ['Submissions', data.kpis.submissions],
      ['Completions', data.kpis.completions],
      ['Documents', data.kpis.documents],
      ['Signatures', data.kpis.signatures],
      ['Invoices', data.kpis.invoices],
      ['Activities', data.kpis.activities]
    ] as [string, number][];
  }, [data]);

  return (
    <div className="animate-fade-in theme-colored page-theme-glow page-container workflow-tracker">
      <div className="glass-panel workflow-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-red)" />
            <h3 style={{ color: '#fff', margin: 0 }}>Workflow Tracker</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0' }}>
            Daily, weekly, monthly, and yearly activity across filings, staff actions, signatures, and billing.
          </p>
        </div>
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
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading tracker…</div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', color: '#f87171', borderColor: 'rgba(215,25,32,0.35)' }}>{error}</div>
      ) : data ? (
        <>
          <div className="workflow-kpi-grid">
            {kpiCards.map(([label, value], i) => (
              <div key={label} className="glass-panel workflow-kpi">
                <div className="workflow-kpi-label">{label}</div>
                <div className="workflow-kpi-value" style={{ color: KPI_COLORS[i] }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="dashboard-layout-container">
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BarChart3 size={18} color="var(--accent-red)" />
                <h4 style={{ color: '#fff', margin: 0 }}>Submissions by {data.bucketLabel.toLowerCase()}</h4>
              </div>
              <BarSet data={data.series?.submissions || []} color="var(--accent-red)" />
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>Completions</h4>
              <BarSet data={data.series?.completions || []} color="#22c55e" />
            </div>
          </div>

          <div className="dashboard-layout-container">
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>Status mix (all time)</h4>
              {(data.byStatus || []).length === 0 ? (
                <div className="workflow-empty">No filings yet.</div>
              ) : (data.byStatus || []).map((s) => (
                <div key={s.status} className="workflow-row">
                  <span>{s.status.replace(/_/g, ' ')}</span>
                  <strong>{s.count}</strong>
                </div>
              ))}
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>Staff actions this period</h4>
              {(data.byAction || []).length === 0 ? (
                <div className="workflow-empty">No staff actions in this period.</div>
              ) : (data.byAction || []).map((s) => (
                <div key={s.action} className="workflow-row">
                  <span>{s.action.replace(/_/g, ' ')}</span>
                  <strong>{s.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ color: '#fff', marginBottom: '12px' }}>Recent activity</h4>
            <div className="workflow-activity-list">
              {(data.recent || []).length === 0 ? (
                <div className="workflow-empty">No recent activity.</div>
              ) : (data.recent || []).map((row) => (
                <div key={row.id} className="workflow-activity">
                  <div className="workflow-activity-title">{row.action.replace(/_/g, ' ')} · {row.user_name || 'System'}</div>
                  <div className="workflow-activity-meta">{row.details}</div>
                  <div className="workflow-activity-meta">{new Date(row.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default WorkflowTracker;
