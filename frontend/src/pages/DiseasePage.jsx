import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import {
  Search, Activity, Pill, Leaf, Shield, AlertTriangle,
  ChevronDown, Loader2, Stethoscope, Heart, Globe, ArrowRight, Clock, Building
} from 'lucide-react';

const AGE_GROUPS = [
  { key: 'child', label: 'Child', range: '0–12', icon: '👶', color: '#f59e0b' },
  { key: 'teen', label: 'Teen', range: '13–17', icon: '🧑', color: '#06b6d4' },
  { key: 'adult', label: 'Adult', range: '18–59', icon: '🧑‍💼', color: '#a855f7' },
  { key: 'senior', label: 'Senior', range: '60+', icon: '👴', color: '#10b981' },
];

const DiseasePage = () => {
  const { t, language, translations } = useApp();
  const [query, setQuery] = useState('');
  const [age, setAge] = useState('');
  const [ageGroup, setAgeGroup] = useState('adult');
  const [outputLanguage, setOutputLanguage] = useState(language);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  
  const localT = (key) => translations[outputLanguage]?.[key] || translations['en']?.[key] || key;

  useEffect(() => {
    if (!query.trim()) return;
    const isGujarati = /[\u0A80-\u0AFF]/.test(query);
    if (isGujarati) { setOutputLanguage('gu'); return; }
    const isHindi = /[\u0900-\u097F]/.test(query);
    if (isHindi) { setOutputLanguage('hi'); return; }
  }, [query]);

  const detectAgeGroup = (val) => {
    const n = parseInt(val);
    if (!isNaN(n)) {
      if (n <= 12) return 'child';
      if (n <= 17) return 'teen';
      if (n <= 59) return 'adult';
      return 'senior';
    }
    return 'adult';
  };

  const handleAgeChange = (val) => {
    setAge(val);
    setAgeGroup(detectAgeGroup(val));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.searchDisease(query, outputLanguage, ageGroup, age || null);
      if (res.success) setResult(res.data);
      else setError(res.error || t('error'));
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = AGE_GROUPS.find(g => g.key === ageGroup);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--info))', borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={22} color="#fff" />
          </div>
          <h1 className="page-title">{t('diseaseSearchTitle')}</h1>
        </div>
        <p className="body-text">{t('diseaseSearchSubtitle')}</p>
      </div>

      {/* Search Form */}
      {/* Search Form */}
      <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)', marginBottom: '2rem' }}>
        <form onSubmit={handleSearch}>
          <div className="disease-search-container">
            <div className="search-input-wrap">
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input ref={inputRef} className="form-control" style={{ paddingLeft: '48px', fontSize: '16px', height: '56px', borderRadius: '12px' }} placeholder={translations[outputLanguage]?.searchPlaceholder || t('searchPlaceholder') || 'Enter disease or condition...'} value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            
            <div className="lang-select-wrap">
              <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select className="form-control" style={{ paddingLeft: '44px', height: '56px', appearance: 'none', background: 'var(--bg-input)', cursor: 'pointer', borderRadius: '12px', fontSize: '15px' }} value={outputLanguage} onChange={e => setOutputLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="gu">ગુજરાતી</option>
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>

            <button type="submit" className="btn btn-primary search-btn" disabled={loading || !query.trim()} style={{ height: '56px', padding: '0 32px', borderRadius: '12px', fontSize: '16px' }}>
              {loading ? <Loader2 size={20} className="spin" /> : <><Search size={20} /> {t('searchBtn') || 'Search'}</>}
            </button>
          </div>

          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{t('ageGroup') || 'Select Age Group'}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AGE_GROUPS.map(group => (
                <button key={group.key} type="button" onClick={() => setAgeGroup(group.key)} style={{ padding: '8px 14px', borderRadius: '50px', border: `2px solid ${ageGroup === group.key ? group.color : 'var(--bg-input)'}`, background: ageGroup === group.key ? `${group.color}15` : 'transparent', color: ageGroup === group.key ? group.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}>
                  <span>{group.icon}</span> <span>{group.label}</span> <span style={{ opacity: 0.7, fontSize: '12px' }}>({group.range})</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '24px', flexDirection: 'row', alignItems: 'center' }}><AlertTriangle size={20} /> <span>{error}</span></div>}

      {loading && (
        <div className="empty-state" style={{ minHeight: '300px', border: 'none' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(6,182,212,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Loader2 size={32} style={{ color: 'var(--primary)' }} className="spin" />
          </div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Analyzing Clinical Databases...</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Fetching evidence-based disease information</p>
        </div>
      )}

      {result && !loading && (
        <div className="fade-in">
          {/* Overview Header */}
          <div className="card" style={{ padding: 'clamp(20px, 4vw, 32px)', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{localT('diseaseOverview') || 'Disease Overview'}</span>
                <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px', marginBottom: '16px', lineHeight: 1.2 }}>{result.diseaseName}</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px', maxWidth: '800px' }}>{result.description}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '50px', background: `${selectedGroup?.color}15`, border: `1px solid ${selectedGroup?.color}30`, color: selectedGroup?.color, fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                {selectedGroup?.icon} {localT(ageGroup) || selectedGroup.label} {localT('profileApplied') || 'Profile Applied'}
              </div>
            </div>
            {result.ageSpecificAdvice && (
              <div className="alert alert-primary" style={{ marginTop: '24px', flexDirection: 'row', alignItems: 'center', padding: '16px' }}>
                <Stethoscope size={20} style={{ flexShrink: 0 }} />
                <p><strong style={{ fontSize: '15px' }}>{localT('ageSpecificAdvice') || 'Age-Specific Advice'}:</strong> {result.ageSpecificAdvice}</p>
              </div>
            )}
          </div>

          <div className="dashboard-grid" style={{ alignItems: 'start' }}>
            {/* Symptoms Card */}
            <div className="col-6">
              <div className="card" style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={20} />
                  </div>
                  <h3 className="card-heading">{localT('commonSymptoms') || 'Symptoms'}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(result.commonSymptoms || []).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'var(--primary)', marginTop: '2px', fontSize: '14px' }}>●</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Causes Card */}
            <div className="col-6">
              <div className="card" style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="card-heading">{localT('causes') || 'Causes & Triggers'}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(result.causes || []).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'var(--warning)', marginTop: '2px', fontSize: '14px' }}>⚡</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Treatment Card */}
            <div className="col-12">
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pill size={20} />
                  </div>
                  <h3 className="card-heading">{localT('treatmentAndRemedies') || 'Treatment & Remedies'}</h3>
                </div>
                
                <div className="dashboard-grid" style={{ padding: '0 24px 24px', gap: '24px' }}>
                  <div className="col-6">
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Leaf size={16} /> {localT('homeRemedies') || 'Home Remedies'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(result.homeRemedies || []).map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          <span style={{ color: 'var(--success)', marginTop: '2px', fontSize: '14px' }}>🌿</span>
                          <span style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5 }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-6">
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Pill size={16} /> {localT('clinicalMedicines') || 'Clinical Medicines'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(result.recommendedMedicines || []).map((med, i) => (
                        <div key={i} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{med.name}</h5>
                            <span className="badge badge-info">{med.form}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                            <p><strong style={{ color: 'var(--success)' }}>{localT('purpose') || 'Purpose'}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{med.purpose}</span></p>
                            <p><strong style={{ color: 'var(--warning)' }}>{localT('dosage') || 'Dosage'}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{med.dosage}</span></p>
                            <p><strong style={{ color: 'var(--danger)' }}>{localT('sideEffects') || 'Side Effects'}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{med.sideEffects}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prevention Card */}
            <div className="col-6">
              <div className="card" style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={20} />
                  </div>
                  <h3 className="card-heading">{localT('prevention') || 'Prevention Guidelines'}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(result.prevention || []).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'var(--success)', marginTop: '2px', fontSize: '14px' }}>🛡️</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Warning Signs */}
            <div className="col-6">
              <div className="card" style={{ height: '100%', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={20} />
                  </div>
                  <h3 className="card-heading" style={{ color: 'var(--danger)' }}>{localT('whenToSeeDoctor') || 'Warning Signs'}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(result.whenToSeeDoctor || []).map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                      <span style={{ color: 'var(--danger)', marginTop: '2px', fontSize: '14px' }}>🚨</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5 }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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

export default DiseasePage;
