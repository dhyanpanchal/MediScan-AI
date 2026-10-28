import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Users, Pill, FileText, ShieldAlert, Search, Calendar, X,
  ExternalLink, Loader2, TrendingUp, Fingerprint, Activity,
  CheckCircle, AlertTriangle, Stethoscope, Camera, Server, Shield
} from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuth();
  const { language, t } = useApp();
  const navigate = useNavigate();

  const hasAccess = user && user.email && (
    user.email.trim().toLowerCase().includes('premkardani2006') ||
    user.email.trim().toLowerCase().includes('panchaldhyan007')
  );

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, scans, reports, diseases
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [scansList, setScansList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [diseasesList, setDiseasesList] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    fetchAdminData();
  }, [activeTab, hasAccess]);

  const fetchAdminData = async () => {
    setLoading(true); setError('');
    try {
      if (activeTab === 'overview') {
        const res = await api.getAdminStats();
        if (res.success) setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers(searchQuery);
        if (res.success) setUsersList(res.data);
      } else if (activeTab === 'scans') {
        const res = await api.getAdminScans(searchQuery);
        if (res.success) setScansList(res.data);
      } else if (activeTab === 'reports') {
        const res = await api.getAdminReports(searchQuery);
        if (res.success) setReportsList(res.data);
      } else if (activeTab === 'diseases') {
        const res = await api.getAdminDiseases(searchQuery);
        if (res.success) setDiseasesList(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchAdminData(); };

  const handleUserSelect = async (userId) => {
    try {
      const res = await api.getAdminUserDetail(userId);
      if (res.success) setSelectedUserDetail(res.data);
    } catch (err) { alert('Failed to fetch detailed records.'); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.charAt(0)}***@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone.slice(0, 3) + '******' + phone.slice(-2);
  };

  if (!hasAccess) {
    return (
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '40px', textAlign: 'center', border: '1px solid var(--danger-glow)' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><ShieldAlert size={32} /></div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Security Clearance Required</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>This administrative portal is restricted to authorized MediScan network operators.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const KPICard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="card col-3" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
      <div style={{ background: bg, color: color, width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={28} /></div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', color: 'var(--text-primary)' }}>{value.toLocaleString()}</h3>
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-primary"><Shield size={12} style={{marginRight:'4px'}}/> Admin Authority</span>
          </div>
          <h1 className="page-title">Command Center</h1>
          <p className="body-text" style={{ marginTop: '8px' }}>System-wide analytics, user registries, and operational telemetry.</p>
        </div>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--success-glow)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Network Operational</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', overflowX: 'auto' }}>
        {[
          { id: 'overview', name: 'Telemetry', icon: TrendingUp },
          { id: 'users', name: 'Patient Registry', icon: Users },
          { id: 'scans', name: 'Medicine Scans', icon: Camera },
          { id: 'reports', name: 'Lab Reports', icon: FileText },
          { id: 'diseases', name: 'Disease Queries', icon: Activity }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className="btn" style={{
              padding: '10px 20px', fontSize: '14px', borderRadius: '12px', whiteSpace: 'nowrap',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
              fontWeight: isActive ? '700' : '600', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <tab.icon size={16} /> {tab.name}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={18} style={{ marginRight: '8px' }} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && stats && (
            <div className="fade-in">
              <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
                <KPICard title="Total Patients" value={stats.stats.totalUsers} icon={Users} color="var(--primary)" bg="rgba(139, 92, 246, 0.1)" />
                <KPICard title="Medicine Scans" value={stats.stats.totalScans} icon={Camera} color="var(--success)" bg="rgba(16, 185, 129, 0.1)" />
                <KPICard title="Reports Analyzed" value={stats.stats.totalReports} icon={FileText} color="var(--secondary)" bg="rgba(6, 182, 212, 0.1)" />
                <KPICard title="Disease Searches" value={stats.stats.totalDiseaseSearches || 0} icon={Activity} color="var(--warning)" bg="rgba(245, 158, 11, 0.1)" />
              </div>

              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
                
                {/* Registration Methods Chart */}
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-heading" style={{ marginBottom: '24px' }}><Server size={18} style={{display:'inline', marginRight:'8px'}}/> Registration Telemetry</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Email / Password Authentication</span>
                        <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{stats.authStats.email} users</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stats.authStats.email / (stats.stats.totalUsers || 1)) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Google OAuth (SSO)</span>
                        <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{stats.authStats.google} users</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stats.authStats.google / (stats.stats.totalUsers || 1)) * 100}%`, height: '100%', background: 'var(--success)' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Log */}
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-heading" style={{ marginBottom: '24px' }}><Fingerprint size={18} style={{display:'inline', marginRight:'8px'}}/> Recent Registrations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.recentUsers.slice(0, 4).map(u => (
                      <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                        <div>
                          <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{u.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{maskEmail(u.email)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge ${u.oauthProvider === 'google' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '10px' }}>
                            {u.oauthProvider || 'Email'}
                          </span>
                          <p style={{ fontSize: '11px', color: 'var(--text-dark)', marginTop: '6px' }}>{formatDate(u.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIST TABS (Users, Scans, Reports, Diseases) */}
          {activeTab !== 'overview' && (
            <div className="fade-in">
              <form onSubmit={handleSearchSubmit} className="search-form-row" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '13px', color: 'var(--text-muted)' }} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab}...`} className="form-control" style={{ paddingLeft: '44px', height: '44px', borderRadius: '12px' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '12px', height: '44px' }}>Search</button>
              </form>

              <div className="card table-responsive" style={{ padding: '0' }}>
                <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {activeTab === 'users' && (
                        <>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient Name</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Identity (Masked)</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auth Provider</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Date</th>
                          <th></th>
                        </>
                      )}
                      {activeTab === 'scans' && (
                        <>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient Name</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Medicine Name</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingredients Extract</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scan Date</th>
                          <th></th>
                        </>
                      )}
                      {activeTab === 'reports' && (
                        <>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient Name</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>File Name</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Diagnostic Summary</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upload Date</th>
                          <th></th>
                        </>
                      )}
                      {activeTab === 'diseases' && (
                        <>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient Name</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disease Query</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Search Query</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Search Date</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render Logic specific to tab list */}
                    {(activeTab === 'users' ? usersList : activeTab === 'scans' ? scansList : activeTab === 'reports' ? reportsList : diseasesList).map((item, idx) => (
                      <tr key={item.id || item._id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        
                        {/* Users Columns */}
                        {activeTab === 'users' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>{item.name}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{maskEmail(item.email)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-dark)', marginTop: '2px' }}>{maskPhone(item.phone)}</div>
                            </td>
                            <td style={{ padding: '16px 24px' }}><span className={`badge ${item.oauthProvider === 'google' ? 'badge-success' : 'badge-primary'}`}>{item.oauthProvider || 'Email'}</span></td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(item.createdAt)}</td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button onClick={() => handleUserSelect(item.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View Records</button>
                            </td>
                          </>
                        )}

                        {/* Scans Columns */}
                        {activeTab === 'scans' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{item.userId?.name || 'Deleted'} <br/><span style={{fontSize:'11px', color:'var(--text-dark)'}}>{maskEmail(item.userId?.email)}</span></td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>{item.medicineName}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{item.activeIngredients ? (item.activeIngredients.length > 50 ? `${item.activeIngredients.substring(0,50)}...` : item.activeIngredients) : 'Unspecified'}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(item.createdAt)}</td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button onClick={() => setSelectedScan(item)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Details</button>
                            </td>
                          </>
                        )}

                        {/* Reports Columns */}
                        {activeTab === 'reports' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{item.userId?.name || 'Deleted'} <br/><span style={{fontSize:'11px', color:'var(--text-dark)'}}>{maskEmail(item.userId?.email)}</span></td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--secondary)', fontSize: '14px' }}>{item.fileName || 'Report'} <br/><span className="badge badge-warning" style={{marginTop:'4px', fontSize:'9px'}}>{item.fileType}</span></td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{item.summary ? (item.summary.length > 50 ? `${item.summary.substring(0,50)}...` : item.summary) : 'No summary'}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(item.createdAt)}</td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button onClick={() => setSelectedReport(item)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Details</button>
                            </td>
                          </>
                        )}

                        {/* Diseases Columns */}
                        {activeTab === 'diseases' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{item.userId?.name || 'Deleted'} <br/><span style={{fontSize:'11px', color:'var(--text-dark)'}}>{maskEmail(item.userId?.email)}</span></td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--warning)', fontSize: '14px' }}>{item.diseaseName}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{item.query}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(item.createdAt)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {(activeTab === 'users' ? usersList : activeTab === 'scans' ? scansList : activeTab === 'reports' ? reportsList : diseasesList).length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dark)' }}>No records found in the database.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default AdminPage;
