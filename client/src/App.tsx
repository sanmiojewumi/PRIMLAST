import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import ServicesPortal, { NIGERIA_STATES_AND_LGAS } from './components/ServicesPortal';
import KanbanBoard from './components/KanbanBoard';
import ChatRoom from './components/ChatRoom';
import AdminPortal from './components/AdminPortal';
import LandingPage from './components/LandingPage';
import AIAdvisor from './components/AIAdvisor';
import ComplianceDashboard from './components/ComplianceDashboard';
import KnowledgeHub from './components/KnowledgeHub';
import DraggableWhatsApp from './components/DraggableWhatsApp';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Building2, FileCheck2, FolderHeart, ShieldAlert, RefreshCw, MessageSquare, Layers, X, Search, Bell } from 'lucide-react';

const App: React.FC = () => {
  const { user, token, loading, login, register, registerVerify, resetPassword, logout } = useAuth();

  // Auto-logout after 20 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 20 minutes = 1,200,000 ms
      timeoutId = setTimeout(() => {
        logout();
        alert('You have been logged out due to 20 minutes of inactivity.');
      }, 1200000);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    resetTimer();

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout]);
  
  // Navigation states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auth view states
  const [authView, setAuthView] = useState<'login' | 'register' | 'reset'>('login');

  // Landing page auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openAuthModal = (view: 'login' | 'register') => {
    setAuthView(view);
    setAuthError(null);
    setAuthSuccess(null);
    setShowAuthModal(true);
  };
  
  // Profile modal states
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profCompany, setProfCompany] = useState('');
  const [profAddress, setProfAddress] = useState('');
  const [profBio, setProfBio] = useState('');
  const [profAvatar, setProfAvatar] = useState('');
  const [profState, setProfState] = useState('');
  const [profLga, setProfLga] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Home search bar states
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);

  // Admin Request / Reaction Notification Popup State for Clients
  const [adminNotificationModal, setAdminNotificationModal] = useState<{
    appId: number;
    serviceType: string;
    status: string;
    details: string;
    updatedAt: string;
  } | null>(null);

  useEffect(() => {
    if (user && user.role === 'client' && token) {
      const checkAdminNotifications = async () => {
        try {
          const res = await fetch(`${API_BASE}/services/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const apps = await res.json();
            const acknowledgedKey = `acknowledged_admin_notif_${user.id}`;
            const acknowledgedStr = localStorage.getItem(acknowledgedKey) || '{}';
            let acknowledgedMap: Record<number, string> = {};
            try { acknowledgedMap = JSON.parse(acknowledgedStr); } catch (e) {}

            for (const app of apps) {
              const lastAck = acknowledgedMap[app.id];
              const appUpdated = app.updated_at || app.created_at;
              if (!lastAck || lastAck !== appUpdated) {
                setAdminNotificationModal({
                  appId: app.id,
                  serviceType: app.service_type,
                  status: app.status,
                  details: typeof app.details === 'string' ? app.details : JSON.stringify(app.details),
                  updatedAt: appUpdated
                });
                break;
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      };

      checkAdminNotifications();
    }
  }, [user, token]);

  // Target flagged application ID for direct popup navigation
  const [targetAppId, setTargetAppId] = useState<number | null>(null);

  const [clientReplyText, setClientReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleAcknowledgeAdminNotif = async (targetDestination: 'services' | 'chat' | 'dismiss' = 'dismiss') => {
    if (!adminNotificationModal || !user) return;

    if (targetDestination !== 'dismiss' && clientReplyText.trim()) {
      setSendingReply(true);
      try {
        await fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            application_id: adminNotificationModal.appId,
            message_text: `[CLIENT REPLY TO ADMIN REQUEST] ${clientReplyText.trim()}`
          })
        });
      } catch (err) {
        console.error('Failed to send reply to admin:', err);
      } finally {
        setSendingReply(false);
      }
    }

    const acknowledgedKey = `acknowledged_admin_notif_${user.id}`;
    const acknowledgedStr = localStorage.getItem(acknowledgedKey) || '{}';
    let acknowledgedMap: Record<number, string> = {};
    try { acknowledgedMap = JSON.parse(acknowledgedStr); } catch (e) {}
    acknowledgedMap[adminNotificationModal.appId] = adminNotificationModal.updatedAt;
    localStorage.setItem(acknowledgedKey, JSON.stringify(acknowledgedMap));

    const currentFlaggedId = adminNotificationModal.appId;
    setAdminNotificationModal(null);
    setClientReplyText('');

    if (targetDestination === 'services') {
      setTargetAppId(currentFlaggedId);
      const sType = adminNotificationModal.serviceType.toLowerCase();
      if (['compliance', 'scuml', 'pencom', 'itf', 'nsitf', 'tcc', 'bpp'].some(k => sType.includes(k))) {
        setActiveTab('compliance');
      } else {
        setActiveTab('services');
      }
    } else if (targetDestination === 'chat') {
      setTargetAppId(currentFlaggedId);
      setActiveTab('chat');
    }
  };

  // Unread notifications & messages popup states
  const [unreadSummary, setUnreadSummary] = useState<{ notifications: any[], messages: any[] } | null>(null);
  const [showUnreadPopup, setShowUnreadPopup] = useState(false);

  const SEARCHABLE_ITEMS = [
    { name: 'Company Incorporation', type: 'Service', tab: 'services', action: 'company_incorporation' },
    { name: 'Business Name Registration', type: 'Service', tab: 'services', action: 'business_registration' },
    { name: 'Incorporated Trustee (NGO)', type: 'Service', tab: 'services', action: 'incorporated_trustee' },
    { name: 'Annual Returns Filing', type: 'Service', tab: 'services', action: 'annual_returns' },
    { name: 'Post-Incorporation Services', type: 'Service', tab: 'services', action: 'post_incorporation' },
    { name: 'Compliance Services (NRS/SCUML)', type: 'Service', tab: 'services', action: 'compliance' },
    { name: 'Other Services (Licenses)', type: 'Service', tab: 'services', action: 'other_services' },
    { name: 'SCUML Registration', type: 'Compliance', tab: 'compliance', action: 'scuml' },
    { name: 'PENCOM Compliance', type: 'Compliance', tab: 'compliance', action: 'pencom' },
    { name: 'NSITF Registration', type: 'Compliance', tab: 'compliance', action: 'nsitf' },
    { name: 'ITF Compliance', type: 'Compliance', tab: 'compliance', action: 'itf' },
    { name: 'NRS Tax Clearance (FIRS)', type: 'Compliance', tab: 'compliance', action: 'nrs' },
    { name: "Driver's Licence", type: 'Other Service', tab: 'services', action: 'other_services', sub: "Driver's Licence" },
    { name: "Car Dealer's Licence", type: 'Other Service', tab: 'services', action: 'other_services', sub: "Car Dealer's Licence" },
    { name: 'Export Licence', type: 'Other Service', tab: 'services', action: 'other_services', sub: 'Export licence' },
    { name: 'Mining Licence', type: 'Other Service', tab: 'services', action: 'other_services', sub: 'Mining licence' },
    { name: 'NAFDAC Registration', type: 'Other Service', tab: 'services', action: 'other_services', sub: 'NAFDAC' },
    { name: 'SON Compliance', type: 'Other Service', tab: 'services', action: 'other_services', sub: 'SON' },
    { name: 'Knowledge Hub Startup Guide', type: 'Knowledge', tab: 'knowledge' },
    { name: 'AI Business Advisor', type: 'AI Tool', tab: 'advisor' },
    { name: 'Consultations Chat Room', type: 'Support', tab: 'chat' }
  ];

  const homeSuggestions = homeSearchQuery.trim()
    ? SEARCHABLE_ITEMS.filter(item => item.name.toLowerCase().includes(homeSearchQuery.toLowerCase()))
    : [];

  const handleHomeSuggestionClick = (item: any) => {
    setHomeSearchQuery('');
    setShowHomeSuggestions(false);
    setActiveTab(item.tab);
    if (item.action) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-service', { 
          detail: { serviceId: item.action, sub: item.sub } 
        }));
      }, 100);
    }
  };

  useEffect(() => {
    const fetchUnreadSummary = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/services/unread-summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.notifications.length > 0 || data.messages.length > 0) {
            setUnreadSummary(data);
            setShowUnreadPopup(true);
          }
        }
      } catch (err) {
        console.error('Failed to load unread summary:', err);
      }
    };
    fetchUnreadSummary();
  }, [token]);

  const fetchProfile = async (id: number) => {
    setLoadingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/auth/profile/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfileData(data);
        setProfName(data.user.name);
        setProfPhone(data.profile.phone);
        setProfCompany(data.profile.company_name);
        setProfAddress(data.profile.address);
        setProfBio(data.profile.profile_bio);
        setProfAvatar(data.profile.avatar_url || '');
        setProfState(data.profile.state || '');
        setProfLga(data.profile.lga || '');
      } else {
        setProfileError(data.error || 'Failed to fetch profile details');
      }
    } catch (err) {
      setProfileError('Failed to fetch profile details');
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUserId) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      if (user?.role === 'admin') {
        const detailsRes = await fetch(`${API_BASE}/auth/profile/${profileUserId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: profName,
            phone: profPhone,
            company_name: profCompany,
            address: profAddress,
            profile_bio: profBio,
            state: profState,
            lga: profLga
          })
        });
        const detailsData = await detailsRes.json();
        if (!detailsRes.ok) throw new Error(detailsData.error || 'Failed to save profile details');
      }

      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const avatarRes = await fetch(`${API_BASE}/auth/profile/${profileUserId}/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const avatarData = await avatarRes.json();
        if (!avatarRes.ok) throw new Error(avatarData.error || 'Failed to upload profile picture');
        setProfAvatar(avatarData.avatar_url);
        setAvatarFile(null);
      }

      setProfileSuccess('Profile saved successfully!');
      setTimeout(() => {
        setProfileSuccess(null);
      }, 3000);
      fetchProfile(profileUserId);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (token) {
      (window as any).openProfileModal = (id: number) => {
        setProfileUserId(id);
        fetchProfile(id);
      };
    }
    return () => {
      delete (window as any).openProfileModal;
    };
  }, [token]);
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Verification states
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedOTP, setSimulatedOTP] = useState('');

  useEffect(() => {
    setVerificationMode(false);
    setVerificationCode('');
    setPhone('');
    setConfirmPassword('');
    setAuthError(null);
    setAuthSuccess(null);
  }, [authView]);
  
  // Messaging indicator
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Set default tab when user changes (e.g. show welcome landing page)
  useEffect(() => {
    if (user) {
      setActiveTab('welcome');
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setSubmitting(true);

    try {
      if (authView === 'login') {
        await login(email, password);
      } else if (authView === 'register') {
        if (!verificationMode) {
          if (password !== confirmPassword) {
            setAuthError('Passwords do not match. Please re-enter your password to confirm.');
            setSubmitting(false);
            return;
          }
          // Request Code
          const code = await register(name, email, password, phone);
          setSimulatedOTP(code);
          setVerificationMode(true);
          setAuthSuccess('Verification code generated. Please type it below.');
        } else {
          // Complete verification
          await registerVerify(email, verificationCode);
          setVerificationMode(false);
          setVerificationCode('');
          setConfirmPassword('');
        }
      } else if (authView === 'reset') {
        if (password !== confirmPassword) {
          setAuthError('Passwords do not match. Please re-enter your password to confirm.');
          setSubmitting(false);
          return;
        }
        const msg = await resetPassword(email, password); // password field holds new password in reset mode
        setAuthSuccess(msg);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setAuthView('login'), 3000);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authorization failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '45px', height: '45px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear' }} />
      </div>
    );
  }

  // Not authenticated — show landing page with optional auth modal overlay
  if (!user || !token) {
    return (
      <>
        <LandingPage onShowAuth={openAuthModal} />
        {showAuthModal && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '20px', animation: 'fadeIn 0.25s ease'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}
          >
            <div
              className="glass-panel-light"
              style={{
                width: '100%', maxWidth: '440px', padding: '36px',
                position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <X size={20} />
              </button>

              <div 
                onClick={() => { setShowAuthModal(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                title="Return to Homepage"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '-8px', cursor: 'pointer' }}
              >
                <img src="/logo.jpg" alt="Primeflow Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F0F0F', fontFamily: "'Outfit', sans-serif" }}>
                  PRIME<span style={{ color: '#D71920' }}>FLOW</span>
                </h2>
              </div>

              {/* Pill tabs */}
              <div style={{ display: 'flex', padding: '4px', background: 'rgba(0,0,0,0.04)', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.06)' }}>
                {(['login', 'register'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setAuthView(v); setAuthError(null); }}
                    style={{
                      flex: 1, padding: '8px 16px', borderRadius: '20px', border: 'none',
                      fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                      background: authView === v ? '#D71920' : 'none',
                      color: authView === v ? '#fff' : '#4a5568',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {v === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              {authError && (
                <div style={{ padding: '10px 12px', background: 'rgba(215,25,32,0.08)', border: '1px solid #D71920', borderRadius: '6px', color: '#D71920', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ShieldCheck size={16} /><span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e', borderRadius: '6px', color: '#22c55e', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ShieldCheck size={16} /><span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {authView === 'reset' && <h3 style={{ fontSize: '1.1rem', color: '#1e293b', textAlign: 'center', fontWeight: '700', margin: 0 }}>Reset Portal Password</h3>}

                {!verificationMode && (
                  <>
                    {authView === 'register' && (
                      <div className="form-group animate-fade-in">
                        <label className="form-label" style={{ color: '#374151' }}>Full Name</label>
                        <input type="text" required placeholder="e.g. Babajide Sowande" className="form-input" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#374151' }}>Email Address</label>
                      <input type="email" required placeholder="e.g. client@business.com" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    {authView === 'register' && (
                      <div className="form-group animate-fade-in">
                        <label className="form-label" style={{ color: '#374151' }}>Phone Number</label>
                        <input type="tel" required placeholder="e.g. 07066714961" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#374151' }}>{authView === 'reset' ? 'New Password' : 'Password'}</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showPassword ? 'text' : 'password'} required
                          placeholder={authView === 'reset' ? 'Enter new password' : '••••••••'}
                          className="form-input" style={{ width: '100%', paddingRight: '45px' }}
                          value={password} onChange={e => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    {(authView === 'register' || authView === 'reset') && (
                      <div className="form-group animate-fade-in">
                        <label className="form-label" style={{ color: '#374151' }}>
                          Confirm {authView === 'reset' ? 'New Password' : 'Password'}
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'} required
                          placeholder="Re-enter password to confirm"
                          className="form-input" style={{ width: '100%' }}
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}

                {authView === 'register' && verificationMode && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(215,25,32,0.08)', border: '1px solid #D71920', borderRadius: '8px', fontSize: '0.8rem', color: '#1e293b', lineHeight: '1.4' }}>
                      <strong style={{ color: '#D71920' }}>Verification Code:</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Code sent to <strong>{email}</strong></p>
                      <p style={{ margin: '6px 0 0 0' }}>Code: <strong style={{ fontSize: '1rem', background: 'rgba(215,25,32,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#D71920' }}>{simulatedOTP}</strong></p>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#374151' }}>6-Digit Verification Code</label>
                      <input type="text" maxLength={6} required placeholder="e.g. 123456" className="form-input"
                        style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800' }}
                        value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))} />
                    </div>
                  </div>
                )}

                <button type="submit" style={{ background: '#D71920', color: '#fff', border: 'none', padding: '13px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(215,25,32,0.35)', transition: 'background 0.2s, transform 0.1s' }} disabled={submitting}
                  onMouseEnter={e => e.currentTarget.style.background = '#b01419'}
                  onMouseLeave={e => e.currentTarget.style.background = '#D71920'}>
                  {submitting ? 'Processing...' : (authView === 'login' ? 'Sign In' : authView === 'register' ? (verificationMode ? 'Verify & Create Account' : 'Request Verification Code') : 'Reset Password')}
                  {!submitting && <ArrowRight size={16} />}
                </button>

                {authView === 'register' && verificationMode && (
                  <button type="button" onClick={() => setVerificationMode(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}>← Edit registration details</button>
                )}
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '14px' }}>
                {authView === 'login' && (
                  <div>Forgot password?{' '}<button onClick={() => { setAuthView('reset'); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer', fontWeight: '600' }}>Reset password</button></div>
                )}
                {authView === 'reset' && (
                  <div>Remember credentials?{' '}<button onClick={() => { setAuthView('login'); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer', fontWeight: '600' }}>Sign in</button></div>
                )}
                {authView === 'login' && (
                  <div>Don't have an account?{' '}<button onClick={() => { setAuthView('register'); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer', fontWeight: '600' }}>Create account</button></div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Old inline auth view — keep for fallback (unreachable now, replaced above)
  if (false) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          backgroundColor: 'var(--bg-primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '40px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated 3D Floating Bubbles */}
        <div className="sphere-bubble bubble-1"></div>
        <div className="sphere-bubble bubble-2"></div>
        <div className="sphere-bubble bubble-3"></div>
        <div className="sphere-bubble bubble-4"></div>

        {/* Dual Column Layout */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '1100px',
            gap: '50px',
            zIndex: 10,
            flexWrap: 'wrap'
          }}
        >
          {/* Left Column: Brand Hero and Key Services Menu Buttons */}
          <div 
            style={{ 
              flex: '1.2 1 300px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '28px',
              animation: 'fadeIn 0.6s ease forwards'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
              <img 
                src="/logo.jpg" 
                alt="PrimeFlow Logo" 
                style={{ 
                  width: '140px', 
                  height: '140px', 
                  borderRadius: '16px',
                  boxShadow: '0 0 30px rgba(229, 62, 62, 0.45)',
                  border: '2px solid rgba(255,255,255,0.15)',
                  objectFit: 'cover'
                }} 
              />
              <h1 style={{ fontSize: '2.6rem', fontWeight: '800', color: '#fff', letterSpacing: '0.05em', margin: 0 }}>
                PRIME<span style={{ color: 'var(--accent-red)' }}>FLOW</span>
              </h1>
            </div>

            <div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: '700', marginBottom: '8px', lineHeight: '1.3' }}>
                Premium Corporate Registry Portal
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Secure, digital compliance filings and corporate registrations managed directly by certified experts. Streamline your CAC regulatory submissions today.
              </p>
            </div>

            {/* Quick Access Services Menu Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Core Platform Filings
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass-panel-light" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={18} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '700' }}>Incorporation</span>
                </div>
                <div className="glass-panel-light" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileCheck2 size={18} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '700' }}>Business Names</span>
                </div>
                <div className="glass-panel-light" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderHeart size={18} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '700' }}>NGOs & Trustees</span>
                </div>
                <div className="glass-panel-light" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={18} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '700' }}>Compliance Permits</span>
                </div>
                <div className="glass-panel-light" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={18} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '700' }}>Annual Returns</span>
                </div>
                <div className="glass-panel-light" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={18} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '700' }}>Consultant Chat</span>
                </div>
              </div>
            </div>
            {/* Correspondence Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Official Correspondence
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div>Email: <a href="mailto:primeflowconsultingservices@gmail.com" style={{ color: '#fff', textDecoration: 'none' }}>primeflowconsultingservices@gmail.com</a></div>
                <div>Call, SMS & WhatsApp: <a href="https://wa.me/2347072928256" target="_blank" rel="noopener noreferrer" style={{ color: '#48bb78', fontWeight: '600', textDecoration: 'none' }}>+234 707 292 8256</a></div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Auth Card */}
          <div 
            className="glass-panel-light" 
            style={{ 
              flex: '0.8 1 300px', 
              padding: '36px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px',
              animation: 'fadeIn 0.6s ease 0.1s forwards',
              background: 'rgba(255, 255, 255, 0.94)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Pill Capsule Toggle Menu Buttons */}
            <div style={{ display: 'flex', padding: '4px', background: 'rgba(0,0,0,0.04)', borderRadius: '24px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <button
                type="button"
                onClick={() => { setAuthView('login'); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: authView === 'login' ? 'var(--accent-red)' : 'none',
                  color: authView === 'login' ? '#fff' : '#4a5568',
                  transition: 'all 0.25s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthView('register'); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: authView === 'register' ? 'var(--accent-red)' : 'none',
                  color: authView === 'register' ? '#fff' : '#4a5568',
                  transition: 'all 0.25s ease'
                }}
              >
                Create Account
              </button>
            </div>

            {/* Form container */}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {authView === 'reset' && (
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', textAlign: 'center', fontWeight: '700', margin: 0 }}>
                  Reset Portal Password
                </h3>
              )}

              {authError && (
                <div style={{ padding: '10px 12px', background: 'rgba(229, 62, 62, 0.08)', border: '1px solid var(--accent-red)', borderRadius: '6px', color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ShieldCheck size={16} />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div style={{ padding: '10px 12px', background: 'rgba(72, 187, 120, 0.08)', border: '1px solid #48bb78', borderRadius: '6px', color: '#48bb78', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ShieldCheck size={16} />
                  <span>{authSuccess}</span>
                </div>
              )}

              {!verificationMode && (
                <>
                  {authView === 'register' && (
                    <div className="form-group animate-fade-in">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Babajide Sowande"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client@primeflow.com"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {authView === 'register' && (
                    <div className="form-group animate-fade-in">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 07066714961"
                        className="form-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      {authView === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={authView === 'reset' ? 'Enter new password' : '••••••••'}
                        className="form-input"
                        style={{ width: '100%', paddingRight: '45px' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {authView === 'register' && verificationMode && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(229, 62, 62, 0.08)', border: '1px solid var(--accent-red)', borderRadius: '8px', fontSize: '0.8rem', color: '#fff', lineHeight: '1.4' }}>
                    <strong style={{ color: 'var(--accent-red)' }}>Simulated Security Codes:</strong>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                      We simulated sending verification codes to <strong>{email}</strong> and phone <strong>{phone}</strong>.
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: '#fff' }}>
                      Simulation Code: <strong style={{ color: '#fff', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{simulatedOTP}</strong>
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 123456"
                      className="form-input"
                      style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800' }}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              )}

              {/* Simulation Role Selector Removed for Client Security */}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                disabled={submitting}
              >
                {submitting ? 'Verifying...' : (
                  authView === 'login' ? 'Sign In' : (
                    authView === 'register' ? (verificationMode ? 'Verify & Create Account' : 'Request Verification Code') : 'Reset Password'
                  )
                )}
                <ArrowRight size={16} />
              </button>

              {authView === 'register' && verificationMode && (
                <button
                  type="button"
                  onClick={() => setVerificationMode(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center', width: '100%', marginTop: '8px' }}
                >
                  ← Edit registration details
                </button>
              )}
            </form>

            {/* View toggle footer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {authView === 'login' && (
                <>
                  <div>
                    Forgot password?{' '}
                    <button 
                      onClick={() => { setAuthView('reset'); setAuthError(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Reset password
                    </button>
                  </div>
                </>
              )}

              {authView === 'reset' && (
                <div>
                  Remember credentials?{' '}
                  <button 
                    onClick={() => { setAuthView('login'); setAuthError(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>

            {/* Brand Social Media & Support Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: 'var(--text-secondary)' }}>
                <a href="https://facebook.com/primeflow" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.color='#fff'} onMouseLeave={(e)=>e.currentTarget.style.color='inherit'} title="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://twitter.com/primeflow" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.color='#fff'} onMouseLeave={(e)=>e.currentTarget.style.color='inherit'} title="Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="https://linkedin.com/company/primeflow" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.color='#fff'} onMouseLeave={(e)=>e.currentTarget.style.color='inherit'} title="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="https://instagram.com/primeflow" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.color='#fff'} onMouseLeave={(e)=>e.currentTarget.style.color='inherit'} title="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div>primeflowconsultingservices@gmail.com</div>
                <div>Helpline: <a href="https://wa.me/2347072928256" target="_blank" rel="noopener noreferrer" style={{ color: '#48bb78', textDecoration: 'none', fontWeight: '500' }}>+234 707 292 8256 (Call, SMS & WA)</a></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Authenticated Shell View
  return (
    <div className="app-shell-container">
      {/* Mobile Sidebar backdrop overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 140
          }}
        />
      )}
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      
      {/* Main Content Area */}
      <div 
        className={`main-content-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          position: 'relative',
        }}
      >
        {/* Faded logo watermark background */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/logo.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: '420px 420px',
          opacity: 0.025,
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <Header activeTab={activeTab} onMenuClick={() => setMobileMenuOpen(true)} setActiveTab={setActiveTab} />
        
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', maxWidth: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, paddingBottom: '60px' }}>
          {activeTab === 'welcome' && (
            <div className="animate-fade-in welcome-dashboard-card">
              {/* Glow Logo Backdrop */}
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,111,232,0.4) 0%, rgba(215,25,32,0.2) 50%, transparent 70%)', filter: 'blur(28px)', opacity: 0.7, zIndex: 1 }} />
                <img 
                  src="/logo.jpg" 
                  alt="PrimeFlow Brand Logo" 
                  className="welcome-dashboard-logo"
                  style={{ 
                    position: 'relative',
                    zIndex: 2,
                    animation: 'pulseGlow 2.5s infinite ease-in-out'
                  }} 
                />
              </div>

              {/* Welcome Text */}
              <h1 className="welcome-dashboard-title">
                Welcome back, <span style={{ color: 'var(--accent-red)' }}>{user.name}</span>!
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', lineHeight: '1.6', margin: '0 0 36px 0' }}>
                Welcome to your PrimeFlow Consulting workspace. Select a service portal category below or choose an action in the navigation bar to start.
              </p>

              {/* Search Bar for Mobile/Desktop Home Page */}
              <div 
                className="welcome-search-container"
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  maxWidth: '500px', 
                  margin: '0 auto 30px auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center' 
                }}
              >
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search 
                    size={20} 
                    style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} 
                  />
                  <input
                    type="text"
                    placeholder="Search services, compliance, licenses..."
                    value={homeSearchQuery}
                    onChange={(e) => {
                      setHomeSearchQuery(e.target.value);
                      setShowHomeSuggestions(true);
                    }}
                    onFocus={() => setShowHomeSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowHomeSuggestions(false), 200)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      padding: '14px 20px 14px 48px',
                      borderRadius: '30px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s',
                      borderColor: homeSearchQuery ? 'var(--accent-red)' : 'var(--border-color)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
                
                {showHomeSuggestions && homeSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '56px',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 15, 17, 0.98)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    zIndex: 999,
                    width: '100%'
                  }}>
                    {homeSuggestions.map((item, index) => (
                      <div 
                        key={index}
                        onClick={() => handleHomeSuggestionClick(item)}
                        style={{
                          padding: '12px 18px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(229, 62, 62, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '600' }}>{item.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)', textTransform: 'uppercase', marginTop: '2px', fontWeight: '700' }}>{item.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {user.role === 'client' && (
                <button
                  onClick={() => setActiveTab('services')}
                  className="btn-primary"
                  style={{
                    padding: '14px 28px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    borderRadius: '30px',
                    marginBottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(215, 25, 32, 0.4)',
                    border: 'none',
                    alignSelf: 'center',
                    color: '#fff',
                    backgroundColor: 'var(--accent-red)'
                  }}
                >
                  🚀 Go to Services Portal
                </button>
              )}

              {/* Quick Portal Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', width: '100%', maxWidth: '900px', marginBottom: '40px' }}>
                
                {user.role === 'client' && (
                  <div 
                    onClick={() => setActiveTab('services')}
                    className="glass-panel-interactive animate-fade-in"
                    style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building2 size={24} style={{ color: 'var(--accent-red)' }} />
                      <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Submit New Filings</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      Launch the 3-step Services wizard to submit company incorporation documents, business registrations, or compliance files.
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: '600', alignSelf: 'flex-start', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Go to Services Portal <ArrowRight size={14} />
                    </span>
                  </div>
                )}

                {user.role !== 'client' && (
                  <div 
                    onClick={() => setActiveTab('kanban')}
                    className="glass-panel-interactive animate-fade-in"
                    style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Layers size={24} style={{ color: 'var(--accent-red)' }} />
                      <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Operations Kanban</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      Manage pending CAC filings, assign operations team members, transition workflow statuses, and verify secure uploads.
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: '600', alignSelf: 'flex-start', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Open Kanban Board <ArrowRight size={14} />
                    </span>
                  </div>
                )}

                {user.role === 'client' && (
                  <div 
                    onClick={() => setActiveTab('knowledge')}
                    className="glass-panel-interactive animate-fade-in"
                    style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building2 size={24} style={{ color: 'var(--accent-red)' }} />
                      <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Knowledge Hub</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      Read detailed guides on starting up, taxation, and legal regulations in Nigeria.
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: '600', alignSelf: 'flex-start', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Browse Startup Guides <ArrowRight size={14} />
                    </span>
                  </div>
                )}

                <div 
                  onClick={() => setActiveTab('chat')}
                  className="glass-panel-interactive animate-fade-in"
                  style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={24} style={{ color: 'var(--accent-red)' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Consultations Chat</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Connect directly with certified corporate consultants to resolve outstanding info requests or receive status updates.
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: '600', alignSelf: 'flex-start', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open Client Chat <ArrowRight size={14} />
                  </span>
                </div>

                {user.role === 'client' ? (
                  <div 
                    onClick={() => setActiveTab('compliance')}
                    className="glass-panel-interactive animate-fade-in"
                    style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={24} style={{ color: 'var(--accent-red)' }} />
                        <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Corporate Compliance Hub</h3>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                        COMPLIANCE
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      Access your annual regulatory compliance status, tax clearances, Pencom, ITF, and SCUML filings.
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: '600', alignSelf: 'flex-start', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View Compliance Status <ArrowRight size={14} />
                    </span>
                  </div>
                ) : (
                  <div 
                    onClick={() => setActiveTab('dashboard')}
                    className="glass-panel-interactive animate-fade-in"
                    style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldCheck size={24} style={{ color: 'var(--accent-red)' }} />
                      <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Platform Security & Logs</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      Verify session logs, audit trails, parameters sanitization checks, and system security controls.
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: '600', alignSelf: 'flex-start', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Verify Workspace Logs <ArrowRight size={14} />
                    </span>
                  </div>
                )}
                
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'services' && user.role === 'client' && <ServicesPortal targetAppId={targetAppId} />}
          {activeTab === 'compliance' && user.role === 'client' && <ComplianceDashboard />}
          {activeTab === 'advisor' && user.role === 'client' && <AIAdvisor />}
          {activeTab === 'knowledge' && user.role === 'client' && <KnowledgeHub />}
          {activeTab === 'kanban' && user.role !== 'client' && <KanbanBoard />}
          {activeTab === 'chat' && <ChatRoom initialAppId={targetAppId} />}
          {activeTab === 'admin' && ['admin', 'supervisor'].includes(user.role) && <AdminPortal />}
        </main>
      </div>

      {/* Floating Draggable WhatsApp Button */}
      <DraggableWhatsApp />


      {/* ── ADMIN ACTION REQUEST / REACTION POPUP MODAL FOR CLIENTS ──────── */}
      {adminNotificationModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-frame animate-fade-in" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={24} style={{ color: 'var(--accent-red)' }} />
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.15rem', margin: 0, fontWeight: '700' }}>
                    New Admin Action Request & Reaction
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Filing Application #${adminNotificationModal.appId}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleAcknowledgeAdminNotif('dismiss')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>
                  Category: {adminNotificationModal.serviceType.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: adminNotificationModal.status === 'action_required' ? 'rgba(229,62,62,0.2)' : 'rgba(72,187,120,0.2)',
                  color: adminNotificationModal.status === 'action_required' ? '#fc8181' : '#48bb78',
                  border: adminNotificationModal.status === 'action_required' ? '1px solid #fc8181' : '1px solid #48bb78'
                }}>
                  {adminNotificationModal.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Admin Notes & Action Request Message:
                </span>
                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: '1.5' }}>
                  {adminNotificationModal.details || 'Your application status has been updated by PrimeFlow Admin Officers.'}
                </p>
              </div>

              {/* Interactive Client Reply Field */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} style={{ color: 'var(--accent-red)' }} />
                  <span>Reply / Respond to Admin Request:</span>
                </label>
                <textarea
                  placeholder="Type your response to admin request or document notes here (Optional)..."
                  className="form-input"
                  style={{ minHeight: '75px', fontSize: '0.85rem', resize: 'vertical' }}
                  value={clientReplyText}
                  onChange={(e) => setClientReplyText(e.target.value)}
                />
              </div>

              {/* Action & Routing Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleAcknowledgeAdminNotif('dismiss')}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={sendingReply}
                  onClick={() => handleAcknowledgeAdminNotif('chat')}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={14} />
                  <span>{clientReplyText.trim() ? 'Send Reply & Open Chat' : 'Open Live Chat'}</span>
                </button>
                <button
                  type="button"
                  disabled={sendingReply}
                  onClick={() => handleAcknowledgeAdminNotif('services')}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{clientReplyText.trim() ? 'Send Reply & View Filing' : 'Go to Filing Uploads'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      {profileUserId !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '540px', 
              maxHeight: '90vh',
              padding: '24px', 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px' 
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>User Profile Details</h3>
              <button 
                onClick={() => { setProfileUserId(null); setProfileData(null); setAvatarFile(null); }}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Close
              </button>
            </div>

            {/* Modal Body Container (Scrollable) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)', paddingRight: '8px' }}>
              {loadingProfile ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '30px', height: '30px', border: '2px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear', margin: '0 auto 10px auto' }} />
                  <span>Fetching profile data...</span>
                </div>
              ) : profileError ? (
                <div style={{ padding: '16px', background: 'rgba(229,62,62,0.08)', border: '1px solid var(--accent-red)', borderRadius: '8px', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                  {profileError}
                </div>
              ) : profileData ? (
                <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Profile Picture Block */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      border: '2px solid var(--accent-red)',
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 15px rgba(229,62,62,0.2)',
                      position: 'relative'
                    }}>
                      <img 
                        src={avatarFile ? URL.createObjectURL(avatarFile) : (profAvatar ? `${API_BASE}${profAvatar}?t=${Date.now()}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150')} 
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    
                    {/* Avatar Upload (Only if owner or admin) */}
                    {(user.role === 'admin' || user.id === profileUserId) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add or update profile picture</span>
                        <input 
                          type="file" 
                          id="profile-avatar-input"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAvatarFile(e.target.files[0]);
                            }
                          }}
                        />
                        <label 
                          htmlFor="profile-avatar-input"
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignSelf: 'flex-start' }}
                        >
                          Change Photo
                        </label>
                      </div>
                    )}
                  </div>
                  {/* Form fields (readonly if not admin) */}
                  <div className="profile-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        readOnly={user.role !== 'admin'}
                        style={user.role !== 'admin' ? { background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' } : {}}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={profileData.user.email}
                        readOnly
                        style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' }}
                      />
                    </div>
                  </div>

                  <div className="profile-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. +234 803 123 4567"
                        className="form-input"
                        value={profPhone}
                        onChange={(e) => setProfPhone(e.target.value)}
                        readOnly={user.role !== 'admin'}
                        style={user.role !== 'admin' ? { background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' } : {}}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. PrimeFlow Consultants"
                        className="form-input"
                        value={profCompany}
                        onChange={(e) => setProfCompany(e.target.value)}
                        readOnly={user.role !== 'admin'}
                        style={user.role !== 'admin' ? { background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' } : {}}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input 
                      type="text"
                      placeholder="e.g. Wuse II, Abuja"
                      className="form-input"
                      value={profAddress}
                      onChange={(e) => setProfAddress(e.target.value)}
                      readOnly={user.role !== 'admin'}
                      style={user.role !== 'admin' ? { background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' } : {}}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">State</label>
                      {user.role === 'admin' ? (
                        <select
                          className="form-select"
                          value={profState}
                          onChange={(e) => {
                            setProfState(e.target.value);
                            setProfLga('');
                          }}
                        >
                          <option value="">Select State</option>
                          {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          value={profState || 'Not Set'}
                          readOnly
                          style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' }}
                        />
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Local Government (LGA)</label>
                      {user.role === 'admin' ? (
                        <select
                          className="form-select"
                          value={profLga}
                          onChange={(e) => setProfLga(e.target.value)}
                          disabled={!profState}
                        >
                          <option value="">Select LGA</option>
                          {profState && NIGERIA_STATES_AND_LGAS[profState]?.map(lg => (
                            <option key={lg} value={lg}>{lg}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          value={profLga || 'Not Set'}
                          readOnly
                          style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Biography / Description</label>
                    <textarea 
                      placeholder="User profile bio details..."
                      className="form-input"
                      value={profBio}
                      onChange={(e) => setProfBio(e.target.value)}
                      readOnly={user.role !== 'admin'}
                      style={user.role !== 'admin' ? { background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)', minHeight: '60px', resize: 'none' } : { minHeight: '60px', resize: 'vertical' }}
                    />
                  </div>

                  {profileSuccess && (
                    <div style={{ padding: '8px 12px', background: 'rgba(72,187,120,0.08)', border: '1px solid #48bb78', borderRadius: '6px', color: '#48bb78', fontSize: '0.8rem', textAlign: 'center' }}>
                      {profileSuccess}
                    </div>
                  )}

                  {/* Save button overrides */}
                  {user.role === 'admin' ? (
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving profile...' : 'Save Profile Changes'}
                    </button>
                  ) : avatarFile ? (
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Uploading...' : 'Save Profile Picture'}
                    </button>
                  ) : (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                      Only system administrators can modify profile text details.
                    </div>
                  )}

                </form>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* Unread Items Popup on Login */}
      {showUnreadPopup && unreadSummary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              padding: '24px', 
              borderRadius: '16px',
              border: '1px solid var(--accent-red)',
              background: 'rgba(10, 10, 12, 0.98)',
              boxShadow: '0 20px 50px rgba(215, 25, 32, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} style={{ color: 'var(--accent-red)' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Pending Updates</h3>
              </div>
              <button 
                onClick={() => setShowUnreadPopup(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
              {/* Unread Chat Messages */}
              {unreadSummary.messages.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: '700' }}>
                    New Chat Messages ({unreadSummary.messages.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unreadSummary.messages.map((msg: any) => (
                      <div 
                        key={msg.id}
                        onClick={() => {
                          setShowUnreadPopup(false);
                          setActiveTab('chat');
                        }}
                        style={{ 
                          padding: '10px 12px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600' }}>{msg.sender_name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{msg.service_type?.replace(/_/g, ' ')}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.message_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unread Notifications */}
              {unreadSummary.notifications.length > 0 && (
                <div style={{ marginTop: unreadSummary.messages.length > 0 ? '10px' : '0' }}>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: '700' }}>
                    System Alerts ({unreadSummary.notifications.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unreadSummary.notifications.map((notif: any) => (
                      <div 
                        key={notif.id}
                        style={{ 
                          padding: '10px 12px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          {notif.title}
                        </span>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              className="btn-primary" 
              onClick={() => {
                setShowUnreadPopup(false);
                // Mark all read
                fetch(`${API_BASE}/services/notifications/read-all`, {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}` }
                }).catch(err => console.error(err));
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}
            >
              Acknowledge All
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
