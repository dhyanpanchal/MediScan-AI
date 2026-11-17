import { translateMedicinePayload } from './clinicalTranslations';
import { getHistoryCacheKey, clearHistoryCache } from './historyCache';

let API_URL = import.meta.env.VITE_API_URL || '/api';

// Self-healing: If running on a production domain but VITE_API_URL points to localhost, ignore it and fall back to relative /api
if (typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' && 
    (API_URL.includes('localhost') || API_URL.includes('127.0.0.1'))) {
  API_URL = '/api';
}

if (API_URL.startsWith('http') && !API_URL.endsWith('/api') && !API_URL.includes('/api/')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

const createAbortError = (msg = 'Request was cancelled.') => {
  if (typeof DOMException !== 'undefined') return new DOMException(msg, 'AbortError');
  const err = new Error(msg);
  err.name = 'AbortError';
  return err;
};

/**
 * Helper to fetch with auth headers, timeout, AbortController, and automatic JSON parsing.
 */
async function request(endpoint, options = {}) {
  const { timeout = (/^\/(scan|report|disease)/.test(endpoint) ? 90000 : 25000), signal, ...fetchOptions } = options;
  const Controller = typeof AbortController !== 'undefined' ? AbortController : class { constructor() { this.signal = { aborted: false, addEventListener: () => {}, removeEventListener: () => {} }; } abort() { this.signal.aborted = true; } };
  const controller = new Controller();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener?.('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
  try {
    const headers = typeof Headers !== 'undefined' ? new Headers(fetchOptions.headers) : Object.assign({}, fetchOptions.headers);
    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
    if (typeof headers.set === 'function') {
      if (!isFormData) headers.set('Content-Type', 'application/json');
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('mediscan_token') : null;
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } else {
      if (!isFormData) headers['Content-Type'] = 'application/json';
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('mediscan_token') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, { ...fetchOptions, headers, signal: controller.signal });
    let data;
    if (typeof response.json === 'function') {
      try {
        data = await response.json();
      } catch {
        if (typeof response.text === 'function') {
          const raw = await response.text();
          try { data = JSON.parse(raw); } catch { data = null; }
        }
      }
    } else if (typeof response.text === 'function') {
      const raw = await response.text();
      try { data = JSON.parse(raw); } catch { data = null; }
    }
    if (!response.ok) {
      const error = new Error(data?.error || (response.status === 413 ? 'The uploaded file exceeds the 10 MB limit.' : `Server returned HTTP ${response.status}. Please try again.`));
      error.status = response.status;
      error.retryAfter = Number(response.headers?.get?.('retry-after')) || 0;
      if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mediscan:unauthorized'));
        }
      }
      throw error;
    }
    if (!data) throw new Error('Server returned an invalid response. Please try again.');
    return data;
  } catch (error) {
    if (signal?.aborted) throw createAbortError('Request was cancelled.');
    if (timedOut) throw new Error('Request timed out. Please try again.');
    throw error;
  } finally {
    if (typeof clearTimeout !== 'undefined') clearTimeout(timer);
    signal?.removeEventListener?.('abort', abort);
  }
}

async function requestWithRetry(endpoint, options = {}) {
  // Replaying uploads can create duplicate history; only explicit busy responses are retryable.
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return await request(endpoint, options); }
    catch (error) {
      if (options.signal?.aborted || attempt || ![429, 503].includes(error.status)) throw error;
      await new Promise((resolve, reject) => {
        const abort = () => { if (typeof clearTimeout !== 'undefined') clearTimeout(timer); reject(createAbortError('Request was cancelled.')); };
        const timer = setTimeout(() => { options.signal?.removeEventListener?.('abort', abort); resolve(); }, Math.min(5000, Math.max(1500, error.retryAfter * 1000)));
        if (options.signal?.aborted) abort();
        else options.signal?.addEventListener?.('abort', abort, { once: true });
      });
    }
  }
}

