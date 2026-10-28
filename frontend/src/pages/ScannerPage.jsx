import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { 
  Upload, Camera, Pill, FileCheck,
  Sparkles, Loader2, AlertOctagon,
  ShieldAlert, Clock, Building, X, Search, CheckCircle2, AlertTriangle
} from 'lucide-react';

const PRESET_MEDICINES = [
  {
    id: 'amoxicillin', name: 'Amoxicillin 500mg', category: 'Antibiotic',
    labelText: 'AMOXICILLIN 500mg CAPSULES - GSK Pharma. Take 1 capsule every 8 hours.'
  },
  {
    id: 'metformin', name: 'Metformin 850mg', category: 'Diabetes',
    labelText: 'METFORMIN HYDROCHLORIDE 850mg. Take 1 tablet twice daily with meals.'
  }
];

const generatePresetImageFile = (preset) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0B0D1C'; ctx.fillRect(0, 0, 600, 400);
    ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, 560, 360);
    ctx.fillStyle = '#8B5CF6'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(preset.name, 40, 60);
    ctx.fillStyle = '#A8AEC7'; ctx.font = '16px monospace'; ctx.fillText(preset.labelText, 40, 100);
    canvas.toBlob((blob) => {
      resolve({ file: new File([blob], `${preset.id}.jpg`, { type: 'image/jpeg' }), dataUrl: canvas.toDataURL('image/jpeg') });
    }, 'image/jpeg', 0.95);
  });
};

const LoadingChecklist = ({ progress }) => {
  const steps = [
    { label: 'Image uploaded securely', threshold: 15 },
    { label: 'OCR text extracted', threshold: 40 },
    { label: 'Medicine identified via AI', threshold: 65 },
    { label: 'Cross-referencing clinical data', threshold: 85 },
    { label: 'Preparing safety summary', threshold: 95 }
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(11, 13, 28, 0.9)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20
    }}>
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Analyzing Medicine</h3>
        </div>
        
        {steps.map((step, idx) => {
          const isDone = progress >= step.threshold;
          const isActive = !isDone && (idx === 0 || progress >= steps[idx - 1].threshold);
          
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isDone || isActive ? 1 : 0.4, transition: 'opacity 0.3s' }}>
              {isDone ? (
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              ) : isActive ? (
                <Loader2 size={18} className="spin" style={{ color: 'var(--primary)' }} />
              ) : (
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500', color: isDone ? 'var(--text-secondary)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                {step.label}
              </span>
            </div>
          );
        })}

        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-blue))', transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
};

