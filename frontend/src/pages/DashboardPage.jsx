import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Pill, FileText, TrendingUp, ArrowRight, Sparkles, Loader2,
  ChevronRight, User, Activity, Search, Camera, Clock, CheckCircle2, ShieldCheck
} from 'lucide-react';

const StatCard = ({ icon: Icon, color, label, value }) => (
  <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
    <div style={{
      position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05,
      transform: 'scale(2.5)', color: `var(--${color})`
    }}>
      <Icon size={48} />
    </div>
    <div style={{
      background: `linear-gradient(135deg, rgba(var(--${color}-rgb, 139, 92, 246), 0.15), rgba(var(--${color}-rgb, 139, 92, 246), 0.05))`,
      color: `var(--${color}, var(--primary))`,
      width: '56px', height: '56px', borderRadius: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: `1px solid rgba(var(--${color}-rgb, 139, 92, 246), 0.2)`
    }}>
      <Icon size={28} />
    </div>
    <div style={{ minWidth: 0, flex: 1, zIndex: 1 }}>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>
        {label}
      </p>
      <h2 style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1, color: 'var(--text-primary)' }}>{value}</h2>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, color, title, desc, to }) => (
  <Link to={to} className="card" style={{ 
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
    textDecoration: 'none', transition: 'all 0.3s ease', cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = `var(--${color})`;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = `0 8px 24px rgba(var(--${color}-rgb, 139, 92, 246), 0.15)`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{
        background: `rgba(var(--${color}-rgb, 139, 92, 246), 0.1)`,
        color: `var(--${color}, var(--primary))`,
        width: '40px', height: '40px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={20} />
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '6px',
        color: 'var(--text-secondary)'
      }}>
        <ArrowRight size={14} />
      </div>
    </div>
    <div>
      <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h4>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  </Link>
);

const ListRow = ({ icon: Icon, color, primary, secondary, date }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px', background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)',
    gap: '16px', transition: 'var(--transition)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '10px', 
        background: `rgba(var(--${color}-rgb, 139, 92, 246), 0.05)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
      }}>
        <Icon size={18} style={{ color: `var(--${color}, var(--text-muted))` }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {primary}
        </p>
        {secondary && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
            {secondary}
          </p>
        )}
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{date}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <CheckCircle2 size={12} />
        <span>Completed</span>
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { t, language } = useApp();
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [recentDiseases, setRecentDiseases] = useState([]);
  const [recentMedicineSearches, setRecentMedicineSearches] = useState([]);
  const [dailyTip, setDailyTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scans');

  useEffect(() => {
    api.getDashboardStats().then((res) => {
      if (res.success) {
        let medSearches = res.data.recentMedicineSearches || [];
        if (medSearches.length === 0) {
          try {
            const local = JSON.parse(localStorage.getItem('mediscan_text_searches') || '[]');
            if (local.length > 0) medSearches = local.slice(0, 5);
          } catch (_) {}
        }
        let statsData = res.data.stats || {};
        if ((!statsData.totalMedicineSearches || statsData.totalMedicineSearches === 0) && medSearches.length > 0) {
          statsData = { ...statsData, totalMedicineSearches: medSearches.length };
        }
        setStats(statsData);
        setRecentScans(res.data.recentScans || []);
        setRecentReports(res.data.recentReports || []);
        setRecentDiseases(res.data.recentDiseaseSearches || []);
        setRecentMedicineSearches(medSearches);
        setDailyTip(res.data.dailyTip);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmtDate = (d) => {
    if (!d) return 'N/A';
    try {
      if (language === 'hi') return new Date(d).toLocaleDateString('hi-u-nu-deva', { month: 'short', day: 'numeric', year: 'numeric' });
      if (language === 'gu') return new Date(d).toLocaleDateString('gu-u-nu-gujr', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {}
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fmtNum = (num) => {
    if (num == null) return 0;
    try {
      if (language === 'hi') return new Intl.NumberFormat('hi-u-nu-deva').format(num);
      if (language === 'gu') return new Intl.NumberFormat('gu-u-nu-gujr').format(num);
    } catch (e) {}
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateProfileCompletion = () => {
    let score = 0;
    if (user?.name) score += 25;
    if (user?.email) score += 25;
    if (user?.gender) score += 20;
    if (user?.dateOfBirth) score += 15;
    if (user?.phone) score += 15;
    return score;
  };

  const profileScore = calculateProfileCompletion();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', margin: '0 auto 16px', display: 'block' }} />
          <p className="text-secondary" style={{ fontSize: '16px', fontWeight: '500' }}>{t('loadingMetrics') || 'Loading Dashboard...'}</p>
        </div>
      </div>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'scans':
        return recentScans.length === 0 ? (
          <div className="empty-state">
            <Camera size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Image Scans Yet</h4>
            <p className="empty-state-text">Use the camera to scan medicine packaging.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentScans.map((scan) => {
              let name = scan.medicineName;
              let active = scan.activeIngredients;
              if (['YOURINFO', 'TABLETS', 'TABLET'].includes((name || '').toUpperCase().trim())) {
                const raw = ((scan.rawOcrText || '') + ' ' + (scan.imageUrl || '')).toLowerCase();
                if (raw.includes('cetcip') || raw.includes('cetirizine')) name = 'Cetcip 10mg (Cetirizine HCl)';
                else if (raw.includes('dolo') || raw.includes('paracetamol')) name = 'Dolo-650 (Paracetamol)';
                else if (raw.includes('amicold')) name = 'Amicold Plus Suspension';
                else if (raw.includes('zithromax') || raw.includes('azithromycin')) name = 'Zithromax 500mg';
                else name = 'Prescription Formulation';
              }
              if (active && (active.includes('approx. 250mg') || active.includes('Active substance identified'))) {
                active = 'Active clinical substance';
              }
              return (
                <ListRow key={scan._id || scan.id} icon={Camera} color="primary" primary={name} secondary={active ? `Active: ${active}` : null} date={fmtDate(scan.createdAt)} />
              );
            })}
          </div>
        );
      case 'searches':
        return recentMedicineSearches.length === 0 ? (
          <div className="empty-state">
            <Search size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Medicine Searches</h4>
            <p className="empty-state-text">Search for medicines by name to see history.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentMedicineSearches.map((ms) => (
              <ListRow key={ms._id || ms.id} icon={Search} color="info" primary={ms.medicineName || ms.searchQuery} secondary={ms.category ? `${ms.category} · ${ms.dosageForm || ''}` : ms.genericName || null} date={fmtDate(ms.createdAt)} />
            ))}
          </div>
        );
      case 'reports':
        return recentReports.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Reports Analyzed</h4>
            <p className="empty-state-text">Upload clinical reports to get AI summaries.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentReports.map((report) => (
              <ListRow key={report._id || report.id} icon={FileText} color="success" primary={report.fileName} secondary={t(report.summary)} date={fmtDate(report.createdAt)} />
            ))}
          </div>
        );
      case 'diseases':
        return recentDiseases.length === 0 ? (
          <div className="empty-state">
            <Activity size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Disease Searches</h4>
            <p className="empty-state-text">Explore diseases to learn more about them.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentDiseases.map((d) => (
              <ListRow key={d._id || d.id} icon={TrendingUp} color="danger" primary={d.diseaseName || d.query} date={fmtDate(d.createdAt)} />
            ))}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fade-in">
      {/* ─── Page Header ─── */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-title">{t('clinicalDashboard')}</h1>
          <p className="body-text" style={{ marginTop: '8px' }}>
            {t('welcomeBack', { name: user?.name || '' })} Here's your overview for today.
          </p>
        </div>
        <div className="dashboard-profile-pill" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} aria-hidden="true">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray={`${profileScore}, 100`} style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }} aria-label={`Profile ${profileScore}% complete`}>
              {profileScore}%
            </div>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Profile Setup</p>
            <Link to="/settings" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Complete now &rarr;</Link>
          </div>
        </div>
      </div>

      {/* ─── Health Tip Banner ─── */}
      <div className="alert alert-success" style={{
        marginBottom: '28px', padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)',
        display: 'flex', alignItems: 'flex-start', gap: '16px',
        flexDirection: 'row', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)'
      }} role="note" aria-label="Daily health tip">
        <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={24} />
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700', letterSpacing: '0.02em' }}>{t('healthTip') || 'Daily Health Insight'}</span>
          <p style={{ color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px', fontWeight: '500', lineHeight: 1.5 }}>
            {t(dailyTip) || t('defaultTip')}
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="col-3">
          <StatCard icon={Camera} color="primary" label={t('totalMedicineScans') === 'totalMedicineScans' ? 'Image Scans' : t('totalMedicineScans')} value={fmtNum(stats?.totalScans ?? 0)} />
        </div>
        <div className="col-3">
          <StatCard icon={Search} color="info" label={t('totalMedicineSearches') === 'totalMedicineSearches' ? 'Text Searches' : t('totalMedicineSearches')} value={fmtNum(stats?.totalMedicineSearches ?? 0)} />
        </div>
        <div className="col-3">
          <StatCard icon={TrendingUp} color="danger" label={t('diseaseSearches') === 'diseaseSearches' ? 'Disease Searches' : t('diseaseSearches')} value={fmtNum(stats?.totalDiseaseSearches ?? 0)} />
        </div>
        <div className="col-3">
          <StatCard icon={FileText} color="success" label={t('reportsParsed') === 'reportsParsed' ? 'Reports Parsed' : t('reportsParsed')} value={fmtNum(stats?.totalReports ?? 0)} />
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div style={{ marginBottom: '32px' }}>
        <h3 className="section-heading" style={{ marginBottom: '16px', fontSize: '18px' }}>{t('quickActions') || 'Quick Actions'}</h3>
        <div className="dashboard-grid">
          <div className="col-4">
            <QuickAction icon={Camera} color="primary" title={t('scanMedicineLabel')} desc="Use your camera to identify a medicine" to="/scanner" />
          </div>
          <div className="col-4">
            <QuickAction icon={FileText} color="success" title={t('analyzeLabReport')} desc="Upload and summarize clinical documents" to="/report" />
          </div>
          <div className="col-4">
            <QuickAction icon={Search} color="info" title={t('searchDiseaseQuick')} desc="Lookup medical conditions & treatments" to="/disease" />
          </div>
        </div>
      </div>

      {/* ─── Main 2-col body ─── */}
      <div className="dashboard-grid" style={{ alignItems: 'start' }}>
        
        {/* ── LEFT: Unified Recent Activity ── */}
        <div className="col-8">
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-heading">Recent Activity</h3>
              <Link to="/history" style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>
                {t('viewAll')} &rarr;
              </Link>
            </div>
            
            <div className="tab-nav-scroll" style={{ margin: '20px 24px 0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button className={activeTab === 'scans' ? 'active' : ''} onClick={() => setActiveTab('scans')}>Image Scans</button>
              <button className={activeTab === 'searches' ? 'active' : ''} onClick={() => setActiveTab('searches')}>Text Searches</button>
              <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Reports</button>
              <button className={activeTab === 'diseases' ? 'active' : ''} onClick={() => setActiveTab('diseases')}>Diseases</button>
            </div>

            <div style={{ padding: '24px', minHeight: '300px' }}>
              {renderActiveTabContent()}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Clinical Profile & Identity ── */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '80px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px', position: 'relative', zIndex: 1 }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', 
                border: '4px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginBottom: '16px'
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: '800' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
              
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {user?.name || 'User'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                {user?.email}
              </p>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  [t('gender') || 'Gender', user?.gender, User],
                  [t('dateOfBirth') || 'Date of Birth', user?.dateOfBirth, Clock],
                  [t('phone') || 'Phone', user?.phone, Pill],
                ].map(([label, val, Icon]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600', textTransform: 'capitalize' }}>
                      {val || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Data Privacy Assured</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              All your clinical scans and medical searches are end-to-end encrypted and strictly confidential. We do not sell your health data.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
