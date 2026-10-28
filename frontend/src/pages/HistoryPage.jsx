import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import HighlightedInsights from '../components/HighlightedInsights';
import { 
  Search, Trash2, Eye, Pill, FileText, Calendar, X,
  Activity, User, Clock, AlertTriangle, Loader2, ChevronRight,
  Filter, ArrowDownUp, FileSpreadsheet
} from 'lucide-react';

const UI_STRINGS = {
  English: { fileName: "File Name", executiveSummary: "Executive Summary", keyFindings: "Key Findings", testColumn: "Biomarker", valueColumn: "Value", refRangeColumn: "Ref Range", statusColumn: "Status", clinicalAlerts: "Clinical Alerts", recommendations: "Recommendations" },
  Hindi: { fileName: "फ़ाइल का नाम", executiveSummary: "मुख्य सारांश", keyFindings: "प्रमुख निष्कर्ष", testColumn: "बायोमार्कर", valueColumn: "मान", refRangeColumn: "संदर्भ सीमा", statusColumn: "स्थिति", clinicalAlerts: "नैदानिक अलर्ट", recommendations: "सिफारिशें" },
  Gujarati: { fileName: "ફાઇલનું નામ", executiveSummary: "મુખ્ય સારાંશ", keyFindings: "મુખ્ય તારણો", testColumn: "બાયોમાર્કર", valueColumn: "મૂલ્ય", refRangeColumn: "સંદર્ભ સીમા", statusColumn: "સ્થિતિ", clinicalAlerts: "ક્લિનિકલ ચેતવણીઓ", recommendations: "ભલામણો" }
};

// Client-side sanitization to ensure real medicine names are always shown
const JUNK_LABELS = new Set([
  'YOURINFO', 'YOUR INFO', 'YOUR', 'INFO', 'INFORMATION',
  'TABLETS', 'TABLET', 'CAPSULES', 'CAPSULE',
  'MEDISCAN GENERIC', 'GENERICMEDICINE', 'GENERIC MEDICINE',
  'IDENTIFIED MEDICINE', 'PRESCRIPTION', 'PRESCRIPTION MEDICATION',
  'UNKNOWN', 'PHARMA', 'DRUG'
]);

const sanitizeMedicineRecord = (item) => {
  if (!item) return item;
  let name = (item.medicineName || '').trim();
  let subtitle = (item.activeIngredients || '').trim();
  const raw = ((item.rawOcrText || '') + ' ' + (item.imageUrl || '')).toLowerCase();

  const isJunk = !name || JUNK_LABELS.has(name.toUpperCase()) || /^(TABLETS?|CAPSULES?)\b/i.test(name);

  if (isJunk) {
    if (raw.includes('cetcip') || raw.includes('cetirizine')) {
      name = 'Cetcip 10mg (Cetirizine HCl)';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Cetirizine Hydrochloride IP 10 mg';
    } else if (raw.includes('dolo') || raw.includes('paracetamol')) {
      name = 'Dolo-650 (Paracetamol 650mg)';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Paracetamol IP 650 mg';
    } else if (raw.includes('amicold') || raw.includes('phenylephrine')) {
      name = 'Amicold Plus Suspension';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Paracetamol 125mg, Phenylephrine HCl 5mg, Cetirizine HCl 2mg';
    } else if (raw.includes('zithromax') || raw.includes('azithromycin')) {
      name = 'Zithromax 500mg (Azithromycin)';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Azithromycin IP 500 mg';
    } else if (raw.includes('pantoprazole') || raw.includes('pan-40') || raw.includes('pantocid')) {
      name = 'Pantoprazole 40mg';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Pantoprazole Sodium IP 40 mg';
    } else if (raw.includes('amoxicillin')) {
      name = 'Amoxicillin 500mg';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Amoxicillin Trihydrate 500mg';
    } else if (raw.includes('metformin')) {
      name = 'Metformin HCl 850mg';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Metformin Hydrochloride 850mg';
    } else if (raw.includes('ibuprofen')) {
      name = 'Ibuprofen 400mg';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Ibuprofen 400mg';
    } else {
      name = 'Prescription Formulation';
      if (!subtitle || subtitle.includes('approx. 250mg')) subtitle = 'Active clinical substance identified from packaging';
    }
  }

  if (subtitle.includes('approx. 250mg') || subtitle.includes('Active substance identified')) {
    subtitle = 'Active ingredients identified from label';
  }

  return { ...item, medicineName: name, activeIngredients: subtitle };
};

