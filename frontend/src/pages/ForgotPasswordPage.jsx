import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, Lock, ArrowLeft, Send, CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Multi-step flow: 'request' (enter email) -> 'reset' (enter OTP + new password)
  const [step, setStep] = useState('request');

  // Input states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Request 6-digit recovery OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      return setErrorMessage('Please fill in your registered email address.');
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setStep('reset');
        setSuccessMessage(`Recovery instructions with a 6-digit code have been sent to ${email}.`);
        setResendCooldown(60);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to send recovery email. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend 6-digit recovery OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setSuccessMessage(`A fresh 6-digit recovery code has been sent to ${email}.`);
        setResendCooldown(60);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend recovery code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP and save new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return setErrorMessage('Please enter the full 6-digit recovery code from your email.');
    }

    if (!newPassword || newPassword.length < 6) {
      return setErrorMessage('New password must be at least 6 characters long.');
    }

    if (newPassword !== confirmPassword) {
      return setErrorMessage('Passwords do not match. Please verify both password fields.');
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({
        email,
        otp: cleanOtp,
        newPassword
      });

      if (res.success) {
        setSuccessMessage('Password reset successfully! Redirecting to login page...');
        // Wait 1.2s to show success feedback, then redirect to login with prefilled email & banner
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Password reset successfully! Please sign in with your new password.',
              email
            }
          });
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. Please verify the 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div style={{ maxWidth: '420px', width: '100%' }} className="fade-in">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
            {step === 'request' ? 'Reset Password' : 'Create New Password'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            {step === 'request'
              ? 'We will email you a 6-digit security recovery code'
              : `Enter the 6-digit recovery code sent to ${email}`}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
          {errorMessage && (
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
              {errorMessage}
            </div>
          )}

          {!errorMessage && successMessage && (
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
              {successMessage}
            </div>
          )}

          {step === 'request' ? (
            /* Step 1: Request Recovery OTP Form */
            <form onSubmit={handleRequestOTP}>
              <div className="form-group">
                <label htmlFor="email">Registered Email Address</label>
                <div className="input-icon-group">
                  <Mail size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    id="email"
                    name="email"
                    placeholder="name@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.25rem' }}
                disabled={loading}
              >
                {loading ? 'Sending Request...' : 'Send Recovery Email'} <Send size={16} />
              </button>
            </form>
          ) : (
            /* Step 2: Enter 6-Digit OTP and New Password Form */
            <form onSubmit={handleResetPassword}>
              {/* 6-Digit OTP input */}
              <div className="form-group">
                <label htmlFor="reset-otp">Enter 6-Digit Recovery Code</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="reset-otp"
                    name="reset-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    style={{
                      letterSpacing: '0.5em',
                      fontSize: '1.35rem',
                      fontWeight: '700',
                      textAlign: 'center',
                      padding: '10px 14px'
                    }}
                    required
                  />
                </div>
              </div>

              {/* New Password input */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="newPassword">New Password</label>
                <div className="input-icon-group">
                  <Lock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
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
                      color: showPassword ? 'var(--secondary)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password input */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-icon-group">
                  <Lock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: showConfirmPassword ? 'var(--secondary)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.25rem' }}
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Reset Password & Sign In'} <CheckCircle size={16} />
              </button>

              {/* Resend and change email actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || resendCooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--secondary)',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    padding: 0,
                    fontWeight: '500'
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Recovery Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {/* Back link */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.875rem'
            }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
