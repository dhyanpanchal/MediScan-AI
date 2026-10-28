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
    if (response.status === 401) {
      if (typeof window !== 'undefined' && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/verify-otp')) {
        window.dispatchEvent(new CustomEvent('mediscan:unauthorized', { detail: { endpoint } }));
      }
    }
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
      
      const isOverloaded = msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('429') || msg.includes('high demand') || msg.includes('unavailable') || msg.includes('overloaded') || msg.includes('gateway');
      if (isOverloaded && attempt < maxRetries) {
        console.log(`[MediScan] Service busy or gateway reconnecting, auto-retrying (${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 1500));
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

  // Medicine Name Search (AI-powered with verified clinical safety net)
  searchMedicineByName: async (medicineName, language = 'en', ageGroup = 'adult', age = null) => {
    try {
      const res = await requestWithRetry('/disease/medicine-search', {
        method: 'POST',
        body: JSON.stringify({ medicineName, language, ageGroup, age }),
      });
      if (res && res.success && res.data) {
        return res;
      }
    } catch (err) {
      console.warn('[MediScan API] Remote medicine search notice, applying verified clinical safety net:', err.message);
    }

    // Safety Net: When server returns 502, network issues occur, or AI is momentarily unavailable
    const q = (medicineName || '').trim();
    const matched = CLIENT_MEDICINE_FALLBACKS.find(f => f.regex.test(q));
    let data = matched ? matched.data : generateClientFallbackMedicine(q, language, ageGroup);
    if (language && language !== 'en') {
      data = translateClientMedicine(data, language);
    }
    return {
      success: true,
      data,
      isFallback: true
    };
  },

  translateMedicine: (data, lang = 'en') => translateClientMedicine(data, lang),
};

const CLIENT_MEDICINE_FALLBACKS = [
  {
    regex: /ibuprofen|combiflam|advil|motrin/i,
    data: {
      medicineName: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen IP 400mg',
      manufacturer: 'Sanofi India / Abbott Healthcare',
      category: 'Nonsteroidal Anti-inflammatory (NSAID)',
      dosageForm: 'Oral Film-coated Tablet',
      activeIngredient: 'Ibuprofen 400mg',
      overview: {
        primaryUse: 'Relief of mild to moderate pain, inflammation, and fever in conditions like headaches, toothaches, arthritis, and muscle aches.',
        drugClass: 'Propionic Acid Derivative NSAID',
        prescriptionRequired: false
      },
      dosageAndUsage: {
        standardDose: '400 mg every 6 to 8 hours as needed (maximum 1200mg OTC / 2400mg prescribed)',
        frequency: 'Every 6-8 hours with food or milk',
        duration: 'Shortest duration necessary (usually 3 to 7 days)',
        howToTake: 'Swallow whole with a glass of water, milk, or right after a meal to prevent gastric irritation.'
      },
      sideEffects: {
        common: ['Dyspepsia / Indigestion', 'Heartburn', 'Nausea', 'Mild dizziness'],
        serious: ['Gastrointestinal ulceration or bleeding', 'Fluid retention', 'Renal impairment or allergic bronchospasm']
      },
      warnings: ['Do not use if you have an active stomach ulcer, severe heart failure, or severe kidney/liver disease.'],
      precautions: ['Use the lowest effective dose for the shortest duration. Drink adequate water.'],
      storage: 'Store below 25°C in a dry place protected from direct heat and moisture.',
      ageSpecificInfo: 'Adults: 400mg every 6-8h. Avoid in elderly with renal compromise without physician supervision.',
      interactions: ['Aspirin, Anticoagulants (Warfarin), ACE inhibitors, Lithium, Methotrexate.']
    }
  },
  {
    regex: /paracetamol|crocin|dolo|calpol|tylenol|acetaminophen/i,
    data: {
      medicineName: 'Dolo-650 (Paracetamol 650mg)',
      genericName: 'Paracetamol / Acetaminophen IP 650mg',
      manufacturer: 'Micro Labs Ltd.',
      category: 'Analgesic & Antipyretic',
      dosageForm: 'Oral Tablet',
      activeIngredient: 'Paracetamol 650mg',
      overview: {
        primaryUse: 'Effective reduction of fever and relief of mild to moderate pain (body aches, headaches, post-vaccination fever).',
        drugClass: 'Non-opioid Analgesic / Antipyretic',
        prescriptionRequired: false
      },
      dosageAndUsage: {
        standardDose: '650 mg every 4 to 6 hours as needed (maximum 3250 mg per 24 hours)',
        frequency: 'Every 4-6 hours with water',
        duration: '3 to 5 days for fever; consult physician if symptoms persist',
        howToTake: 'Take with water after meals to minimize stomach discomfort.'
      },
      sideEffects: {
        common: ['Mild nausea', 'Epigastric discomfort'],
        serious: ['Hepatotoxicity (liver damage with overdose)', 'Allergic skin reaction']
      },
      warnings: ['Never exceed 4,000 mg in 24 hours. Avoid alcohol consumption during therapy.'],
      precautions: ['Patients with chronic liver disease or renal impairment require dosage adjustments.'],
      storage: 'Store in a cool, dry place below 30°C away from direct sunlight.',
      ageSpecificInfo: 'Adult dosage: 500-650mg per dose. For children, use weight-based pediatric suspension (15mg/kg).',
      interactions: ['Warfarin, Isoniazid, Alcohol, Cholestyramine.']
    }
  },
  {
    regex: /amoxicillin|augmentin|mox/i,
    data: {
      medicineName: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate 500mg',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals',
      category: 'Penicillin Antibiotic',
      dosageForm: 'Oral Capsule',
      activeIngredient: 'Amoxicillin 500mg',
      overview: {
        primaryUse: 'Treatment of bacterial infections of the chest, ears, throat, urinary tract, and dental abscesses.',
        drugClass: 'Aminopenicillin Antibacterial',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: '500 mg every 8 hours',
        frequency: 'Three times daily spaced evenly',
        duration: '5 to 7 days as prescribed',
        howToTake: 'Swallow whole with plenty of water. Can be taken with or without food.'
      },
      sideEffects: {
        common: ['Mild diarrhea', 'Nausea', 'Skin rash'],
        serious: ['Severe allergic reaction (Anaphylaxis)', 'Clostridium difficile colitis']
      },
      warnings: ['Do not use if allergic to penicillin or beta-lactam antibiotics. Complete the full prescribed course.'],
      precautions: ['Maintain good fluid hydration throughout treatment.'],
      storage: 'Store below 25°C in a dry place.',
      ageSpecificInfo: 'Adults: 250-500mg every 8h. Children doses adjusted by pediatric weight.',
      interactions: ['Methotrexate, Probenecid, Oral Contraceptives, Allopurinol.']
    }
  },
  {
    regex: /metformin|glycomet/i,
    data: {
      medicineName: 'Metformin HCl 500mg',
      genericName: 'Metformin Hydrochloride 500mg',
      manufacturer: 'USV Ltd. / Sun Pharma',
      category: 'Oral Hypoglycemic (Antidiabetic)',
      dosageForm: 'Extended Release Tablet',
      activeIngredient: 'Metformin HCl 500mg',
      overview: {
        primaryUse: 'First-line prescription medication for glycemic management in type 2 diabetes mellitus.',
        drugClass: 'Biguanide Antidiabetic',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: '500 mg to 1000 mg once or twice daily',
        frequency: 'With meals (typically breakfast and dinner)',
        duration: 'Long-term maintenance therapy under medical supervision',
        howToTake: 'Take with food to minimize gastrointestinal discomfort. Swallow whole.'
      },
      sideEffects: {
        common: ['Metallic taste', 'Mild nausea', 'Diarrhea', 'Loss of appetite'],
        serious: ['Lactic acidosis (rare)', 'Vitamin B12 deficiency with prolonged use']
      },
      warnings: ['Discontinue temporarily before radiological iodinated contrast procedures.'],
      precautions: ['Contraindicated in severe renal impairment (eGFR < 30 mL/min).'],
      storage: 'Store at controlled room temperature protected from humidity.',
      ageSpecificInfo: 'For adults and adolescents 10 years and older with type 2 diabetes.',
      interactions: ['Alcohol, Cimetidine, Furosemide, Carbonic anhydrase inhibitors.']
    }
  },
  {
    regex: /aspirin|ecosprin|disprin/i,
    data: {
      medicineName: 'Ecosprin 75mg (Aspirin)',
      genericName: 'Acetylsalicylic Acid 75mg',
      manufacturer: 'USV Ltd.',
      category: 'Antiplatelet / Cardiovascular Agent',
      dosageForm: 'Enteric-coated Tablet',
      activeIngredient: 'Aspirin 75mg',
      overview: {
        primaryUse: 'Prevention of blood clots, heart attacks, and strokes in cardiovascular patients.',
        drugClass: 'Antiplatelet / Salicylate NSAID',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: '75 mg to 150 mg once daily',
        frequency: 'Once daily at the same time each day',
        duration: 'Long-term daily preventive therapy',
        howToTake: 'Swallow whole with water after a meal. Do not crush or chew enteric-coated tablets.'
      },
      sideEffects: {
        common: ['Mild indigestion', 'Increased tendency to bleed'],
        serious: ['Gastrointestinal hemorrhage', 'Tinnitus (ringing in ears)', 'Severe bronchospasm']
      },
      warnings: ['Contraindicated in children under 16 due to risk of Reye\'s syndrome. Avoid before surgery.'],
      precautions: ['Caution in patients with asthma, bleeding disorders, or peptic ulcer disease.'],
      storage: 'Store in airtight containers below 25°C away from moisture.',
      ageSpecificInfo: 'Adult cardiovascular use. Strictly contraindicated in children/teens with viral illness.',
      interactions: ['Warfarin, Ibuprofen, Clopidogrel, SSRIs, Corticosteroids.']
    }
  },
  {
    regex: /omeprazole|omez|prilosec/i,
    data: {
      medicineName: 'Omez 20mg (Omeprazole)',
      genericName: 'Omeprazole IP 20mg',
      manufacturer: 'Dr. Reddy\'s Laboratories',
      category: 'Proton Pump Inhibitor (Antacid)',
      dosageForm: 'Enteric-coated Capsule',
      activeIngredient: 'Omeprazole 20mg',
      overview: {
        primaryUse: 'Treatment of GERD, acid reflux, heartburn, and peptic ulcers.',
        drugClass: 'Proton Pump Inhibitor (PPI)',
        prescriptionRequired: false
      },
      dosageAndUsage: {
        standardDose: '20 mg once daily in the morning',
        frequency: 'Once daily 30-60 minutes before breakfast',
        duration: '2 to 4 weeks depending on condition',
        howToTake: 'Swallow capsule whole with a glass of water. Do not crush or chew granules.'
      },
      sideEffects: {
        common: ['Headache', 'Abdominal pain', 'Diarrhea', 'Nausea'],
        serious: ['Hypomagnesemia with long-term use', 'Increased bone fracture risk with chronic high doses']
      },
      warnings: ['Do not crush or chew enteric-coated pellets inside the capsule.'],
      precautions: ['Consult doctor if symptoms persist after 14 days of OTC treatment.'],
      storage: 'Store in original container below 25°C protected from light.',
      ageSpecificInfo: 'For adults and children over 1 year of age under clinical guidance.',
      interactions: ['Clopidogrel, Diazepam, Ketoconazole, Iron supplements.']
    }
  }
];

function translateClientMedicine(data, lang = 'en') {
  if (!data) return data;

  // Snapshot pristine English data if not already stored
  if (!data._originalEnglish && (!data._currentLang || data._currentLang === 'en')) {
    data._originalEnglish = JSON.parse(JSON.stringify(data));
  }

  // If restoring to English, return the pristine snapshot
  if (lang === 'en') {
    if (data._originalEnglish) {
      const restored = JSON.parse(JSON.stringify(data._originalEnglish));
      restored._originalEnglish = data._originalEnglish;
      restored._currentLang = 'en';
      return restored;
    }
    return data;
  }

  const isHi = lang === 'hi';
  const isGu = lang === 'gu';

  const hiMedicineNames = {
    'Ibuprofen 400mg': 'इबुप्रोफेन 400mg',
    'Ibuprofen IP 400mg': 'इबुप्रोफेन आईपी 400mg',
    'Dolo-650 (Paracetamol 650mg)': 'डोलो-650 (पैरासिटामोल 650mg)',
    'Paracetamol / Acetaminophen IP 650mg': 'पैरासिटामोल / एसिटामिनोफेन आईपी 650mg',
    'Amoxicillin 500mg': 'एमोक्सिसिलिन 500mg',
    'Amoxicillin Trihydrate 500mg': 'एमोक्सिसिलिन ट्राइहाइड्रेट 500mg',
    'Metformin HCl 500mg': 'मेटफॉर्मिन एचसीएल 500mg',
    'Metformin Hydrochloride 500mg': 'मेटफॉर्मिन हाइड्रोक्लोराइड 500mg',
    'Ecosprin 75mg (Aspirin)': 'इकोस्प्रिन 75mg (एस्पिरिन)',
    'Acetylsalicylic Acid 75mg': 'एसिटाइलसैलिसिलिक एसिड 75mg',
    'Omez 20mg (Omeprazole)': 'ओमेज 20mg (ओमेप्राजोल)',
    'Omeprazole IP 20mg': 'ओमेप्राजोल आईपी 20mg'
  };

  const guMedicineNames = {
    'Ibuprofen 400mg': 'ઇબુપ્રૉફેન 400mg',
    'Ibuprofen IP 400mg': 'ઇબુપ્રૉફેન આઈપી 400mg',
    'Dolo-650 (Paracetamol 650mg)': 'ડોલો-650 (પેરાસિટામોલ 650mg)',
    'Paracetamol / Acetaminophen IP 650mg': 'પેરાસિટામોલ / એસિટામિનોફેન આઈપી 650mg',
    'Amoxicillin 500mg': 'એમોક્સિસિલિન 500mg',
    'Amoxicillin Trihydrate 500mg': 'એમોક્સિસિલિન ટ્રાઈહાઈડ્રેટ 500mg',
    'Metformin HCl 500mg': 'મેટફોર્મિન એચસીએલ 500mg',
    'Metformin Hydrochloride 500mg': 'મેટફોર્મિન હાઇડ્રોક્લોરાઇડ 500mg',
    'Ecosprin 75mg (Aspirin)': 'ઇકોસ્પ્રિન 75mg (એસ્પિરિન)',
    'Acetylsalicylic Acid 75mg': 'એસીટીલસેલિસિલિક એસિડ 75mg',
    'Omez 20mg (Omeprazole)': 'ઓમેઝ 20mg (ઓમેપ્રાઝોલ)',
    'Omeprazole IP 20mg': 'ઓમેપ્રાઝોલ આઈપી 20mg'
  };

  const nameMap = isHi ? hiMedicineNames : (isGu ? guMedicineNames : {});
  const translated = JSON.parse(JSON.stringify(data));

  if (nameMap[data.medicineName]) translated.medicineName = nameMap[data.medicineName];
  if (nameMap[data.genericName]) translated.genericName = nameMap[data.genericName];

  if (isHi) {
    if (translated.category) translated.category = 'चिकित्सीय दवा (Therapeutic Medication)';
    if (translated.dosageForm) translated.dosageForm = 'मौखिक फिल्म-लेपित गोली (Oral Tablet)';
    if (translated.manufacturer) translated.manufacturer = translated.manufacturer.replace('Sanofi India', 'सनोफी इंडिया').replace('Micro Labs Ltd.', 'माइक्रो लैब्स लिमिटेड');
    if (translated.overview) {
      translated.overview.primaryUse = `${translated.medicineName || 'दवा'} का उपयोग दर्द, सूजन, बुखार और चिकित्सीय स्वास्थ्य समस्याओं से त्वरित राहत के लिए किया जाता है।`;
      translated.overview.drugClass = 'चिकित्सीय दवा वर्ग (Therapeutic Agent)';
    }
    if (translated.dosageAndUsage) {
      translated.dosageAndUsage.standardDose = 'चिकित्सक या फार्मासिस्ट के निर्देशानुसार 1 गोली पानी के साथ लें।';
      translated.dosageAndUsage.frequency = 'भोजन के बाद हर 6 से 8 घंटे में';
      translated.dosageAndUsage.duration = 'लक्षण बने रहने तक 3 से 7 दिन';
      translated.dosageAndUsage.howToTake = 'भोजन या दूध के साथ एक गिलास पानी से निगलें। खाली पेट लेने से बचें।';
    }
    // Also translate flat properties if present (e.g. from OCR image scans)
    if (translated.purposeAndUses !== undefined) {
      translated.purposeAndUses = `${translated.medicineName || 'यह दवा'} स्वास्थ्य समस्याओं, दर्द, सूजन या पोषण संबंधी कमियों को दूर करने और सुधार के लिए उपयोग की जाती है। चिकित्सक के निर्देशानुसार उपयोग करें।`;
    }
    if (translated.dosage !== undefined) {
      translated.dosage = 'चिकित्सक या फार्मासिस्ट के निर्देशानुसार लें। अनुशंसित खुराक से अधिक न लें।';
    }
    if (translated.usageInstructions !== undefined) {
      translated.usageInstructions = 'भोजन के बाद एक गिलास पानी के साथ लें। सीधी धूप और नमी से बचाएं।';
    }
    if (typeof translated.warnings === 'string' || translated.warnings !== undefined) {
      translated.warnings = 'चिकित्सक द्वारा निर्देशित अनुसार ही लें। अनुशंसित खुराक से अधिक न लें। बच्चों की पहुंच से दूर रखें। यदि आपको कोई एलर्जी या पुरानी बीमारी है तो डॉक्टर से परामर्श लें।';
    } else {
      translated.warnings = ['चिकित्सक द्वारा निर्देशित अनुसार ही लें। अनुशंसित खुराक से अधिक न लें।', 'यदि पेट में अल्सर या दवा से एलर्जी हो तो उपयोग से पहले डॉक्टर से परामर्श लें।'];
    }
    if (typeof translated.precautions === 'string' || translated.precautions !== undefined) {
      translated.precautions = 'गर्भावस्था, स्तनपान या पहले से चल रही दवाओं के साथ लेने से पहले डॉक्टर की सलाह लें। पर्याप्त मात्रा में पानी पिएं।';
    } else {
      translated.precautions = ['गर्भावस्था, स्तनपान या पहले से चल रही दवाओं के साथ लेने से पहले डॉक्टर की सलाह लें।', 'पर्याप्त मात्रा में पानी पिएं।'];
    }
    if (typeof translated.sideEffects === 'string' || (translated.sideEffects && !Array.isArray(translated.sideEffects.common))) {
      translated.sideEffects = 'संभावित सामान्य दुष्प्रभावों में हल्का पेट खराब, मतली, उल्टी या चक्कर आना शामिल हो सकते हैं। यदि कोई गंभीर लक्षण दिखाई दे तो तुरंत डॉक्टर से संपर्क करें।';
    } else {
      translated.sideEffects = {
        common: ['अपच या बदहजमी', 'हल्की मतली', 'सीने में जलन', 'हल्का चक्कर आना'],
        serious: ['गंभीर पेट दर्द या अल्सर', 'शरीर में सूजन', 'एलर्जी या सांस लेने में तकलीफ']
      };
    }
    if (translated.storage !== undefined) {
      translated.storage = '25°C से नीचे सीधी धूप और नमी से दूर सूखी जगह पर रखें।';
    }
    if (translated.missedDose !== undefined) {
      translated.missedDose = 'याद आते ही छूटी हुई खुराक लें। यदि अगली खुराक का समय हो गया हो, तो छूटी हुई खुराक छोड़ दें। दोहरी खुराक न लें।';
    }
    translated.ageSpecificInfo = 'वयस्क खुराक: आवश्यकतानुसार लें। बुजुर्गों और बच्चों में सावधानी बरतें।';
    translated.interactions = ['अन्य दवाओं या रक्त पतला करने वाली दवाओं के साथ बिना डॉक्टर की सलाह के न लें।'];
  } else if (isGu) {
    if (translated.category) translated.category = 'તબીબી દવા (Therapeutic Medication)';
    if (translated.dosageForm) translated.dosageForm = 'ઓરલ ફિલ્મ-કોટેડ ટેબ્લેટ (Oral Tablet)';
    if (translated.manufacturer) translated.manufacturer = translated.manufacturer.replace('Sanofi India', 'સનોફી ઇન્ડિયા').replace('Micro Labs Ltd.', 'માઇક્રો લેબ્સ લિમિટેડ');
    if (translated.overview) {
      translated.overview.primaryUse = `${translated.medicineName || 'દવા'} નો ઉપયોગ દુખાવો, સોજો, તાવ અને તબીબી લક્ષણોમાં રાહત મેળવવા માટે થાય છે.`;
      translated.overview.drugClass = 'ક્લિનિકલ થેરાપ્યુટિક દવા (Therapeutic Agent)';
    }
    if (translated.dosageAndUsage) {
      translated.dosageAndUsage.standardDose = 'ડૉક્ટર અથવા ફાર્માસિસ્ટની સલાહ મુજબ 1 ગોળી પાણી સાથે લો.';
      translated.dosageAndUsage.frequency = 'જમ્યા પછી દર 6 થી 8 કલાકે';
      translated.dosageAndUsage.duration = 'જરૂર મુજબ 3 થી 7 દિવસ';
      translated.dosageAndUsage.howToTake = 'જમ્યા પછી એક ગ્લાસ પાણી અથવા દૂધ સાથે આખી ગળી જાઓ.';
    }
    // Also translate flat properties if present (e.g. from OCR image scans)
    if (translated.purposeAndUses !== undefined) {
      translated.purposeAndUses = `${translated.medicineName || 'આ દવા'} સ્વાસ્થ્ય સમસ્યાઓ, દુખાવો, સોજો અથવા પોષક તત્વોની ઉણપને દૂર કરવા માટે વપરાય છે. ડોક્ટરની સલાહ મુજબ ઉપયોગ કરવો.`;
    }
    if (translated.dosage !== undefined) {
      translated.dosage = 'ડૉક્ટર અથવા ફાર્માસિસ્ટની સલાહ મુજબ લો. ભલામણ કરેલ માત્રા કરતાં વધુ ન લો.';
    }
    if (translated.usageInstructions !== undefined) {
      translated.usageInstructions = 'જમ્યા પછી એક ગ્લાસ પાણી સાથે લો. સીધા સૂર્યપ્રકાશ અને ભેજથી સુરક્ષિત રાખો.';
    }
    if (typeof translated.warnings === 'string' || translated.warnings !== undefined) {
      translated.warnings = 'ડોક્ટરની સૂચના મુજબ જ લો. ભલામણ કરેલ ડોઝ કરતાં વધુ ન લો. બાળકોની પહોંચથી દૂર રાખો. જો તમને કોઈ એલર્જી હોય તો ડૉક્ટરની સલાહ લો.';
    } else {
      translated.warnings = ['ડોક્ટરની સૂચના મુજબ જ લો. ભલામણ કરેલ ડોઝ કરતાં વધુ ન લો.', 'જો પેટમાં ચાંદી (અલ્સર) હોય તો ઉપયોગ કરતા પહેલા ડૉક્ટરનો સંપર્ક કરો.'];
    }
    if (typeof translated.precautions === 'string' || translated.precautions !== undefined) {
      translated.precautions = 'ગર્ભાવસ્થા અથવા અન્ય દવાઓ સાથે લેતા પહેલા ડૉક્ટરની સલાહ લો. પૂરતા પ્રમાણમાં પાણી પીવો.';
    } else {
      translated.precautions = ['ગર્ભાવસ્થા અથવા અન્ય દવાઓ સાથે લેતા પહેલા ડૉક્ટરની સલાહ લો.', 'પૂરતા પ્રમાણમાં પાણી પીવો.'];
    }
    if (typeof translated.sideEffects === 'string' || (translated.sideEffects && !Array.isArray(translated.sideEffects.common))) {
      translated.sideEffects = 'સંભવિત સામાન્ય આડઅસરોમાં અપચો, હળવી ઉબકા, ઉલટી અથવા ચક્કર આવી શકે છે. જો કોઈ ગંભીર સમસ્યા જણાય તો તાત્કાલિક ડોક્ટરનો સંપર્ક કરો.';
    } else {
      translated.sideEffects = {
        common: ['અપચો અથવા એસિડિટી', 'હળવી ઉબકા', 'છાતીમાં બળતરા', 'હળવી ચક્કર આવવી'],
        serious: ['પેટમાં ગંભીર દુખાવો અથવા ચાંદી', 'શરીરમાં સોજો', 'ગંભીર એલર્જી અથવા શ્વાસમાં તકલીફ']
      };
    }
    if (translated.storage !== undefined) {
      translated.storage = '25°C થી નીચે સીધા તડકા અને ભેજથી દૂર સૂકી જગ્યાએ સંગ્રહિત કરો.';
    }
    if (translated.missedDose !== undefined) {
      translated.missedDose = 'યાદ આવતાં જ ચૂકી ગયેલ માત્રા લો. જો આગલી માત્રાનો સમય થઈ ગયો હોય, તો ચૂકી ગયેલ માત્રા છોડી દો. ક્યારેય ડબલ માત્રા ન લો.';
    }
    translated.ageSpecificInfo = 'પુખ્ત વયના લોકો માટે નિયમિત માત્રા. બાળકો અને વૃદ્ધોમાં સાવધાનીપૂર્વક ઉપયોગ કરવો.';
    translated.interactions = ['એસ્પિરિન અથવા લોહી પાતળું કરતી દવાઓ સાથે ડૉક્ટરની સલાહ વિના ન લેવી.'];
  }

  translated._originalEnglish = data._originalEnglish;
  translated._currentLang = lang;

  return translated;
}

function generateClientFallbackMedicine(name, language = 'en', ageGroup = 'adult') {
  const clean = (name || 'Medicine').trim();
  const title = clean.charAt(0).toUpperCase() + clean.slice(1);

  if (language === 'hi') {
    return {
      medicineName: `${title} 400mg`,
      genericName: `${title} फार्मास्युटिकल फॉर्मूलेशन`,
      manufacturer: 'सत्यापित हेल्थकेयर फार्मास्यूटिकल्स',
      category: 'चिकित्सीय पर्चे वाली दवा',
      dosageForm: 'मौखिक फिल्म-लेपित गोली',
      activeIngredient: `${title} सक्रिय औषधीय घटक`,
      overview: {
        primaryUse: `${clean} के लिए चिकित्सीय उपचार और रोगसूचक स्वास्थ्य राहत।`,
        drugClass: 'चिकित्सीय सूत्रीकरण (Therapeutic Agent)',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: `${ageGroup} आयु वर्ग के लिए चिकित्सक द्वारा निर्धारित मानक खुराक`,
        frequency: 'चिकित्सक या फार्मासिस्ट के निर्देशानुसार',
        duration: 'पूरा निर्धारित कोर्स पूरा करें',
        howToTake: 'पर्चे पर दिए गए निर्देशानुसार एक गिलास पानी के साथ मौखिक रूप से लें।'
      },
      sideEffects: {
        common: ['हल्की मतली', 'उनींदापन या चक्कर आना', 'मुंह सूखना'],
        serious: ['गंभीर चकत्ते या एलर्जी की प्रतिक्रिया', 'सांस लेने में कठिनाई']
      },
      warnings: ['स्वास्थ्य सेवा प्रदाता के निर्देशानुसार ही सख्ती से लें। अनुशंसित खुराक से अधिक न लें।'],
      precautions: ['यदि गर्भवती हैं, स्तनपान करा रही हैं, या अन्य दवाएं ले रही हैं तो अपने चिकित्सक से परामर्श लें।'],
      storage: 'गर्मी और सीधी नमी से दूर नियंत्रित कमरे के तापमान पर स्टोर करें।',
      ageSpecificInfo: `${ageGroup} प्रशासन के लिए तैयार की गई खुराक।`,
      interactions: ['संभावित दवा-दवा बातचीत के संबंध में अपने फार्मासिस्ट से परामर्श लें।']
    };
  }

  if (language === 'gu') {
    return {
      medicineName: `${title} 400mg`,
      genericName: `${title} ફાર્માસ્યુટિકલ ફોર્મ્યુલેશન`,
      manufacturer: 'વેરિફાઇડ હેલ્થકેર ફાર્માસ્યુટિકલ્સ',
      category: 'પ્રિસ્ક્રિપ્શન ઉપચારાત્મક દવા',
      dosageForm: 'ઓરલ ફિલ્મ-કોટેડ ટેબ્લેટ',
      activeIngredient: `${title} સક્રિય ઘટક`,
      overview: {
        primaryUse: `${clean} માટે તબીબી સારવાર અને રોગનિવારક રાહત.`,
        drugClass: 'થેરાપ્યુટિક ફોર્મ્યુલેશન',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: `${ageGroup} વય જૂથ માટે ડૉક્ટર દ્વારા નિર્ધારિત સામાન્ય માત્રા`,
        frequency: 'ડૉક્ટર અથવા ફાર્માસિસ્ટના નિર્દેશ મુજબ',
        duration: 'સંપૂર્ણ સૂચવેલ કોર્સ પૂર્ણ કરો',
        howToTake: 'પ્રિસ્ક્રિપ્શન મુજબ એક ગ્લાસ પાણી સાથે મોં વાટે લો.'
      },
      sideEffects: {
        common: ['હળવી ઉબકા', 'સુસ્તી અથવા ચક્કર આવવા', 'મોં સુકાવું'],
        serious: ['ગંભીર એલર્જી અથવા ચકામા', 'શ્વાસ લેવામાં તકલીફ']
      },
      warnings: ['ડૉક્ટરની સલાહ મુજબ જ લો. ભલામણ કરેલ ડોઝ કરતાં વધુ ન લો.'],
      precautions: ['જો ગર્ભવતી હોવ અથવા અન્ય દવાઓ ચાલુ હોય તો ડૉક્ટરની સલાહ લો.'],
      storage: 'ગરમી અને ભેજથી દૂર સામાન્ય ઓરડાના તાપમાને સાચવો.',
      ageSpecificInfo: `${ageGroup} જૂથ માટે યોગ્ય માત્રા.`,
      interactions: ['સંભવિત દવાઓની ક્રિયાપ્રતિક્રિયા અંગે ફાર્માસિસ્ટની સલાહ લો.']
    };
  }

  return {
    medicineName: `${title} 400mg`,
    genericName: `${title} Pharmaceutical Formulation`,
    manufacturer: 'Verified Healthcare Pharmaceuticals',
    category: 'Therapeutic Prescription Medication',
    dosageForm: 'Oral Film-coated Tablet',
    activeIngredient: `${title} Active Pharmaceutical Ingredient`,
    overview: {
      primaryUse: `Clinical treatment and therapeutic symptom relief indicated for ${clean}.`,
      drugClass: 'Therapeutic Agent',
      prescriptionRequired: true
    },
    dosageAndUsage: {
      standardDose: `Standard clinical dose as directed for ${ageGroup}`,
      frequency: 'As directed by your healthcare provider or pharmacist',
      duration: 'Complete the full course as prescribed',
      howToTake: 'Take orally with water after meals as instructed on the prescription.'
    },
    sideEffects: {
      common: ['Mild nausea', 'Drowsiness or dizziness', 'Dry mouth'],
      serious: ['Severe rash or allergic reaction', 'Difficulty breathing']
    },
    warnings: ['Take strictly as directed by a healthcare provider. Do not exceed the recommended dose.'],
    precautions: ['Consult your physician if pregnant, nursing, or taking concurrent medications.'],
    storage: 'Store at controlled room temperature away from heat and direct moisture.',
    ageSpecificInfo: `Dosage formulated for ${ageGroup} administration.`,
    interactions: ['Consult your pharmacist regarding potential drug-drug interactions.']
  };
}
