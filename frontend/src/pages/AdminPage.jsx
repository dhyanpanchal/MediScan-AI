import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Users, Pill, FileText, ShieldAlert, Search, Calendar, X,
  ExternalLink, Loader2, TrendingUp, Fingerprint, Activity,
  CheckCircle, AlertTriangle, Stethoscope, Camera, Server, Shield,
  Eye, EyeOff, Download, ZoomIn, ZoomOut, RotateCcw, FileQuestion,
  Code, Copy, Check
} from 'lucide-react';

/**
 * Robust document and image previewer for the Admin portal.
 * Handles images, PDFs, loading spinners, zoom controls, and graceful fallbacks
 * to extracted OCR raw text if files are missing from storage.
 */
const AdminDocumentViewer = ({ fileUrl, fileName, fileType, rawText }) => {
  const [viewMode, setViewMode] = useState('doc'); // 'doc' | 'ocr'
  const [docStatus, setDocStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);

  // Generate candidate URLs in order of preference
  const candidateUrls = useMemo(() => {
    if (!fileUrl) return [];
    if (
      fileUrl.startsWith('http://') ||
      fileUrl.startsWith('https://') ||
      fileUrl.startsWith('data:') ||
      fileUrl.startsWith('blob:')
    ) {
      return [fileUrl];
    }

    const clean = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    const list = [];

    // 1. If VITE_API_URL is configured, use its base
    if (import.meta.env?.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
      const base = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
      list.push(`${base}${clean}`);
    }

    // 2. Relative path (proxied by Vite dev server or served directly by Express)
    list.push(clean);

    // 3. Fallback direct connection to backend port 5001
    list.push(`http://localhost:5001${clean}`);
    list.push(`http://127.0.0.1:5001${clean}`);

    return Array.from(new Set(list));
  }, [fileUrl]);

  const activeSrc = candidateUrls[currentUrlIndex] || fileUrl;

  const handleMediaError = () => {
    if (currentUrlIndex + 1 < candidateUrls.length) {
      setCurrentUrlIndex((prev) => prev + 1);
    } else {
      setDocStatus('error');
    }
  };

  const isPdf =
    fileType?.toLowerCase() === 'pdf' ||
    fileUrl?.toLowerCase().endsWith('.pdf') ||
    fileName?.toLowerCase().endsWith('.pdf');

  // Reset states when the file URL changes
  useEffect(() => {
    setDocStatus('loading');
    setCurrentUrlIndex(0);
    setZoomLevel(1);
    setViewMode('doc');
  }, [fileUrl]);

  const handleCopyText = () => {
    if (!rawText) return;
    navigator.clipboard?.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'rgba(10, 14, 28, 0.95)',
      }}
    >
      {/* Top Sub-Header Toolbar */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Left: View Mode Tabs */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setViewMode('doc')}
            className="btn"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              background: viewMode === 'doc' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
            }}
          >
            <FileText size={13} />
            Original Document ({isPdf ? 'PDF' : 'Image'})
          </button>

          {rawText && (
            <button
              type="button"
              onClick={() => setViewMode('ocr')}
              className="btn"
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                background: viewMode === 'ocr' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
              }}
            >
              <Code size={13} />
              Extracted OCR Text
            </button>
          )}
        </div>

        {/* Right: Actions (Zoom, External Open, Download) */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {viewMode === 'doc' && !isPdf && docStatus === 'loaded' && (
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px 4px' }}>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                title="Zoom Out"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                title="Reset Zoom"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '11px' }}
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                title="Zoom In"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <ZoomIn size={14} />
              </button>
            </div>
          )}

          {activeSrc && (
            <>
              <a
                href={activeSrc}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Open in new window"
              >
                <ExternalLink size={12} />
                <span>Open in new tab</span>
              </a>
              <a
                href={activeSrc}
                download={fileName || 'document'}
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Download file"
              >
                <Download size={12} />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Main Display Area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          minHeight: '320px',
        }}
      >
        {/* OCR TEXT VIEW */}
        {viewMode === 'ocr' ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                Full OCR Raw Transcription ({rawText?.length || 0} characters)
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', gap: '4px' }}
              >
                {copied ? <><Check size={12} color="var(--success)" /> Copied</> : <><Copy size={12} /> Copy Text</>}
              </button>
            </div>
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: '16px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '12px',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowY: 'auto',
              }}
            >
              {rawText || 'No raw OCR transcription available for this record.'}
            </pre>
          </div>
        ) : (
          /* DOCUMENT FILE VIEW */
          <>
            {isPdf ? (
              <div style={{ width: '100%', height: '100%', minHeight: '440px', display: 'flex', flexDirection: 'column' }}>
                <iframe
                  src={activeSrc}
                  title={fileName || 'Original PDF Document'}
                  onLoad={() => setDocStatus('loaded')}
                  onError={handleMediaError}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '440px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#fff',
                  }}
                />
              </div>
            ) : (
              /* Image View */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                }}
              >
                {docStatus === 'loading' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                    <Loader2 size={36} className="spin" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '13px' }}>Loading document image...</span>
                  </div>
                )}

                {docStatus === 'error' ? (
                  <div
                    style={{
                      maxWidth: '420px',
                      padding: '28px 24px',
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '14px',
                      textAlign: 'center',
                    }}
                  >
                    <FileQuestion size={44} style={{ color: 'var(--warning)', margin: '0 auto 12px' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Document Image Unavailable
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '18px' }}>
                      The file <strong>"{fileName || 'document'}"</strong> is not present on the server storage.
                      All extracted biomarkers and clinical AI summaries remain intact.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {rawText && (
                        <button
                          type="button"
                          onClick={() => setViewMode('ocr')}
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '12px', display: 'inline-flex', gap: '6px', justifyContent: 'center' }}
                        >
                          <Code size={14} />
                          View Extracted OCR Text
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDocStatus('loading');
                          setCurrentUrlIndex(0);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '12px', display: 'inline-flex', gap: '6px', justifyContent: 'center' }}
                      >
                        <RotateCcw size={13} />
                        Retry Loading
                      </button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={activeSrc}
                    alt={fileName || 'Original Document'}
                    onLoad={() => setDocStatus('loaded')}
                    onError={handleMediaError}
                    style={{
                      display: docStatus === 'loaded' ? 'block' : 'none',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease',
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AdminPage = () => {
  const { user } = useAuth();
  const { language, t } = useApp();
  const navigate = useNavigate();

  const hasAccess =
    user &&
    user.email &&
    (user.email.trim().toLowerCase().includes('premkardani2006') ||
      user.email.trim().toLowerCase().includes('panchaldhyan007'));

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, scans, reports, diseases
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [scansList, setScansList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [diseasesList, setDiseasesList] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Detail state
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDoc, setShowReportDoc] = useState(false);
  const [showScanDoc, setShowScanDoc] = useState(false);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedReport(null);
        setSelectedScan(null);
        setSelectedUserDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset split-screen doc viewer when a new report modal is opened
  useEffect(() => {
    if (selectedReport) {
      setShowReportDoc(true); // Default to showing document view on selection
    } else {
      setShowReportDoc(false);
    }
  }, [selectedReport?._id ?? selectedReport?.id]);

  useEffect(() => {
    if (selectedScan) {
      setShowScanDoc(!!selectedScan.imageUrl);
    } else {
      setShowScanDoc(false);
    }
  }, [selectedScan?._id ?? selectedScan?.id]);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    fetchAdminData();
  }, [activeTab, hasAccess]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleUserSelect = async (userId) => {
    if (!userId) {
      alert('Invalid patient ID.');
      return;
    }
    setLoadingUserDetail(true);
    try {
      const res = await api.getAdminUserDetail(userId);
      if (res.success && res.data) {
        setSelectedUserDetail(res.data);
      } else {
        alert(res?.error || 'Failed to fetch detailed records.');
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch detailed records.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase =
      import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5001';
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (!hasAccess) {
    return (
      <div
        className="fade-in"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}
      >
        <div
          className="card"
          style={{ maxWidth: '440px', width: '100%', padding: '40px', textAlign: 'center', border: '1px solid var(--danger-glow)' }}
        >
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Security Clearance Required</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            This administrative portal is restricted to authorized MediScan network operators.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const KPICard = ({ title, value, icon: Icon, color, bg }) => (
    <div
      className="card col-3"
      style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s', cursor: 'default' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ background: bg, color: color, width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} />
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </p>
        <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', color: 'var(--text-primary)' }}>
          {value.toLocaleString()}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-primary">
              <Shield size={12} style={{ marginRight: '4px' }} /> Admin Authority
            </span>
          </div>
          <h1 className="page-title">Command Center</h1>
          <p className="body-text" style={{ marginTop: '8px' }}>
            System-wide analytics, user registries, and operational telemetry.
          </p>
        </div>
        <div
          className="card"
          role="status"
          aria-label="System status: Network operational"
          style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success-glow)' }}
        >
          <div aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success)' }}>Network Operational</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div role="tablist" style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', overflowX: 'auto' }}>
        {[
          { id: 'overview', name: 'Telemetry', icon: TrendingUp },
          { id: 'users', name: 'Patient Registry', icon: Users },
          { id: 'scans', name: 'Medicine Scans', icon: Camera },
          { id: 'reports', name: 'Lab Reports', icon: FileText },
          { id: 'diseases', name: 'Disease Queries', icon: Activity },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className="btn"
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                fontWeight: isActive ? '700' : '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
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
                  <h3 className="card-heading" style={{ marginBottom: '24px' }}>
                    <Server size={18} style={{ display: 'inline', marginRight: '8px' }} /> Registration Telemetry
                  </h3>
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
                  <h3 className="card-heading" style={{ marginBottom: '24px' }}>
                    <Fingerprint size={18} style={{ display: 'inline', marginRight: '8px' }} /> Recent Registrations
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.recentUsers.slice(0, 4).map((u) => (
                      <div
                        key={u._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px',
                          background: 'var(--bg-elevated)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.02)',
                        }}
                      >
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
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="form-control"
                    style={{ paddingLeft: '44px', height: '44px', borderRadius: '12px' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '12px', height: '44px' }}>
                  Search
                </button>
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
                          <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
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
                    {(activeTab === 'users'
                      ? usersList
                      : activeTab === 'scans'
                      ? scansList
                      : activeTab === 'reports'
                      ? reportsList
                      : diseasesList
                    ).map((item, idx) => (
                      <tr
                        key={item.id || item._id || idx}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Users Columns */}
                        {activeTab === 'users' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                              {item.name}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{maskEmail(item.email)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-dark)', marginTop: '2px' }}>{maskPhone(item.phone)}</div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span className={`badge ${item.oauthProvider === 'google' ? 'badge-success' : 'badge-primary'}`}>
                                {item.oauthProvider || 'Email'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {formatDate(item.createdAt)}
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleUserSelect(item.id)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                View Records
                              </button>
                            </td>
                          </>
                        )}

                        {/* Scans Columns */}
                        {activeTab === 'scans' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                              {item.userId?.name || 'Deleted'} <br />
                              <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>{maskEmail(item.userId?.email)}</span>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>
                              {item.medicineName}
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {item.activeIngredients
                                ? item.activeIngredients.length > 50
                                  ? `${item.activeIngredients.substring(0, 50)}...`
                                  : item.activeIngredients
                                : 'Unspecified'}
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {formatDate(item.createdAt)}
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => setSelectedScan(item)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 16px', fontSize: '12px', whiteSpace: 'nowrap', display: 'inline-flex', minWidth: '76px', justifyContent: 'center' }}
                              >
                                Details
                              </button>
                            </td>
                          </>
                        )}

                        {/* Reports Columns */}
                        {activeTab === 'reports' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                              {item.userId?.name || 'Deleted'} <br />
                              <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>{maskEmail(item.userId?.email)}</span>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--secondary)', fontSize: '14px' }}>
                              {item.fileName || 'Report'} <br />
                              <span className="badge badge-warning" style={{ marginTop: '4px', fontSize: '9px' }}>
                                {item.fileType}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {item.summary ? (item.summary.length > 50 ? `${item.summary.substring(0, 50)}...` : item.summary) : 'No summary'}
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {formatDate(item.createdAt)}
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setSelectedReport(item);
                                    setShowReportDoc(true);
                                  }}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                                >
                                  <Eye size={13} /> View Document
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Diseases Columns */}
                        {activeTab === 'diseases' && (
                          <>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                              {item.userId?.name || 'Deleted'} <br />
                              <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>{maskEmail(item.userId?.email)}</span>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--warning)', fontSize: '14px' }}>
                              {item.diseaseName}
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{item.query}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {formatDate(item.createdAt)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {(activeTab === 'users'
                      ? usersList
                      : activeTab === 'scans'
                      ? scansList
                      : activeTab === 'reports'
                      ? reportsList
                      : diseasesList
                    ).length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dark)' }}>
                          No records found in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Patient Details & Records (Portal to document.body)              */}
      {/* ========================================================================= */}
      {selectedUserDetail &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-modal-title"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100000,
              padding: '16px',
            }}
            onClick={() => setSelectedUserDetail(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: '840px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-elevated)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 id="patient-modal-title" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedUserDetail.user?.name || 'Patient Records'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      User ID: {selectedUserDetail.user?._id || selectedUserDetail.user?.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  aria-label="Close modal"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Patient Profile Card */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '18px 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                    Patient Identity & Authentication
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Full Name</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedUserDetail.user?.name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Email (Unmasked)</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedUserDetail.user?.email || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Phone</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedUserDetail.user?.phone || 'Not provided'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Gender / DOB</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {selectedUserDetail.user?.gender || 'Unspecified'}{' '}
                        {selectedUserDetail.user?.dateOfBirth ? `• ${selectedUserDetail.user.dateOfBirth}` : ''}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Auth Provider</span>
                      <span
                        className={`badge ${selectedUserDetail.user?.oauthProvider === 'google' ? 'badge-success' : 'badge-primary'}`}
                        style={{ marginTop: '2px' }}
                      >
                        {selectedUserDetail.user?.oauthProvider || 'Email'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Registration Date</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{formatDate(selectedUserDetail.user?.createdAt)}</strong>
                    </div>
                  </div>
                </div>

                {/* Medicine Scans */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Camera size={16} color="var(--success)" /> Medicine Scans ({selectedUserDetail.scans?.length || 0})
                  </h4>
                  {(!selectedUserDetail.scans || selectedUserDetail.scans.length === 0) ? (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-dark)', fontSize: '13px' }}>
                      No medicine scans recorded for this patient.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                      {selectedUserDetail.scans.map((scan) => (
                        <div
                          key={scan._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: 'var(--bg-elevated)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                              <Pill size={18} />
                            </div>
                            <div>
                              <h5 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>{scan.medicineName}</h5>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{scan.dosage || scan.activeIngredients || 'Scanned medicine'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedScan({ ...scan, userId: selectedUserDetail.user })}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lab Reports */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <FileText size={16} color="var(--secondary)" /> Lab Reports ({selectedUserDetail.reports?.length || 0})
                  </h4>
                  {(!selectedUserDetail.reports || selectedUserDetail.reports.length === 0) ? (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-dark)', fontSize: '13px' }}>
                      No lab reports analyzed for this patient.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                      {selectedUserDetail.reports.map((report) => (
                        <div
                          key={report._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: 'var(--bg-elevated)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                              <FileText size={18} />
                            </div>
                            <div>
                              <h5 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)', margin: 0 }}>{report.fileName || 'Diagnostic Report'}</h5>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{report.summary ? report.summary.slice(0, 45) + '...' : 'No summary'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedReport({ ...report, userId: selectedUserDetail.user });
                              setShowReportDoc(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-elevated)', flexShrink: 0 }}>
                <button onClick={() => setSelectedUserDetail(null)} className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL 2: Medicine Scan Details (Portal to document.body)                  */}
      {/* ========================================================================= */}
      {selectedScan &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-modal-title"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100000,
              padding: '16px',
            }}
            onClick={() => setSelectedScan(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: showScanDoc ? 'min(96vw, 1280px)' : 'min(92vw, 760px)',
                width: '100%',
                maxHeight: '90vh',
                height: showScanDoc ? '88vh' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
                transition: 'max-width 0.25s ease, height 0.25s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-elevated)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 id="scan-modal-title" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedScan.medicineName || 'Medicine Scan Details'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Patient: {selectedScan.userId?.name || 'Unknown'} ({selectedScan.userId?.email || 'N/A'})
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selectedScan.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setShowScanDoc((prev) => !prev)}
                      className={showScanDoc ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {showScanDoc ? <><EyeOff size={14} /> Hide Image</> : <><Eye size={14} /> Show Image</>}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedScan(null)}
                    aria-label="Close modal"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body: Split view if image is open */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minHeight: 0 }}>
                {showScanDoc && selectedScan.imageUrl && (
                  <div style={{ flex: '1 1 50%', width: '50%', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
                    <AdminDocumentViewer
                      fileUrl={selectedScan.imageUrl}
                      fileName={selectedScan.medicineName || 'medicine-scan'}
                      fileType="image"
                      rawText={selectedScan.rawOcrText}
                    />
                  </div>
                )}

                <div style={{ flex: showScanDoc ? '1 1 50%' : '1 1 100%', width: showScanDoc ? '50%' : '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Clinical Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--bg-elevated)', padding: '18px 20px', borderRadius: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dark)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Medicine Name</span>
                      <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>{selectedScan.medicineName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Active Ingredients</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedScan.activeIngredients || 'Unspecified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Dosage & Form</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {selectedScan.dosage || 'N/A'} {selectedScan.dosageForm ? `(${selectedScan.dosageForm})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Category</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedScan.category || 'Medication'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Manufacturer</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedScan.manufacturer || 'Unspecified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dark)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Scan Timestamp</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{formatDate(selectedScan.createdAt)}</strong>
                    </div>
                  </div>

                  {selectedScan.usageInstructions && (
                    <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)', marginBottom: '6px' }}>Usage Instructions</h5>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{selectedScan.usageInstructions}</p>
                    </div>
                  )}

                  {selectedScan.purposeAndUses && (
                    <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                      <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '6px' }}>Purpose & Uses</h5>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{selectedScan.purposeAndUses}</p>
                    </div>
                  )}

                  {selectedScan.sideEffects && (
                    <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warning)', marginBottom: '6px' }}>Side Effects</h5>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{selectedScan.sideEffects}</p>
                    </div>
                  )}

                  {selectedScan.warnings && (
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)', marginBottom: '6px' }}>Warnings & Precautions</h5>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                        {selectedScan.warnings} {selectedScan.precautions ? `• ${selectedScan.precautions}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-elevated)', flexShrink: 0 }}>
                <button onClick={() => setSelectedScan(null)} className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL 3: Lab Report Details with Document Viewer (Portal to document.body)*/}
      {/* ========================================================================= */}
      {selectedReport &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100000,
              padding: '16px',
            }}
            onClick={() => {
              setSelectedReport(null);
              setShowReportDoc(false);
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: showReportDoc ? 'min(96vw, 1360px)' : 'min(92vw, 840px)',
                width: '100%',
                height: showReportDoc ? '88vh' : 'auto',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
                transition: 'max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-elevated)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      color: 'var(--secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      id="report-modal-title"
                      style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedReport.fileName || 'Diagnostic Lab Report'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Patient: {selectedReport.userId?.name || 'Unknown'} ({selectedReport.userId?.email || 'N/A'})
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {selectedReport.fileUrl && (
                    <button
                      type="button"
                      onClick={() => setShowReportDoc((prev) => !prev)}
                      className={showReportDoc ? 'btn btn-secondary' : 'btn btn-primary'}
                      style={{ padding: '7px 16px', fontSize: '12px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {showReportDoc ? (
                        <>
                          <EyeOff size={14} /> Hide Document
                        </>
                      ) : (
                        <>
                          <Eye size={14} /> Show Document
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(null);
                      setShowReportDoc(false);
                    }}
                    aria-label="Close modal"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Split Screen Container */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  overflow: 'hidden',
                  minHeight: 0,
                }}
              >
                {/* LEFT HALF SCREEN: Original Document View */}
                {showReportDoc && selectedReport.fileUrl && (
                  <div
                    style={{
                      flex: '1 1 50%',
                      width: '50%',
                      minWidth: '320px',
                      borderRight: '1px solid rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    <AdminDocumentViewer
                      fileUrl={selectedReport.fileUrl}
                      fileName={selectedReport.fileName || 'lab-report'}
                      fileType={selectedReport.fileType}
                      rawText={selectedReport.rawText}
                    />
                  </div>
                )}

                {/* RIGHT HALF SCREEN (Diagnostic Details) */}
                <div
                  style={{
                    flex: showReportDoc ? '1 1 50%' : '1 1 100%',
                    width: showReportDoc ? '50%' : '100%',
                    padding: '24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  {/* Meta Header Box */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-elevated)',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span className="badge badge-warning" style={{ fontSize: '11px', textTransform: 'uppercase', marginRight: '8px' }}>
                        {selectedReport.fileType || 'Document'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Uploaded: {formatDate(selectedReport.createdAt)}
                      </span>
                    </div>

                    {!showReportDoc && selectedReport.fileUrl && (
                      <button
                        type="button"
                        onClick={() => setShowReportDoc(true)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', gap: '6px' }}
                      >
                        <Eye size={13} /> Split Screen View
                      </button>
                    )}
                  </div>

                  {/* Diagnostic AI Summary */}
                  <div>
                    <h4
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '8px',
                      }}
                    >
                      Diagnostic AI Summary
                    </h4>
                    <div
                      style={{
                        padding: '16px',
                        background: 'var(--bg-elevated)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {selectedReport.summary || 'No diagnostic summary generated for this report.'}
                    </div>
                  </div>

                  {/* Key Findings / Lab Results Table */}
                  {((selectedReport.keyFindings && selectedReport.keyFindings.length > 0) ||
                    (selectedReport.labResults && selectedReport.labResults.length > 0)) && (
                    <div>
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '12px',
                        }}
                      >
                        Extracted Biomarkers & Test Results
                      </h4>
                      <div className="card table-responsive" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)' }}>Test / Biomarker</th>
                              <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)' }}>Observed Value</th>
                              <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)' }}>Reference Range</th>
                              <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedReport.labResults && selectedReport.labResults.length > 0
                              ? selectedReport.labResults
                              : selectedReport.keyFindings
                            ).map((kf, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '10px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>{kf.test}</td>
                                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                                  {kf.value} {kf.unit || ''}
                                </td>
                                <td style={{ padding: '10px 16px', color: 'var(--text-dark)' }}>{kf.referenceRange || 'Standard'}</td>
                                <td style={{ padding: '10px 16px' }}>
                                  <span
                                    className={`badge ${
                                      kf.status?.toLowerCase().includes('abnormal') ||
                                      kf.status?.toLowerCase().includes('high') ||
                                      kf.status?.toLowerCase().includes('low')
                                        ? 'badge-danger'
                                        : 'badge-success'
                                    }`}
                                  >
                                    {kf.status || 'Normal'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Patient Explanation / Recommendations */}
                  {selectedReport.patientExplanation && (
                    <div
                      style={{
                        padding: '16px',
                        background: 'rgba(139, 92, 246, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      <h5 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
                        Patient-Friendly Clinical Interpretation
                      </h5>
                      {selectedReport.patientExplanation.overallStatus && (
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                          <strong>Status:</strong> {selectedReport.patientExplanation.overallStatus}
                        </p>
                      )}
                      {selectedReport.patientExplanation.recommendedTreatment &&
                        selectedReport.patientExplanation.recommendedTreatment.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Recommended Actions:
                            </span>
                            <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {selectedReport.patientExplanation.recommendedTreatment.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}

                  {selectedReport.criticalAlerts && selectedReport.criticalAlerts.length > 0 && (
                    <div
                      style={{
                        padding: '16px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '12px',
                        border: '1px solid var(--danger-glow)',
                      }}
                    >
                      <h5 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={16} /> Critical Alerts
                      </h5>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {selectedReport.criticalAlerts.map((alert, idx) => (
                          <li key={idx}>{typeof alert === 'string' ? alert : alert.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-elevated)',
                  flexShrink: 0,
                }}
              >
                <div>
                  {selectedReport.fileUrl && (
                    <button
                      type="button"
                      onClick={() => setShowReportDoc((prev) => !prev)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {showReportDoc ? (
                        <>
                          <EyeOff size={14} /> Hide Document View
                        </>
                      ) : (
                        <>
                          <Eye size={14} /> Split View with Document
                        </>
                      )}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    setShowReportDoc(false);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 24px', fontSize: '13px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default AdminPage;
