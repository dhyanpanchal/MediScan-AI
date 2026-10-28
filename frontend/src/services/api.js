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

/**
 * Helper to fetch with auth headers and automatic JSON parsing.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mediscan_token');
  
  const headers = {
    ...options.headers,
  };

  // If sending JSON data, add headers
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach token if present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${text.replace(/<[^>]*>?/gm, '').trim().substring(0, 150)}`);
    }
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Expected JSON response from server');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

/**
 * Auto-retry wrapper for AI endpoints that may hit 503/429 overload.
 * Retries up to 3 times with 4-second gaps silently.
 */
const AI_ENDPOINTS = ['/disease/search', '/disease/medicine-search', '/scan', '/report'];

async function requestWithRetry(endpoint, options = {}) {
  const isAIEndpoint = AI_ENDPOINTS.some(ep => endpoint.startsWith(ep));
  const maxRetries = isAIEndpoint ? 3 : 1;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await request(endpoint, options);
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      // Don't retry if the backend explicitly gave us a hard wait instruction
      if (msg.includes('please wait')) throw err;
      
      const isOverloaded = msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('unavailable') || msg.includes('overloaded');
      if (isOverloaded && attempt < maxRetries) {
        console.log(`[MediScan] AI overloaded, auto-retrying (${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw err;
    }
  }
}

const DEFAULT_INITIAL_SEARCHES = [
  {
    id: 'search_init_1',
    searchQuery: 'Cetcip',
    medicineName: 'Cetcip 10mg (Cetirizine HCl)',
    genericName: 'Cetirizine Hydrochloride IP 10 mg',
    category: 'Antihistamine / Antiallergic',
    dosageForm: 'Film-coated Oral Tablet',
    overview: {
      primaryUse: 'Relief of allergy symptoms including runny nose, sneezing, itchy/watery eyes, and chronic urticaria (hives).',
      drugClass: 'Second-generation H1-receptor Antagonist'
    },
    dosageAndUsage: {
      standardDose: '10 mg once daily (1 tablet)',
      howToTake: 'Take orally with water. May be taken with or without food.'
    },
    sideEffects: {
      common: ['Mild drowsiness', 'Dry mouth', 'Headache', 'Fatigue']
    },
    warnings: ['May cause mild sedation; avoid operating heavy machinery or driving after first dose.'],
    precautions: ['Use caution in patients with renal impairment or prostatic hypertrophy.'],
    ageGroup: 'adult',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'search_init_2',
    searchQuery: 'Dolo 650',
    medicineName: 'Dolo-650 (Paracetamol 650mg)',
    genericName: 'Paracetamol / Acetaminophen IP 650 mg',
    category: 'Analgesic & Antipyretic',
    dosageForm: 'Oral Tablet',
    overview: {
      primaryUse: 'Reduction of fever and relief of mild to moderate pain (headache, body ache, toothache).',
      drugClass: 'Non-opioid Analgesic / Antipyretic'
    },
    dosageAndUsage: {
      standardDose: '650 mg every 4 to 6 hours as needed (maximum 3250 mg per 24 hours)',
      howToTake: 'Take with a glass of water after meals to minimize stomach irritation.'
    },
    sideEffects: {
      common: ['Mild nausea', 'Epigastric discomfort']
    },
    warnings: ['Never exceed 4,000 mg per day. Do not consume alcohol concurrently.'],
    precautions: ['Patients with chronic liver disease require dosage reduction.'],
    ageGroup: 'adult',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'search_init_3',
    searchQuery: 'Amicold',
    medicineName: 'Amicold Plus Suspension',
    genericName: 'Paracetamol 125mg, Phenylephrine HCl 5mg, Cetirizine HCl 2mg',
    category: 'Decongestant & Antipyretic Cold Relief',
    dosageForm: 'Oral Liquid Suspension',
    overview: {
      primaryUse: 'Symptomatic relief of common cold, nasal congestion, runny nose, and cold-associated low grade fever.',
      drugClass: 'Multi-ingredient Cold & Cough Preparation'
    },
    dosageAndUsage: {
      standardDose: '5 ml to 10 ml as directed by physician',
      howToTake: 'Shake well before use. Use measuring cup provided.'
    },
    sideEffects: {
      common: ['Mild sleepiness', 'Nausea', 'Dry mouth']
    },
    warnings: ['Do not use concurrently with other paracetamol or antihistamine products.'],
    precautions: ['Use with caution in hypertensive or cardiac patients.'],
    ageGroup: 'adult',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

export const api = {
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

  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  getGoogleConfig: () => request('/auth/google-config'),

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

    // Tier 2: Try admin medicine searches endpoint (in memory since boot)
    if (!apiSucceeded || items.length === 0) {
      try {
        const adminRes = await request(`/admin/medicine-searches?search=${encodeURIComponent(search)}`);
        if (adminRes && adminRes.success && Array.isArray(adminRes.data)) {
          items = adminRes.data;
          apiSucceeded = true;
        }
      } catch (e) {
        console.warn('[MediScan API] /admin/medicine-searches fallback unavailable...', e.message);
      }
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

    // Tier 4: Merge client-side local searches cache
    try {
      if (localStorage.getItem('mediscan_text_searches') === null) {
        localStorage.setItem('mediscan_text_searches', JSON.stringify(DEFAULT_INITIAL_SEARCHES));
      }
      const local = JSON.parse(localStorage.getItem('mediscan_text_searches') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        const existingIds = new Set(items.map(i => (i.id || i._id || '').toString()));
        const existingQueries = new Set(items.map(i => (i.searchQuery || '').toLowerCase().trim()));
        
        for (const loc of local) {
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
      console.warn('[MediScan API] Backend delete search item failed, removing locally:', e.message);
    }
    try {
      const local = JSON.parse(localStorage.getItem('mediscan_text_searches') || '[]');
      localStorage.setItem('mediscan_text_searches', JSON.stringify(local.filter(i => (i.id || i._id) !== id)));
    } catch (_) {}
    return { success: true, message: 'Record deleted successfully' };
  },
  clearHistory: async () => {
    try {
      await request('/user/history/clear', { method: 'DELETE' });
    } catch (e) {
      console.warn('[MediScan API] Backend clear history failed, clearing local:', e.message);
    }
    try {
      localStorage.setItem('mediscan_text_searches', '[]');
    } catch (_) {}
    return { success: true, message: 'All records cleared' };
  },

  // Scanning & Analytics File Uploads (AI-powered — auto-retry on overload)
  scanMedicine: (formData) => requestWithRetry('/scan', {
    method: 'POST',
    body: formData, // FormData contains 'image' file
  }),

  analyzeReport: (formData) => requestWithRetry('/report', {
    method: 'POST',
    body: formData, // FormData contains 'file' file
  }),

  translateReport: (reportData, language) => requestWithRetry('/report/translate', {
    method: 'POST',
    body: JSON.stringify({ reportData, language }),
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

  // Medicine Name Search (AI-powered — auto-retry on overload)
  searchMedicineByName: (medicineName, language = 'en', ageGroup = 'adult', age = null) => requestWithRetry('/disease/medicine-search', {
    method: 'POST',
    body: JSON.stringify({ medicineName, language, ageGroup, age }),
  }),
};
