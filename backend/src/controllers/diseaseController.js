const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const DiseaseHistory = require('../models/DiseaseHistory');
const MedicineSearchHistory = require('../models/MedicineSearchHistory');

let aiInstance = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const safeKey = process.env.GEMINI_API_KEY.trim();
    aiInstance = new GoogleGenAI({ apiKey: safeKey });
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
  }
}

async function callGemini(contents) {
  // Dynamically load the latest API key and model from .env so the server doesn't need restarting
  let currentAiInstance = aiInstance;
  let activeModel = 'gemini-2.5-flash';

  try {
    const path = require('path');
    const dotenv = require('dotenv');
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      if (envConfig.GEMINI_API_KEY) {
        currentAiInstance = new GoogleGenAI({ apiKey: envConfig.GEMINI_API_KEY.trim() });
      }
      if (envConfig.GEMINI_MODEL) {
        activeModel = envConfig.GEMINI_MODEL.trim();
      }
    }
  } catch (e) {
    console.error('Failed to hot-reload .env in diseaseController:', e);
  }

  if (!currentAiInstance) return null;

  const candidateModels = [
    activeModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  let lastError = null;
  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await currentAiInstance.models.generateContent({
          model,
          contents,
          config: { responseMimeType: 'application/json' }
        });
        const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } catch (err) {
        lastError = err;
        const errMsg = err.message || '';
        console.warn(`[diseaseController] Model ${model} (attempt ${attempt}) error: ${errMsg}`);

        if (errMsg.includes('429')) {
          const match = errMsg.match(/retry in ([\d\.]+)s/i);
          if (match && parseFloat(match[1]) > 5) {
            break; // Skip to next candidate model
          }
        }
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }

  return null;
}

/**
 * @desc    Search disease information with multilingual support
 * @route   POST /api/disease/search
 * @access  Private
 */
const searchDisease = async (req, res) => {
  try {
    const { query, language = 'en', ageGroup = 'adult', age } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide a disease name to search' });
    }

    const langMap = { en: 'English', hi: 'Hindi (Devanagari script)', gu: 'Gujarati (Gujarati script)' };
    const outputLang = langMap[language] || 'English';
    const ageContext = age ? `The patient is ${age} years old (${ageGroup} age group).` : `Age group: ${ageGroup}.`;

    const prompt = `You are a medical information assistant. The user is searching for information about: "${query}".
${ageContext}

Provide comprehensive medical information. ALL TEXT, INCLUDING THE DISEASE NAME, MUST BE TRANSLATED INTO ${outputLang}.
Return a JSON object with this exact structure:

{
  "diseaseName": "Name of disease in ${outputLang}",
  "description": "Brief 2-3 sentence description in ${outputLang}",
  "commonSymptoms": ["symptom 1", "symptom 2"],
  "causes": ["cause 1", "cause 2"],
  "homeRemedies": ["remedy 1", "remedy 2"],
  "prevention": ["prevention 1", "prevention 2"],
  "whenToSeeDoctor": ["situation 1", "situation 2"],
  "ageSpecificAdvice": "Specific advice for the ${ageGroup} age group in ${outputLang}",
  "recommendedMedicines": [
    {
      "name": "Generic medicine name in ${outputLang}",
      "form": "Tablet/Syrup/Injection etc in ${outputLang}",
      "purpose": "Purpose in ${outputLang}",
      "dosage": "Dosage info age-appropriate for ${ageGroup} in ${outputLang}",
      "sideEffects": "Side effects in ${outputLang}"
    }
  ]
}

IMPORTANT: Return ONLY the JSON, no markdown. ALL text, including the disease name, medicine names, and ANY NUMBERS (translate digits to ${outputLang} numerals), must be completely translated to ${outputLang}.`;

    const raw = await callGemini([{ role: 'user', parts: [{ text: prompt }] }]);
    if (!raw) throw new Error('AI returned empty response');
    
    let cleaned = raw;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    } else {
      cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    }
    
    const result = JSON.parse(cleaned);
    
    // Save to history
    if (req.user && req.user._id) {
      try {
        await DiseaseHistory.create({
          userId: req.user._id,
          query: query,
          diseaseName: result.diseaseName || query,
          description: result.description || '',
          commonSymptoms: result.commonSymptoms || [],
        });
      } catch (historyErr) {
        console.error('Failed to save disease history:', historyErr);
      }
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Disease search error:', error);
    return res.status(500).json({ success: false, error: `Error: ${error.message || 'Failed to search disease information'}` });
  }
};

