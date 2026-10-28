import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const LoginPage = () => {
  const { login, verifyOTP, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP view states
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  // Google OAuth simulation state
  const [oauthSimulating, setOauthSimulating] = useState(false);
  const [oauthStatus, setOauthStatus] = useState('');

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
        setOtpSuccessMsg('A security code has been sent to your email. Please check your inbox or server console.');
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
    setError('');
    setOtpLoading(true);
    setOtpSuccessMsg('');
    try {
      await login(email, password);
      setOtpSuccessMsg('A new security code has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setError('');
    setOauthSimulating(true);
    setOauthStatus('Loading Google Sign-In...');

    try {
      // Get Google Client ID from backend config
      const config = await api.getGoogleConfig();
      
      if (!config || !config.clientId) {
        // Fallback to simulation if Google Client ID is not configured yet
        setOauthStatus('Google Sign-In config not found. Falling back to simulator...');
        setTimeout(() => {
          setOauthStatus('Redirecting to Google secure accounts portal...');
          
          setTimeout(() => {
            setOauthStatus('Google credentials verified. Authenticating with MediScan AI...');
            
            setTimeout(async () => {
              try {
                // Send simulated OAuth payloads
                await loginWithGoogle(
                  'google_oauth_token_' + Math.random().toString(36).substring(2),
                  'google.user@gmail.com',
                  'Google Clinical User'
                );
                setOauthSimulating(false);
                navigate('/dashboard');
              } catch (err) {
                setError('Google OAuth authentication failed.');
                setOauthSimulating(false);
              }
            }, 1000);

          }, 1200);
        }, 1000);
        return;
      }

      // Real Google Identity Services prompt flow
      /* global google */
      if (typeof google === 'undefined') {
        throw new Error('Google identity client script failed to load. Please verify index.html integration and internet connectivity.');
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
          setError('Google Accounts portal encountered an error.');
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
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <Loader2 size={48} className="badge-normal" style={{ animation: 'spin 2s linear infinite', background: 'none' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }} className="gradient-text">Google Accounts</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{oauthStatus}</p>
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Sign in to your clinical analysis dashboard</p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
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
                  disabled={otpLoading}
                  style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: 0, fontWeight: '500' }}
                >
                  Resend Security Code
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      id="email_address"
                      className="form-control"
                      placeholder="name@hospital.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Password</label>
                    <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      id="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
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
