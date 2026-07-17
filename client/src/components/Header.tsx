import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Bell, Search, User as UserIcon, Menu, Mail } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onMenuClick?: () => void;
  setActiveTab?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onMenuClick, setActiveTab }) => {
  const { user, token } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showMailbox, setShowMailbox] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const suggestions = searchQuery.trim()
    ? SEARCHABLE_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSuggestionClick = (item: any) => {
    setSearchQuery('');
    setShowSuggestions(false);
    if (setActiveTab) {
      setActiveTab(item.tab);
    }
    if (item.action) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-service', { 
          detail: { serviceId: item.action, sub: item.sub } 
        }));
      }, 100);
    }
  };

  useEffect(() => {
    document.documentElement.style.fontSize = '';
    localStorage.removeItem('primeflow_zoom');
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/services/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmails = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/services/mock-mailbox`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEmails(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchEmails();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchEmails();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const markRead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/services/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await markRead(n.id);
    }
  };

  if (!user) return null;

  const tabNames: Record<string, string> = {
    welcome: 'Home Workspace',
    dashboard: 'Workspace Dashboard',
    services: 'Service Submissions',
    compliance: 'Compliance Dashboard',
    advisor: 'AI Business Advisor',
    knowledge: 'Knowledge Hub',
    kanban: 'Operations Kanban',
    chat: 'Consultation Chat',
    admin: 'System Administration'
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'linear-gradient(90deg, rgba(10,22,40,0.95) 0%, rgba(13,27,42,0.92) 100%)',
        backgroundSize: 'cover',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 90
      }}
    >
      {/* Title & Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuClick}
          className="mobile-menu-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '4px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={22} />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
          {tabNames[activeTab] || 'PrimeFlow Hub'}
        </h2>
      </div>

      {/* Global Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Search */}
        <div className="header-search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} 
          />
          <input
            type="text"
            placeholder="Search services, guides..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '8px 16px 8px 36px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              outline: 'none',
              width: searchQuery ? '280px' : '220px',
              transition: 'all 0.2s',
              borderColor: searchQuery ? 'var(--accent-red)' : 'var(--border-color)'
            }}
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: 0,
              width: '320px',
              background: 'rgba(10, 10, 12, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 999
            }}>
              {suggestions.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleSuggestionClick(item)}
                  style={{
                    padding: '10px 14px',
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
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>{item.name}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-red)', textTransform: 'uppercase', marginTop: '2px', fontWeight: '700' }}>{item.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mailbox Simulator */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowMailbox(!showMailbox);
              setShowNotifications(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '50%',
              position: 'relative'
            }}
            title="Mailbox Alerts Simulator"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Mail size={20} />
            {emails.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px #22c55e'
                }}
              />
            )}
          </button>

          {/* Mailbox Dropdown */}
          {showMailbox && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                width: '350px',
                padding: '16px',
                zIndex: 110,
                animation: 'fadeIn 0.2s ease forwards'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Simulated Email Inbox</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  Active Delivery
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {emails.slice().reverse().map((em, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '10px', 
                      borderRadius: '6px', 
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>
                      <span style={{ color: '#fff' }}>{em.subject}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(em.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      To: {em.to}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {em.body}
                    </p>
                  </div>
                ))}

                {emails.length === 0 && (
                  <div style={{ padding: '24px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No emails received yet. Email alerts sent by administrators will show up here in real time.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMailbox(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '50%',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-red)',
                  boxShadow: '0 0 8px var(--accent-red)'
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                width: '320px',
                padding: '16px',
                zIndex: 110,
                animation: 'fadeIn 0.2s ease forwards'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => { if (!n.is_read) markRead(n.id); }}
                    style={{ 
                      padding: '8px 10px', 
                      borderRadius: '6px', 
                      background: n.is_read ? 'transparent' : 'rgba(229, 62, 62, 0.05)',
                      borderLeft: n.is_read ? '2px solid transparent' : '2px solid var(--accent-red)',
                      cursor: n.is_read ? 'default' : 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', marginBottom: '2px' }}>
                      <span style={{ color: n.is_read ? 'var(--text-primary)' : '#fff' }}>{n.title}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3', margin: 0 }}>{n.message}</p>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div style={{ padding: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Brand Mini Logo — click to go home */}
        <img 
          src="/logo.jpg" 
          alt="PrimeFlow Logo" 
          onClick={() => setActiveTab && setActiveTab('welcome')}
          title="Go to Home Workspace"
          style={{ 
            width: '34px', 
            height: '34px', 
            borderRadius: '6px', 
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 8px rgba(229, 62, 62, 0.2)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s, transform 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(215,25,32,0.5)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 8px rgba(229,62,62,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
        />
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />

        {/* User Info Quick View */}
        <div 
          onClick={() => {
            if ((window as any).openProfileModal) {
              (window as any).openProfileModal(user.id);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          title="View/Edit Profile"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{user.name}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            overflow: 'hidden'
          }}>
            <img 
              src={`${API_BASE}/auth/avatar/${user.id}?t=${Date.now()}`} 
              alt={user.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (sibling) sibling.style.display = 'block';
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ display: 'none' }}>
              <UserIcon size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