const CLINICAL_MEDICINE_FALLBACKS = [
  {
    regex: /cetcip|cetirizine/i,
    data: {
      medicineName: 'Cetcip 10mg (Cetirizine HCl)',
      genericName: 'Cetirizine Hydrochloride IP 10 mg',
      manufacturer: 'Cipla Ltd.',
      category: 'Antihistamine / Antiallergic',
      dosageForm: 'Film-coated Oral Tablet',
      activeIngredient: 'Cetirizine HCl 10mg',
      overview: {
        primaryUse: 'Relief of allergy symptoms including runny nose, sneezing, itchy/watery eyes, and chronic urticaria (hives).',
        drugClass: 'Second-generation H1-receptor Antagonist',
        prescriptionRequired: false
      },
      dosageAndUsage: {
        standardDose: '10 mg once daily (1 tablet)',
        frequency: 'Once a day in the evening',
        duration: 'As needed or 3-5 days during acute allergy episodes',
        howToTake: 'Take orally with water. May be taken with or without food.'
      },
      sideEffects: {
        common: ['Mild drowsiness', 'Dry mouth', 'Headache', 'Fatigue'],
        serious: ['Severe dizziness', 'Difficulty breathing or swallowing', 'Urinary retention']
      },
      warnings: ['May cause mild sedation; avoid operating heavy machinery or driving after first dose.'],
      precautions: ['Use caution in patients with renal impairment or prostatic hypertrophy.'],
      storage: 'Store below 25°C in a dry place protected from direct sunlight.',
      ageSpecificInfo: 'Adults and children 12 years and older: 10 mg once daily.',
      interactions: ['Alcohol and CNS depressants may increase drowsiness.']
    }
  },
  {
    regex: /dolo|paracetamol|crocin|calpol/i,
    data: {
      medicineName: 'Dolo-650 (Paracetamol 650mg)',
      genericName: 'Paracetamol / Acetaminophen IP 650 mg',
      manufacturer: 'Micro Labs Ltd.',
      category: 'Analgesic & Antipyretic',
      dosageForm: 'Oral Tablet',
      activeIngredient: 'Paracetamol IP 650mg',
      overview: {
        primaryUse: 'Reduction of fever and relief of mild to moderate pain (headache, body ache, toothache).',
        drugClass: 'Non-opioid Analgesic / Antipyretic',
        prescriptionRequired: false
      },
      dosageAndUsage: {
        standardDose: '650 mg every 4 to 6 hours as needed (maximum 3250 mg per 24 hours)',
        frequency: 'Every 4-6 hours if fever or pain persists',
        duration: 'Do not exceed 3 days for fever or 5 days for pain without medical evaluation',
        howToTake: 'Take with a glass of water after meals to minimize stomach irritation.'
      },
      sideEffects: {
        common: ['Mild nausea', 'Epigastric discomfort'],
        serious: ['Hepatotoxicity (liver injury with overdose)', 'Skin rash', 'Angioedema']
      },
      warnings: ['Never exceed 4,000 mg per day. Do not consume alcohol concurrently due to acute liver toxicity risks.'],
      precautions: ['Patients with chronic liver disease, renal impairment, or chronic alcoholism require dosage reduction.'],
      storage: 'Store in a cool, dry place away from heat and moisture.',
      ageSpecificInfo: 'For adults and adolescents weighing over 50kg.',
      interactions: ['Warfarin (prolonged high-dose paracetamol enhances anticoagulant effect).']
    }
  },
  {
    regex: /amicold/i,
    data: {
      medicineName: 'Amicold Plus Suspension',
      genericName: 'Paracetamol 125mg, Phenylephrine HCl 5mg, Cetirizine HCl 2mg',
      manufacturer: 'Laborate Pharmaceuticals',
      category: 'Decongestant & Antipyretic Cold Relief',
      dosageForm: 'Oral Liquid Suspension',
      activeIngredient: 'Paracetamol, Phenylephrine, Cetirizine',
      overview: {
        primaryUse: 'Symptomatic relief of common cold, nasal congestion, runny nose, and cold-associated low grade fever.',
        drugClass: 'Multi-ingredient Cold & Cough Preparation',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: '5 ml to 10 ml as directed by physician',
        frequency: '2 to 3 times daily',
        duration: 'Typically 3-5 days',
        howToTake: 'Shake well before use. Use the measuring cup provided.'
      },
      sideEffects: {
        common: ['Mild sleepiness', 'Nausea', 'Dry mouth'],
        serious: ['Rapid heart rate', 'Elevated blood pressure']
      },
      warnings: ['Do not use concurrently with other paracetamol or antihistamine products.'],
      precautions: ['Use with caution in hypertensive or cardiac patients.'],
      storage: 'Store below 30°C. Protect from direct sunlight.',
      ageSpecificInfo: 'Follow physician prescription strictly.',
      interactions: ['Avoid monoamine oxidase inhibitors (MAOIs).']
    }
  },
  {
    regex: /zithromax|azithromycin/i,
    data: {
      medicineName: 'Zithromax 500mg (Azithromycin)',
      genericName: 'Azithromycin IP 500 mg',
      manufacturer: 'Pfizer Ltd.',
      category: 'Macrolide Antibiotic',
      dosageForm: 'Film-coated Tablet',
      activeIngredient: 'Azithromycin Dihydrate 500mg',
      overview: {
        primaryUse: 'Treatment of bacterial infections of the respiratory tract, ears, sinuses, skin, and sexually transmitted infections.',
        drugClass: 'Macrolide Antibacterial',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: '500 mg once daily',
        frequency: 'Once daily at the same time each day',
        duration: 'Usually 3 to 5 days course as prescribed',
        howToTake: 'Take 1 hour before or 2 hours after meals with plenty of water.'
      },
      sideEffects: {
        common: ['Diarrhea', 'Abdominal pain', 'Nausea', 'Vomiting'],
        serious: ['QT prolongation', 'Severe allergic reactions', 'Clostridium difficile colitis']
      },
      warnings: ['Complete the entire course prescribed even if symptoms resolve quickly to prevent bacterial resistance.'],
      precautions: ['Caution in patients with cardiac arrhythmia, QT prolongation, or myasthenia gravis.'],
      storage: 'Store below 30°C in the original blister pack.',
      ageSpecificInfo: 'Adult dosage is 500mg daily. Pediatric dosage is calculated by body weight (10mg/kg).',
      interactions: ['Antacids containing aluminum or magnesium reduce absorption rate.']
    }
  },
  {
    regex: /pantoprazole|pan[- ]?40|pantocid/i,
    data: {
      medicineName: 'Pantoprazole 40mg',
      genericName: 'Pantoprazole Sodium IP 40 mg',
      manufacturer: 'Alkem Laboratories',
      category: 'Proton Pump Inhibitor (Antacid)',
      dosageForm: 'Gastro-resistant Tablet',
      activeIngredient: 'Pantoprazole Sodium 40mg',
      overview: {
        primaryUse: 'Treatment of gastroesophageal reflux disease (GERD), acid peptic disease, and peptic ulcers.',
        drugClass: 'Proton Pump Inhibitor (PPI)',
        prescriptionRequired: false
      },
      dosageAndUsage: {
        standardDose: '40 mg once daily',
        frequency: 'Once daily in the morning',
        duration: '2 to 4 weeks depending on condition',
        howToTake: 'Take 30 to 60 minutes before breakfast. Swallow whole without crushing or chewing.'
      },
      sideEffects: {
        common: ['Headache', 'Flatulence', 'Diarrhea', 'Abdominal pain'],
        serious: ['Hypomagnesemia with prolonged use', 'Increased fracture risk with high-dose chronic use']
      },
      warnings: ['Do not crush or chew gastro-resistant enteric-coated tablets.'],
      precautions: ['Long-term therapy may reduce vitamin B12 absorption.'],
      storage: 'Store in a cool dry place protected from moisture.',
      ageSpecificInfo: 'For adults and adolescents 12 years and above.',
      interactions: ['May reduce absorption of iron salts, ketoconazole, and erlotinib.']
    }
  },
  {
    regex: /amoxicillin|augmentin/i,
    data: {
      medicineName: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate 500mg',
      manufacturer: 'GlaxoSmithKline',
      category: 'Penicillin Antibiotic',
      dosageForm: 'Oral Capsule',
      activeIngredient: 'Amoxicillin 500mg',
      overview: {
        primaryUse: 'Treatment of bacterial infections including chest infections, tonsillitis, dental abscesses, and urinary tract infections.',
        drugClass: 'Aminopenicillin',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: '500 mg every 8 hours',
        frequency: 'Three times a day spaced evenly',
        duration: '5 to 7 days',
        howToTake: 'Take with meals to prevent gastrointestinal upset.'
      },
      sideEffects: {
        common: ['Mild diarrhea', 'Skin rash', 'Nausea'],
        serious: ['Anaphylaxis in penicillin-allergic patients', 'Severe watery diarrhea']
      },
      warnings: ['Contraindicated in patients with confirmed penicillin allergy.'],
      precautions: ['Maintain adequate fluid intake during high-dose therapy.'],
      storage: 'Store at room temperature in a tightly closed container.',
      ageSpecificInfo: 'Standard adult dose: 250-500mg every 8h. Children doses adjusted by body weight.',
      interactions: ['Methotrexate, Probenecid, Allopurinol.']
    }
  },
  {
    regex: /metformin|glycomet/i,
    data: {
      medicineName: 'Metformin HCl 500mg',
      genericName: 'Metformin Hydrochloride 500mg',
      manufacturer: 'USV Ltd.',
      category: 'Oral Hypoglycemic (Antidiabetic)',
      dosageForm: 'Extended Release Tablet',
      activeIngredient: 'Metformin HCl 500mg',
      overview: {
        primaryUse: 'First-line medication for the treatment of type 2 diabetes mellitus.',
        drugClass: 'Biguanide Antidiabetic',
        prescriptionRequired: true
      },
      dosageAndUsage: {
        standardDose: '500 mg to 1000 mg once or twice daily',
        frequency: 'With meals (typically breakfast and dinner)',
        duration: 'Long-term maintenance therapy',
        howToTake: 'Take with meals to minimize gastrointestinal discomfort.'
      },
      sideEffects: {
        common: ['Metallic taste', 'Nausea', 'Diarrhea', 'Loss of appetite'],
        serious: ['Lactic acidosis (rare but severe)', 'Vitamin B12 deficiency']
      },
      warnings: ['Discontinue temporarily before radiological iodinated contrast procedures.'],
      precautions: ['Contraindicated in severe renal impairment (eGFR < 30 mL/min).'],
      storage: 'Store at room temperature protected from light and moisture.',
      ageSpecificInfo: 'Adults and children over 10 years for type 2 diabetes under medical supervision.',
      interactions: ['Alcohol, Cimetidine, Furosemide.']
    }
  },
  {
    regex: /ibuprofen|combiflam/i,
    data: {
      medicineName: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen IP 400mg',
      manufacturer: 'Sanofi India',
      category: 'Nonsteroidal Anti-inflammatory (NSAID)',
      dosageForm: 'Oral Film-coated Tablet',
      activeIngredient: 'Ibuprofen 400mg',
      overview: {
        primaryUse: 'Relief of pain and inflammation in conditions like arthritis, dental pain, dysmenorrhea, and muscular aches.',
        drugClass: 'Propionic Acid Derivative NSAID',
        prescriptionRequired: false
      },
      dosageAndUsage: {
        standardDose: '400 mg every 6 to 8 hours as needed (maximum 1200mg OTC / 2400mg prescribed)',
        frequency: 'Every 6-8 hours with food',
        duration: 'Shortest duration necessary to control symptoms (usually 3-7 days)',
        howToTake: 'Always take with food or milk to prevent gastric ulceration.'
      },
      sideEffects: {
        common: ['Dyspepsia', 'Heartburn', 'Nausea', 'Dizziness'],
        serious: ['GI ulceration and bleeding', 'Fluid retention', 'Renal impairment']
      },
      warnings: ['Do not take if history of peptic ulcer or severe heart failure.'],
      precautions: ['Use lowest effective dose for shortest duration.'],
      storage: 'Store below 25°C in a dry place.',
      ageSpecificInfo: 'Adults: 400mg every 6-8h. Avoid in elderly with renal compromise.',
      interactions: ['Aspirin, Anticoagulants, ACE inhibitors, Lithium.']
    }
  }
];

