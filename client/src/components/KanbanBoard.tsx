import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  Plus, 
  UserPlus, 
  X, 
  Download,
  Send,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Application, User, Document, Message, ApplicationStatus } from '../types';

const KanbanBoard: React.FC = () => {
  const { user, token } = useAuth();
  
  // State
  const [applications, setApplications] = useState<Application[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Selected Application Assets
  const [appDocs, setAppDocs] = useState<Document[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  
  // Action inputs
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [chatText, setChatText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAppData, setShowAppData] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const columns: { id: ApplicationStatus; title: string; color: string }[] = [
    { id: 'submitted', title: 'Submitted', color: '#ffffff' },
    { id: 'under_review', title: 'Under Review', color: '#3182ce' },
    { id: 'add_info_required', title: 'Info Required', color: '#e53e3e' },
    { id: 'processing', title: 'Processing', color: '#3182ce' },
    { id: 'completed', title: 'Completed', color: '#38a169' },
    { id: 'rejected', title: 'Rejected', color: '#e53e3e' }
  ];

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/services/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out clients, only show officers and admins
        setStaffList(data.filter((u: User) => u.role !== 'client'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    
    const init = async () => {
      setLoading(true);
      await fetchApplications();
      await fetchStaff();
      setLoading(false);
    };

    init();
  }, [token]);

  // Handle opening details modal
  const handleOpenDetails = async (app: Application) => {
    setSelectedApp(app);
    setIsFullscreen(false);
    setNewStatus(app.status);
    setAssigneeId(app.assigned_to?.toString() || '');
    setAppDocs([]);
    setChatMessages([]);
    setShowAppData(false);

    try {
      // 1. Fetch documents
      const docRes = await fetch(`${API_BASE}/documents/application/${app.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docRes.ok) {
        const docData = await docRes.json();
        setAppDocs(docData);
      }

      // 2. Fetch Chat messages
      const msgRes = await fetch(`${API_BASE}/messages/${app.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setChatMessages(msgData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Status
  const handleUpdateStatus = async () => {
    if (!selectedApp || !newStatus) return;
    try {
      const res = await fetch(`${API_BASE}/services/applications/${selectedApp.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Update local state
        setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign Staff
  const handleAssignStaff = async () => {
    if (!selectedApp) return;
    const targetId = assigneeId ? parseInt(assigneeId) : null;
    try {
      const res = await fetch(`${API_BASE}/services/applications/${selectedApp.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assigned_to: targetId })
      });
      if (res.ok) {
        const targetStaffName = staffList.find(s => s.id === targetId)?.name || 'Unassigned';
        setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, assigned_to: targetId, assignee_name: targetStaffName } : a));
        setSelectedApp({ ...selectedApp, assigned_to: targetId, assignee_name: targetStaffName });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Application (Admin only)
  const handleDeleteApplication = async () => {
    if (!selectedApp) return;
    if (!window.confirm('Are you sure you want to permanently delete this application and all associated data?')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/applications/${selectedApp.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setApplications(applications.filter(a => a.id !== selectedApp.id));
        setSelectedApp(null);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete application.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to delete application.');
    }
  };

  // Post chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !chatText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          application_id: selectedApp.id,
          message_text: chatText
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages([...chatMessages, newMsg]);
        setChatText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload certificate from staff
  const handleUploadCert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedApp) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('application_id', selectedApp.id.toString());

      try {
        const res = await fetch(`${API_BASE}/documents/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          await res.json();
          // Reload documents
          const updatedDocsRes = await fetch(`${API_BASE}/documents/application/${selectedApp.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (updatedDocsRes.ok) {
            setAppDocs(await updatedDocsRes.json());
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Download File securely
  const handleDownloadFile = async (docId: number, originalName: string) => {
    try {
      const response = await fetch(`${API_BASE}/documents/download/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = originalName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  };

  const renderParsedDetails = (app: Application) => {
    let details: any = {};
    try {
      details = JSON.parse(app.details);
    } catch (e) {
      return <p style={{ color: 'var(--text-secondary)' }}>Unable to parse application details: {app.details}</p>;
    }

    const renderField = (label: string, value: any) => {
      if (value === undefined || value === null || value === '') return null;
      return (
        <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>{String(value)}</span>
        </div>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Core Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px 24px' }}>
          {details.proposedNames && details.proposedNames.length > 0 && (
            <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Proposed Names</span>
              {details.proposedNames.map((name: string, i: number) => (
                <div key={i} style={{ fontSize: '0.9rem', color: 'var(--accent-red)', fontWeight: '700', padding: '4px 0' }}>
                  Option {i + 1}: {name}
                </div>
              ))}
            </div>
          )}

          {renderField('RC Number', details.rcNumber)}
          {renderField('Filing Year', details.filingYear)}
          {renderField('Date of Incorporation', details.incDate)}
          {renderField('Last Filing Date', details.lastFilingDate)}
          {renderField('Share Capital (NGN)', details.shareCapital)}
          {renderField('Business Email', details.businessEmail)}
          
          {/* Address Details */}
          {(details.street || details.city || details.lga || details.state) && (
            <div style={{ gridColumn: '1 / -1' }}>
              {renderField('Business/Association Address', `${details.street || ''}, ${details.city || ''}, ${details.lga || ''}, ${details.state || ''}`)}
            </div>
          )}

          {/* Nature of Business / Objectives */}
          {renderField(app.service_type === 'incorporated_trustee' ? 'Objectives' : 'Nature of Business', details.natureOfBusiness)}
        </div>

        {/* Selected Services for Post-inc / Compliance */}
        {details.selectedSubServices && details.selectedSubServices.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Requested Post-Incorporation filings</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {details.selectedSubServices.map((sub: string) => (
                <span key={sub} style={{ background: 'rgba(229,62,62,0.1)', color: 'var(--accent-red)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(229,62,62,0.2)' }}>
                  {sub.replace(/_/g, ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {details.selectedComplianceServices && details.selectedComplianceServices.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Compliance filings Requested</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {details.selectedComplianceServices.map((sub: string) => (
                <span key={sub} style={{ background: 'rgba(229,62,62,0.1)', color: 'var(--accent-red)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(229,62,62,0.2)' }}>
                  {sub.replace(/_/g, ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Personal Details */}
        {(details.firstName || details.surname) && (
          <div style={{ marginTop: '10px' }}>
            <h5 style={{ color: 'var(--accent-red)', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Filing Representative Details</h5>
            <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr 1fr 1fr 1fr' : '1fr 1fr', gap: '8px 16px' }}>
              {renderField('Representative Name', `${details.surname || ''} ${details.firstName || ''} ${details.otherName || ''}`)}
              {renderField('Phone Number', details.partyPhone)}
              {renderField('Email Address', details.partyEmail)}
              {renderField('Date of Birth', details.dob)}
              {renderField('Marital Status', details.compMaritalStatus)}
              {renderField('Place of Birth', details.compPlaceOfBirth)}
              {renderField('State of Origin', details.compStateOfOrigin)}
              {renderField('LGA of Origin', details.compLgaOfOrigin)}
              {renderField('NIN', details.compNin)}
              {renderField('Address', details.compAddress)}
            </div>
          </div>
        )}

        {/* Next of Kin Details */}
        {details.compNokSurname && (
          <div style={{ marginTop: '10px' }}>
            <h5 style={{ color: 'var(--accent-red)', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Next of Kin (NOK) & Financials</h5>
            <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr 1fr 1fr 1fr' : '1fr 1fr', gap: '8px 16px' }}>
              {renderField('NOK Name', `${details.compNokSurname || ''} ${details.compNokFirstName || ''} ${details.compNokOtherName || ''}`)}
              {renderField('NOK Relationship', details.compNokRelationship)}
              {renderField('NOK Phone', details.compNokPhone)}
              {renderField('NOK Email', details.compNokEmail)}
              {renderField('NOK Address', details.compNokAddress)}
              {renderField('BVN (Bank Verification Number)', details.compBvn)}
            </div>
          </div>
        )}

        {/* Directors / Shareholders */}
        {details.directors && details.directors.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <h5 style={{ color: 'var(--accent-red)', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Directors & Shareholders ({details.directors.length})</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {details.directors.map((dir: any, idx: number) => (
                <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>Director #{idx + 1}: {dir.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr 1fr 1fr' : '1fr', gap: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Phone:</strong> {dir.phone || 'N/A'}</div>
                    <div><strong>Email:</strong> {dir.email || 'N/A'}</div>
                    <div><strong>Address:</strong> {dir.address || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trustees */}
        {details.trustees && details.trustees.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <h5 style={{ color: 'var(--accent-red)', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Board of Trustees & Personal Details ({details.trustees.length})</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {details.trustees.map((tr: any, idx: number) => (
                <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>Trustee Member #{idx + 1}: {tr.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr 1fr 1fr' : '1fr', gap: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Phone:</strong> {tr.phone || 'N/A'}</div>
                    <div><strong>Email:</strong> {tr.email || 'N/A'}</div>
                    <div><strong>Address:</strong> {tr.address || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {details.detailsText && (
          <div style={{ marginTop: '10px' }}>
            {renderField('Additional Specifications / Requests', details.detailsText)}
          </div>
        )}

      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in theme-colored page-theme-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>
      
      {/* Board Header info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Review, claim, and advance regulatory applications from Submitted to Completed status.
          </p>
        </div>
      </div>

      {/* Columns Container */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
        {columns.map((col) => {
          const colApps = applications.filter(a => a.status === col.id);
          return (
            <div 
              key={col.id} 
              style={{ 
                flex: '0 0 280px', 
                background: 'rgba(255,255,255,0.01)', 
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
                overflow: 'hidden'
              }}
            >
              {/* Column Title */}
              <div 
                style={{ 
                  padding: '16px', 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{col.title}</span>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '2px 8px', 
                  borderRadius: '12px' 
                }}>
                  {colApps.length}
                </span>
              </div>

              {/* Cards List */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {colApps.map((app) => {
                  let parsedDetails = { proposedNames: [''] };
                  try { parsedDetails = JSON.parse(app.details); } catch(e) {}
                  const displayName = parsedDetails.proposedNames ? parsedDetails.proposedNames[0] : 'CAC Filing';

                  return (
                    <div
                      key={app.id}
                      onClick={() => handleOpenDetails(app)}
                      className="glass-panel-interactive animate-fade-in"
                      style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                          {app.service_type.replace('_', ' ')}
                        </span>
                        <h5 style={{ color: '#fff', fontSize: '0.85rem', marginTop: '3px', fontWeight: '600' }}>
                          {displayName || 'Regulatory Service'}
                        </h5>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                        <span>Ref: #{app.id}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserPlus size={12} />
                          {app.assignee_name ? app.assignee_name.split(' ')[0] : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {colApps.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    No applications
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* DETAIL INSPECTION DRAWER / MODAL */}
      {selectedApp && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 200
          }}
        >
          {/* Main Modal body */}
          <div 
            className="kanban-detail-modal"
            style={isFullscreen ? {
              width: '100vw',
              height: '100vh',
              animation: 'none',
              borderLeft: 'none'
            } : {}}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Reference ID: #{selectedApp.id}
                </span>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: '2px' }}>
                  {selectedApp.service_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {(user?.role === 'admin' || (user?.role === 'supervisor' && (user as any).permissions?.can_delete_applications === true)) && (
                  <button 
                    onClick={handleDeleteApplication}
                    style={{ 
                      background: 'rgba(229, 62, 62, 0.1)', 
                      border: '1px solid var(--accent-red)', 
                      color: 'var(--accent-red)', 
                      padding: '6px 12px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e)=>e.currentTarget.style.background='rgba(229, 62, 62, 0.2)'}
                    onMouseLeave={(e)=>e.currentTarget.style.background='rgba(229, 62, 62, 0.1)'}
                  >
                    Delete Case
                  </button>
                )}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button 
                  onClick={() => setSelectedApp(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>
 
            {/* Scrollable Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Client Info Section */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Client Account</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={`${API_BASE}/auth/avatar/${selectedApp.client_id}?t=${Date.now()}`} 
                    alt={selectedApp.client_name || 'Client'}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150';
                    }}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                  />
                  <div>
                    <span 
                      onClick={() => {
                        if ((window as any).openProfileModal) {
                          (window as any).openProfileModal(selectedApp.client_id);
                        }
                      }}
                      style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-red)', cursor: 'pointer', textDecoration: 'underline' }}
                      title="Click to view full client profile"
                    >
                      {selectedApp.client_name || 'View Profile'}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Client User ID: #{selectedApp.client_id}
                    </span>
                  </div>
                </div>
              </div>
 
              {/* Operations Control Panel */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Operations Control</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Status update */}
                  <div className="form-group">
                    <label className="form-label">Workflow Status</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className="form-select"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="add_info_required">Info Required</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button 
                        onClick={handleUpdateStatus}
                        className="btn-primary" 
                        style={{ padding: '8px 12px' }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
 
                  {/* Assign staff */}
                  <div className="form-group">
                    <label className="form-label">Assigned Consultant</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className="form-select"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role.split('_')[0]})</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAssignStaff}
                        className="btn-primary" 
                        style={{ padding: '8px 12px' }}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Application Details Summary */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>Application Data</h4>
                  <button 
                    onClick={() => setShowAppData(!showAppData)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-red)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                    onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  >
                    {showAppData ? 'Hide Details' : 'Reveal Details'}
                  </button>
                </div>
                
                {showAppData ? (
                  renderParsedDetails(selectedApp)
                ) : (
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Application details are masked by default to protect privacy. Click "Reveal Details" above to view.
                  </div>
                )}
              </div>

              {/* Secure Document List / Certificate Upload */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Secure Files & CAC Certificates</h4>
                  
                  {/* Upload button for official CAC docs */}
                  <div>
                    <input 
                      type="file" 
                      id="staff-upload" 
                      style={{ display: 'none' }}
                      onChange={handleUploadCert}
                    />
                    <label 
                      htmlFor="staff-upload"
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: '600' }}
                    >
                      <Plus size={14} /> Upload Approved File
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {appDocs.length > 0 ? (
                    appDocs.map(doc => (
                      <div 
                        key={doc.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                          {doc.original_name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {(doc.size / 1024).toFixed(1)} KB
                          </span>
                          <button 
                            onClick={() => handleDownloadFile(doc.id, doc.original_name)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                            title="Download secure file"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No files uploaded yet.</div>
                  )}
                </div>
              </div>

              {/* Consultation Chat Panel */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Consultation Chat</h4>
                
                {/* Chat History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                  {chatMessages.map((msg, idx) => {
                    const isSenderMe = msg.sender_id === user?.id;
                    return (
                      <div 
                        key={msg.id || idx}
                        style={{
                          alignSelf: isSenderMe ? 'flex-end' : 'flex-start',
                          background: isSenderMe ? 'var(--accent-red-dim)' : 'rgba(255,255,255,0.03)',
                          border: isSenderMe ? '1px solid rgba(229,62,62,0.2)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          maxWidth: '85%'
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'capitalize' }}>
                          {msg.sender_name} ({msg.sender_role?.split('_')[0]})
                        </span>
                        <p style={{ fontSize: '0.8rem', color: '#fff', marginTop: '2px', lineHeight: '1.4' }}>
                          {msg.message_text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Send chat */}
                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ask client for more info or give update..."
                    className="form-input"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '8px' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default KanbanBoard;