async function fetchFileBlob(fileUrl, options = {}) {
  const base = new URL(API_URL, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  const url = new URL(fileUrl, base.origin);
  // Never send a bearer token to an arbitrary URL stored in a record.
  if (url.origin !== base.origin || !/^\/(?:api\/)?uploads\/[^/]+$/.test(url.pathname)) throw new Error('Invalid document URL');
  const Controller = typeof AbortController !== 'undefined' ? AbortController : class { constructor() { this.signal = { aborted: false, addEventListener: () => {}, removeEventListener: () => {} }; } abort() { this.signal.aborted = true; } };
  const controller = new Controller();
  const abort = () => controller.abort();
  options.signal?.addEventListener?.('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, 30000);
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('mediscan_token') : '';
    const headers = { Authorization: `Bearer ${token || ''}` };
    const response = await fetch(url.href, { headers, signal: controller.signal });
    if (!response.ok) { const error = new Error(`Document unavailable (HTTP ${response.status})`); error.status = response.status; throw error; }
    return await response.blob();
  } finally { if (typeof clearTimeout !== 'undefined') clearTimeout(timer); options.signal?.removeEventListener?.('abort', abort); }
}

export const api = {
  fetchFileBlob,
  // Auth API
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  googleOAuth: (oauthData) => request('/auth/google-oauth', {
    method: 'POST',
    body: JSON.stringify(oauthData),
  }),

  verifyOTP: (otpData) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(otpData),
  }),

  resendOTP: (email) => request('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  resetPassword: (payload) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getGoogleConfig: () => request('/auth/google-config'),
  getSmtpStatus: () => request('/auth/smtp-status'),
  getMe: () => request('/auth/me'),

  // User Dashboard & Profiles
  getProfile: () => request('/user/profile'),
  updateProfile: (profileData) => request('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  getDashboardStats: () => request('/user/dashboard'),
  getScans: (search = '') => request(`/user/scans?search=${encodeURIComponent(search)}`),
  getReports: (search = '') => request(`/user/reports?search=${encodeURIComponent(search)}`),
  getMedicineSearches: async (search = '') => {
    let items = [];
    let apiSucceeded = false;

    // Tier 1: Try dedicated user medicine searches endpoint
    try {
      const res = await request(`/user/medicine-searches?search=${encodeURIComponent(search)}`);
      if (res && res.success && Array.isArray(res.data)) {
        items = res.data;
        apiSucceeded = true;
      }
    } catch (e) {
      console.warn('[MediScan API] /user/medicine-searches unavailable, trying admin endpoint...', e.message);
    }

    // Tier 3: Try user dashboard stats (which returns recentMedicineSearches)
    if (!apiSucceeded || items.length === 0) {
      try {
        const dashRes = await request('/user/dashboard');
        if (dashRes && dashRes.success && Array.isArray(dashRes.data?.recentMedicineSearches)) {
          let list = dashRes.data.recentMedicineSearches;
          if (search) {
            const q = search.toLowerCase();
            list = list.filter(m => 
              (m.medicineName && m.medicineName.toLowerCase().includes(q)) ||
              (m.searchQuery && m.searchQuery.toLowerCase().includes(q)) ||
              (m.genericName && m.genericName.toLowerCase().includes(q))
            );
          }
          if (list.length > 0) {
            items = list;
          }
        }
      } catch (e) {
        console.warn('[MediScan API] Dashboard fallback unavailable...', e.message);
      }
    }

    // Tier 4: Merge client-side local searches cache (isolated by account, genuinely empty for new users)
    try {
      const cacheKey = getHistoryCacheKey();
      const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      if (Array.isArray(local) && local.length > 0) {
        const existingIds = new Set(items.map(i => (i.id || i._id || '').toString()));
        const existingQueries = new Set(items.map(i => (i.searchQuery || '').toLowerCase().trim()));
        
        for (const loc of local) {
          if (loc.id && String(loc.id).startsWith('search_init_')) continue;
          const locId = (loc.id || loc._id || '').toString();
          const locQuery = (loc.searchQuery || '').toLowerCase().trim();
          if ((!locId || !existingIds.has(locId)) && (!locQuery || !existingQueries.has(locQuery))) {
            if (!search || (loc.medicineName && loc.medicineName.toLowerCase().includes(search.toLowerCase())) || (loc.searchQuery && loc.searchQuery.toLowerCase().includes(search.toLowerCase()))) {
              items.push(loc);
              if (locId) existingIds.add(locId);
              if (locQuery) existingQueries.add(locQuery);
            }
          }
        }
      }
    } catch (_) {}

    return { success: true, data: items };
  },
  deleteScan: (id) => request(`/user/scans/${id}`, { method: 'DELETE' }),
  deleteReport: (id) => request(`/user/reports/${id}`, { method: 'DELETE' }),
  deleteMedicineSearch: async (id) => {
    try {
      await request(`/user/medicine-searches/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (!String(id).startsWith('search_')) throw e;
    }
    try {
      const cacheKey = getHistoryCacheKey();
      const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      localStorage.setItem(cacheKey, JSON.stringify(local.filter(i => (i.id || i._id) !== id)));
      localStorage.removeItem('mediscan_text_searches');
    } catch (_) {}
    return { success: true, message: 'Record deleted successfully' };
  },
  clearHistory: async () => {
    await request('/user/history/clear', { method: 'DELETE' });
    try {
      clearHistoryCache();
    } catch (_) {}
    return { success: true, message: 'All records cleared' };
  },

  // Scanning & Analytics File Uploads (AI-powered — auto-retry on overload)
  scanMedicine: (formData, options = {}) => requestWithRetry('/scan', {
    method: 'POST',
    body: formData, // FormData contains 'image' file
    ...options,
  }),

  analyzeReport: (formData, options = {}) => requestWithRetry('/report', {
    method: 'POST',
    body: formData, // FormData contains 'file' file
    ...options,
  }),

  translateReport: (reportData, language, options = {}) => requestWithRetry('/report/translate', {
    method: 'POST',
    body: JSON.stringify({ reportData, language }),
    ...options,
  }),


  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: (search = '') => request(`/admin/users?search=${encodeURIComponent(search)}`),
  getAdminUserDetail: (id) => request(`/admin/users/${id}`),
  getAdminScans: (search = '') => request(`/admin/scans?search=${encodeURIComponent(search)}`),
  getAdminReports: (search = '') => request(`/admin/reports?search=${encodeURIComponent(search)}`),
  getAdminDiseases: (search = '') => request(`/admin/diseases?search=${encodeURIComponent(search)}`),
  getAdminMedicineSearches: (search = '') => request(`/admin/medicine-searches?search=${encodeURIComponent(search)}`),

  // Disease Search (AI-powered — auto-retry on overload)
  searchDisease: (query, language = 'en', ageGroup = 'adult', age = null) => requestWithRetry('/disease/search', {
    method: 'POST',
    body: JSON.stringify({ query, language, ageGroup, age }),
  }),

  // Never substitute guessed clinical information for a failed request.
  searchMedicineByName: (medicineName, language = 'en', ageGroup = 'adult', age = null, options = {}) => requestWithRetry('/disease/medicine-search', {
    method: 'POST', body: JSON.stringify({ medicineName, language, ageGroup, age }), ...options,
  }),
  translateMedicine: (data, language = 'en', options = {}) => translateMedicinePayload(data, language, async (medicineData, target) => {
    const response = await request('/scan/translate', {
      method: 'POST', body: JSON.stringify({ medicineData, language: target }), ...options,
    });
    if (!response.success || !response.data) throw new Error('Translation is unavailable. Please try again.');
    return response.data;
  }),
};
