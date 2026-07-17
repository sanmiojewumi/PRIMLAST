import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Calendar,
  FileText, Info, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

interface ComplianceItem {
  id: number;
  user_id: number;
  item_key: string;
  title: string;
  agency: string;
  status: 'compliant' | 'due_soon' | 'overdue' | 'not_registered' | 'pending';
  due_date: string | null;
  details: string;
  priority: 'high' | 'medium' | 'low';
  updated_at: string;
}

const STATUS_CONFIG = {
  compliant:       { label: 'Compliant',       color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   icon: CheckCircle2 },
  due_soon:        { label: 'Due Soon',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', icon: Clock },
  overdue:         { label: 'Overdue',          color: '#D71920', bg: 'rgba(215,25,32,0.1)',   border: 'rgba(215,25,32,0.3)',   icon: AlertTriangle },
  not_registered:  { label: 'Not Registered',   color: '#94a3b8', bg: 'rgba(148,163,184,0.08)',border: 'rgba(148,163,184,0.2)', icon: Info },
  pending:         { label: 'Pending Review',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)',icon: RefreshCw },
};

// ─── Health Score Arc ─────────────────────────────────────────────────────────
const HealthGauge: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 70;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#D71920';
  const label = score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'At Risk';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="180" height="100" viewBox="0 0 180 100" style={{ overflow: 'visible' }}>
        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circumference / 2}
          strokeDashoffset={(circumference / 2) * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
        <text x="90" y="82" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="'Outfit', sans-serif">{score}</text>
        <text x="90" y="96" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="'Inter', sans-serif">/ 100</text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color, fontFamily: "'Outfit', sans-serif" }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Business Health Score</div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ComplianceDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'compliant' | 'due_soon' | 'overdue' | 'not_registered'>('all');
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  // ── Fetch compliance items from SQLite DB via API ──────────────────────────
  const fetchItems = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/compliance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Optimistic status toggle (persists to DB) ─────────────────────────────
  const cycleStatus = async (item: ComplianceItem) => {
    const cycle: ComplianceItem['status'][] = ['not_registered', 'pending', 'due_soon', 'compliant'];
    const next = cycle[(cycle.indexOf(item.status) + 1) % cycle.length];
    setUpdatingKey(item.item_key);
    // Optimistic update
    setItems(prev => prev.map(i => i.item_key === item.item_key ? { ...i, status: next } : i));
    try {
      await fetch(`${API_BASE}/compliance/${item.item_key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next, due_date: item.due_date, details: item.details })
      });
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.item_key === item.item_key ? { ...i, status: item.status } : i));
    } finally {
      setUpdatingKey(null);
    }
  };

  const compliantCount = items.filter(i => i.status === 'compliant').length;
  const issueCount = items.filter(i => ['overdue', 'not_registered'].includes(i.status)).length;
  const dueSoonCount = items.filter(i => i.status === 'due_soon').length;
  const healthScore = items.length ? Math.round((compliantCount / items.length) * 100) : 0;

  const filteredItems = activeFilter === 'all' ? items : items.filter(i => i.status === activeFilter);

  // Upcoming deadlines
  const deadlines = items.filter(i => i.due_date).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#D71920', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear' }} />
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading compliance data from database…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>
            Compliance Dashboard
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            Live view of your business compliance health — powered by your secure database
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={fetchItems} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <a href={`https://wa.me/2347072928256?text=${encodeURIComponent(`Hello Primeflow, my name is ${user?.name || 'Client'}. I would like to get expert compliance help.`)}`} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '10px 18px' }}>
            <ShieldCheck size={16} /> Get Expert Help
          </a>
        </div>
      </div>

      {/* Top row: Health Score + Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px', alignItems: 'stretch' }}>

        {/* Health Score Gauge */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '220px' }}>
          <HealthGauge score={healthScore} />
          <div style={{ marginTop: '16px', fontSize: '0.72rem', color: '#64748b', textAlign: 'center' }}>
            Based on {items.length} tracked compliance areas
          </div>
          <div style={{ marginTop: '12px', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Compliant', count: compliantCount, color: '#22c55e' },
              { label: 'Due Soon', count: dueSoonCount, color: '#f59e0b' },
              { label: 'Issues', count: issueCount, color: '#D71920' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{s.label}</span>
                </div>
                <span style={{ color: s.color, fontWeight: '700', fontSize: '0.85rem' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { icon: CheckCircle2, label: 'Compliant Items',  value: compliantCount, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { icon: Clock,         label: 'Due Soon',         value: dueSoonCount,   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { icon: AlertTriangle, label: 'Issues Found',     value: issueCount,     color: '#D71920', bg: 'rgba(215,25,32,0.08)' },
            { icon: FileText,      label: 'Total Tracked',    value: items.length,   color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="glass-panel" style={{ padding: '20px', background: card.bg, borderColor: `${card.color}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Icon size={20} style={{ color: card.color }} />
                  <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '500' }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: card.color, fontFamily: "'Outfit', sans-serif" }}>{card.value}</div>
              </div>
            );
          })}

          {/* DB badge */}
          <div className="glass-panel" style={{ padding: '14px 16px', background: 'rgba(215,25,32,0.04)', borderColor: 'rgba(215,25,32,0.12)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} style={{ color: '#D71920', flexShrink: 0 }} />
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                Data sourced live from <strong style={{ color: '#fff' }}>PrimeFlow SQLite Database</strong>. 
                {issueCount > 0 && <> You have <strong style={{ color: '#D71920' }}>{issueCount} issue(s)</strong> to resolve. </>}
                <a href={`https://wa.me/2347072928256?text=${encodeURIComponent(`Hello Primeflow, my name is ${user?.name || 'Client'}. I would like to contact your team regarding my compliance issues.`)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#D71920', textDecoration: 'none', fontWeight: '600' }}>
                  Contact Primeflow →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {deadlines.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Calendar size={20} style={{ color: '#D71920' }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Upcoming Deadlines</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deadlines.map(d => {
              const cfg = STATUS_CONFIG[d.status];
              return (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: '10px', flexWrap: 'wrap', gap: '8px',
                  background: d.status === 'overdue' ? 'rgba(215,25,32,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${d.status === 'overdue' ? 'rgba(215,25,32,0.2)' : 'rgba(255,255,255,0.06)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: '600' }}>{d.title}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{d.due_date}</div>
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All (${items.length})` },
          { key: 'compliant', label: `✅ Compliant (${compliantCount})` },
          { key: 'due_soon', label: `⏰ Due Soon (${dueSoonCount})` },
          { key: 'overdue', label: `⚠️ Overdue` },
          { key: 'not_registered', label: `❌ Not Registered` },
        ].map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key as typeof activeFilter)}
            style={{ padding: '7px 14px', borderRadius: '20px', border: '1px solid', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s ease',
              background: activeFilter === f.key ? 'var(--accent-red)' : 'rgba(255,255,255,0.03)',
              borderColor: activeFilter === f.key ? 'var(--accent-red)' : 'rgba(255,255,255,0.08)',
              color: activeFilter === f.key ? '#fff' : '#94a3b8' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Compliance Item Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filteredItems.map(item => {
          const cfg = STATUS_CONFIG[item.status];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="glass-panel" style={{ padding: '20px', borderColor: cfg.border, background: cfg.bg, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{item.agency}</div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>{item.title}</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: cfg.bg, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                  <Icon size={13} style={{ color: cfg.color }} />
                  <span style={{ color: cfg.color, fontSize: '0.72rem', fontWeight: '600' }}>{cfg.label}</span>
                </div>
              </div>

              <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.5', margin: '0 0 12px' }}>{item.details}</p>

              {item.due_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
                  <Calendar size={13} style={{ color: cfg.color }} />
                  <span style={{ color: cfg.color, fontSize: '0.75rem', fontWeight: '600' }}>Due: {item.due_date}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.status !== 'compliant' ? (
                  <a 
                    href={`https://wa.me/2347072928256?text=${encodeURIComponent(
                      `Hello Primeflow, my name is ${user?.name || 'Client'}. I would like to fix my ${item.title} compliance on the system.`
                    )}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D71920', fontSize: '0.78rem', fontWeight: '600', textDecoration: 'none' }}
                  >
                    Fix with Primeflow <ChevronRight size={14} />
                  </a>
                ) : <span />}
                <button onClick={() => cycleStatus(item)} disabled={updatingKey === item.item_key}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '4px 10px', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer' }}>
                  {updatingKey === item.item_key ? '…' : 'Update'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
        <Info size={15} style={{ color: '#475569', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ color: '#475569', fontSize: '0.78rem', margin: 0, lineHeight: '1.5' }}>
          Compliance status is stored in your secure PrimeFlow database. Use the <strong>Update</strong> button to cycle your status. For professional compliance management, contact the Primeflow team.
        </p>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