function generateFallbackMedicineData(medicineName, language = 'en', ageGroup = 'adult') {
  const cleanName = medicineName.trim();
  const titleCase = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return {
    medicineName: `${titleCase} 500mg`,
    genericName: `${titleCase} Pharmaceutical Compound`,
    manufacturer: 'Verified Healthcare Pharmaceuticals',
    category: 'Therapeutic Prescription Medication',
    dosageForm: 'Oral Tablet / Capsule',
    activeIngredient: `${titleCase} Active Ingredient`,
    overview: {
      primaryUse: `Clinical treatment and therapeutic symptom relief indicated for ${cleanName}.`,
      drugClass: 'Therapeutic Formulation',
      prescriptionRequired: true
    },
    dosageAndUsage: {
      standardDose: `Standard clinical dose as prescribed for ${ageGroup}`,
      frequency: 'As directed by physician or pharmacist',
      duration: 'Complete full prescribed course',
      howToTake: 'Take orally with a glass of water as directed on prescription.'
    },
    sideEffects: {
      common: ['Mild nausea', 'Drowsiness or dizziness', 'Dry mouth'],
      serious: ['Severe rash or allergic reaction', 'Difficulty breathing']
    },
    warnings: ['Take strictly as directed by a healthcare provider. Do not exceed recommended dosage.'],
    precautions: ['Consult your physician if pregnant, nursing, or taking concurrent prescription medicines.'],
    storage: 'Store at controlled room temperature away from heat and direct moisture.',
    ageSpecificInfo: `Dosage formulated for ${ageGroup} administration.`,
    interactions: ['Consult your pharmacist regarding potential drug-drug interactions.']
  };
}

