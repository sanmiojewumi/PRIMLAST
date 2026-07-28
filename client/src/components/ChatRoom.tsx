import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { MessageSquare, Send, FileText, Paperclip, Download } from 'lucide-react';
import type { Application, Message } from '../types';

interface ChatRoomProps {
  initialAppId?: number | null;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ initialAppId }) => {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Accordion toggle state for admin viewing
  const [expandedClients, setExpandedClients] = useState<{ [key: number]: boolean }>({});

  const toggleClientExpanded = (clientId: number) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  // Fetch applications
  useEffect(() => {
    if (!token) return;
    const fetchApps = async () => {
      try {
        const res = await fetch(`${API_BASE}/services/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
          if (data.length > 0) {
            if (initialAppId) {
              const matched = data.find((a: Application) => a.id === initialAppId);
              if (matched) {
                setSelectedApp(matched);
                if (matched.client_id) {
                  setExpandedClients({ [matched.client_id]: true });
                }
              } else {
                setSelectedApp(data[0]);
                setExpandedClients({ [data[0].client_id]: true });
              }
            } else {
              setSelectedApp(data[0]);
              setExpandedClients({ [data[0].client_id]: true });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [token]);

  // Fetch messages when selected application changes
  useEffect(() => {
    if (!token || !selectedApp) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/messages/${selectedApp.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
    
    // Setup simple polling every 5 seconds to simulate real-time chat
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);

  }, [token, selectedApp]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || (!inputText.trim() && !selectedFile)) return;

    setUploadingFile(true);
    try {
      let fileUrl = null;
      let finalFilename = null;

      // 1. If a file is selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('application_id', selectedApp.id.toString());

        const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileUrl = `/documents/download/${uploadData.id}`;
          finalFilename = uploadData.originalName || selectedFile.name;
        } else {
          const uploadData = await uploadRes.json();
          alert(`Failed to upload chat file: ${uploadData.error || 'Unknown error'}`);
          setUploadingFile(false);
          return;
        }
      }

      // 2. Post the message
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          application_id: selectedApp.id,
          message_text: inputText.trim() || `Sent attachment: ${finalFilename}`,
          file_url: fileUrl,
          filename: finalFilename
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setInputText('');
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in chat-layout-container" style={{ padding: '24px', height: 'calc(100vh - var(--header-height) - 48px)', overflow: 'hidden' }}>
      
      {/* Applications list sidebar */}
      <div className="glass-panel chat-list-sidebar">
        <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '14px', paddingLeft: '4px' }}>Active Consultations</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          {(() => {
            if (user?.role === 'admin') {
              // Group applications by client_id
              const clientGroups: { [key: number]: { clientName: string; apps: Application[] } } = {};
              applications.forEach(app => {
                const cid = app.client_id;
                const cname = app.client_name || `Client #${cid}`;
                if (!clientGroups[cid]) {
                  clientGroups[cid] = { clientName: cname, apps: [] };
                }
                clientGroups[cid].apps.push(app);
              });

              const groupsArray = Object.entries(clientGroups);

              if (groupsArray.length === 0) {
                return (
                  <div style={{ padding: '20px 4px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No active applications.
                  </div>
                );
              }

              return groupsArray.map(([cidStr, group]) => {
                const cid = Number(cidStr);
                const isExpanded = !!expandedClients[cid];
                return (
                  <div key={cid} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <button 
                      onClick={() => toggleClientExpanded(cid)}
                      style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        color: isExpanded ? '#fff' : 'var(--text-secondary)', 
                        padding: '6px 8px', 
                        background: isExpanded ? 'rgba(229, 62, 62, 0.12)' : 'rgba(255, 255, 255, 0.02)', 
                        border: 'none',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isExpanded ? 'rgba(229, 62, 62, 0.18)' : 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isExpanded ? 'rgba(229, 62, 62, 0.12)' : 'rgba(255, 255, 255, 0.02)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isExpanded ? 'var(--accent-red)' : 'var(--text-muted)' }} />
                        <span>{group.clientName}</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                        {isExpanded ? '▼' : '▶'} ({group.apps.length})
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '2px' }}>
                        {group.apps.map(app => {
                          const isSelected = selectedApp?.id === app.id;
                          return (
                            <button
                              key={app.id}
                              onClick={() => setSelectedApp(app)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isSelected ? 'var(--accent-red-dim)' : 'transparent',
                                borderLeft: isSelected ? '3px solid var(--accent-red)' : '3px solid transparent',
                                color: isSelected ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                            >
                              <span style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'capitalize' }}>
                                {app.service_type.replace('_', ' ')}
                              </span>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                Ref: #{app.id} • {app.status.replace('_', ' ')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            } else {
              // Flat list for non-admin roles (e.g. Client or standard staff if needed, although clients only see their own)
              if (applications.length === 0) {
                return (
                  <div style={{ padding: '20px 4px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No active applications.
                  </div>
                );
              }
              return applications.map(app => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected ? 'var(--accent-red-dim)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent-red)' : '3px solid transparent',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {app.service_type.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Ref ID: #{app.id}
                    </span>
                  </button>
                );
              });
            }
          })()}
        </div>
      </div>

      {/* Main Chat Thread area */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedApp ? (
          <>
            {/* Thread Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '1rem' }}>
                  {selectedApp.service_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Consultation
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Assigned Consultant: {selectedApp.assignee_name || 'Awaiting Operations Officer assignment'}
                </span>
              </div>
              <span className={`badge badge-${selectedApp.status}`} style={{ fontSize: '0.7rem' }}>
                {selectedApp.status.replace('_', ' ')}
              </span>
            </div>

            {/* Message History */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, idx) => {
                const isSenderMe = msg.sender_id === user?.id;
                return (
                  <div 
                    key={msg.id || idx}
                    style={{
                      alignSelf: isSenderMe ? 'flex-end' : 'flex-start',
                      display: 'flex',
                      gap: '10px',
                      maxWidth: '70%',
                      flexDirection: isSenderMe ? 'row-reverse' : 'row'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      border: isSenderMe ? '1px solid var(--accent-red)' : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: isSenderMe ? 'var(--accent-red)' : 'var(--text-secondary)',
                      flexShrink: 0
                    }}>
                      {msg.sender_name?.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Chat Bubble */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSenderMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        background: isSenderMe ? 'var(--accent-red-dim)' : 'rgba(20,20,24,0.4)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {msg.message_text}
                        </p>
                        
                        {msg.file_url && (
                          <div 
                            style={{ 
                              marginTop: '8px', 
                              padding: '10px 12px', 
                              background: 'rgba(0, 0, 0, 0.25)', 
                              border: '1px solid rgba(255, 255, 255, 0.15)', 
                              borderRadius: '8px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              gap: '12px',
                              maxWidth: '340px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <FileText size={20} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span 
                                  style={{ 
                                    fontSize: '0.8rem', 
                                    color: '#fff', 
                                    fontWeight: '600',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {msg.filename || 'Attached Correspondence'}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Correspondence File</span>
                              </div>
                            </div>
                            <a 
                              href={`${API_BASE}${msg.file_url}`} 
                              download={msg.filename || 'Correspondence_Attachment'}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn-secondary"
                              style={{ 
                                padding: '4px 12px', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                textDecoration: 'none',
                                flexShrink: 0
                              }}
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </a>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={36} strokeWidth={1.5} />
                  <p style={{ fontSize: '0.8rem' }}>No consultation log entries. Send a message to start.</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form 
              onSubmit={handleSendMessage}
              style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid var(--border-color)', 
                background: 'rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(215, 25, 32, 0.1)', border: '1px solid rgba(215, 25, 32, 0.2)', borderRadius: '6px', fontSize: '0.78rem', alignSelf: 'flex-start' }}>
                  <FileText size={14} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ color: '#fff', fontWeight: '500' }}>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#ff8888', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px', fontWeight: 'bold' }}>✕</button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  id="chat-file-input"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (file.size > 5 * 1024 * 1024) {
                        alert("File exceeds the 5MB security limit.");
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                />
                <label 
                  htmlFor="chat-file-input"
                  style={{ 
                    cursor: 'pointer', 
                    padding: '10px', 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    transition: 'background 0.2s'
                  }}
                  title="Attach document"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Paperclip size={18} style={{ color: 'var(--text-secondary)' }} />
                </label>
                
                <input
                  type="text"
                  placeholder={uploadingFile ? "Uploading attachment..." : "Type your message to PrimeFlow staff..."}
                  className="form-input"
                  style={{ flex: 1, height: '40px' }}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={uploadingFile}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 20px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={uploadingFile || (!inputText.trim() && !selectedFile)}>
                  {uploadingFile ? (
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear' }} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <MessageSquare size={48} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontSize: '1rem', color: '#fff' }}>No Consultations Found</h4>
            <p style={{ fontSize: '0.8rem', maxWidth: '300px', textAlign: 'center' }}>
              Please navigate to the Services Portal and submit an application request to start a chat.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatRoom;
