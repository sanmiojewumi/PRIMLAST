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

const BarSet: React.FC<{ data: { bucket: string; count: number }[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data.map((d) => Number(d.count) || 0), 1);
  if (!data.length) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '24px 0' }}>No activity in this period.</div>;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px' }}>
      {data.map((d) => (
        <div key={d.bucket} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max(6, (Number(d.count) / max) * 100)}%`,
              background: color,
              borderRadius: '4px 4px 0 0',
              minHeight: '4px'
            }} />
          </div>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', writingMode: data.length > 10 ? 'vertical-rl' : undefined }}>
            {String(d.bucket).slice(-5)}
          </span>
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

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/workflow/tracker?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, period]);

  const kpiCards = useMemo(() => {
    if (!data) return [];
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
    <div className="animate-fade-in page-container">
      <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-red)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-red)" />
            <h3 style={{ color: '#fff', margin: 0 }}>Workflow Tracker</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0' }}>
            Daily, weekly, monthly, and yearly activity across filings, staff actions, signatures, and billing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={period === p ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 12px', textTransform: 'capitalize' }}
            >
              {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : p === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading tracker…</div>
      ) : (
        <>
          <div className="dashboard-grid">
            {kpiCards.map(([label, value]) => (
              <div key={label} className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="dashboard-layout-container">
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BarChart3 size={18} color="var(--accent-red)" />
                <h4 style={{ color: '#fff', margin: 0 }}>Submissions by {data.bucketLabel.toLowerCase()}</h4>
              </div>
              <BarSet data={data.series.submissions || []} color="var(--accent-red)" />
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>Completions</h4>
              <BarSet data={data.series.completions || []} color="#22c55e" />
            </div>
          </div>

          <div className="dashboard-layout-container">
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>Status mix (all time)</h4>
              {(data.byStatus || []).map((s) => (
                <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}>
                  <span>{s.status.replace(/_/g, ' ')}</span>
                  <strong>{s.count}</strong>
                </div>
              ))}
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>Staff actions this period</h4>
              {(data.byAction || []).map((s) => (
                <div key={s.action} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}>
                  <span>{s.action.replace(/_/g, ' ')}</span>
                  <strong>{s.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ color: '#fff', marginBottom: '12px' }}>Recent activity</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {(data.recent || []).map((row) => (
                <div key={row.id} style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{row.action.replace(/_/g, ' ')} · {row.user_name || 'System'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{row.details}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date(row.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkflowTracker;
