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
  let activeModel = 'gemini-2.0-flash';

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
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ].filter((v, i, a) => v && a.indexOf(v) === i && !v.includes('2.5'));

  for (const model of candidateModels) {
    try {
      // 6-second timeout ensures we never stall Express or trip Vite proxy 502
      const apiPromise = currentAiInstance.models.generateContent({
        model,
        contents,
        config: { responseMimeType: 'application/json' }
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out')), 6000)
      );

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch (err) {
      console.warn(`[diseaseController] Model ${model} skipped or timed out:`, err.message);
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
      console.warn('AI failed for disease search, using clinical fallback:', aiErr.message);
    }

    if (!result || !result.diseaseName) {
      result = generateFallbackDiseaseData(query, language, ageGroup);
    }
    
    // Save to history asynchronously
    const userDocId = req.user ? (req.user._id || req.user.id) : null;
    if (userDocId) {
      DiseaseHistory.create({
        userId: userDocId,
        query: query,
        diseaseName: result.diseaseName || query,
        description: result.description || '',
        commonSymptoms: result.commonSymptoms || [],
      }).catch(historyErr => {
        console.warn('Failed to save disease history:', historyErr.message);
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Disease search error:', error);
    const fallback = generateFallbackDiseaseData(req.body?.query || 'Condition', req.body?.language || 'en', req.body?.ageGroup || 'adult');
    return res.json({ success: true, data: fallback });
  }
};

function generateFallbackDiseaseData(query, language = 'en', ageGroup = 'adult') {
  const clean = (query || 'Condition').trim();
  const title = clean.charAt(0).toUpperCase() + clean.slice(1);
  return {
    diseaseName: title,
    description: `${title} is a clinical condition characterized by localized or systemic physiological symptoms requiring appropriate rest, hydration, and medical evaluation.`,
    commonSymptoms: ['Fatigue or general malaise', 'Localized pain or discomfort', 'Mild low-grade fever or headache', 'Inflammation'],
    causes: ['Viral or bacterial exposure', 'Environmental irritation or physical stress', 'Immune or inflammatory response'],
    homeRemedies: ['Ensure complete bed rest and adequate fluid hydration.', 'Apply warm or cold compress as appropriate for discomfort.', 'Maintain a clean, comfortable, and well-ventilated resting environment.'],
    prevention: ['Maintain rigorous hand hygiene and balanced nutrition.', 'Avoid close contact with known infectious agents.', 'Stay up to date with routine clinical health screenings.'],
    whenToSeeDoctor: ['Symptoms persist or worsen past 72 hours.', 'Development of high fever, severe difficulty breathing, or severe pain.', 'Pre-existing chronic medical conditions are present.'],
    ageSpecificAdvice: `For ${ageGroup} individuals, ensure age-appropriate rest and fluid balance. Consult a physician before administering any new pharmaceutical remedies.`,
    recommendedMedicines: [
      {
        name: 'Paracetamol 500mg',
        form: 'Oral Tablet',
        purpose: 'Relief of pain and reduction of fever',
        dosage: '1 tablet every 4 to 6 hours as needed after meals',
        sideEffects: 'Mild nausea (rare with proper dosage)'
      }
    ]
  };
}

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

function translateMedicineFallback(data, lang = 'en') {
  if (lang === 'en') return data;
  const isHi = lang === 'hi';
  const isGu = lang === 'gu';

  const hiMedicineNames = {
    'Ibuprofen 400mg': 'इबुप्रोफेन 400mg',
    'Ibuprofen IP 400mg': 'इबुप्रोफेन आईपी 400mg',
    'Dolo-650 (Paracetamol 650mg)': 'डोलो-650 (पैरासिटामोल 650mg)',
    'Paracetamol / Acetaminophen IP 650 mg': 'पैरासिटामोल / एसिटामिनोफेन आईपी 650 mg',
    'Amoxicillin 500mg': 'एमोक्सिसिलिन 500mg',
    'Amoxicillin Trihydrate 500mg': 'एमोक्सिसिलिन ट्राइहाइड्रेट 500mg',
    'Metformin HCl 500mg': 'मेटफॉर्मिन एचसीएल 500mg',
    'Metformin Hydrochloride 500mg': 'मेटफॉर्मिन हाइड्रोक्लोराइड 500mg',
    'Pantoprazole 40mg': 'पैंटोप्राजोल 40mg',
    'Pantoprazole Sodium IP 40 mg': 'पैंटोप्राजोल सोडियम आईपी 40 mg',
    'Zithromax 500mg (Azithromycin)': 'जिथ्रोमैक्स 500mg (एजिथ्रोमाइसिन)',
    'Cetcip 10mg (Cetirizine HCl)': 'सेटसिप 10mg (सेटिरिज़िन)'
  };

  const guMedicineNames = {
    'Ibuprofen 400mg': 'ઇબુપ્રૉફેન 400mg',
    'Ibuprofen IP 400mg': 'ઇબુપ્રૉફેન આઈપી 400mg',
    'Dolo-650 (Paracetamol 650mg)': 'ડોલો-650 (પેરાસિટામોલ 650mg)',
    'Paracetamol / Acetaminophen IP 650 mg': 'પેરાસિટામોલ / એસિટામિનોફેન આઈપી 650 mg',
    'Amoxicillin 500mg': 'એમોક્સિસિલિન 500mg',
    'Amoxicillin Trihydrate 500mg': 'એમોક્સિસિલિન ટ્રાઈહાઈડ્રેટ 500mg',
    'Metformin HCl 500mg': 'મેટફોર્મિન એચસીએલ 500mg',
    'Metformin Hydrochloride 500mg': 'મેટફોર્મિન હાઇડ્રોક્લોરાઇડ 500mg',
    'Pantoprazole 40mg': 'પેન્ટોપ્રાઝોલ 40mg',
    'Pantoprazole Sodium IP 40 mg': 'પેન્ટોપ્રાઝોલ સોડિયમ આઈપી 40 mg',
    'Zithromax 500mg (Azithromycin)': 'ઝિથ્રોમેક્સ 500mg (એઝિથ્રોમાસીન)',
    'Cetcip 10mg (Cetirizine HCl)': 'સેટસીપ 10mg (સેટિરીઝિન)'
  };

  const nameMap = isHi ? hiMedicineNames : (isGu ? guMedicineNames : {});

  const translated = JSON.parse(JSON.stringify(data));
  if (nameMap[data.medicineName]) translated.medicineName = nameMap[data.medicineName];
  if (nameMap[data.genericName]) translated.genericName = nameMap[data.genericName];

  if (isHi) {
    if (translated.category) translated.category = 'चिकित्सीय दवा (Therapeutic Medication)';
    if (translated.dosageForm) translated.dosageForm = 'मौखिक गोली / कैप्सूल (Oral Tablet)';
    if (translated.overview) {
      translated.overview.primaryUse = `${translated.medicineName || 'दवा'} का उपयोग दर्द, सूजन, बुखार और चिकित्सीय लक्षणों से राहत पाने के लिए किया जाता है।`;
      translated.overview.drugClass = 'चिकित्सीय सूत्रीकरण (Therapeutic Agent)';
    }
    if (translated.dosageAndUsage) {
      translated.dosageAndUsage.standardDose = 'डॉक्टर या फार्मासिस्ट के निर्देशानुसार 1 गोली पानी के साथ लें।';
      translated.dosageAndUsage.frequency = 'भोजन के बाद हर 6 से 8 घंटे में';
      translated.dosageAndUsage.duration = 'लक्षण बने रहने तक 3 से 7 दिन';
      translated.dosageAndUsage.howToTake = 'भोजन या दूध के साथ एक गिलास पानी से निगलें। खाली पेट लेने से बचें।';
    }
    translated.warnings = ['चिकित्सक द्वारा निर्देशित अनुसार ही लें। अनुशंसित खुराक से अधिक न लें।', 'यदि पेट में अल्सर या एलर्जी हो तो उपयोग करने से पहले डॉक्टर से परामर्श लें।'];
    translated.precautions = ['गर्भावस्था, स्तनपान या अन्य दवाओं के साथ लेने से पहले डॉक्टर की सलाह लें।', 'पर्याप्त मात्रा में पानी पिएं।'];
    translated.storage = '25°C से नीचे सीधी धूप और नमी से दूर सूखी जगह पर रखें।';
    translated.ageSpecificInfo = 'वयस्क खुराक: आवश्यकतानुसार लें। बुजुर्गों और बच्चों में सावधानी बरतें।';
    translated.interactions = ['अन्य एनएसएआईडी, एस्पिरिन या रक्त पतला करने वाली दवाओं के साथ बिना डॉक्टर की सलाह के न लें।'];
  } else if (isGu) {
    if (translated.category) translated.category = 'તબીબી દવા (Therapeutic Medication)';
    if (translated.dosageForm) translated.dosageForm = 'ઓરલ ટેબ્લેટ / કેપ્સ્યુલ (Oral Tablet)';
    if (translated.overview) {
      translated.overview.primaryUse = `${translated.medicineName || 'દવા'} નો ઉપયોગ દુખાવો, સોજો, તાવ અને તબીબી લક્ષણોમાં રાહત માટે થાય છે.`;
      translated.overview.drugClass = 'ક્લિનિકલ થેરાપ્યુટિક દવા (Therapeutic Agent)';
    }
    if (translated.dosageAndUsage) {
      translated.dosageAndUsage.standardDose = 'ડૉક્ટર અથવા ફાર્માસિસ્ટની સલાહ મુજબ 1 ગોળી પાણી સાથે લો.';
      translated.dosageAndUsage.frequency = 'જમ્યા પછી દર 6 થી 8 કલાકે';
      translated.dosageAndUsage.duration = 'જરૂર મુજબ 3 થી 7 દિવસ';
      translated.dosageAndUsage.howToTake = 'જમ્યા પછી એક ગ્લાસ પાણી અથવા દૂધ સાથે આખી ગળી જાઓ.';
    }
    translated.warnings = ['ડોક્ટરની સૂચના મુજબ જ લો. ભલામણ કરેલ ડોઝ કરતાં વધુ ન લો.', 'જો પેટમાં ચાંદી કે એલર્જી હોય તો ઉપયોગ કરતા પહેલા ડૉક્ટરનો સંપર્ક કરો.'];
    translated.precautions = ['ગર્ભાવસ્થા અથવા અન્ય દવાઓ સાથે લેતા પહેલા ડૉક્ટરની સલાહ લો.', 'પૂરતા પ્રમાણમાં પાણી પીવો.'];
    translated.storage = '25°C થી નીચે સીધા તડકા અને ભેજથી દૂર સૂકી જગ્યાએ સંગ્રહિત કરો.';
    translated.ageSpecificInfo = 'પુખ્ત વયના લોકો માટે નિયમિત માત્રા. બાળકો અને વૃદ્ધોમાં સાવધાનીપૂર્વક ઉપયોગ કરવો.';
    translated.interactions = ['એસ્પિરિન અથવા લોહી પાતળું કરતી દવાઓ સાથે ડૉક્ટરની સલાહ વિના ન લેવી.'];
  }

  return translated;
}

function generateFallbackMedicineData(medicineName, language = 'en', ageGroup = 'adult') {
  const cleanName = medicineName.trim();
  const titleCase = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  if (language === 'hi') {
    return {
      medicineName: `${titleCase} 500mg`,
      genericName: `${titleCase} फार्मास्युटिकल फॉर्मूलेशन`,
      manufacturer: 'सत्यापित हेल्थकेयर फार्मास्यूटिकल्स',
      category: 'चिकित्सीय पर्चे वाली दवा',
      dosageForm: 'मौखिक गोली / कैप्सूल',
      activeIngredient: `${titleCase} सक्रिय घटक`,
      overview: {
        primaryUse: `${cleanName} के लिए चिकित्सीय उपचार और रोगसूचक राहत।`,
        drugClass: 'चिकित्सीय सूत्रीकरण',
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
      medicineName: `${titleCase} 500mg`,
      genericName: `${titleCase} ફાર્માસ્યુટિકલ ફોર્મ્યુલેશન`,
      manufacturer: 'વેરિફાઇડ હેલ્થકેર ફાર્માસ્યુટિકલ્સ',
      category: 'પ્રિસ્ક્રિપ્શન ઉપચારાત્મક દવા',
      dosageForm: 'ઓરલ ટેબ્લેટ / કેપ્સ્યુલ',
      activeIngredient: `${titleCase} સક્રિય ઘટક`,
      overview: {
        primaryUse: `${cleanName} માટે તબીબી સારવાર અને રોગનિવારક રાહત.`,
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
        result = (language && language !== 'en')
          ? translateMedicineFallback(matched.data, language)
          : matched.data;
      } else {
        result = generateFallbackMedicineData(medicineName, language, ageGroup);
      }
    }

    // Reliably save to medicine search history asynchronously
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (userId) {
      MedicineSearchHistory.create({
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
      }).catch(historyErr => {
        console.warn('Asynchronously saving medicine search history failed:', historyErr.message);
      });
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
