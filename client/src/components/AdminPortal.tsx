import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  ShieldCheck, UserMinus, UserCheck, AlertCircle, RefreshCw, 
  FileSpreadsheet, Trash2, Edit3, X, Search, UserPlus, FileText 
} from 'lucide-react';
import type { User, AuditLog, Application } from '../types';

const AdminPortal: React.FC = () => {
  const { token, user: activeUser } = useAuth();
  
  // State lists
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [expandedStaffId, setExpandedStaffId] = useState<number | null>(null);
  
  // Create Account Form State (Client or Staff)
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountRole, setAccountRole] = useState('client');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [staffPermissions] = useState({
    can_view_users: true,
    can_update_user_status: true,
    can_delete_users: true,
    can_delete_applications: true,
    can_view_logs: true,
    can_create_staff: true
  });

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('client');
  const [editStatus, setEditStatus] = useState('active');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Edit Application Modal State
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editAppStatus, setEditAppStatus] = useState('submitted');
  const [editAppService, setEditAppService] = useState('company_incorporation');
  const [editAppAssignee, setEditAppAssignee] = useState<string>('');
  const [editAppDetails, setEditAppDetails] = useState('');
  const [savingApp, setSavingApp] = useState(false);

  // Search & Filter for Applications section
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('all');

  const hasPermission = (permName: string) => {
    if (!activeUser) return false;
    if (activeUser.role === 'admin') return true;
    if (activeUser.role === 'supervisor') {
      const perms = (activeUser as any).permissions || {};
      return perms[permName] === true;
    }
    return false;
  };

  // Loading indicators
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Users
  const fetchUsers = async () => {
    if (!hasPermission('can_view_users')) {
      setLoadingUsers(false);
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Audit Logs
  const fetchLogs = async () => {
    if (!hasPermission('can_view_logs')) {
      setLoadingLogs(false);
      setAuditLogs([]);
      return;
    }
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/admin/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch all applications
  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch(`${API_BASE}/services/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApps(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchLogs();
    fetchApplications();
  }, [token]);

  // Create User Account (Client or Staff)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    setAccountSuccess(null);
    setAccountError(null);

    if (accountPassword !== accountConfirmPassword) {
      setAccountError('Passwords do not match. Please re-enter password to confirm.');
      setCreatingAccount(false);
      return;
    }

    try {
      const endpoint = `${API_BASE}/admin/users`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: accountName,
          email: accountEmail,
          password: accountPassword,
          role: accountRole,
          phone: accountPhone,
          permissions: accountRole === 'supervisor' ? staffPermissions : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAccountSuccess(`Account (${accountRole.replace('_', ' ')}) created successfully!`);
        setAccountName('');
        setAccountEmail('');
        setAccountPassword('');
        setAccountConfirmPassword('');
        setAccountPhone('');
        fetchUsers();
        fetchLogs();
      } else {
        setAccountError(data.error || 'Failed to create account.');
      }
    } catch (err) {
      setAccountError('Network error. Failed to create account.');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Open Edit User Modal
  const openEditUser = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditStatus(u.status || 'active');
    setEditPhone((u as any).phone || '');
    setEditPassword('');
  };

  // Save Edit User Account
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);

    try {
      const res = await fetch(`${API_BASE}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          status: editStatus,
          phone: editPhone,
          password: editPassword.trim() ? editPassword.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
        fetchLogs();
      } else {
        alert(data.error || 'Failed to update user account.');
      }
    } catch (err) {
      alert('Network error. Failed to update user account.');
    } finally {
      setSavingUser(false);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        fetchLogs();
        fetchApplications();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user account.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to delete user account.');
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'pending' : 'active';
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }
      
      setUsers(users.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      fetchLogs();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Open Edit Application Modal
  const openEditApp = (app: Application) => {
    setEditingApp(app);
    setEditAppStatus(app.status);
    setEditAppService(app.service_type);
    setEditAppAssignee(app.assigned_to ? app.assigned_to.toString() : '');
    setEditAppDetails(typeof app.details === 'string' ? app.details : JSON.stringify(app.details, null, 2));
  };

  // Save Edit Application
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setSavingApp(true);

    try {
      const res = await fetch(`${API_BASE}/admin/applications/${editingApp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editAppStatus,
          service_type: editAppService,
          assigned_to: editAppAssignee ? parseInt(editAppAssignee) : null,
          details: editAppDetails
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEditingApp(null);
        fetchApplications();
        fetchLogs();
      } else {
        alert(data.error || 'Failed to update application.');
      }
    } catch (err) {
      alert('Network error. Failed to update application.');
    } finally {
      setSavingApp(false);
    }
  };

  // Delete Application
  const handleDeleteApp = async (appId: number) => {
    if (!window.confirm(`Are you sure you want to delete application #${appId}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setApps(apps.filter(a => a.id !== appId));
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete application.');
      }
    } catch (err) {
      alert('Network error. Failed to delete application.');
    }
  };

  // Export applications to CSV
  const handleExportCSV = () => {
    if (apps.length === 0) {
      alert('No application records found to export.');
      return;
    }

    const sortedApps = [...apps].sort((a, b) => a.service_type.localeCompare(b.service_type));

    const headers = [
      'Ref ID', 'Client Name', 'Service Type', 'Status', 'Assigned To', 'Created At',
      'Proposed Name 1', 'Proposed Name 2', 'Proposed Name 3', 'Share Capital / Details',
      'Client Email', 'Client Phone', 'State', 'LGA'
    ];
    
    const rows = sortedApps.map(app => {
      let detailsObj: any = {};
      try {
        detailsObj = JSON.parse(app.details) || {};
      } catch (e) {
        detailsObj = { raw_details: app.details };
      }

      return [
        app.id.toString(),
        app.client_name || `Client #${app.client_id}`,
        app.service_type.toUpperCase().replace(/_/g, ' '),
        app.status.toUpperCase().replace(/_/g, ' '),
        app.assignee_name || 'Unassigned',
        app.created_at ? new Date(app.created_at).toLocaleDateString() : '',
        detailsObj.proposedName1 || detailsObj.serviceName || '',
        detailsObj.proposedName2 || '',
        detailsObj.proposedName3 || '',
        detailsObj.shareCapital ? `₦${detailsObj.shareCapital}` : (detailsObj.natureOfBusiness || ''),
        detailsObj.email || '',
        detailsObj.phone || '',
        detailsObj.state || '',
        detailsObj.lga || ''
      ];
    });

    const escapeCSV = (val: string) => `"${val.toString().replace(/"/g, '""')}"`;
    const csvHeader = headers.map(escapeCSV).join(',');
    const csvRows = rows.map(row => row.map(escapeCSV).join(','));
    const csvContent = [csvHeader, ...csvRows].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `primeflow_filings_${new Date().toISOString().split('T')[0]}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const renderUserRow = (u: User) => {
    const isMe = u.id === activeUser?.id;
    const isStaff = u.role !== 'client';
    const staffApps = apps.filter(a => a.assigned_to === u.id);
    const assignedClientIds = Array.from(new Set(staffApps.map(a => a.client_id)));
    const isExpanded = expandedStaffId === u.id;

    return (
      <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div 
          onClick={() => {
            if (isStaff) {
              setExpandedStaffId(isExpanded ? null : u.id);
            }
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            cursor: isStaff ? 'pointer' : 'default',
            transition: 'background 0.2s'
          }}
        >
          <div>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                openEditUser(u);
              }}
              style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-red)', display: 'inline-block', cursor: 'pointer', textDecoration: 'underline' }}
              title="Click to edit user account details"
            >
              {u.name} {isMe && <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem' }}>(You)</span>}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
              {u.email}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-red)', textTransform: 'capitalize', fontWeight: '500' }}>
              {u.role.replace('_', ' ')} {isStaff && `(${assignedClientIds.length} clients assigned)`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => openEditUser(u)}
              style={{
                background: 'rgba(26,111,232,0.1)',
                border: '1px solid rgba(26,111,232,0.3)',
                color: '#60a5fa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '5px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                gap: '4px'
              }}
              title="Edit User Account"
            >
              <Edit3 size={14} /> Edit
            </button>

            {!isMe && hasPermission('can_update_user_status') && (
              <button
                onClick={() => handleToggleUserStatus(u.id, u.status)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: u.status === 'active' ? '#fc8181' : '#48bb78',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  borderRadius: '4px'
                }}
                title={u.status === 'active' ? 'Suspend user' : 'Activate user'}
              >
                {u.status === 'active' ? <UserMinus size={16} /> : <UserCheck size={16} />}
              </button>
            )}
            
            {!isMe && hasPermission('can_delete_users') && (
              <button
                onClick={() => handleDeleteUser(u.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fc8181',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  borderRadius: '4px'
                }}
                title="Delete User Account"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Filtered applications list
  const filteredApps = apps.filter(a => {
    const matchesSearch = 
      a.id.toString().includes(appSearchQuery) ||
      (a.client_name && a.client_name.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
      a.service_type.toLowerCase().includes(appSearchQuery.toLowerCase());

    const matchesStatus = appStatusFilter === 'all' || a.status === appStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const staffMembers = users.filter(u => u.role !== 'client');

  return (
    <div className="animate-fade-in theme-colored page-theme-glow page-container">
      
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontWeight: '800' }}>Admin Portal</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            System administration, user account management, filing controls, and security audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button 
            onClick={() => { fetchUsers(); fetchLogs(); fetchApplications(); }} 
            className="btn-secondary" 
            style={{ fontSize: '0.8rem', padding: '10px' }}
            title="Refresh All Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(229,62,62,0.08)', border: '1px solid var(--accent-red)', borderRadius: '8px', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Admin Grid */}
      <div className="admin-grid-container">
        
        {/* Left Column: Create Account & Users List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Create User Account Form */}
          {hasPermission('can_create_staff') ? (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--accent-red)' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Create User Account</h4>
              </div>
              
              <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Account Role</label>
                  <select 
                    className="form-select" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={accountRole} 
                    onChange={(e) => setAccountRole(e.target.value)}
                  >
                    <option value="client">Client Account (Business Owner)</option>
                    <option value="operations_officer">Operations Officer (Consultant)</option>
                    <option value="compliance_officer">Compliance Officer (Filer)</option>
                    <option value="supervisor">Supervisor (Manager)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={accountName} 
                    onChange={(e) => setAccountName(e.target.value)} 
                    placeholder="e.g. Babajide Sowande"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={accountEmail} 
                    onChange={(e) => setAccountEmail(e.target.value)} 
                    placeholder="e.g. client@primeflow.com"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={accountPhone} 
                    onChange={(e) => setAccountPhone(e.target.value)} 
                    placeholder="e.g. 08012345678"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Initial Password</label>
                  <input 
                    type="password" 
                    required 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={accountPassword} 
                    onChange={(e) => setAccountPassword(e.target.value)} 
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm Initial Password</label>
                  <input 
                    type="password" 
                    required 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={accountConfirmPassword} 
                    onChange={(e) => setAccountConfirmPassword(e.target.value)} 
                    placeholder="Re-enter password to confirm"
                  />
                </div>

                {accountSuccess && (
                  <div style={{ color: '#48bb78', fontSize: '0.8rem', textAlign: 'center', fontWeight: '500' }}>
                    {accountSuccess}
                  </div>
                )}
                {accountError && (
                  <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', textAlign: 'center', fontWeight: '500' }}>
                    {accountError}
                  </div>
                )}
                
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: '0.85rem' }} disabled={creatingAccount}>
                  {creatingAccount ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>
          ) : null}

          {/* User Accounts List */}
          {hasPermission('can_view_users') ? (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                User Accounts Directory
              </h4>

              {loadingUsers ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Staff Section */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                      <span>Staff Members</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({users.filter(u => u.role !== 'client').length})</span>
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {users.filter(u => u.role !== 'client').map(u => renderUserRow(u))}
                      {users.filter(u => u.role !== 'client').length === 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px', textAlign: 'center' }}>No staff members found.</div>
                      )}
                    </div>
                  </div>

                  {/* Clients Section */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                      <span>Client Accounts</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({users.filter(u => u.role === 'client').length})</span>
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {users.filter(u => u.role === 'client').map(u => renderUserRow(u))}
                      {users.filter(u => u.role === 'client').length === 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px', textAlign: 'center' }}>No client accounts found.</div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ) : null}

        </div>

        {/* Right Column: Applications Management & Security Trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Applications Management Section */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--accent-red)' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Applications Management</h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: {apps.length} filings</span>
            </div>

            {/* Filter & Search */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '6px 10px 6px 30px', fontSize: '0.8rem', width: '100%' }}
                  placeholder="Search by client or ID..."
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                />
              </div>

              <select 
                className="form-select" 
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="processing">Processing</option>
                <option value="add_info_required">Add Info Required</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loadingApps ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading applications...</div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px' }}>Ref ID</th>
                      <th style={{ padding: '8px' }}>Client</th>
                      <th style={{ padding: '8px' }}>Service Type</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px' }}>Assignee</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px', color: '#fff', fontWeight: '700' }}>#{a.id}</td>
                        <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{a.client_name || `Client #${a.client_id}`}</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{a.service_type.replace(/_/g, ' ').toUpperCase()}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            background: a.status === 'completed' ? 'rgba(72,187,120,0.15)' : a.status === 'rejected' || a.status === 'add_info_required' ? 'rgba(229,62,62,0.15)' : 'rgba(49,130,206,0.15)',
                            color: a.status === 'completed' ? '#48bb78' : a.status === 'rejected' || a.status === 'add_info_required' ? '#f56565' : '#4299e1',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>
                            {a.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{a.assignee_name || 'Unassigned'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => openEditApp(a)}
                              style={{ background: 'rgba(26,111,232,0.1)', border: '1px solid rgba(26,111,232,0.3)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                              title="Edit Application Details"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button 
                              onClick={() => handleDeleteApp(a.id)}
                              style={{ background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)', color: '#fc8181', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                              title="Delete Application"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredApps.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No application records found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Audit Trail Section */}
          {hasPermission('can_view_logs') ? (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--accent-red)' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Security Audit Trail</h4>
              </div>

              {loadingLogs ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                  {auditLogs.map(log => (
                    <div 
                      key={log.id}
                      style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid var(--border-color)',
                        borderLeft: '3px solid var(--accent-red)',
                        borderRadius: '6px',
                        fontSize: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--accent-red)' }}>{log.action}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.3' }}>
                        {log.details}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        <span>Operator: {log.user_name || 'System'} ({log.user_role || 'unassigned'})</span>
                        <span>IP: {log.ip_address}</span>
                      </div>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs recorded.</div>
                  )}
                </div>
              )}
            </div>
          ) : null}

        </div>

      </div>

      {/* EDIT USER ACCOUNT MODAL (POPUP FRAMED) */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-frame" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, fontWeight: '700' }}>Edit User Account</h4>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone Number</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Role</label>
                  <select 
                    className="form-select"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="client">Client Account</option>
                    <option value="operations_officer">Operations Officer</option>
                    <option value="compliance_officer">Compliance Officer</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
                  <select 
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Suspended / Pending</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password (leave blank to keep current)</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingUser}>
                  {savingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT APPLICATION MODAL (POPUP FRAMED) */}
      {editingApp && (
        <div className="modal-overlay" onClick={() => setEditingApp(null)}>
          <div className="modal-frame" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, fontWeight: '700' }}>
                Edit Application #{editingApp.id}
              </h4>
              <button onClick={() => setEditingApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveApp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
                  <select 
                    className="form-select"
                    value={editAppStatus}
                    onChange={(e) => setEditAppStatus(e.target.value)}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="processing">Processing</option>
                    <option value="add_info_required">Add Info Required</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Service Type</label>
                  <select 
                    className="form-select"
                    value={editAppService}
                    onChange={(e) => setEditAppService(e.target.value)}
                  >
                    <option value="company_incorporation">Company Incorporation</option>
                    <option value="business_registration">Business Name Registration</option>
                    <option value="incorporated_trustee">Incorporated Trustee (NGO)</option>
                    <option value="annual_returns">Annual Returns</option>
                    <option value="post_incorporation">Post Incorporation</option>
                    <option value="compliance">Compliance (SCUML/TIN)</option>
                    <option value="other_services">Other Services</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Assigned Staff Member</label>
                <select 
                  className="form-select"
                  value={editAppAssignee}
                  onChange={(e) => setEditAppAssignee(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {staffMembers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Application Details (JSON or Plain Text)</label>
                <textarea 
                  rows={6}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                  value={editAppDetails}
                  onChange={(e) => setEditAppDetails(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingApp(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingApp}>
                  {savingApp ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
