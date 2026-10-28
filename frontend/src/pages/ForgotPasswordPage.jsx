import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return setErrorMessage('Please fill in your email address.');
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setSuccessMessage(res.message);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div style={{ maxWidth: '400px', width: '100%' }} className="fade-in">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>We will email you password recovery instructions</p>
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

          {successMessage ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                color: 'var(--primary)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                fontWeight: '500',
                lineHeight: '1.4'
              }}>
                {successMessage}
              </div>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Registered Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    placeholder="s.jenkins@clinic.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Sending Request...' : 'Send Recovery Email'} <Send size={16} />
              </button>
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
