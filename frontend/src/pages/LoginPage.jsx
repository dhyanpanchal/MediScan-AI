import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

const LoginPage = () => {
  const { login, verifyOTP, resendOTP, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(location.state?.message || '');

  // Sync state if redirected with parameters
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      setInfoMessage(location.state.message);
    }
  }, [location.state]);

  // OTP view states
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google OAuth simulation state
  const [oauthSimulating, setOauthSimulating] = useState(false);
  const [oauthStatus, setOauthStatus] = useState('');

  // Handle countdown for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }

    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.otpRequired) {
        setOtpRequired(true);
        setOtpSuccessMsg(res.message || `A 6-digit security code has been sent to ${email}. Please check your inbox.`);
        setResendCooldown(30);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      return setError('Please enter the 6-digit OTP code.');
    }
    if (otp.length !== 6) {
      return setError('OTP must be exactly 6 digits.');
    }

    setError('');
    setOtpLoading(true);
    try {
      await verifyOTP(email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setOtpLoading(true);
    setOtpSuccessMsg('');
    try {
      const res = await resendOTP(email);
      setOtpSuccessMsg(res.message || `A new security code has been sent to ${email}.`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend security code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDemoGoogleLogin = async () => {
    setError('');
    setOauthSimulating(true);
    setOauthStatus('Signing in with Google Account (panchaldhyan007@gmail.com)...');
    try {
      await loginWithGoogle(
        'google_demo_token_' + Date.now(),
        'panchaldhyan007@gmail.com',
        'Dhyan Panchal'
      );
      setOauthSimulating(false);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google account authentication failed.');
      setOauthSimulating(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setError('');
    setOauthSimulating(true);
    setOauthStatus('Connecting to Google Identity Services...');

    try {
      // Get Google Client ID from backend config
      const config = await api.getGoogleConfig();
      
      if (!config || !config.clientId) {
        // Fallback to simulation if Google Client ID is not configured yet
        return handleDemoGoogleLogin();
      }

      // Real Google Identity Services prompt flow
      /* global google */
      if (typeof google === 'undefined') {
        throw new Error('Google identity client script failed to load. Please verify internet connectivity.');
      }

      setOauthStatus('Opening Google Accounts chooser...');
      
      const client = google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: 'email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setOauthStatus('Authenticating user profile via Google API...');
            try {
              // Fetch user info from Google's endpoint
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const userInfo = await userInfoRes.json();
              
              if (!userInfo || !userInfo.email) {
                throw new Error('Failed to retrieve user email from Google Accounts');
              }

              setOauthStatus(`Google account verified (${userInfo.email}). Syncing session...`);
              
              // Register/Login user on our backend using real email/name
              await loginWithGoogle(
                tokenResponse.access_token,
                userInfo.email,
                userInfo.name || userInfo.email.split('@')[0]
              );

              setOauthSimulating(false);
              navigate('/dashboard');
            } catch (authErr) {
              console.error('Google OAuth backend sync error:', authErr);
              setError(authErr.message || 'Google OAuth backend synchronization failed.');
              setOauthSimulating(false);
            }
          } else {
            setError('Google OAuth authorization was declined.');
            setOauthSimulating(false);
          }
        },
        error_callback: (err) => {
          console.warn('Google Accounts error callback:', err);
          setError(`Google Sign-In blocked (Error 400: origin_mismatch). Please add "${window.location.origin}" to Authorized JavaScript origins in Google Cloud Console, or use 1-Click Login.`);
          setOauthSimulating(false);
        }
      });

      client.requestAccessToken();
    } catch (err) {
      console.error('Google login trigger failed:', err);
      setError(err.message || 'Failed to initialize Google Sign-In.');
      setOauthSimulating(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Simulation Overlay */}
      {oauthSimulating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11, 15, 25, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          padding: '1.5rem'
        }}>
          <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <Loader2 size={48} className="badge-normal" style={{ animation: 'spin 2s linear infinite', background: 'none' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }} className="gradient-text">Google Accounts</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{oauthStatus}</p>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', width: '100%' }}>
              Current Origin: <code style={{ color: 'var(--primary)' }}>{window.location.origin}</code>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOauthSimulating(false)}
                style={{ flex: 1, padding: '0.65rem 1rem', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDemoGoogleLogin}
                style={{ flex: 1.2, padding: '0.65rem 1rem', fontSize: '0.875rem' }}
              >
                Instant 1-Click Login
              </button>
            </div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div style={{ maxWidth: '420px', width: '100%' }} className="fade-in">
        {/* Back Link */}
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          ← Back to homepage
        </Link>

        {/* Logo Card Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            fontWeight: '800',
            fontSize: '1.25rem',
            marginBottom: '1rem'
          }}>
            M
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Sign in to your clinical analysis dashboard</p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
          {infoMessage && !otpRequired && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {infoMessage}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {otpRequired ? (
            <form onSubmit={handleOTPSubmit}>
              {otpSuccessMsg && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  fontWeight: '500'
                }}>
                  {otpSuccessMsg}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="otp">Enter 6-Digit OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="otp"
                    className="form-control"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={otpLoading}
                    style={{ 
                      paddingLeft: '1rem',
                      letterSpacing: '0.5em',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      textAlign: 'center'
                    }}
                    required
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  The code was sent to <strong>{email}</strong>.
                </p>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} disabled={otpLoading}>
                {otpLoading ? 'Verifying...' : 'Verify & Sign In'} <ArrowRight size={16} />
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                <button 
                  type="button" 
                  onClick={handleResendOTP} 
                  disabled={otpLoading || resendCooldown > 0}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--secondary)', 
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', 
                    padding: 0, 
                    fontWeight: '500' 
                  }}
                >
                  {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Security Code'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setOtpRequired(false); setOtp(''); setError(''); }} 
                  disabled={otpLoading}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email_address">Email Address</label>
                  <div className="input-icon-group">
                    <Mail size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                      type="text"
                      id="email_address"
                      placeholder="name@hospital.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Password</label>
                    <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div className="input-icon-group">
                    <Lock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        color: showPassword ? 'var(--secondary)' : 'var(--text-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
                </button>
              </form>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.5rem 0',
                color: 'var(--text-dark)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                <span style={{ padding: '0 0.75rem' }}>or connect via</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
              </div>

              {/* Google OAuth Trigger */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGoogleOAuth}
                style={{ 
                  width: '100%', 
                  gap: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDemoGoogleLogin}
                style={{ 
                  width: '100%', 
                  marginTop: '0.75rem',
                  gap: '0.5rem',
                  background: 'transparent',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 1rem'
                }}
                disabled={loading}
              >
                ⚡ Instant 1-Click Google Sign In (panchaldhyan007@gmail.com)
              </button>
            </>
          )}
        </div>

        {/* Footer Link */}
        <p style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          marginTop: '1.5rem'
        }}>
          Don't have a clinical account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
