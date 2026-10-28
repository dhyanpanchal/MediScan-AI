import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Try to load user profile on startup if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('mediscan_token');
      if (token) {
        try {
          const res = await api.getProfile();
          if (res.success) {
            setUser(res.data);
          } else {
            // Token is invalid/expired
            localStorage.removeItem('mediscan_token');
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err.message);
          localStorage.removeItem('mediscan_token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  // Listen for unauthorized 401 events from API requests to cleanly reset session
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('mediscan_token');
      setUser(null);
    };

    window.addEventListener('mediscan:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('mediscan:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.otpRequired) {
        return res; // Hand off to component to display OTP screen
      }
      if (res.success) {
        localStorage.setItem('mediscan_token', res.data.token);
        setUser(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email, otp) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOTP({ email, otp });
      if (res.success) {
        localStorage.setItem('mediscan_token', res.data.token);
        setUser(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.register(userData);
      if (res.success) {
        localStorage.setItem('mediscan_token', res.data.token);
        setUser(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (oauthToken, email, name) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.googleOAuth({ oauthToken, email, name });
      if (res.success) {
        localStorage.setItem('mediscan_token', res.data.token);
        setUser(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'Google OAuth login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mediscan_token');
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await api.updateProfile(profileData);
      if (res.success) {
        setUser(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const resendOTP = async (email) => {
    setError(null);
    try {
      const res = await api.resendOTP(email);
      return res;
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    verifyOTP,
    resendOTP,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
