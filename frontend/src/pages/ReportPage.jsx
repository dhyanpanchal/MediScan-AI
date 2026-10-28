import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { 
  FileText, Upload, RefreshCw, ShieldAlert,
  Table, Eye, Loader2, CheckCircle2, AlertOctagon, Info,
  Activity, User, Clock, FileSpreadsheet, Building, Sparkles, AlertTriangle
} from 'lucide-react';

const UI_STRINGS = {
  English: {
    detectedReportType: "Detected Report Type", patientDetails: "Patient Details",
    executiveSummary: "Executive Summary", medicalHistory: "Medical History",
    presentingSymptoms: "Presenting Symptoms", labBiomarkers: "Laboratory Biomarkers",
    testColumn: "Biomarker", valueColumn: "Value", refRangeColumn: "Ref Range",
    statusColumn: "Status", keyFindings: "Key Findings", doctorNotes: "Clinical Notes",
    criticalAlerts: "Critical Alerts", noAlerts: "No critical alerts detected.",
    recommendations: "Clinical Recommendations", summaryHeader: "Quick Summary"
  },
  Hindi: {
    detectedReportType: "पहचाना गया रिपोर्ट प्रकार", patientDetails: "मरीज का विवरण",
    executiveSummary: "मुख्य सारांश", medicalHistory: "चिकित्सा इतिहास",
    presentingSymptoms: "वर्तमान लक्षण", labBiomarkers: "प्रयोगशाला बायोमार्कर",
    testColumn: "बायोमार्कर", valueColumn: "मान", refRangeColumn: "संदर्भ सीमा",
    statusColumn: "स्थिति", keyFindings: "प्रमुख निष्कर्ष", doctorNotes: "नैदानिक टिप्पणियां",
    criticalAlerts: "महत्वपूर्ण अलर्ट", noAlerts: "कोई महत्वपूर्ण अलर्ट नहीं पाया गया।",
    recommendations: "नैदानिक सिफारिशें", summaryHeader: "त्वरित सारांश"
  },
  Gujarati: {
    detectedReportType: "ઓળખાયેલ રિપોર્ટ પ્રકાર", patientDetails: "દર્દીની વિગતો",
    executiveSummary: "મુખ્ય સારાંશ", medicalHistory: "તબીબી ઇતિહાસ",
    presentingSymptoms: "હાલના લક્ષણો", labBiomarkers: "લેબોરેટરી બાયોમાર્કર્સ",
    testColumn: "બાયોમાર્કર", valueColumn: "મૂલ્ય", refRangeColumn: "સંદર્ભ સીમા",
    statusColumn: "સ્થિતિ", keyFindings: "મુખ્ય તારણો", doctorNotes: "ક્લિનિકલ ટિપ્પણીઓ",
    criticalAlerts: "મહત્વપૂર્ણ ચેતવણીઓ", noAlerts: "કોઈ મહત્વપૂર્ણ ચેતવણીઓ મળી નથી.",
    recommendations: "ક્લિનિકલ ભલામણો", summaryHeader: "ઝડપી સારાંશ"
  }
};

const LoadingChecklist = ({ progress }) => {
  const steps = [
    { label: 'Securely uploading document', threshold: 15 },
    { label: 'Running medical OCR extraction', threshold: 40 },
    { label: 'Structuring biomarker data', threshold: 65 },
    { label: 'Analyzing clinical references', threshold: 85 },
    { label: 'Finalizing patient summary', threshold: 95 }
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11, 13, 28, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Analyzing Report</h3>
        </div>
        {steps.map((step, idx) => {
          const isDone = progress >= step.threshold;
          const isActive = !isDone && (idx === 0 || progress >= steps[idx - 1].threshold);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isDone || isActive ? 1 : 0.4, transition: 'opacity 0.3s' }}>
              {isDone ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> : isActive ? <Loader2 size={18} className="spin" style={{ color: 'var(--primary)' }} /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />}
              <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500', color: isDone ? 'var(--text-secondary)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }}>{step.label}</span>
            </div>
          );
        })}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--info))', transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
};

const ReportPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return setError('Please upload a PDF or image medical report first.');
    setError(''); setLoading(true); setAnalyzeProgress(15);

    const formData = new FormData(); formData.append('file', selectedFile);

    let progress = 15;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 95) progress = 95;
      setAnalyzeProgress(progress);
    }, 800);

    try {
      const res = await api.analyzeReport(formData);
      clearInterval(progressInterval); setAnalyzeProgress(100);
      setTimeout(() => {
        if (res.success) { setResult(res.data); setActiveTab('overview'); }
        else setError(res.error || 'Failed to analyze report file.');
        setLoading(false); setAnalyzeProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval); setLoading(false); setAnalyzeProgress(0);
      setError(err.message || 'Failed to analyze report file.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null); setImagePreview(null); setResult(null); setError(''); setActiveTab('overview');
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('normal')) return 'badge-success';
    if (s.includes('low')) return 'badge-info';
    if (s.includes('high')) return 'badge-warning';
    if (s.includes('critical')) return 'badge-danger';
    return 'badge-normal';
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-primary"><FileSpreadsheet size={12} style={{marginRight:'4px'}}/> Clinical Document Engine</span>
          </div>
          <h1 className="page-title">Report Analyzer</h1>
          <p className="body-text" style={{ marginTop: '8px', maxWidth: '800px', fontSize: '16px' }}>
            Upload lab results, blood work, or clinical panels. Our system extracts unstructured data and transforms it into an organized, patient-friendly dashboard.
          </p>
        </div>
        
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Language</span>
            <select className="form-control" style={{ padding: '6px 12px', height: 'auto', background: 'var(--bg-input)', border: 'none', borderRadius: '8px' }} value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Gujarati">Gujarati</option>
            </select>
          </div>
        )}
      </div>

      <div className="dashboard-grid fade-in" style={{ alignItems: 'start' }}>
        
        {/* LEFT COLUMN: UPLOAD & METADATA */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={18} />
                </div>
                <h3 className="card-heading">Document Source</h3>
              </div>
              {result && <button onClick={handleReset} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12px' }}>Reset</button>}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" style={{ display: 'none' }} />

            <div style={{ padding: '24px' }}>
              <div className={`scanner-container ${loading ? 'active' : ''}`} style={{
                minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
                borderRadius: '16px', background: imagePreview ? '#000' : 'rgba(255,255,255,0.02)',
                border: imagePreview ? 'none' : '2px dashed rgba(255,255,255,0.1)', marginBottom: '20px'
              }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: loading ? 0.3 : 1 }} />
                ) : selectedFile ? (
                  <div style={{ textAlign: 'center' }}>
                    <FileText size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{selectedFile.name}</p>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current.click()} style={{ textAlign: 'center', padding: '24px', cursor: 'pointer' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <FileSpreadsheet size={32} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>Upload Lab Report</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '200px', margin: '0 auto' }}>PDFs or clear images of blood work and clinical panels.</p>
                  </div>
                )}
                {loading && <LoadingChecklist progress={analyzeProgress} />}
              </div>

              {!result && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>Browse</button>
                  {selectedFile && <button onClick={handleAnalyze} className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>Analyze Report</button>}
                </div>
              )}
              {error && <div className="alert alert-danger" style={{ marginTop: '16px', fontSize: '13px' }}><AlertTriangle size={16} /> {error}</div>}
            </div>
          </div>

          {result && result.cardAnalysis?.patient_information && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <User size={20} style={{ color: 'var(--info)' }} />
                <h3 className="card-heading">{UI_STRINGS[selectedLanguage].patientDetails}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Name</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}>{result.cardAnalysis.patient_information.patient_name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Age/Gender</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}>{result.cardAnalysis.patient_information.age} / {result.cardAnalysis.patient_information.gender}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Date</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}>{result.cardAnalysis.report_information?.report_date || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Physician</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px', textAlign: 'right', maxWidth: '140px' }}>{result.cardAnalysis.report_information?.doctor_name || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ANALYSIS RESULTS */}
        <div className="col-8">
          <div className="card" style={{ height: '100%', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} />
                </div>
                <h3 className="card-heading">Clinical Findings</h3>
              </div>
              {result && <span className="badge badge-success"><CheckCircle2 size={14} style={{marginRight:'6px'}}/> Extracted</span>}
            </div>

            {!result ? (
              <div className="empty-state" style={{ flex: 1, margin: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <FileSpreadsheet size={40} className="empty-state-icon" style={{ margin: 0 }} />
                </div>
                <h4 className="empty-state-title" style={{ fontSize: '18px' }}>Awaiting Document</h4>
                <p className="empty-state-text" style={{ fontSize: '15px', lineHeight: 1.6 }}>Upload a lab report to automatically extract structured clinical data and health summaries.</p>
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                
                {/* Tabs */}
                <div className="tab-nav-scroll" style={{ margin: '0 24px', paddingBottom: '0', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''} style={{ padding: '16px', fontSize: '15px' }}>Overview</button>
                  <button onClick={() => setActiveTab('lab')} className={activeTab === 'lab' ? 'active' : ''} style={{ padding: '16px', fontSize: '15px' }}>Lab Results</button>
                  <button onClick={() => setActiveTab('notes')} className={activeTab === 'notes' ? 'active' : ''} style={{ padding: '16px', fontSize: '15px' }}>Clinical Notes</button>
                </div>

                <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                  {activeTab === 'overview' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Health Score Banner */}
                      {result.cardAnalysis?.overall_summary && (
                        <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '24px' }}>
                          <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--success)" strokeWidth="3" strokeDasharray={`${result.cardAnalysis.overall_summary.health_score || 0}, 100`} />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>
                              {result.cardAnalysis.overall_summary.health_score || '--'}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Health Status</span>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{result.cardAnalysis.overall_summary.health_status || 'Normal'}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>Risk Level: <span style={{ fontWeight: '600' }}>{result.cardAnalysis.overall_summary.overall_risk || 'Low'}</span></p>
                          </div>
                        </div>
                      )}

                      {/* Critical Alerts */}
                      {result.criticalAlerts && result.criticalAlerts.length > 0 && !result.criticalAlerts[0]?.toLowerCase().includes('no critical') && (
                        <div className="alert alert-danger" style={{ padding: '20px' }}>
                          <h4 className="alert-title" style={{ fontSize: '16px', marginBottom: '12px' }}><ShieldAlert size={18} /> {UI_STRINGS[selectedLanguage].criticalAlerts}</h4>
                          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {result.criticalAlerts.map((alert, i) => <li key={i} style={{ fontSize: '15px', fontWeight: '600' }}>{alert}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Summary */}
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={18} style={{ color: 'var(--primary)' }} /> {UI_STRINGS[selectedLanguage].executiveSummary}
                        </h4>
                        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{result.summary || (result.cardAnalysis?.overall_summary?.summary)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'lab' && (
                    <div className="fade-in">
                      {result.cardAnalysis?.tests && result.cardAnalysis.tests.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                          {result.cardAnalysis.tests.map((test, i) => {
                            const isAbnormal = test.status?.toLowerCase().includes('high') || test.status?.toLowerCase().includes('low') || test.status?.toLowerCase().includes('abnormal');
                            return (
                              <div key={i} style={{ padding: '20px', background: isAbnormal ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-elevated)', borderRadius: '12px', border: `1px solid ${isAbnormal ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                  <h5 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{test.test_name}</h5>
                                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Ref: {test.reference_range || 'N/A'}</p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div>
                                    <span style={{ fontSize: '20px', fontWeight: '800', color: isAbnormal ? 'var(--warning)' : 'var(--text-primary)' }}>{test.value}</span>
                                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px' }}>{test.unit}</span>
                                  </div>
                                  <span className={`badge ${getStatusBadge(test.status)}`} style={{ minWidth: '80px', justifyContent: 'center' }}>{test.status}</span>
                                </div>
                                {isAbnormal && test.simple_explanation && (
                                  <div style={{ width: '100%', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(245, 158, 11, 0.1)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    <strong>AI Insight:</strong> {test.simple_explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : result.labResults && result.labResults.length > 0 ? (
                        <div className="table-responsive" style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <table style={{ minWidth: '500px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '16px', fontWeight: '600', fontSize: '14px' }}>{UI_STRINGS[selectedLanguage].testColumn}</th>
                                <th style={{ padding: '16px', fontWeight: '600', fontSize: '14px' }}>{UI_STRINGS[selectedLanguage].valueColumn}</th>
                                <th style={{ padding: '16px', fontWeight: '600', fontSize: '14px' }}>{UI_STRINGS[selectedLanguage].refRangeColumn}</th>
                                <th style={{ padding: '16px', fontWeight: '600', fontSize: '14px' }}>{UI_STRINGS[selectedLanguage].statusColumn}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.labResults.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{item.test}</td>
                                  <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '14px' }}>{item.value} {item.unit && item.unit !== 'Not Available' ? item.unit : ''}</td>
                                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>{item.referenceRange}</td>
                                  <td style={{ padding: '16px' }}><span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="empty-state">
                          <AlertOctagon size={40} className="empty-state-icon" />
                          <p className="empty-state-text">No structured lab biomarkers detected in this document.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {result.recommendations && (
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>{UI_STRINGS[selectedLanguage].recommendations}</h4>
                          <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            {Array.isArray(result.recommendations) ? (
                              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            ) : (
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{result.recommendations}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {result.doctorNotes && result.doctorNotes.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>{UI_STRINGS[selectedLanguage].doctorNotes}</h4>
                          <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {result.doctorNotes.map((n, i) => <li key={i}>{n}</li>)}
                            </ul>
                          </div>
                        </div>
                      )}

                      {(!result.recommendations || result.recommendations.length === 0) && (!result.doctorNotes || result.doctorNotes.length === 0) && (
                        <div className="empty-state">
                          <Info size={40} className="empty-state-icon" />
                          <p className="empty-state-text">No clinical notes or recommendations extracted.</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '32px' }}>
                    <MedicalDisclaimer />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ReportPage;
