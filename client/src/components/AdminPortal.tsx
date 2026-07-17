import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, UserMinus, UserCheck, AlertCircle, RefreshCw, FileSpreadsheet, Trash2 } from 'lucide-react';
import type { User, AuditLog, Application } from '../types';

const AdminPortal: React.FC = () => {
  const { token, user: activeUser } = useAuth();
  
  // State lists
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [expandedStaffId, setExpandedStaffId] = useState<number | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  
  // Create Staff Account Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('operations_officer');
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffPermissions, setStaffPermissions] = useState({
    can_view_users: true,
    can_update_user_status: false,
    can_delete_users: false,
    can_delete_applications: false,
    can_view_logs: false,
    can_create_staff: false
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingStaff(true);
    setStaffSuccess(null);
    setStaffError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          role: staffRole,
          permissions: staffRole === 'supervisor' ? staffPermissions : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStaffSuccess('Staff account created successfully!');
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffPermissions({
          can_view_users: true,
          can_update_user_status: false,
          can_delete_users: false,
          can_delete_applications: false,
          can_view_logs: false,
          can_create_staff: false
        });
        fetchUsers();
        fetchLogs();
      } else {
        setStaffError(data.error || 'Failed to create staff account.');
      }
    } catch (err) {
      setStaffError('Network error. Failed to create staff.');
    } finally {
      setCreatingStaff(false);
    }
  };
  
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

  // Fetch all applications (for CSV export)
  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/services/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApps(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchLogs();
    fetchApplications();
  }, [token]);

  const renderUserRow = (u: User) => {
    const isMe = u.id === activeUser?.id;
    const isStaff = u.role !== 'client';
    
    // Find all cases/filings assigned to this staff member
    const staffApps = apps.filter(a => a.assigned_to === u.id);
    
    // Get unique list of client IDs assigned to this staff member
    const assignedClientIds = Array.from(new Set(staffApps.map(a => a.client_id)));
    const assignedClients = assignedClientIds.map(cId => {
      const clientApp = staffApps.find(a => a.client_id === cId);
      return {
        id: cId,
        name: clientApp?.client_name || `Client #${cId}`,
        applications: staffApps.filter(a => a.client_id === cId)
      };
    });

    const isExpanded = expandedStaffId === u.id;

    return (
      <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Main Row */}
        <div 
          onClick={() => {
            if (isStaff) {
              setExpandedStaffId(isExpanded ? null : u.id);
              setExpandedClientId(null);
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
          title={isStaff ? "Click to toggle assigned clients and progress list" : undefined}
        >
          <div>
            <span 
              onClick={(e) => {
                e.stopPropagation(); // Prevent toggling dropdown
                if ((window as any).openProfileModal) {
                  (window as any).openProfileModal(u.id);
                }
              }}
              style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-red)', display: 'inline-block', cursor: 'pointer', textDecoration: 'underline' }}
              title="Click to view/edit user profile"
            >
              {u.name} {isMe && <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem' }}>(You)</span>}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
              {u.email}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-red)', textTransform: 'capitalize', fontWeight: '500' }}>
              {u.role.replace('_', ' ')} {isStaff && `(${assignedClients.length} clients assigned)`}
            </span>
            {u.role === 'supervisor' && u.permissions && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {Object.entries(u.permissions).map(([key, val]) => {
                  if (val !== true) return null;
                  return (
                    <span key={key} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-color)' }}>
                      {key.replace('can_', '').replace(/_/g, ' ')}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {!isMe && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
              {hasPermission('can_update_user_status') && (
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
              
              {hasPermission('can_delete_users') && (
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
          )}
        </div>

        {/* Dropdown of Assigned Clients */}
        {isStaff && isExpanded && (
          <div style={{
            marginLeft: '12px',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderLeft: '2px solid var(--accent-red)',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clients assigned to {u.name.split(' ')[0]}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assignedClients.map(client => {
                const isClientExpanded = expandedClientId === client.id;
                return (
                  <div key={client.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div 
                      onClick={() => setExpandedClientId(isClientExpanded ? null : client.id)}
                      style={{
                        padding: '6px 10px',
                        background: isClientExpanded ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      title="Click to view client work progress details"
                    >
                      <span>{client.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {client.applications.length} case{client.applications.length > 1 ? 's' : ''} {isClientExpanded ? '▼' : '►'}
                      </span>
                    </div>

                    {isClientExpanded && (
                      <div style={{
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginLeft: '8px'
                      }}>
                        {client.applications.map(app => (
                          <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                            <div>
                              <span style={{ color: '#fff', fontWeight: '500' }}>
                                {app.service_type.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>(#{app.id})</span>
                            </div>
                            <span style={{
                              background: app.status === 'completed' ? 'rgba(72,187,120,0.1)' : app.status === 'rejected' || app.status === 'add_info_required' ? 'rgba(229,62,62,0.1)' : 'rgba(49,130,206,0.1)',
                              color: app.status === 'completed' ? '#48bb78' : app.status === 'rejected' || app.status === 'add_info_required' ? '#f56565' : '#4299e1',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              textTransform: 'uppercase',
                              fontWeight: '700'
                            }}>
                              {app.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {assignedClients.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                  No clients currently assigned.
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  };

  // Toggle user status (Suspend / Activate)
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
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      fetchLogs(); // Reload audit logs
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Delete user account (Admin only)
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
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to delete user.');
    }
  };

  // Export applications to CSV (categorised by service type with all client-supplied information)
  const handleExportCSV = () => {
    if (apps.length === 0) {
      alert('No application records found to export.');
      return;
    }

    // Sort by service type to group/categorise them based on services
    const sortedApps = [...apps].sort((a, b) => a.service_type.localeCompare(b.service_type));

    // Headers
    const headers = [
      'Ref ID',
      'Client Name',
      'Service Type',
      'Status',
      'Assigned To',
      'Created At',
      'Proposed Name / Service Name',
      'Proposed Name 2',
      'Proposed Name 3',
      'Share Capital / Aims & Objectives / Nature of Business',
      'Selected Sub-services',
      'Client Email',
      'Client Phone',
      'BVN',
      'State of Origin',
      'State',
      'LGA',
      'Residential Address',
      'Next of Kin',
      'Next of Kin Contact',
      'Directors / Trustees List'
    ];
    
    // Rows
    const rows = sortedApps.map(app => {
      let detailsObj: any = {};
      try {
        detailsObj = JSON.parse(app.details) || {};
      } catch (e) {
        detailsObj = { raw_details: app.details };
      }

      // Map directors/trustees arrays to a clean readable string
      const members = detailsObj.directors || detailsObj.trustees || [];
      const membersStr = Array.isArray(members) 
        ? members.map((m: any) => `${m.name || ''} (${m.email || ''}, ${m.phone || ''})`).join('; ') 
        : '';

      const subServices = Array.isArray(detailsObj.selectedSubServices)
        ? detailsObj.selectedSubServices.join(', ')
        : (detailsObj.selectedSubServices || '');

      const shareOrAims = detailsObj.shareCapital 
        ? `₦${detailsObj.shareCapital}` 
        : (detailsObj.aimsAndObjectives || detailsObj.natureOfBusiness || '');

      return [
        app.id.toString(),
        app.client_name || `Client #${app.client_id}`,
        app.service_type.toUpperCase().replace('_', ' '),
        app.status.toUpperCase().replace('_', ' '),
        app.assignee_name || 'Unassigned',
        app.created_at ? new Date(app.created_at).toLocaleDateString() : '',
        detailsObj.proposedName1 || detailsObj.serviceName || '',
        detailsObj.proposedName2 || '',
        detailsObj.proposedName3 || '',
        shareOrAims,
        subServices,
        detailsObj.email || '',
        detailsObj.phone || '',
        detailsObj.bvn || '',
        detailsObj.stateOfOrigin || '',
        detailsObj.state || '',
        detailsObj.lga || '',
        detailsObj.residentialAddress || '',
        detailsObj.nextOfKin || '',
        detailsObj.nextOfKinContact || '',
        membersStr
      ];
    });

    // Helper to escape CSV cell contents
    const escapeCSV = (val: string) => {
      const escaped = val.toString().replace(/"/g, '""');
      return `"${escaped}"`;
    };

    // Construct CSV content with UTF-8 BOM for direct Excel compatibility
    const csvHeader = headers.map(escapeCSV).join(',');
    const csvRows = rows.map(row => row.map(escapeCSV).join(','));
    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Create download link
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `primeflow_all_filings_by_service_${new Date().toISOString().split('T')[0]}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in theme-colored page-theme-glow page-container">
      
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            System configurations, user administration, data reports, and maximum security audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            <FileSpreadsheet size={16} /> Export Applications CSV
          </button>
          <button 
            onClick={() => { fetchUsers(); fetchLogs(); }} 
            className="btn-secondary" 
            style={{ fontSize: '0.8rem', padding: '10px' }}
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
        
        {/* User Management Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {/* Create Staff Account Form */}
          {hasPermission('can_create_staff') ? (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Create Staff Account
              </h4>
              <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={staffName} 
                    onChange={(e) => setStaffName(e.target.value)} 
                    placeholder="e.g. Fatima Okafor"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={staffEmail} 
                    onChange={(e) => setStaffEmail(e.target.value)} 
                    placeholder="e.g. fatima@primeflow.com"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Password</label>
                  <input 
                    type="password" 
                    required 
                    className="form-input" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={staffPassword} 
                    onChange={(e) => setStaffPassword(e.target.value)} 
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Role</label>
                  <select 
                    className="form-select" 
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={staffRole} 
                    onChange={(e) => setStaffRole(e.target.value)}
                  >
                    <option value="operations_officer">Operations Officer (Consultant)</option>
                    <option value="compliance_officer">Compliance Officer (Filer)</option>
                    <option value="supervisor">Supervisor (Manager)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                {staffRole === 'supervisor' && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Supervisor Permissions Checklist
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {[
                        { key: 'can_view_users', label: 'Monitor User Accounts list' },
                        { key: 'can_update_user_status', label: 'Suspend/Activate user accounts' },
                        { key: 'can_delete_users', label: 'Permanently delete user accounts' },
                        { key: 'can_delete_applications', label: 'Permanently delete applications' },
                        { key: 'can_view_logs', label: 'Monitor Security Audit logs' },
                        { key: 'can_create_staff', label: 'Onboard/create other staff accounts' }
                      ].map(perm => (
                        <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={(staffPermissions as any)[perm.key]}
                            onChange={(e) => setStaffPermissions(prev => ({
                              ...prev,
                              [perm.key]: e.target.checked
                            }))}
                            style={{ accentColor: 'var(--accent-red)' }}
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {staffSuccess && (
                  <div style={{ color: '#48bb78', fontSize: '0.8rem', textAlign: 'center', fontWeight: '500' }}>
                    {staffSuccess}
                  </div>
                )}
                {staffError && (
                  <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', textAlign: 'center', fontWeight: '500' }}>
                    {staffError}
                  </div>
                )}
                
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: '0.85rem' }} disabled={creatingStaff}>
                  {creatingStaff ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ShieldAlert size={28} style={{ color: 'var(--accent-red)', marginBottom: '4px' }} />
              <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>Staff Onboarding Locked</div>
              <div style={{ textAlign: 'center', lineHeight: '1.4' }}>Supervisor grant required to onboard new staff members.</div>
            </div>
          )}

          {/* User Accounts List */}
          {hasPermission('can_view_users') ? (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                User Accounts
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
          ) : (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ShieldAlert size={28} style={{ color: 'var(--accent-red)', marginBottom: '4px' }} />
              <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>Accounts Directory Locked</div>
              <div style={{ textAlign: 'center', lineHeight: '1.4' }}>Supervisor grant required to view staff and client accounts.</div>
            </div>
          )}

        </div>

        {/* Security Audit Trail Section */}
        {hasPermission('can_view_logs') ? (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent-red)' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#fff' }}>Security Audit Trail</h4>
            </div>

            {loadingLogs ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
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
        ) : (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <ShieldAlert size={28} style={{ color: 'var(--accent-red)', marginBottom: '4px' }} />
            <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>Security Trail Locked</div>
            <div style={{ textAlign: 'center', lineHeight: '1.4' }}>Supervisor grant required to monitor security audit logs.</div>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminPortal;