const ScannerPage = () => {
  const { t, language } = useApp();
  const [scanMode, setScanMode] = useState('image');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // ── Manual name-search state ─────────────────────────────────────────────
  const [nameQuery, setNameQuery] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameResult, setNameResult] = useState(null);
  const [nameError, setNameError] = useState('');
  const [nameTab, setNameTab] = useState('overview');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => stopCameraStream(), []);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(''); setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError('Unable to access device camera. Please upload an image instead.');
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    setIsCameraOpen(false);
  };

  const captureCameraFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current; const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setSelectedFile(new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' }));
          setImagePreview(canvas.toDataURL('image/jpeg'));
          stopCameraStream();
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return setError('Please select an image first.');
    setError(''); setLoading(true); setScanProgress(15);
    const formData = new FormData(); formData.append('image', selectedFile);

    let progress = 15;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 95) progress = 95;
      setScanProgress(progress);
    }, 800);

    try {
      const res = await api.scanMedicine(formData);
      clearInterval(progressInterval); setScanProgress(100);
      setTimeout(() => {
        if (res.success) { setResult(res.data); setActiveTab('overview'); }
        else setError(res.error || 'Failed to analyze medicine.');
        setLoading(false); setScanProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval); setLoading(false); setScanProgress(0);
      setError('Unable to load this information. Please check your connection and try again.');
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setResult(null);
    setError('');
  };

  // ── Manual name-search handlers ──────────────────────────────────────────
  const handleNameSearch = async (e) => {
    e.preventDefault();
    const trimmed = nameQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      return setNameError('Please enter at least 2 characters to search.');
    }
    setNameError('');
    setNameResult(null);
    setNameLoading(true);
    setNameTab('overview');
    try {
      const res = await api.searchMedicineByName(trimmed, language || 'en', 'adult', null);
      if (res.success) {
        setNameResult(res.data);

        // Store to local medicine searches cache so Medical History immediately displays it
        try {
          const newEntry = {
            id: 'search_' + Date.now(),
            searchQuery: trimmed,
            medicineName: res.data.medicineName || trimmed,
            genericName: res.data.genericName || res.data.activeIngredient || '',
            category: res.data.category || res.data.overview?.drugClass || 'Therapeutic Medication',
            dosageForm: res.data.dosageForm || 'Oral',
            overview: res.data.overview,
            dosageAndUsage: res.data.dosageAndUsage,
            sideEffects: res.data.sideEffects,
            warnings: res.data.warnings,
            precautions: res.data.precautions,
            createdAt: new Date().toISOString()
          };
          const existing = JSON.parse(localStorage.getItem('mediscan_text_searches') || '[]');
          const filtered = existing.filter(i => (i.searchQuery || '').toLowerCase() !== trimmed.toLowerCase());
          localStorage.setItem('mediscan_text_searches', JSON.stringify([newEntry, ...filtered].slice(0, 50)));
        } catch (cacheErr) {
          console.warn('[ScannerPage] Could not cache search locally:', cacheErr);
        }
      } else {
        setNameError(res.error || 'Failed to find medicine information.');
      }
    } catch (err) {
      setNameError(err.message || 'Unable to search. Please check your connection and try again.');
    } finally {
      setNameLoading(false);
    }
  };

  const resetNameSearch = () => {
    setNameQuery('');
    setNameResult(null);
    setNameError('');
  };

  // ── Name-search result renderer ──────────────────────────────────────────
  const renderNameResult = () => {
    if (!nameResult) return null;
    const r = nameResult;
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '6px' }}>{r.medicineName}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>Generic:</strong> {r.genericName || 'N/A'}</p>
              {r.manufacturer && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}><strong>Maker:</strong> {r.manufacturer}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
              {r.category && <span className="badge badge-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>{r.category}</span>}
              {r.dosageForm && <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 9px', borderRadius: '8px' }}>{r.dosageForm}</span>}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div className="tab-nav-scroll" style={{ margin: 0, paddingBottom: '0', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
            {[{ id: 'overview', label: 'Overview' }, { id: 'dosage', label: 'Dosage' }, { id: 'warnings', label: 'Warnings' }, { id: 'sideeffects', label: 'Side Effects' }].map(tab => (
              <button key={tab.id} onClick={() => setNameTab(tab.id)} className={nameTab === tab.id ? 'active' : ''} style={{ padding: '10px 14px', fontSize: '13px' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          {nameTab === 'overview' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.overview?.primaryUse && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Primary Use</h4><p>{r.overview.primaryUse}</p></div>}
              {r.overview?.drugClass && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Drug Class</h4><p>{r.overview.drugClass}</p></div>}
              {r.activeIngredient && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Active Ingredient</h4><p>{r.activeIngredient}</p></div>}
              {r.ageSpecificInfo && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Age-Specific Info</h4><p>{r.ageSpecificInfo}</p></div>}
              {r.storage && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={14} /> Storage</h4><p>{r.storage}</p></div>}
              {r.interactions && r.interactions.length > 0 && (
                <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>Drug Interactions</h4>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{r.interactions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          {nameTab === 'dosage' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.dosageAndUsage?.standardDose && (<div className="alert alert-primary" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={15} /> Standard Dose</strong><p>{r.dosageAndUsage.standardDose}</p></div>)}
              {r.dosageAndUsage?.frequency && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Frequency</h4><p>{r.dosageAndUsage.frequency}</p></div>}
              {r.dosageAndUsage?.duration && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Duration</h4><p>{r.dosageAndUsage.duration}</p></div>}
              {r.dosageAndUsage?.howToTake && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>How to Take</h4><p>{r.dosageAndUsage.howToTake}</p></div>}
            </div>
          )}
          {nameTab === 'warnings' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.warnings && r.warnings.length > 0 && (<div className="alert alert-danger" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={15} /> Warnings</strong><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>{r.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>)}
              {r.precautions && r.precautions.length > 0 && (<div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>Precautions</h4><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{r.precautions.map((p, i) => <li key={i}>{p}</li>)}</ul></div>)}
            </div>
          )}
          {nameTab === 'sideeffects' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.sideEffects?.common && r.sideEffects.common.length > 0 && (<div className="alert alert-warning" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertOctagon size={15} /> Common Side Effects</strong><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>{r.sideEffects.common.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
              {r.sideEffects?.serious && r.sideEffects.serious.length > 0 && (<div className="alert alert-danger" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={15} /> Serious Side Effects</strong><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>{r.sideEffects.serious.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
            </div>
          )}
        </div>
        <div style={{ marginTop: '24px' }}><MedicalDisclaimer /></div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-primary"><Sparkles size={12} style={{marginRight:'4px'}}/> Clinical OCR Engine</span>
        </div>
        <h1 className="page-title">{t('scannerTitle') || 'Medicine Scanner'}</h1>
        <p className="body-text" style={{ marginTop: '8px', maxWidth: '800px', fontSize: '16px' }}>
          Upload pill bottles, packaging, or prescription labels. Our system extracts textual data and generates structured clinical dosages, active ingredients, warnings, and safety information.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => { setScanMode('image'); setNameResult(null); setNameError(''); }} className={`btn ${scanMode === 'image' ? 'btn-primary' : 'btn-secondary'}`}>
          <Upload size={16} /> Scan Image
        </button>
        <button onClick={() => { setScanMode('name'); setResult(null); setError(''); }} className={`btn ${scanMode === 'name' ? 'btn-primary' : 'btn-secondary'}`}>
          <Search size={16} /> Manual Search
        </button>
      </div>

      {scanMode === 'image' && (
        <div className="dashboard-grid fade-in">
          
          {/* LEFT: Upload Zone */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={18} />
                  </div>
                  <h3 className="card-heading">Image Source</h3>
                </div>
                {imagePreview && (
                  <button onClick={resetScanner} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12px' }}>
                    Reset
                  </button>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className={`scanner-container ${loading ? 'active' : ''} ${imagePreview ? 'has-image' : ''}`} style={{
                  flex: 1, minHeight: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden', marginBottom: '24px',
                  borderRadius: '16px', background: imagePreview ? '#000' : 'rgba(255,255,255,0.02)',
                  border: imagePreview ? 'none' : '2px dashed rgba(255,255,255,0.1)'
                }}>
                  
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: loading ? 0.3 : 1 }} />
                      {!loading && !result && (
                        <div style={{ position: 'absolute', bottom: '24px', display: 'flex', gap: '12px', zIndex: 10 }}>
                          <button onClick={handleScan} className="btn btn-primary" style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5)', padding: '12px 24px', fontSize: '16px' }}>
                            <Sparkles size={20} /> Analyze Medicine
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div onClick={() => fileInputRef.current.click()} style={{ textAlign: 'center', padding: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <Upload size={32} style={{ color: 'var(--primary)' }} />
                      </div>
                      <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>Upload Medicine Label</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '240px', lineHeight: 1.5 }}>
                        Drag and drop an image, click to browse, or use your camera.
                      </p>
                    </div>
                  )}
                  {loading && <LoadingChecklist progress={scanProgress} />}
                </div>

                {!imagePreview && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary" style={{ flex: 1, padding: '14px' }}>
                      <Upload size={18} /> Browse Files
                    </button>
                    <button onClick={startCamera} className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>
                      <Camera size={18} /> Open Camera
                    </button>
                  </div>
                )}
                
                {!imagePreview && (
                  <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                    <p className="caption" style={{ marginBottom: '12px', fontWeight: '600' }}>DEMO PRESETS</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {PRESET_MEDICINES.map(p => (
                        <button key={p.id} onClick={async () => { const { file, dataUrl } = await generatePresetImageFile(p); setSelectedFile(file); setImagePreview(dataUrl); }} className="badge badge-normal" style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" style={{ marginTop: '16px', flexDirection: 'row', alignItems: 'center' }}>
                    <AlertOctagon size={20} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '14px' }}>{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Results Zone */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={18} />
                  </div>
                  <h3 className="card-heading">Analysis Results</h3>
                </div>
                {result && <span className="badge badge-success"><CheckCircle2 size={14} style={{marginRight:'6px'}}/> Verified</span>}
              </div>

              {!result ? (
                <div className="empty-state" style={{ flex: 1, margin: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Pill size={40} className="empty-state-icon" style={{ margin: 0 }} />
                  </div>
                  <h4 className="empty-state-title" style={{ fontSize: '18px' }}>Awaiting Scan</h4>
                  <p className="empty-state-text" style={{ fontSize: '15px', lineHeight: 1.6 }}>Upload an image and analyze it to view the structured clinical breakdown here.</p>
                </div>
              ) : (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px', overflowY: 'auto' }}>
                  
                  {/* Verified Data Header */}
                  <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '8px' }}>{result.medicineName}</h2>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}><strong>Generic:</strong> {result.genericName || result.activeIngredients || 'N/A'}</p>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span className="badge badge-primary" style={{ fontSize: '13px', padding: '6px 12px' }}>{result.category}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>{result.dosageForm}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary Tabs */}
                  <div style={{ marginBottom: '24px' }}>
                     <div className="tab-nav-scroll" style={{ margin: 0, paddingBottom: '0', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
                        {[{ id: 'overview', label: 'Overview' }, { id: 'dosage', label: 'Dosage' }, { id: 'warnings', label: 'Warnings' }, { id: 'sideeffects', label: 'Side Effects' }].map(tab => (
                          <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={activeTab === tab.id ? 'active' : ''}
                            style={{ padding: '12px 16px', fontSize: '15px' }}
                          >
                            {tab.label}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div style={{ flex: 1, fontSize: '15px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                    {activeTab === 'overview' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Clinical Purpose</h4>
                          <p>{result.purposeAndUses || result.usageInstructions}</p>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={16} /> Manufacturer</h4>
                            <p>{result.manufacturer || 'N/A'}</p>
                          </div>
                          {result.storage && (
                            <div>
                              <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Storage</h4>
                              <p>{result.storage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === 'dosage' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="alert alert-primary" style={{ padding: '20px' }}>
                          <strong className="alert-title" style={{ fontSize: '16px', marginBottom: '8px' }}><Clock size={18} /> Prescribed Dosage</strong>
                          <p style={{ fontSize: '15px' }}>{result.dosage}</p>
                        </div>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Usage Instructions</h4>
                          <p>{result.usageInstructions}</p>
                        </div>
                        {result.missedDose && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>If you miss a dose</h4>
                            <p>{result.missedDose}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'warnings' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="alert alert-danger" style={{ padding: '20px' }}>
                          <strong className="alert-title" style={{ fontSize: '16px', marginBottom: '8px' }}><ShieldAlert size={18} /> Critical Warnings</strong>
                          <p style={{ fontSize: '15px' }}>{result.warnings}</p>
                        </div>
                        {result.precautions && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>General Precautions</h4>
                            <p>{result.precautions}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'sideeffects' && (
                      <div className="fade-in">
                        <div className="alert alert-warning" style={{ padding: '20px' }}>
                          <strong className="alert-title" style={{ fontSize: '16px', marginBottom: '8px' }}><AlertOctagon size={18} /> Known Side Effects</strong>
                          <p style={{ fontSize: '15px' }}>{result.sideEffects}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '32px' }}>
                    <MedicalDisclaimer />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {scanMode === 'name' && (
        <div className="dashboard-grid fade-in">
          {/* LEFT: Search input */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--info)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={18} />
                  </div>
                  <h3 className="card-heading">Medicine Name Search</h3>
                </div>
                {nameResult && (
                  <button onClick={resetNameSearch} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12px' }}>Reset</button>
                )}
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className="body-text" style={{ fontSize: '14px' }}>Type the name of any medicine or drug to get detailed clinical information — dosage, warnings, side effects, and interactions.</p>
                <form onSubmit={handleNameSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input type="text" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="e.g. Paracetamol, Amoxicillin, Metformin..." className="input" style={{ paddingLeft: '44px', fontSize: '15px', width: '100%' }} disabled={nameLoading} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={nameLoading || !nameQuery.trim()} style={{ padding: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {nameLoading ? <><Loader2 size={18} className="spin" /> Searching...</> : <><Sparkles size={18} /> Search Medicine</>}
                  </button>
                </form>
                {nameError && (
                  <div className="alert alert-danger" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                    <AlertOctagon size={20} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '14px' }}>{nameError}</p>
                  </div>
                )}
                {!nameResult && !nameLoading && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                    <p className="caption" style={{ marginBottom: '12px', fontWeight: '600' }}>QUICK SUGGESTIONS</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['Paracetamol', 'Amoxicillin', 'Metformin', 'Ibuprofen', 'Aspirin', 'Omeprazole'].map(name => (
                        <button key={name} type="button" onClick={() => setNameQuery(name)} className="badge badge-normal" style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}>{name}</button>
                      ))}
                    </div>
                  </div>
                )}
                {nameLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'rgba(6, 182, 212, 0.03)', borderRadius: '16px', padding: '40px', border: '2px dashed rgba(6, 182, 212, 0.15)' }}>
                    <Loader2 size={44} className="spin" style={{ color: 'var(--info)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Analyzing Medicine Data</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI is retrieving clinical information...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* RIGHT: Search results */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={18} />
                  </div>
                  <h3 className="card-heading">Search Results</h3>
                </div>
                {nameResult && <span className="badge badge-success"><CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Found</span>}
              </div>
              {!nameResult ? (
                <div className="empty-state" style={{ flex: 1, margin: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Pill size={40} className="empty-state-icon" style={{ margin: 0 }} />
                  </div>
                  <h4 className="empty-state-title" style={{ fontSize: '18px' }}>Awaiting Search</h4>
                  <p className="empty-state-text" style={{ fontSize: '15px', lineHeight: 1.6 }}>Enter a medicine name on the left and click Search to view detailed clinical information here.</p>
                </div>
              ) : (
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>{renderNameResult()}</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isCameraOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8, 10, 22, 0.95)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
             <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Capture Label</h3>
             <button onClick={stopCameraStream} className="btn btn-secondary" style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none' }}><X size={24} color="#fff" /></button>
           </div>
           
           <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
             {cameraError ? (
               <div style={{ padding: '24px', textAlign: 'center' }}>
                 <AlertOctagon size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
                 <p style={{ color: '#fff', fontSize: '16px' }}>{cameraError}</p>
               </div>
             ) : (
               <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '800px', maxHeight: '800px' }}>
                 <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 {/* Camera Overlay Guide */}
                 <div style={{ position: 'absolute', inset: '40px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                 <canvas ref={canvasRef} style={{ display: 'none' }} />
               </div>
             )}
           </div>

           <div className="camera-overlay-actions">
              <button onClick={stopCameraStream} className="btn" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', borderRadius: '50px' }}>Cancel</button>
              {!cameraError && (
                <button onClick={captureCameraFrame} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '50px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Camera size={20} /> Capture Frame
                </button>
              )}
           </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ScannerPage;
