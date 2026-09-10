import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  MessageSquare, 
  Users, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  X,
  Mail,
  PhoneCall,
  Home,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Receipt,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onLogoClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user, logout } = useAuth();
  const [drawerInert, setDrawerInert] = useState(false);
  const [mobileServicesExpanded, setMobileServicesExpanded] = useState(false);
  const compact = collapsed && !mobileOpen;

  useEffect(() => {
    if (!mobileOpen) {
      setDrawerInert(false);
      setMobileServicesExpanded(false);
      return;
    }
    setDrawerInert(true);
    const t = window.setTimeout(() => setDrawerInert(false), 420);
    return () => window.clearTimeout(t);
  }, [mobileOpen]);

  if (!user) return null;

  const menuItems = [
    { id: 'welcome', name: 'Home Workspace', icon: Home, roles: ['client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'services', name: 'Services Portal', icon: FileText, roles: ['client'] },
    { id: 'compliance', name: 'Compliance Check', icon: ShieldCheck, roles: ['client'] },
    { id: 'advisor', name: 'AI Business Advisor', icon: Sparkles, roles: ['client'] },
    { id: 'knowledge', name: 'Knowledge Hub', icon: BookOpen, roles: ['client'] },
    { id: 'chat', name: 'Clients Chat', icon: MessageSquare, roles: ['client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'billing', name: 'Invoices & Receipts', icon: Receipt, roles: ['client', 'admin', 'supervisor'] },
    { id: 'kanban', name: 'Kanban Board', icon: Layers, roles: ['operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'workflow', name: 'Workflow Tracker', icon: Activity, roles: ['operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'admin', name: 'Admin Portal', icon: Users, roles: ['admin', 'supervisor'] },
  ];

  const CLIENT_SERVICE_OPTIONS = [
    { name: 'Company Incorporation', id: 'company_incorporation' },
    { name: 'Business Name Registration', id: 'business_registration' },
    { name: 'Incorporated Trustee', id: 'incorporated_trustee' },
    { name: 'Annual Returns', id: 'annual_returns' },
    { name: 'Post-Incorporation', id: 'post_incorporation' },
    { name: 'Compliance Services', id: 'compliance' },
    { name: 'Other Services', id: 'other_services' },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className={`sidebar-aside ${compact ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''} ${drawerInert ? 'drawer-inert' : ''}`}>
      {/* Brand Logo — desktop click goes home; on mobile it must not steal the menu tap */}
      <div 
        className="sidebar-brand-row"
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        {!compact && (
          <div 
            className="sidebar-brand"
            onClick={() => {
              if (mobileOpen) return;
              setActiveTab('welcome');
            }}
            title={mobileOpen ? undefined : 'Return to Homepage'}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: mobileOpen ? 'default' : 'pointer' }}
          >
            <span className="brand-logo-plate">
            <img 
              src="/logo.png?v=4" 
              alt="PrimeFlow Logo" 
              className="brand-logo"
              style={{ 
                width: '72px', 
                height: '36px', 
                borderRadius: '8px'
              }} 
            />
            </span>
            <h1 className="sidebar-brand-title" style={{ fontSize: '1.2rem', color: '#f0f4f8', fontWeight: '800', letterSpacing: '0.05em', margin: 0 }}>
              PRIME<span style={{ color: 'var(--accent-red)' }}>FLOW</span>
            </h1>
          </div>
        )}
        
        {compact && (
          <span className="brand-logo-plate">
          <img 
            src="/logo.png?v=4" 
            alt="PrimeFlow Logo" 
            className="brand-logo"
            onClick={() => setActiveTab('welcome')}
            title="Return to Homepage"
            style={{ 
              width: '52px', 
              height: '28px', 
              borderRadius: '6px',
              cursor: 'pointer'
            }} 
          />
          </span>
        )}

        <button 
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : (collapsed ? 'Expand side panel' : 'Collapse side panel')}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (mobileOpen && setMobileOpen) {
              setMobileOpen(false);
              return;
            }
            setCollapsed(!collapsed);
          }}
          title={mobileOpen ? 'Close menu' : (collapsed ? 'Expand Side Panel' : 'Collapse Side Panel')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            minWidth: '40px',
            minHeight: '40px',
            touchAction: 'manipulation'
          }}
        >
          <span className="desktop-toggle-icon" style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </span>
          <span className="mobile-toggle-icon" style={{ display: 'none', alignItems: 'center' }}>
            <X size={18} />
          </span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (mobileOpen && item.id === 'services') {
                    setActiveTab(item.id);
                    setMobileServicesExpanded(open => !open);
                    return;
                  }
                  setActiveTab(item.id);
                  setMobileOpen?.(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: compact ? 'center' : 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  width: '100%',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--accent-red-dim)' : 'transparent',
                  color: isActive ? 'var(--accent-red)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid var(--accent-red)' : '3px solid transparent'
                }}
              >
                <Icon size={20} />
                {!compact && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
                    <span>{item.name}</span>
                  </div>
                )}
              </button>
              {item.id === 'services' && mobileOpen && mobileServicesExpanded && user.role === 'client' && (
                <ul className="sidebar-mobile-options">
                  {CLIENT_SERVICE_OPTIONS.map(option => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('services');
                          setMobileOpen?.(false);
                          window.setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('navigate-service', {
                              detail: { serviceId: option.id }
                            }));
                          }, 80);
                        }}
                      >
                        {option.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Support / Correspondence Widget */}
      {!compact && (
        <div className="sidebar-support" style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Support & Info
          </span>
          <a 
            href="https://wa.me/2347072928256" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--accent-red)', fontSize: '0.78rem', fontWeight: '700' }}
          >
            <PhoneCall size={14} />
            <span>+234 707 292 8256 (Call, SMS & WA)</span>
          </a>
          <a 
            href="https://wa.me/2347066714961" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: '600' }}
          >
            <PhoneCall size={14} />
            <span>+234 706 671 4961 (WhatsApp)</span>
          </a>
          <a 
            href="mailto:primeflowconsultingservices@gmail.com" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title="primeflowconsultingservices@gmail.com"
          >
            <Mail size={14} />
            <span>primeflowconsultingservices@gmail.com</span>
          </a>
        </div>
      )}

      {/* Profile Footer */}
      <div 
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {!compact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              className="sidebar-avatar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(215, 25, 32, 0.12)',
                border: '1px solid var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            >
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span className="sidebar-user-name" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: compact ? 'center' : 'flex-start',
            gap: '12px',
            padding: '10px 12px',
            width: '100%',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: 'var(--accent-red)',
            cursor: 'pointer',
            fontWeight: '500',
            textAlign: 'left',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-red-dim)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} />
          {!compact && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
