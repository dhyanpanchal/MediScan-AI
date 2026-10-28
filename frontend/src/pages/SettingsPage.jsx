import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sun, Moon, Type, Globe, User, Check, Loader2,
  Palette, Bell, Lock, Settings as SettingsIcon,
  Shield, Eye, Smartphone, Mail, EyeOff, LayoutTemplate
} from 'lucide-react';

const SettingsPage = () => {
  const { t, language, setLanguage, theme, setTheme, fontSize, setFontSize } = useApp();
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('appearance');
  
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Toggles for UI mockup in new sections
  const [toggles, setToggles] = useState({
    emailNotifs: true,
    pushNotifs: true,
    weeklyReport: false,
    dataSharing: false,
    twoFactor: false,
    highContrast: false,
    screenReader: false
  });

  const handleToggle = (key) => setToggles(p => ({...p, [key]: !p[key]}));
  const handleFormChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (activeTab === 'account') {
        await updateProfile(form);
      }
      // other tabs simply mock save
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'appearance', label: t('appearance') || 'Appearance', icon: Palette, color: '#a855f7' },
    { id: 'language', label: t('language') || 'Language', icon: Globe, color: '#06b6d4' },
    { id: 'account', label: t('accountDetails') || 'Account', icon: User, color: '#10b981' },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, color: '#f59e0b' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: '#ec4899' },
    { id: 'accessibility', label: 'Accessibility', icon: Eye, color: '#3b82f6' }
  ];

  const ToggleSwitch = ({ label, description, checked, onChange, color = 'var(--primary)' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ paddingRight: '24px' }}>
        <h5 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</h5>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
      </div>
      <button 
        onClick={onChange}
        style={{
          width: '44px', height: '24px', borderRadius: '12px',
          background: checked ? color : 'var(--bg-input)', border: 'none',
          position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
        }}
      >
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
          position: 'absolute', top: '2px', left: checked ? '22px' : '2px',
          transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="page-title">{t('settingsTitle') || 'Settings Center'}</h1>
          <p className="body-text" style={{ fontSize: '15px', marginTop: '4px' }}>Manage your workspace preferences, security, and account.</p>
        </div>
      </div>

      <div className="settings-layout">
        
        {/* Sidebar Menu */}
        <div className="card settings-sidebar" style={{ padding: '12px' }}>
          <div className="settings-tabs-list">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
                  color: activeTab === tab.id ? tab.color : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? '700' : '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <tab.icon size={18} />
                <span style={{ fontSize: '14px' }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="settings-content">
          <div className="card fade-in" style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {(() => {
                const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon;
                const activeColor = tabs.find(t => t.id === activeTab)?.color;
                return (
                  <>
                    <div style={{ background: `${activeColor}15`, color: activeColor, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ActiveIcon size={20} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      {tabs.find(t => t.id === activeTab)?.label}
                    </h2>
                  </>
                );
              })()}
            </div>

            {/* TAB: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h4 className="card-heading" style={{ marginBottom: '16px' }}>Interface Theme</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    
                    <button onClick={() => setTheme('dark')} style={{
                      padding: '20px', borderRadius: '12px', border: `2px solid ${theme === 'dark' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                      background: theme === 'dark' ? 'var(--bg-elevated)' : 'transparent', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                    }}>
                      <div style={{ width: '48px', height: '48px', background: '#111827', borderRadius: '50%', border: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Moon size={20} color="#a855f7" />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)' }}>{t('darkTheme') || 'Dark Theme'}</span>
                      {theme === 'dark' && <Check size={16} style={{ color: 'var(--primary)' }} />}
                    </button>

                    <button onClick={() => setTheme('light')} style={{
                      padding: '20px', borderRadius: '12px', border: `2px solid ${theme === 'light' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                      background: theme === 'light' ? 'var(--bg-elevated)' : 'transparent', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                    }}>
                      <div style={{ width: '48px', height: '48px', background: '#f3f4f6', borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sun size={20} color="#f59e0b" />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)' }}>{t('lightTheme') || 'Light Theme'}</span>
                      {theme === 'light' && <Check size={16} style={{ color: 'var(--primary)' }} />}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="card-heading" style={{ marginBottom: '16px' }}><Type size={16} style={{display:'inline', marginRight:'8px'}}/> {t('fontSize') || 'Typography Scale'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                    {[
                      { key: 'standard', label: t('standard') || 'Standard', size: '14px' },
                      { key: 'large', label: t('large') || 'Large', size: '18px' },
                      { key: 'extraLarge', label: t('extraLarge') || 'Extra Large', size: '22px' },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => setFontSize(opt.key)} style={{
                        padding: '16px', borderRadius: '12px', border: `2px solid ${fontSize === opt.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                        background: fontSize === opt.key ? 'var(--bg-elevated)' : 'transparent', cursor: 'pointer',
                        color: fontSize === opt.key ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                      }}>
                        <span style={{ fontSize: opt.size, fontWeight: '800', lineHeight: 1 }}>Aa</span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LANGUAGE */}
            {activeTab === 'language' && (
              <div className="fade-in">
                <h4 className="card-heading" style={{ marginBottom: '16px' }}>Display Language</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {[
                    { key: 'English', label: 'English', flag: '🇺🇸', native: 'English' },
                    { key: 'Hindi', label: 'Hindi', flag: '🇮🇳', native: 'हिंदी' },
                    { key: 'Gujarati', label: 'Gujarati', flag: '🇮🇳', native: 'ગુજરાતી' },
                  ].map(lang => (
                    <button key={lang.key} onClick={() => setLanguage(lang.key)} style={{
                      padding: '24px 16px', borderRadius: '12px', border: `2px solid ${language === lang.key ? '#06b6d4' : 'rgba(255,255,255,0.05)'}`,
                      background: language === lang.key ? 'rgba(6, 182, 212, 0.05)' : 'transparent', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                    }}>
                      <span style={{ fontSize: '28px' }}>{lang.flag}</span>
                      <span style={{ fontWeight: '800', color: language === lang.key ? '#06b6d4' : 'var(--text-primary)', fontSize: '16px' }}>{lang.native}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{lang.label}</span>
                      {language === lang.key && <Check size={16} style={{ color: '#06b6d4', marginTop: '4px' }} />}
                    </button>
                  ))}
                </div>
                <div className="alert alert-info" style={{ marginTop: '32px' }}>
                  <h4 className="alert-title">Localization Engine</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>All clinical diagnoses, OCR results, and AI summaries will be natively translated into your selected language globally across the platform.</p>
                </div>
              </div>
            )}

            {/* TAB: ACCOUNT */}
            {activeTab === 'account' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800' }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User size={32} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{user?.name || 'MediScan User'}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{user?.email || 'user@example.com'}</p>
                    <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Provider: {user?.oauthProvider || 'Email/Password'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="card-heading" style={{ marginBottom: '16px' }}>Personal Information</h4>
                  <div className="form-row-2col">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '13px' }}>{t('name') || 'Full Name'}</label>
                      <input className="form-control" value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="Your name" style={{ height: '44px', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '13px' }}>{t('phone') || 'Phone Number'}</label>
                      <input className="form-control" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} placeholder="+91 XXXXXXXXXX" style={{ height: '44px', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '13px' }}>{t('dateOfBirth') || 'Date of Birth'}</label>
                      <input className="form-control" type="date" value={form.dateOfBirth} onChange={e => handleFormChange('dateOfBirth', e.target.value)} style={{ height: '44px', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '13px' }}>{t('gender') || 'Gender'}</label>
                      <select className="form-control" value={form.gender} onChange={e => handleFormChange('gender', e.target.value)} style={{ height: '44px', borderRadius: '8px' }}>
                        <option value="">Select gender</option>
                        <option value="Male">{t('male') || 'Male'}</option>
                        <option value="Female">{t('female') || 'Female'}</option>
                        <option value="Other">{t('other') || 'Other'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 className="card-heading" style={{ marginBottom: '16px' }}>Security & Privacy Control</h4>
                
                <ToggleSwitch 
                  label="Two-Factor Authentication (2FA)" 
                  description="Require an extra security code during login to protect your clinical records."
                  checked={toggles.twoFactor} onChange={() => handleToggle('twoFactor')} color="#f59e0b"
                />
                
                <ToggleSwitch 
                  label="Anonymous Data Donation" 
                  description="Allow MediScan AI to use anonymized metrics to improve medical diagnostic models."
                  checked={toggles.dataSharing} onChange={() => handleToggle('dataSharing')} color="#f59e0b"
                />

                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 className="card-heading" style={{ color: 'var(--danger)', marginBottom: '12px' }}>Danger Zone</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Permanently delete your account and wipe all patient records from the MediScan network.</p>
                  <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '13px', background: 'transparent', border: '1px solid var(--danger)' }}>Delete Account Data</button>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 className="card-heading" style={{ marginBottom: '16px' }}>Communication Preferences</h4>
                
                <ToggleSwitch 
                  label="Email Alerts" 
                  description="Receive critical alerts and PDF summaries via your registered email address."
                  checked={toggles.emailNotifs} onChange={() => handleToggle('emailNotifs')} color="#ec4899"
                />
                
                <ToggleSwitch 
                  label="Push Notifications" 
                  description="Get browser notifications when lab reports finish processing."
                  checked={toggles.pushNotifs} onChange={() => handleToggle('pushNotifs')} color="#ec4899"
                />

                <ToggleSwitch 
                  label="Weekly Health Summary" 
                  description="Receive a weekly digest of your clinical profile and scanner activity."
                  checked={toggles.weeklyReport} onChange={() => handleToggle('weeklyReport')} color="#ec4899"
                />
              </div>
            )}

            {/* TAB: ACCESSIBILITY */}
            {activeTab === 'accessibility' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 className="card-heading" style={{ marginBottom: '16px' }}>Assistive Technologies</h4>
                
                <ToggleSwitch 
                  label="High Contrast Mode" 
                  description="Increase UI contrast ratios to WCAG AAA standards for better visibility."
                  checked={toggles.highContrast} onChange={() => handleToggle('highContrast')} color="#3b82f6"
                />
                
                <ToggleSwitch 
                  label="Screen Reader Optimization" 
                  description="Inject extended ARIA labels and verbose alt-texts across all medical cards."
                  checked={toggles.screenReader} onChange={() => handleToggle('screenReader')} color="#3b82f6"
                />

                <div className="alert alert-info" style={{ marginTop: '24px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Note: Font scaling can be configured in the <strong>Appearance</strong> tab. Language localization is handled in the <strong>Language</strong> tab.</p>
                </div>
              </div>
            )}

            {/* Universal Save Button */}
            <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              {error && <span style={{ color: 'var(--danger)', fontSize: '14px', fontWeight: '600' }}>{error}</span>}
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{
                background: saved ? 'var(--success)' : (tabs.find(t=>t.id===activeTab)?.color || 'var(--primary)'),
                color: '#fff', padding: '12px 24px', fontSize: '15px', borderRadius: '10px', minWidth: '160px',
                transition: 'all 0.3s'
              }}>
                {saving ? <><Loader2 size={16} className="spin" /> Processing...</> : saved ? <><Check size={16} /> Saved Successfully</> : 'Save Preferences'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