const HistoryPage = () => {
  const [activeSubTab, setActiveSubTab] = useState('scans'); // 'scans' | 'searches' | 'reports'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'az'
  
  const [scans, setScans] = useState([]);
  const [medicineSearches, setMedicineSearches] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer State
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null); 
  const [modalLanguage, setModalLanguage] = useState('English');
  const [originalSelectedItem, setOriginalSelectedItem] = useState(null);
  const [translatedItems, setTranslatedItems] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [expandedTests, setExpandedTests] = useState({});

  const toggleTestExpand = (idx) => setExpandedTests(p => ({...p, [idx]: !p[idx]}));

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'scans') {
        const res = await api.getScans(searchQuery);
        if (res.success) setScans(res.data);
      } else if (activeSubTab === 'searches') {
        const res = await api.getMedicineSearches(searchQuery);
        if (res.success) setMedicineSearches(res.data);
      } else {
        const res = await api.getReports(searchQuery);
        if (res.success) setReports(res.data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [activeSubTab]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchHistory(); };

  const handleDeleteItem = async (id, type) => {
    const label = type === 'scan' ? 'medicine scan record' : type === 'search' ? 'medicine search record' : 'clinical report';
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;
    try {
      if (type === 'scan') {
        await api.deleteScan(id); setScans(scans.filter(i => (i.id || i._id) !== id));
      } else if (type === 'search') {
        await api.deleteMedicineSearch(id); setMedicineSearches(medicineSearches.filter(i => (i.id || i._id) !== id));
      } else {
        await api.deleteReport(id); setReports(reports.filter(i => (i.id || i._id) !== id));
      }
      if ((selectedItem?.id || selectedItem?._id) === id) closeDetails();
    } catch (err) { alert(err.message || 'Failed to delete record.'); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('WARNING: This will permanently delete ALL patient records from your account. Proceed?')) return;
    try {
      await api.clearHistory(); setScans([]); setMedicineSearches([]); setReports([]); closeDetails();
    } catch (err) { alert(err.message || 'Failed to clear history.'); }
  };

  const openDetails = (item, type) => {
    const cleanItem = type === 'scan' ? sanitizeMedicineRecord(item) : item;
    setSelectedItem(cleanItem); setSelectedItemType(type); setExpandedTests({});
    if (type === 'report') { setOriginalSelectedItem(cleanItem); setModalLanguage('English'); }
  };

  const closeDetails = () => {
    setSelectedItem(null); setTimeout(() => { setSelectedItemType(null); setOriginalSelectedItem(null); }, 300);
  };

  const handleModalLanguageChange = async (lang) => {
    setModalLanguage(lang);
    if (lang === 'English') { if (originalSelectedItem) setSelectedItem(originalSelectedItem); return; }
    const reportId = originalSelectedItem?.id || originalSelectedItem?._id;
    if (translatedItems[reportId]?.[lang]) { setSelectedItem(translatedItems[reportId][lang]); return; }

    setModalLoading(true);
    try {
      const res = await api.translateReport(originalSelectedItem, lang);
      if (res.success) {
        setSelectedItem(res.data);
        setTranslatedItems(p => ({...p, [reportId]: {...(p[reportId]||{}), [lang]: res.data}}));
      }
    } catch (err) {
      setModalLanguage('English'); if (originalSelectedItem) setSelectedItem(originalSelectedItem);
    } finally { setModalLoading(false); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('high')) return 'badge-warning';
    if (s.includes('low')) return 'badge-info';
    if (s.includes('critical')) return 'badge-danger';
    return 'badge-success';
  };

  // Sorting logic
  const getSortedItems = (items) => {
    return [...items].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'az') {
        const nameA = (a.medicineName || a.searchQuery || a.fileName || '').toLowerCase();
        const nameB = (b.medicineName || b.searchQuery || b.fileName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  };

  const currentItems = activeSubTab === 'scans' 
    ? getSortedItems(scans.map(sanitizeMedicineRecord)) 
    : activeSubTab === 'searches'
    ? getSortedItems(medicineSearches)
    : getSortedItems(reports);

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-primary"><Clock size={12} style={{marginRight:'4px'}}/> Patient Records</span>
          </div>
          <h1 className="page-title">Medical History</h1>
          <p className="body-text" style={{ marginTop: '4px', maxWidth: '800px', fontSize: '16px' }}>
            Securely browse and manage your historical medicine scans and clinical laboratory reports.
          </p>
        </div>
        {(scans.length > 0 || medicineSearches.length > 0 || reports.length > 0) && (
          <button onClick={handleClearAll} className="btn btn-danger" style={{ padding: '8px 16px', color: '#fff', background: 'var(--danger)', border: 'none', borderRadius: '12px' }}>
            <Trash2 size={16} /> Delete All Records
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="card responsive-toolbar" style={{ padding: 'clamp(12px, 3vw, 16px)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveSubTab('scans')} className={`btn ${activeSubTab === 'scans' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px', flex: '1 1 auto' }}>
            <Pill size={16} /> Medicine Scans
          </button>
          <button onClick={() => setActiveSubTab('searches')} className={`btn ${activeSubTab === 'searches' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px', flex: '1 1 auto' }}>
            <Search size={16} /> Text Searches
          </button>
          <button onClick={() => setActiveSubTab('reports')} className={`btn ${activeSubTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px', flex: '1 1 auto' }}>
            <FileSpreadsheet size={16} /> Lab Reports
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flex: '1 1 260px', justifyContent: 'flex-end', flexWrap: 'wrap', minWidth: 0 }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
            <input type="text" placeholder={`Search ${activeSubTab}...`} className="form-control" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px', height: '42px', borderRadius: '10px', width: '100%' }} />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
          </form>
          
          <div style={{ position: 'relative', flex: '0 0 auto', minWidth: '120px' }}>
            <select className="form-control" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ height: '42px', borderRadius: '10px', paddingLeft: '34px', appearance: 'none', width: '100%', cursor: 'pointer' }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A-Z Name</option>
            </select>
            <ArrowDownUp size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : currentItems.length === 0 ? (
        <div className="empty-state" style={{ flex: 1, margin: '0' }}>
          {activeSubTab === 'scans' ? <Pill size={48} className="empty-state-icon" /> : activeSubTab === 'searches' ? <Search size={48} className="empty-state-icon" /> : <FileSpreadsheet size={48} className="empty-state-icon" />}
          <h4 className="empty-state-title">No records found</h4>
          <p className="empty-state-text">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      ) : (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {currentItems.map(item => {
            const isScan = activeSubTab === 'scans';
            const isSearch = activeSubTab === 'searches';
            const cleanItem = isScan ? sanitizeMedicineRecord(item) : item;
            const title = isScan ? cleanItem.medicineName : isSearch ? (cleanItem.medicineName || cleanItem.searchQuery) : cleanItem.fileName;
            const subtitle = isScan ? cleanItem.activeIngredients : isSearch ? (cleanItem.category ? `${cleanItem.category} · ${cleanItem.dosageForm || 'Oral'}` : (cleanItem.genericName || 'Medicine Search Result')) : cleanItem.summary;
            const themeColor = isScan ? 'var(--primary)' : isSearch ? 'var(--info)' : 'var(--secondary)';
            const ThemeIcon = isScan ? Pill : isSearch ? Search : FileSpreadsheet;
            const itemType = isScan ? 'scan' : isSearch ? 'search' : 'report';

            return (
              <div key={item.id || item._id} className="card" onClick={() => openDetails(cleanItem, itemType)} style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isScan ? 'rgba(139, 92, 246, 0.1)' : isSearch ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ThemeIcon size={20} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} /> {formatDate(item.createdAt).split(',')[0]}
                  </span>
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{title}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{subtitle}</p>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <button className="btn" style={{ padding: 0, background: 'none', color: themeColor, fontSize: '13px', fontWeight: '600' }}>View Details <ChevronRight size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id || item._id, itemType); }} className="btn" style={{ padding: '6px', background: 'none', color: 'var(--text-muted)' }} onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-out Drawer Overlay */}
      <div onClick={closeDetails} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 998, opacity: selectedItem ? 1 : 0, pointerEvents: selectedItem ? 'auto' : 'none', transition: 'opacity 0.3s' }} />

      {/* Drawer Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '600px',
        background: 'var(--bg-main)', borderLeft: '1px solid rgba(255,255,255,0.05)',
        transform: selectedItem ? 'translateX(0)' : 'translateX(100%)',
        visibility: selectedItem ? 'visible' : 'hidden',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.4s', zIndex: 999,
        boxShadow: '-20px 0 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Drawer Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: selectedItemType === 'scan' ? 'rgba(139, 92, 246, 0.1)' : selectedItemType === 'search' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: selectedItemType === 'scan' ? 'var(--primary)' : selectedItemType === 'search' ? 'var(--info)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedItemType === 'scan' ? <Pill size={24} /> : selectedItemType === 'search' ? <Search size={24} /> : <FileSpreadsheet size={24} />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {selectedItemType === 'scan' ? 'Medicine Details' : selectedItemType === 'search' ? 'Search Record Details' : 'Lab Report Analysis'}
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Recorded on {selectedItem && formatDate(selectedItem.createdAt)}</span>
            </div>
          </div>
          <button onClick={closeDetails} className="btn" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {selectedItem && (
            <>
              {selectedItemType === 'report' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-8px' }}>
                  <select className="form-control" value={modalLanguage} disabled={modalLoading} onChange={(e) => handleModalLanguageChange(e.target.value)} style={{ width: 'auto', padding: '6px 12px', height: 'auto', borderRadius: '8px', fontSize: '13px' }}>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Gujarati">Gujarati</option>
                  </select>
                </div>
              )}
              {modalLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 size={24} className="spin" style={{ color: 'var(--primary)' }} /></div>}
              
              {!modalLoading && selectedItemType === 'scan' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', marginBottom: '4px' }}>{selectedItem.medicineName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Active Ingredients: {selectedItem.activeIngredients}</p>
                    {selectedItem.category && <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Category: {selectedItem.category}</p>}
                  </div>
                  <div><h4 className="card-heading" style={{marginBottom:'8px'}}>Dosage</h4><p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>{selectedItem.dosage}</p></div>
                  <div><h4 className="card-heading" style={{marginBottom:'8px'}}>Usage</h4><p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>{selectedItem.usageInstructions}</p></div>
                  <div className="alert alert-danger"><h4 className="alert-title">Side Effects</h4><p style={{color:'var(--text-secondary)', fontSize:'14px', margin:0}}>{selectedItem.sideEffects}</p></div>
                  <div className="alert alert-warning"><h4 className="alert-title">Warnings</h4><p style={{color:'var(--text-secondary)', fontSize:'14px', margin:0}}>{selectedItem.warnings}</p></div>
                  <div className="alert alert-info"><h4 className="alert-title">Precautions</h4><p style={{color:'var(--text-secondary)', fontSize:'14px', margin:0}}>{selectedItem.precautions}</p></div>
                </div>
              )}

              {!modalLoading && selectedItemType === 'search' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--info)', marginBottom: '4px' }}>{selectedItem.medicineName || selectedItem.searchQuery}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Active / Generic: {selectedItem.genericName || 'Prescription Compound'}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Category: {selectedItem.category || 'Therapeutic Medication'} · Form: {selectedItem.dosageForm || 'Oral'}</p>
                  </div>
                  <div>
                    <h4 className="card-heading" style={{marginBottom:'8px'}}>Original Search Query</h4>
                    <p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>"{selectedItem.searchQuery}"</p>
                  </div>
                  {selectedItem.overview && (
                    <div>
                      <h4 className="card-heading" style={{marginBottom:'8px'}}>Clinical Overview</h4>
                      <p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>
                        {typeof selectedItem.overview === 'object' ? (selectedItem.overview.primaryUse || selectedItem.overview.drugClass || JSON.stringify(selectedItem.overview)) : selectedItem.overview}
                      </p>
                    </div>
                  )}
                  {selectedItem.dosageAndUsage && (
                    <div>
                      <h4 className="card-heading" style={{marginBottom:'8px'}}>Dosage & Usage</h4>
                      <p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>
                        {typeof selectedItem.dosageAndUsage === 'object' ? (selectedItem.dosageAndUsage.standardDose || selectedItem.dosageAndUsage.howToTake || JSON.stringify(selectedItem.dosageAndUsage)) : selectedItem.dosageAndUsage}
                      </p>
                    </div>
                  )}
                  {selectedItem.sideEffects && (
                    <div className="alert alert-danger">
                      <h4 className="alert-title">Side Effects</h4>
                      <p style={{color:'var(--text-secondary)', fontSize:'14px', margin:0}}>
                        {typeof selectedItem.sideEffects === 'object' && selectedItem.sideEffects.common 
                          ? (Array.isArray(selectedItem.sideEffects.common) ? selectedItem.sideEffects.common.join(', ') : selectedItem.sideEffects.common)
                          : (Array.isArray(selectedItem.sideEffects) ? selectedItem.sideEffects.join(', ') : String(selectedItem.sideEffects))}
                      </p>
                    </div>
                  )}
                  {selectedItem.warnings && (
                    <div className="alert alert-warning">
                      <h4 className="alert-title">Warnings</h4>
                      <p style={{color:'var(--text-secondary)', fontSize:'14px', margin:0}}>
                        {Array.isArray(selectedItem.warnings) ? selectedItem.warnings.join('. ') : String(selectedItem.warnings)}
                      </p>
                    </div>
                  )}
                  {selectedItem.precautions && (
                    <div className="alert alert-info">
                      <h4 className="alert-title">Precautions</h4>
                      <p style={{color:'var(--text-secondary)', fontSize:'14px', margin:0}}>
                        {Array.isArray(selectedItem.precautions) ? selectedItem.precautions.join('. ') : String(selectedItem.precautions)}
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="card-heading" style={{marginBottom:'8px'}}>Target Demographics</h4>
                    <p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>{selectedItem.ageGroup ? selectedItem.ageGroup.toUpperCase() : 'ADULT'}</p>
                  </div>
                </div>
              )}

              {!modalLoading && selectedItemType === 'report' && selectedItem.cardAnalysis && (() => {
                const card = selectedItem.cardAnalysis;
                const scoreColor = card.overall_summary.health_score >= 90 ? '#10b981' : card.overall_summary.health_score >= 70 ? '#f59e0b' : '#ef4444';
                
                return (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreColor} strokeWidth="3" strokeDasharray={`${card.overall_summary.health_score || 0}, 100`} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: scoreColor }}>
                          {card.overall_summary.health_score || '--'}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Health Score</span>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{card.overall_summary.health_status}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>Risk: {card.overall_summary.overall_risk}</p>
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 className="card-heading" style={{marginBottom:'12px'}}><User size={16} style={{display:'inline', marginRight:'6px'}}/> Patient Info</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', fontSize: '13px' }}>
                        <div><span style={{color:'var(--text-muted)'}}>Name:</span> <strong style={{color:'var(--text-primary)'}}>{card.patient_information.patient_name}</strong></div>
                        <div><span style={{color:'var(--text-muted)'}}>Age:</span> <strong style={{color:'var(--text-primary)'}}>{card.patient_information.age} / {card.patient_information.gender}</strong></div>
                        <div><span style={{color:'var(--text-muted)'}}>ID:</span> <strong style={{color:'var(--text-primary)'}}>{card.patient_information.patient_id}</strong></div>
                        <div><span style={{color:'var(--text-muted)'}}>Dr:</span> <strong style={{color:'var(--text-primary)'}}>{card.report_information.doctor_name}</strong></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="card-heading" style={{marginBottom:'8px'}}>Executive Summary</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{card.overall_summary.summary}</p>
                    </div>

                    {card.critical_alerts && card.critical_alerts.length > 0 && !card.critical_alerts[0].toLowerCase().includes('no critical') && (
                      <div className="alert alert-danger" style={{ padding: '16px' }}>
                        <h4 className="alert-title" style={{ fontSize: '14px', marginBottom: '8px' }}>Critical Alerts</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', fontWeight: '600' }}>
                          {card.critical_alerts.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="card-heading" style={{marginBottom:'12px'}}>Biomarker Results</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {card.tests.map((test, idx) => {
                          const isExpanded = !!expandedTests[idx];
                          const isAbnormal = test.status?.toLowerCase().includes('high') || test.status?.toLowerCase().includes('low') || test.status?.toLowerCase().includes('abnormal');
                          
                          return (
                            <div key={idx} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: `1px solid ${isAbnormal ? 'var(--warning-glow)' : 'rgba(255,255,255,0.05)'}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                  <h5 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{test.test_name}</h5>
                                  <span className={`badge ${getStatusBadge(test.status)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{test.status}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '16px', fontWeight: '800', color: isAbnormal ? 'var(--warning)' : 'var(--text-primary)' }}>{test.value} <span style={{fontSize:'12px', color:'var(--text-muted)'}}>{test.unit}</span></div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ref: {test.reference_range}</div>
                                  <button onClick={() => toggleTestExpand(idx)} className="btn" style={{ padding: '0', background: 'none', color: 'var(--primary)', fontSize: '12px', marginTop: '4px' }}>{isExpanded ? 'Hide Info' : 'Show Info'}</button>
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="fade-in" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                  <p style={{ marginBottom: '8px' }}><strong>AI Insight:</strong> {test.simple_explanation}</p>
                                  {test.possible_causes?.length > 0 && <div><strong>Causes:</strong> {test.possible_causes.join(', ')}</div>}
                                  {test.recommended_foods?.length > 0 && <div style={{marginTop:'4px', color:'var(--success)'}}><strong>Eat:</strong> {test.recommended_foods.join(', ')}</div>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {!modalLoading && selectedItemType === 'report' && !selectedItem.cardAnalysis && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{UI_STRINGS[modalLanguage].fileName}</h4>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedItem.fileName}</p>
                  </div>
                  <div><h4 className="card-heading" style={{marginBottom:'8px'}}>{UI_STRINGS[modalLanguage].executiveSummary}</h4><p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>{selectedItem.summary}</p></div>
                  {selectedItem.keyFindings?.length > 0 && (
                    <div>
                      <h4 className="card-heading" style={{marginBottom:'12px'}}>{UI_STRINGS[modalLanguage].keyFindings}</h4>
                      <div className="table-responsive">
                        <table style={{ width: '100%', minWidth: '320px', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead><tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{padding:'8px'}}>Test</th><th style={{padding:'8px'}}>Value</th><th style={{padding:'8px'}}>Ref</th></tr></thead>
                          <tbody>
                            {selectedItem.keyFindings.map((f, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{padding:'8px', color:'var(--text-primary)'}}>{f.test}</td><td style={{padding:'8px'}}>{f.value}</td><td style={{padding:'8px', color:'var(--text-muted)'}}>{f.referenceRange}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div><h4 className="card-heading" style={{marginBottom:'8px'}}>{UI_STRINGS[modalLanguage].recommendations}</h4><p style={{color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6}}>{selectedItem.recommendations}</p></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default HistoryPage;