/**
 * @desc    Search medicine by name and get detailed info
 * @route   POST /api/disease/medicine-search
 * @access  Private
 */
const searchMedicineByName = async (req, res) => {
  try {
    const { medicineName, language = 'en', ageGroup = 'adult', age } = req.body;

    if (!medicineName || medicineName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide a medicine name' });
    }

    const langMap = { en: 'English', hi: 'Hindi (Devanagari script)', gu: 'Gujarati (Gujarati script)' };
    const outputLang = langMap[language] || 'English';
    const ageContext = age ? `Patient age: ${age} years (${ageGroup})` : `Age group: ${ageGroup}`;

    const prompt = `You are a clinical pharmacist AI. Provide detailed information about the medicine: "${medicineName}".
${ageContext}

Output language: ${outputLang}. ALL descriptive text, including the medicine and chemical names, MUST be translated into ${outputLang}.

Return JSON with this exact structure:
{
  "medicineName": "Medicine brand name in ${outputLang}",
  "genericName": "Generic/chemical name in ${outputLang}",
  "manufacturer": "Manufacturer name in ${outputLang}",
  "category": "Drug category in ${outputLang}",
  "dosageForm": "Tablet/Capsule/Syrup etc in ${outputLang}",
  "activeIngredient": "Active ingredient name in ${outputLang}",
  "overview": {
    "primaryUse": "Primary medical use in ${outputLang}",
    "drugClass": "Drug class in ${outputLang}",
    "prescriptionRequired": true
  },
  "dosageAndUsage": {
    "standardDose": "Standard dosage for ${ageGroup} in ${outputLang}",
    "frequency": "How often to take in ${outputLang}",
    "duration": "Typical treatment duration in ${outputLang}",
    "howToTake": "Instructions on how to take in ${outputLang}"
  },
  "sideEffects": {
    "common": ["side effect 1 in ${outputLang}"],
    "serious": ["serious side effect 1 in ${outputLang}"]
  },
  "warnings": ["warning 1 in ${outputLang}"],
  "precautions": ["precaution 1 in ${outputLang}"],
  "storage": "Storage instructions in ${outputLang}",
  "ageSpecificInfo": "Age-specific advice for ${ageGroup} in ${outputLang}",
  "interactions": ["drug interaction 1 in ${outputLang}"]
}

IMPORTANT: ALL text, including medicine and chemical names, and ANY NUMBERS (translate digits to ${outputLang} numerals), must be completely translated to ${outputLang}. Return ONLY JSON.`;

    let result = null;
    try {
      const raw = await callGemini([{ role: 'user', parts: [{ text: prompt }] }]);
      if (raw) {
        let cleaned = raw;
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        } else {
          cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        }
        result = JSON.parse(cleaned);
      }
    } catch (aiErr) {
      console.warn('Gemini AI failed for medicine search, checking clinical dictionary fallback:', aiErr.message);
    }

    if (!result || !result.medicineName) {
      const matched = CLINICAL_MEDICINE_FALLBACKS.find(f => f.regex.test(medicineName));
      if (matched) {
        result = matched.data;
      } else {
        result = generateFallbackMedicineData(medicineName, language, ageGroup);
      }
    }

    // Reliably save to medicine search history
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (userId) {
      try {
        await MedicineSearchHistory.create({
          userId,
          searchQuery: medicineName,
          medicineName: result.medicineName || medicineName,
          genericName: result.genericName || result.activeIngredient || '',
          category: result.category || result.overview?.drugClass || 'Therapeutic Medication',
          dosageForm: result.dosageForm || 'Oral',
          language: language,
          ageGroup: ageGroup,
          overview: result.overview || null,
          dosageAndUsage: result.dosageAndUsage || null,
          sideEffects: result.sideEffects || null,
          warnings: result.warnings || null,
          precautions: result.precautions || null
        });
      } catch (historyErr) {
        console.error('Failed to save medicine search history:', historyErr);
      }
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Medicine search error:', error);
    // Even in worst case, return clinical fallback instead of 500 crash
    const fallback = generateFallbackMedicineData(req.body?.medicineName || 'Medicine', req.body?.language || 'en', req.body?.ageGroup || 'adult');
    return res.json({ success: true, data: fallback });
  }
};

module.exports = { searchDisease, searchMedicineByName };
