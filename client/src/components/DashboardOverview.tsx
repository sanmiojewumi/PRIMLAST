import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Activity,
  TrendingUp
} from 'lucide-react';
import type { AdminStats, Application } from '../types';

const DashboardOverview: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [clientApps, setClientApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLocation, setProfileLocation] = useState<{ state: string; lga: string } | null>(null);

  useEffect(() => {
    if (!user || !token) return;
    const fetchLoc = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/profile/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            setProfileLocation({
              state: data.profile.state || '',
              lga: data.profile.lga || ''
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch user location profile:', e);
      }
    };
    fetchLoc();
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;

    const fetchDashboardData = async () => {
      try {
        if (user.role === 'client') {
          // Fetch client's own applications
          const res = await fetch(`${API_BASE}/services/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setClientApps(data);
          }
        } else {
          // Fetch global admin/staff statistics
          const res = await fetch(`${API_BASE}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear' }} />
      </div>
    );
  }

  // Client layout metrics calculation
  const totalClientApps = clientApps.length;
  const pendingClientApps = clientApps.filter(a => !['completed', 'rejected'].includes(a.status)).length;
  const completedClientApps = clientApps.filter(a => a.status === 'completed').length;
  const actionRequiredClientApps = clientApps.filter(a => a.status === 'add_info_required').length;

  const isClient = user?.role === 'client';

  return (
    <div className="animate-fade-in page-container">
      
      {/* Welcome banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          borderLeft: '4px solid var(--accent-red)', 
          background: 'linear-gradient(90deg, rgba(20, 20, 24, 0.9) 0%, rgba(229, 62, 62, 0.03) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '6px' }}>
            Welcome back, {user?.name}!
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isClient 
              ? 'Track your regulatory submissions, file renewals, or launch new company incorporations.' 
              : `Here is the operational overview for PrimeFlow ${profileLocation?.state || 'Abuja'} office today.`}
          </p>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>Location: {profileLocation?.state ? `${profileLocation.state}${profileLocation.lga ? ' (' + profileLocation.lga + ')' : ''}, Nigeria` : 'Abuja, Nigeria'}</div>
          <div>Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Total Submissions</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {isClient ? totalClientApps : stats?.metrics.totalApplications}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(99, 179, 237, 0.08)', border: '1px solid rgba(99, 179, 237, 0.2)', color: '#63b3ed' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Processing / Active</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {isClient ? pendingClientApps : stats?.metrics.pendingApplications}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(72, 187, 120, 0.08)', border: '1px solid rgba(72, 187, 120, 0.2)', color: '#48bb78' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Completed Services</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {isClient ? completedClientApps : stats?.metrics.completedApplications}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(229, 62, 62, 0.08)', border: '1px solid rgba(229, 62, 62, 0.2)', color: 'var(--accent-red)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Action Required</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {isClient ? actionRequiredClientApps : stats?.metrics.totalClients /* represent total users registered */}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {isClient ? 'Uploads/Comments needed' : 'Registered customer profiles'}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED CONTENT AREA */}
      <div className="dashboard-layout-container">
        
        {/* LEFT COLUMN: Visual SVG Charts or Active Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Chart Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} style={{ color: 'var(--accent-red)' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#fff' }}>Application Volume History</h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> Abuja CAC submissions (6 Months)</span>
            </div>

            {/* Custom SVG line chart to avoid charting package dependency */}
            <div style={{ position: 'relative', height: '200px', width: '100%' }}>
              <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Grid Lines */}
                <line x1="0" y1="180" x2="500" y2="180" stroke="var(--border-color)" strokeWidth="1" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />

                {/* The Line - Coordinates mapped to months (Jan: 5, Feb: 8, Mar: 15, Apr: 11, May: 20, Jun: 25) */}
                <path
                  d="M 25 150 L 100 135 L 175 100 L 250 115 L 325 60 L 400 30 L 475 20"
                  fill="none"
                  stroke="var(--accent-red)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(229, 62, 62, 0.4))' }}
                />

                {/* Shading Area below path */}
                <path
                  d="M 25 150 L 100 135 L 175 100 L 250 115 L 325 60 L 400 30 L 475 20 L 475 180 L 25 180 Z"
                  fill="url(#chart-gradient)"
                  opacity="0.12"
                />

                {/* Nodes */}
                <circle cx="25" cy="150" r="5" fill="#fff" stroke="var(--accent-red)" strokeWidth="2.5" />
                <circle cx="100" cy="135" r="5" fill="#fff" stroke="var(--accent-red)" strokeWidth="2.5" />
                <circle cx="175" cy="100" r="5" fill="#fff" stroke="var(--accent-red)" strokeWidth="2.5" />
                <circle cx="250" cy="115" r="5" fill="#fff" stroke="var(--accent-red)" strokeWidth="2.5" />
                <circle cx="325" cy="60" r="5" fill="#fff" stroke="var(--accent-red)" strokeWidth="2.5" />
                <circle cx="400" cy="30" r="5" fill="#fff" stroke="var(--accent-red)" strokeWidth="2.5" />
                <circle cx="475" cy="20" r="5" fill="#fff" stroke="var(--accent-red)" strokeWidth="2.5" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-red)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul (est)</span>
              </div>
            </div>
          </div>

          {/* Own Applications (Client) OR Assigned (Staff/Admin) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>
              {isClient ? 'Your Active Services' : 'CAC / Filing Process Flow'}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isClient ? (
                clientApps.length > 0 ? (
                  clientApps.slice(0, 4).map(app => (
                    <div 
                      key={app.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px 16px', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.01)' 
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', display: 'block' }}>
                          {app.service_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Updated: {new Date(app.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`badge badge-${app.status}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No service applications submitted yet.
                  </div>
                )
              ) : (
                stats && stats.byServiceType && stats.byServiceType.map((stat, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 16px', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      background: 'rgba(255,255,255,0.01)' 
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {stat.service_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-red)' }}>
                      {stat.count} {stat.count === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Progress Radial & Audit Feeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Radial Progress Ring */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px', alignSelf: 'flex-start' }}>Overall Target</h4>
            
            {/* Custom SVG circle progress */}
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '10px 0' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke="var(--accent-red)" 
                  strokeWidth="8" 
                  strokeDasharray="314.16" 
                  strokeDashoffset={314.16 * (1 - 0.72)} 
                  strokeLinecap="round" 
                  transform="rotate(-90 60 60)" 
                  style={{ filter: 'drop-shadow(0 0 4px rgba(229, 62, 62, 0.3))' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>72%</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
              Client satisfaction rate has increased by 14% since automating incorporation files in Abuja.
            </p>
          </div>

          {/* System Audit Log feed (Admins/Staff) OR Filing Guidance (Clients) */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity size={18} style={{ color: 'var(--accent-red)' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#fff' }}>
                {isClient ? 'Filing Process Guidance & Tips' : 'Real-time Security Audit Logs'}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, maxHeight: '350px', overflowY: 'auto' }}>
              {isClient ? (
                // Helpful guidance for clients
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', borderLeft: '2px solid var(--accent-red)' }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>Clear Scan Attachments</strong>
                    Ensure your scanned NIN slip or valid ID card images are legible before uploading.
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', borderLeft: '2px solid var(--accent-red)' }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>Real-time Status Tracking</strong>
                    Check your filings tab to monitor CAC review progress, approval certificates, and official documents.
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', borderLeft: '2px solid var(--accent-red)' }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>Direct Advisor Consultation</strong>
                    Use the Live Chat or AI Advisor for instant clarification on tax clearances and regulatory compliance.
                  </div>
                </div>
              ) : (
                // Audit logs for admin/staff
                stats && stats.recentAudits && stats.recentAudits.slice(0, 6).map((log, idx) => (
                  <div key={log.id || idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--accent-red)' }}>{log.action}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.3' }}>{log.details}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      By: {log.user_name || 'System'} | IP: {log.ip_address}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardOverview;
