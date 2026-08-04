import React from 'react';
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
  BookOpen
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

  if (!user) return null;

  const menuItems = [
    { id: 'welcome', name: 'Home Workspace', icon: Home, roles: ['client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'services', name: 'Services Portal', icon: FileText, roles: ['client'] },
    { id: 'compliance', name: 'Compliance Check', icon: ShieldCheck, roles: ['client'] },
    { id: 'advisor', name: 'AI Business Advisor', icon: Sparkles, roles: ['client'] },
    { id: 'knowledge', name: 'Knowledge Hub', icon: BookOpen, roles: ['client'] },
    { id: 'chat', name: 'Clients Chat', icon: MessageSquare, roles: ['client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'kanban', name: 'Kanban Board', icon: Layers, roles: ['operations_officer', 'compliance_officer', 'admin', 'supervisor'] },
    { id: 'admin', name: 'Admin Portal', icon: Users, roles: ['admin', 'supervisor'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className={`sidebar-aside ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Logo — click to go home */}
      <div 
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        {!collapsed && (
          <div 
            onClick={() => { setActiveTab('welcome'); if (setMobileOpen) setMobileOpen(false); }}
            title="Return to Homepage"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <img 
              src="/logo.jpg" 
              alt="PrimeFlow Logo" 
              style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '8px',
                border: '1.5px solid rgba(0,0,0,0.06)',
                boxShadow: '0 0 10px rgba(229, 62, 62, 0.15)'
              }} 
            />
            <h1 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: '800', letterSpacing: '0.05em', margin: 0 }}>
              PRIME<span style={{ color: 'var(--accent-red)' }}>FLOW</span>
            </h1>
          </div>
        )}
        
        {collapsed && (
          <img 
            src="/logo.jpg" 
            alt="PrimeFlow Logo" 
            onClick={() => { setActiveTab('welcome'); if (setMobileOpen) setMobileOpen(false); }}
            title="Return to Homepage"
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '8px',
              border: '1.5px solid var(--accent-red)',
              boxShadow: '0 0 8px var(--accent-red)',
              cursor: 'pointer'
            }} 
          />
        )}

        <button 
          onClick={() => {
            if (setMobileOpen) {
              setMobileOpen(false);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px'
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
      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <React.Fragment key={item.id}>
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className={item.id === 'compliance' ? 'flashing-compliance-card' : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  width: '100%',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--accent-red-dim)' : 'transparent',
                  color: isActive ? 'var(--accent-red)' : (item.id === 'compliance' ? '#fff' : 'var(--text-secondary)'),
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: (isActive || item.id === 'compliance') ? '600' : '400',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid var(--accent-red)' : (item.id === 'compliance' ? '3px solid #D71920' : '3px solid transparent')
                }}
              >
                <Icon size={20} className={item.id === 'compliance' ? 'flashing-compliance-text' : ''} />
                {!collapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
                    <span className={item.id === 'compliance' ? 'flashing-compliance-text' : ''}>{item.name}</span>
                    {item.id === 'compliance' && (
                      <span className="flashing-compliance-badge">
                        ACTION
                      </span>
                    )}
                  </div>
                )}
              </button>

              {item.id === 'dashboard' && (
                <button
                  onClick={logout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '12px',
                    padding: '12px',
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
                  {!collapsed && <span>Logout</span>}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Support / Correspondence Widget */}
      {!collapsed && (
        <div style={{ padding: '16px', borderTop: '1px solid rgba(0, 0, 0, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.85rem',
                color: '#1e293b'
              }}
            >
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};

export default Sidebar;
