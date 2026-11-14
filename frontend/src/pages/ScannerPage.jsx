import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { 
  Upload, Camera, Pill, FileCheck,
  Sparkles, Loader2, AlertOctagon,
  ShieldAlert, Clock, Building, X, Search, CheckCircle2, AlertTriangle,
  Globe, ChevronDown, Check, Info, ExternalLink, BookmarkCheck
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'हिन्दी', native: 'Hindi' },
  { code: 'gu', label: 'ગુજરાતી', native: 'Gujarati' }
];

const SCAN_LABELS = {
  en: {
    analysisResults: 'Analysis Results',
    searchResults: 'Search Results',
    verified: 'Verified',
    partiallyVerified: 'Partially Verified',
    notVerified: 'Information Not Verified',
    found: 'Found',
    awaitingScan: 'Awaiting Scan',
    awaitingScanDesc: 'Upload an image and analyze it to view the structured clinical breakdown here.',
    awaitingSearch: 'Awaiting Search',
    awaitingSearchDesc: 'Enter a medicine name on the left and click Search to view detailed clinical information here.',
    generic: 'Generic Name',
    maker: 'Maker / Brand',
    manufacturer: 'Manufacturer',
    overview: 'Overview',
    dosage: 'Dosage',
    warnings: 'Warnings',
    sideEffects: 'Side Effects',
    clinicalPurpose: 'Clinical Purpose',
    primaryUse: 'Primary Use',
    drugClass: 'Drug Class',
    activeIngredient: 'Active Ingredient',
    activeIngredientsBreakdown: 'Active Pharmaceutical Ingredients (APIs)',
    combinationRationale: 'Combination Synergy & Rationale',
    ageSpecificInfo: 'Age-Specific Guidance',
    storage: 'Storage',
    interactions: 'Drug Interactions',
    standardDose: 'Standard Reference Dose',
    frequency: 'Frequency',
    duration: 'Treatment Duration',
    howToTake: 'How to Take',
    prescribedDosage: 'Prescribed Dosage',
    usageInstructions: 'Usage Instructions',
    missedDose: 'If You Miss a Dose',
    criticalWarnings: 'Critical Warnings & Alerts',
    generalPrecautions: 'General Precautions',
    knownSideEffects: 'Side Effects & Reactions',
    commonSideEffects: 'Common Side Effects',
    seriousSideEffects: 'Serious Adverse Reactions',
    medicalReferences: 'Verified Medical References & Citations',
    referenceDosageNotice: 'Clinical Notice: An individual prescribed dosage for this specific patient is not available from the packaging label. Follow the licensed physician\'s prescription strictly.',
    confidence: 'Clinical Match Confidence',
    searchTitle: 'Medicine Name Search',
    searchPrompt: 'Type the name of any medicine or drug to get detailed clinical information — dosage, warnings, side effects, and interactions.',
    searchPlaceholder: 'e.g. ACENEXT P, Montypen-LC, Metformin, Paracetamol...',
    searchMedicine: 'Search Medicine',
    searching: 'Searching Database...',
    reset: 'Reset',
    quickSuggestions: 'QUICK SUGGESTIONS',
    analyzingData: 'Analyzing Medicine Data',
    aiRetrieving: 'Retrieving verified clinical information...',
    route: 'Route of Administration',
    dosageForm: 'Dosage Form'
  },
  hi: {
    analysisResults: 'विश्लेषण परिणाम (Analysis Results)',
    searchResults: 'खोज परिणाम (Search Results)',
    verified: 'सत्यापित (Verified)',
    partiallyVerified: 'आंशिक रूप से सत्यापित (Partially Verified)',
    notVerified: 'जानकारी सत्यापित नहीं है (Not Verified)',
    found: 'उपलब्ध (Found)',
    awaitingScan: 'स्कैन की प्रतीक्षा है',
    awaitingScanDesc: 'संरचित क्लिनिकल विवरण देखने के लिए एक छवि अपलोड करें और उसका विश्लेषण करें।',
    awaitingSearch: 'खोज की प्रतीक्षा है',
    awaitingSearchDesc: 'बाईं ओर दवा का नाम दर्ज करें और विस्तृत चिकित्सीय जानकारी देखने के लिए खोज बटन दबाएं।',
    generic: 'जेनेरिक नाम',
    maker: 'निर्माता / ब्रांड',
    manufacturer: 'निर्माता कंपनी',
    overview: 'अवलोकन (Overview)',
    dosage: 'खुराक (Dosage)',
    warnings: 'चेतावनियां (Warnings)',
    sideEffects: 'दुष्प्रभाव (Side Effects)',
    clinicalPurpose: 'चिकित्सीय उपयोग',
    primaryUse: 'प्रमुख चिकित्सीय उपयोग',
    drugClass: 'दवा वर्ग (Drug Class)',
    activeIngredient: 'सक्रिय घटक',
    activeIngredientsBreakdown: 'सक्रिय औषधीय घटक (APIs)',
    combinationRationale: 'संयोजन का चिकित्सीय उद्देश्य (Synergy)',
    ageSpecificInfo: 'आयु-विशिष्ट सलाह',
    storage: 'भंडारण निर्देश',
    interactions: 'दवाओं का परस्पर प्रभाव (Interactions)',
    standardDose: 'मानक अनुशंसित खुराक',
    frequency: 'लेने की आवृत्ति (Frequency)',
    duration: 'उपचार अवधि (Duration)',
    howToTake: 'लेने का तरीका (How to Take)',
    prescribedDosage: 'निर्धारित खुराक (Dosage)',
    usageInstructions: 'उपयोग निर्देश',
    missedDose: 'यदि खुराक छूट जाए (Missed Dose)',
    criticalWarnings: 'महत्वपूर्ण चेतावनियां एवं अलर्ट',
    generalPrecautions: 'सामान्य सावधानियां',
    knownSideEffects: 'ज्ञात दुष्प्रभाव एवं प्रतिक्रियाएं',
    commonSideEffects: 'सामान्य दुष्प्रभाव',
    seriousSideEffects: 'गंभीर प्रतिकूल प्रतिक्रियाएं',
    medicalReferences: 'सत्यापित चिकित्सीय संदर्भ एवं स्रोत',
    referenceDosageNotice: 'क्लिनिकल सूचना: मरीज के लिए व्यक्तिगत निर्धारित खुराक इस पैकेजिंग से निर्धारित नहीं होती। हमेशा डॉक्टर के पर्चे अनुसार ही दवा लें।',
    confidence: 'सटीकता स्कोर',
    searchTitle: 'दवा का नाम खोजें',
    searchPrompt: 'विस्तृत चिकित्सीय जानकारी — खुराक, चेतावनियां, दुष्प्रभाव और परस्पर प्रभाव प्राप्त करने के लिए किसी भी दवा का नाम लिखें।',
    searchPlaceholder: 'जैसे: ACENEXT P, Montypen-LC, Metformin, Paracetamol...',
    searchMedicine: 'दवा खोजें',
    searching: 'डेटाबेस खोजा जा रहा है...',
    reset: 'रीसेट',
    quickSuggestions: 'त्वरित सुझाव',
    analyzingData: 'दवा डेटा का विश्लेषण जारी है',
    aiRetrieving: 'सत्यापित चिकित्सीय जानकारी प्राप्त की जा रही है...',
    route: 'प्रशासन मार्ग (Route)',
    dosageForm: 'दवा का प्रकार (Form)'
  },
  gu: {
    analysisResults: 'વિશ્લેષણ પરિણામો (Analysis Results)',
    searchResults: 'શોધ પરિણામો (Search Results)',
    verified: 'ચકાસાયેલ (Verified)',
    partiallyVerified: 'આંશિક ચકાસાયેલ (Partially Verified)',
    notVerified: 'માહિતી ચકાસાયેલ નથી (Not Verified)',
    found: 'મળેલ છે (Found)',
    awaitingScan: 'સ્કેન માટે પ્રતીક્ષારત',
    awaitingScanDesc: 'ક્લિનિકલ વિગતો જોવા માટે દવાના લેબલનો ફોટો અપલોડ કરો અને વિશ્લેષણ કરો.',
    awaitingSearch: 'શોધ માટે પ્રતીક્ષારત',
    awaitingSearchDesc: 'ડાબી બાજુ દવાનું નામ દાખલ કરો અને વિગતવાર ક્લિનિકલ માહિતી મેળવવા માટે સર્ચ પર ક્લિક કરો.',
    generic: 'જેનેરિક નામ',
    maker: 'બ્રાન્ડ / ઉત્પાદક',
    manufacturer: 'ઉત્પાદક કંપની',
    overview: 'વિહંગાવલોકન (Overview)',
    dosage: 'માત્રા / ડોઝ (Dosage)',
    warnings: 'ચેતવણીઓ (Warnings)',
    sideEffects: 'આડઅસરો (Side Effects)',
    clinicalPurpose: 'તબીબી ઉપયોગ (Clinical Purpose)',
    primaryUse: 'મુખ્ય તબીબી ઉપયોગ',
    drugClass: 'દવા વર્ગીકરણ (Drug Class)',
    activeIngredient: 'સક્રિય ઘટક',
    activeIngredientsBreakdown: 'સક્રિય ઔષધીય ઘટકો (APIs)',
    combinationRationale: 'સંયોજનનો હેતુ (Synergy Rationale)',
    ageSpecificInfo: 'ઉંમર મુજબ સલાહ (Age-Specific Info)',
    storage: 'સંગ્રહ માર્ગદર્શિકા (Storage)',
    interactions: 'દવાઓની ક્રિયાપ્રતિક્રિયા (Drug Interactions)',
    standardDose: 'ભલામણ કરેલ સામાન્ય માત્રા',
    frequency: 'લેવાનો સમય / આવર્તન',
    duration: 'સારવારનો સમયગાળો',
    howToTake: 'લેવાની સાચી રીત',
    prescribedDosage: 'ભલામણ કરેલ ડોઝ',
    usageInstructions: 'વપરાશ માર્ગદર્શિકા',
    missedDose: 'જો ડોઝ ચૂકી જાઓ તો (Missed Dose)',
    criticalWarnings: 'મહત્વપૂર્ણ ચેતવણીઓ (Critical Warnings)',
    generalPrecautions: 'સામાન્ય સાવચેતીઓ (Precautions)',
    knownSideEffects: 'જાણીતી આડઅસરો (Known Side Effects)',
    commonSideEffects: 'સામાન્ય આડઅસરો',
    seriousSideEffects: 'ગંભીર આડઅસરો (Serious Side Effects)',
    medicalReferences: 'તબીબી સંદર્ભ અને સ્ત્રોતો (Medical References)',
    referenceDosageNotice: 'ક્લિનિકલ સૂચના: દર્દી માટેનો વ્યક્તિગત નિર્ધારિત ડોઝ પેકેજિંગમાંથી નક્કી થતો નથી. હંમેશા ડૉક્ટરના પ્રિસ્ક્રિપ્શન મુજબ જ દવા લો.',
    confidence: 'ચોકસાઈ સ્કોર',
    searchTitle: 'દવાનું નામ સર્ચ કરો',
    searchPrompt: 'કોઈપણ દવા વિશે વિગતવાર ક્લિનિકલ માહિતી — માત્રા, ચેતવણીઓ, આડઅસરો અને ક્રિયાપ્રતિક્રિયા મેળવવા માટે નામ લખો.',
    searchPlaceholder: 'ઉદાહરણ: ACENEXT P, Montypen-LC, Metformin, Paracetamol...',
    searchMedicine: 'દવા શોધો',
    searching: 'ડેટાબેઝ શોધાઈ રહ્યો છે...',
    reset: 'રીસેટ',
    quickSuggestions: 'ઝડપી સૂચનો',
    analyzingData: 'દવાના ડેટાનું વિશ્લેષણ ચાલુ છે',
    aiRetrieving: 'ચકાસાયેલ ક્લિનિકલ માહિતી લાવવામાં આવી રહી છે...',
    route: 'લેવાનો માર્ગ (Route)',
    dosageForm: 'દવાનું સ્વરૂપ (Form)'
  }
};

const localizeDigits = (text, lang) => {
  if (typeof text !== 'string') {
    if (typeof text === 'number') text = String(text);
    else return text;
  }
  if (lang !== 'gu' && lang !== 'hi') return text;
  const guMap = { '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪', '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯' };
  const hiMap = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '૮', '9': '९' };
  const digitMap = lang === 'gu' ? guMap : hiMap;
  return text.replace(/[0-9]/g, d => digitMap[d] || d);
};

const PRESET_MEDICINES = [
  {
    id: 'acenext_p',
    name: 'ACENEXT P',
    category: 'NSAID / Pain Relief',
    labelText: 'ACENEXT P TABLETS - Each film coated tablet contains: Aceclofenac IP 100 mg, Paracetamol IP 325 mg. Mfg by Acrochem Laboratories.'
  },
  {
    id: 'montypen_lc',
    name: 'Montypen-LC',
    category: 'Antiallergic',
    labelText: 'Montypen-LC Tablets - Each film coated tablet contains: Montelukast Sodium IP 10 mg + Levocetirizine Dihydrochloride IP 5 mg. Mfg by Acrochem.'
  },
  {
    id: 'amoxicillin',
    name: 'Amoxicillin 500mg',
    category: 'Antibiotic',
    labelText: 'AMOXICILLIN 500mg CAPSULES - GSK Pharma. Take 1 capsule every 8 hours.'
  },
  {
    id: 'metformin',
    name: 'Metformin 850mg',
    category: 'Diabetes',
    labelText: 'METFORMIN HYDROCHLORIDE 850mg (Biguanides). Take 1 tablet twice daily with meals.'
  }
];

const generatePresetImageFile = (preset) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 650; canvas.height = 420;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0B0D1C'; ctx.fillRect(0, 0, 650, 420);
    ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, 610, 380);
    ctx.fillStyle = '#8B5CF6'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(preset.name, 40, 65);
    ctx.fillStyle = '#10B981'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`Category: ${preset.category}`, 40, 95);
    ctx.fillStyle = '#CBD5E1'; ctx.font = '15px monospace';
    
    // Multi-line wrap
    const words = preset.labelText.split(' ');
    let line = '';
    let y = 140;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 550 && i > 0) {
        ctx.fillText(line, 40, y);
        line = words[i] + ' ';
        y += 26;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 40, y);

    canvas.toBlob((blob) => {
      resolve({ file: new File([blob], `${preset.id}.jpg`, { type: 'image/jpeg' }), dataUrl: canvas.toDataURL('image/jpeg') });
    }, 'image/jpeg', 0.95);
  });
};

const LoadingChecklist = ({ progress }) => {
  const steps = [
    { label: 'Image uploaded securely', threshold: 15 },
    { label: 'OCR pharmaceutical text extracted', threshold: 40 },
    { label: 'Active ingredients & strengths identified', threshold: 65 },
    { label: 'Cross-referencing verified databases', threshold: 85 },
    { label: 'Preparing clinical monograph & summary', threshold: 95 }
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(11, 13, 28, 0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20
    }}>
      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Analyzing Medicine Label</h3>
        </div>
        
        {steps.map((step, idx) => {
          const isDone = progress >= step.threshold;
          const isActive = !isDone && (idx === 0 || progress >= steps[idx - 1].threshold);
          
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isDone || isActive ? 1 : 0.4, transition: 'opacity 0.3s' }}>
              {isDone ? (
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              ) : isActive ? (
                <Loader2 size={18} className="spin" style={{ color: 'var(--primary)' }} />
              ) : (
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500', color: isDone ? 'var(--text-secondary)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                {step.label}
              </span>
            </div>
          );
        })}

        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-blue))', transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
};

const ScannerPage = () => {
  const { t, language } = useApp();
  const [scanMode, setScanMode] = useState('image');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // ── Manual name-search state ─────────────────────────────────────────────
  const [nameQuery, setNameQuery] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameResult, setNameResult] = useState(null);
  const [nameError, setNameError] = useState('');
  const [nameTab, setNameTab] = useState('overview');
  const [outputLanguage, setOutputLanguage] = useState(language || 'en');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  // ── Image scan language translation state ─────────────────────────────────
  const [scanLanguage, setScanLanguage] = useState(language || 'en');
  const [scanTranslating, setScanTranslating] = useState(false);

  const sT = SCAN_LABELS[scanLanguage] || SCAN_LABELS.en;
  const nT = SCAN_LABELS[outputLanguage] || SCAN_LABELS.en;

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (language) {
      setOutputLanguage(language);
      setScanLanguage(language);
    }
  }, [language]);

  const handleScanLanguageChange = async (newLang) => {
    setScanLanguage(newLang);
    if (!result) return;

    // 1. Instant client-side translation
    const instant = api.translateMedicine(result, newLang);
    if (instant) setResult(instant);

    // 2. Fetch full remote verified translation
    const medName = result._originalEnglish?.medicineName || result.medicineName;
    if (!medName || newLang === 'en') return;

    setScanTranslating(true);
    try {
      const res = await api.searchMedicineByName(medName, newLang, 'adult', null);
      if (res && res.success && res.data) {
        setResult(prev => ({
          ...prev,
          category: res.data.category || prev.category,
          dosageForm: res.data.dosageForm || prev.dosageForm,
          dosage: res.data.dosageAndUsage?.standardDose || prev.dosage,
          usageInstructions: res.data.dosageAndUsage?.howToTake || prev.usageInstructions,
          purposeAndUses: res.data.overview?.primaryUse || prev.purposeAndUses,
          warnings: Array.isArray(res.data.warnings) ? res.data.warnings.join(' ') : (res.data.warnings || prev.warnings),
          precautions: Array.isArray(res.data.precautions) ? res.data.precautions.join(' ') : (res.data.precautions || prev.precautions),
          sideEffects: Array.isArray(res.data.sideEffects?.common) ? res.data.sideEffects.common.join(', ') : (typeof res.data.sideEffects === 'string' ? res.data.sideEffects : prev.sideEffects),
          storage: res.data.storage || prev.storage,
          _currentLang: newLang
        }));
      }
    } catch (err) {
      console.warn('[ScannerPage] Remote scan translation notice:', err.message);
    } finally {
      setScanTranslating(false);
    }
  };

  useEffect(() => () => stopCameraStream(), []);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(''); setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError('Unable to access device camera. Please upload an image instead.');
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    setIsCameraOpen(false);
  };

  const captureCameraFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current; const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setSelectedFile(new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' }));
          setImagePreview(canvas.toDataURL('image/jpeg'));
          stopCameraStream();
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return setError('Please select an image first.');
    setError(''); setLoading(true); setScanProgress(15);
    const formData = new FormData();
    formData.append('image', selectedFile);
    if (scanLanguage) formData.append('language', scanLanguage);

    let progress = 15;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 95) progress = 95;
      setScanProgress(progress);
    }, 700);

    try {
      const res = await api.scanMedicine(formData);
      clearInterval(progressInterval); setScanProgress(100);
      setTimeout(async () => {
        if (res.success) {
          let medData = res.data;
          // Automatically translate entire scan result if target language is not English
          if (scanLanguage && scanLanguage !== 'en') {
            const instant = api.translateMedicine(medData, scanLanguage);
            if (instant) medData = instant;

            const medName = medData._originalEnglish?.medicineName || medData.medicineName;
            if (medName) {
              try {
                const aiRes = await api.searchMedicineByName(medName, scanLanguage, 'adult', null);
                if (aiRes && aiRes.success && aiRes.data) {
                  medData = {
                    ...medData,
                    category: aiRes.data.category || medData.category,
                    dosageForm: aiRes.data.dosageForm || medData.dosageForm,
                    dosage: aiRes.data.dosageAndUsage?.standardDose || medData.dosage,
                    usageInstructions: aiRes.data.dosageAndUsage?.howToTake || medData.usageInstructions,
                    purposeAndUses: aiRes.data.overview?.primaryUse || medData.purposeAndUses,
                    warnings: Array.isArray(aiRes.data.warnings) ? aiRes.data.warnings.join(' ') : (aiRes.data.warnings || medData.warnings),
                    precautions: Array.isArray(aiRes.data.precautions) ? aiRes.data.precautions.join(' ') : (aiRes.data.precautions || medData.precautions),
                    sideEffects: Array.isArray(aiRes.data.sideEffects?.common) ? aiRes.data.sideEffects.common.join(', ') : (typeof aiRes.data.sideEffects === 'string' ? aiRes.data.sideEffects : medData.sideEffects),
                    storage: aiRes.data.storage || medData.storage,
                    _currentLang: scanLanguage
                  };
                }
              } catch (aiErr) {
                console.warn('[ScannerPage] AI scan translation on scan notice:', aiErr);
              }
            }
          }
          setResult(medData);
          setActiveTab('overview');
        } else {
          setError(res.error || 'Failed to analyze medicine.');
        }
        setLoading(false);
        setScanProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval); setLoading(false); setScanProgress(0);
      setError('Unable to load this information. Please check your connection and try again.');
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setResult(null);
    setError('');
  };

  // ── Manual name-search handlers ──────────────────────────────────────────
  const handleNameSearch = async (e) => {
    e.preventDefault();
    const trimmed = nameQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      return setNameError('Please enter at least 2 characters to search.');
    }
    setNameError('');
    setNameResult(null);
    setNameLoading(true);
    setNameTab('overview');
    setActiveSearchQuery(trimmed);
    try {
      const res = await api.searchMedicineByName(trimmed, outputLanguage || language || 'en', 'adult', null);
      if (res.success) {
        setNameResult(res.data);

        // Store to local medicine searches cache
        try {
          const newEntry = {
            id: 'search_' + Date.now(),
            searchQuery: trimmed,
            medicineName: res.data.medicineName || trimmed,
            genericName: res.data.genericName || res.data.activeIngredient || '',
            category: res.data.category || res.data.overview?.drugClass || 'Therapeutic Medication',
            dosageForm: res.data.dosageForm || 'Oral',
            overview: res.data.overview,
            dosageAndUsage: res.data.dosageAndUsage,
            sideEffects: res.data.sideEffects,
            warnings: res.data.warnings,
            precautions: res.data.precautions,
            createdAt: new Date().toISOString()
          };
          const existing = JSON.parse(localStorage.getItem('mediscan_text_searches') || '[]');
          const filtered = existing.filter(i => (i.searchQuery || '').toLowerCase() !== trimmed.toLowerCase());
          localStorage.setItem('mediscan_text_searches', JSON.stringify([newEntry, ...filtered].slice(0, 50)));
        } catch (cacheErr) {
          console.warn('[ScannerPage] Could not cache search locally:', cacheErr);
        }
      } else {
        setNameError(res.error || 'Failed to find medicine information.');
      }
    } catch (err) {
      setNameError(err.message || 'Unable to search. Please check your connection and try again.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleLanguageChange = async (newLang) => {
    setOutputLanguage(newLang);
    if (nameResult) {
      const instant = api.translateMedicine(nameResult, newLang);
      if (instant) setNameResult(instant);

      const q = activeSearchQuery || nameQuery.trim() || nameResult.genericName || nameResult.medicineName;
      if (!q) return;
      setNameLoading(true);
      setNameError('');
      try {
        const res = await api.searchMedicineByName(q, newLang, 'adult', null);
        if (res && res.success && res.data) {
          setNameResult(res.data);
        }
      } catch (err) {
        console.warn('[ScannerPage] Language translation notice:', err.message);
      } finally {
        setNameLoading(false);
      }
    }
  };

  const resetNameSearch = () => {
    setNameQuery('');
    setActiveSearchQuery('');
    setNameResult(null);
    setNameError('');
  };

  // ── Name-search result renderer ──────────────────────────────────────────
  const renderNameResult = () => {
    if (!nameResult) return null;
    const r = nameResult;
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '6px' }}>
                {localizeDigits(r.medicineName, outputLanguage)}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>{nT.generic}:</strong> {localizeDigits(r.genericName || 'N/A', outputLanguage)}
              </p>
              {r.manufacturer && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  <strong>{nT.maker}:</strong> {r.manufacturer}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
              {r.category && <span className="badge badge-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>{r.category}</span>}
              {r.dosageForm && <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 9px', borderRadius: '8px' }}>{r.dosageForm}</span>}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="tab-nav-scroll" style={{ margin: 0, paddingBottom: '0', borderBottom: '2px solid rgba(255,255,255,0.05)', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { id: 'overview', label: nT.overview },
              { id: 'dosage', label: nT.dosage },
              { id: 'warnings', label: nT.warnings },
              { id: 'sideeffects', label: nT.sideEffects }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setNameTab(tab.id)} 
                className={nameTab === tab.id ? 'active' : ''} 
                style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '600', flex: '1 1 0', textAlign: 'center', whiteSpace: 'nowrap', minWidth: 'fit-content' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          {nameTab === 'overview' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.overview?.primaryUse && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.primaryUse}</h4>
                  <p>{localizeDigits(r.overview.primaryUse, outputLanguage)}</p>
                </div>
              )}
              {r.overview?.drugClass && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.drugClass}</h4>
                  <p>{localizeDigits(r.overview.drugClass, outputLanguage)}</p>
                </div>
              )}
              {r.activeIngredient && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.activeIngredient}</h4>
                  <p>{localizeDigits(r.activeIngredient, outputLanguage)}</p>
                </div>
              )}
              {r.ageSpecificInfo && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.ageSpecificInfo}</h4>
                  <p>{localizeDigits(r.ageSpecificInfo, outputLanguage)}</p>
                </div>
              )}
              {r.storage && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={14} /> {nT.storage}
                  </h4>
                  <p>{localizeDigits(r.storage, outputLanguage)}</p>
                </div>
              )}
              {r.interactions && r.interactions.length > 0 && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>{nT.interactions}</h4>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {r.interactions.map((item, i) => <li key={i}>{localizeDigits(item, outputLanguage)}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {nameTab === 'dosage' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="alert alert-primary" style={{ padding: '16px' }}>
                <strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} /> {nT.standardDose}
                </strong>
                <p>{localizeDigits(r.dosageAndUsage?.standardDose || nT.referenceDosageNotice, outputLanguage)}</p>
              </div>
              {r.dosageAndUsage?.frequency && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.frequency}</h4>
                  <p>{localizeDigits(r.dosageAndUsage.frequency, outputLanguage)}</p>
                </div>
              )}
              {r.dosageAndUsage?.duration && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.duration}</h4>
                  <p>{localizeDigits(r.dosageAndUsage.duration, outputLanguage)}</p>
                </div>
              )}
              {r.dosageAndUsage?.howToTake && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.howToTake}</h4>
                  <p>{localizeDigits(r.dosageAndUsage.howToTake, outputLanguage)}</p>
                </div>
              )}
            </div>
          )}

          {nameTab === 'warnings' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.warnings && r.warnings.length > 0 && (
                <div className="alert alert-danger" style={{ padding: '16px' }}>
                  <strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={15} /> {nT.criticalWarnings}
                  </strong>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {Array.isArray(r.warnings) 
                      ? r.warnings.map((w, i) => <li key={i}>{localizeDigits(w, outputLanguage)}</li>)
                      : <li>{localizeDigits(r.warnings, outputLanguage)}</li>}
                  </ul>
                </div>
              )}
              {r.precautions && r.precautions.length > 0 && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>{nT.generalPrecautions}</h4>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Array.isArray(r.precautions) 
                      ? r.precautions.map((p, i) => <li key={i}>{localizeDigits(p, outputLanguage)}</li>)
                      : <li>{localizeDigits(r.precautions, outputLanguage)}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {nameTab === 'sideeffects' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.sideEffects?.common && r.sideEffects.common.length > 0 && (
                <div className="alert alert-warning" style={{ padding: '16px' }}>
                  <strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertOctagon size={15} /> {nT.commonSideEffects}
                  </strong>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {r.sideEffects.common.map((s, i) => <li key={i}>{localizeDigits(s, outputLanguage)}</li>)}
                  </ul>
                </div>
              )}
              {r.sideEffects?.serious && r.sideEffects.serious.length > 0 && (
                <div className="alert alert-danger" style={{ padding: '16px' }}>
                  <strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} /> {nT.seriousSideEffects}
                  </strong>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {r.sideEffects.serious.map((s, i) => <li key={i}>{localizeDigits(s, outputLanguage)}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ marginTop: '24px' }}><MedicalDisclaimer /></div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-primary"><Sparkles size={12} style={{marginRight:'4px'}}/> Clinical OCR Engine</span>
        </div>
        <h1 className="page-title">{t('scannerTitle') || 'Medicine Scanner'}</h1>
        <p className="body-text" style={{ marginTop: '8px', maxWidth: '800px', fontSize: '16px' }}>
          Upload pill bottles, packaging, or prescription labels. Our system extracts textual data and cross-references authoritative pharmaceutical databases to generate structured clinical dosages, active ingredients, warnings, and safety monographs.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => { setScanMode('image'); setNameResult(null); setNameError(''); }} className={`btn ${scanMode === 'image' ? 'btn-primary' : 'btn-secondary'}`}>
          <Upload size={16} /> Scan Image
        </button>
        <button onClick={() => { setScanMode('name'); setResult(null); setError(''); }} className={`btn ${scanMode === 'name' ? 'btn-primary' : 'btn-secondary'}`}>
          <Search size={16} /> Manual Search
        </button>
      </div>

      {scanMode === 'image' && (
        <div className="dashboard-grid fade-in">
          
          {/* LEFT: Upload Zone */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={18} />
                  </div>
                  <h2 className="card-heading">Image Source</h2>
                </div>
                {imagePreview && (
                  <button onClick={resetScanner} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12px', borderRadius: '8px' }}>
                    Reset
                  </button>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Translate Result To:</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleScanLanguageChange(lang.code)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: scanLanguage === lang.code ? '700' : '500',
                          background: scanLanguage === lang.code ? 'linear-gradient(135deg, var(--primary), var(--primary-blue))' : 'rgba(255,255,255,0.04)',
                          color: scanLanguage === lang.code ? '#fff' : 'var(--text-muted)',
                          border: scanLanguage === lang.code ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`scanner-container ${loading ? 'active' : ''} ${imagePreview ? 'has-image' : ''}`} style={{
                  flex: 1, minHeight: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden', marginBottom: '24px',
                  borderRadius: '16px', background: imagePreview ? '#000' : 'rgba(255,255,255,0.02)',
                  border: imagePreview ? 'none' : '2px dashed rgba(255,255,255,0.1)'
                }}>
                  
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: loading ? 0.3 : 1 }} />
                      {!loading && !result && (
                        <div style={{ position: 'absolute', bottom: '24px', display: 'flex', gap: '12px', zIndex: 10 }}>
                          <button onClick={handleScan} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '16px', borderRadius: '8px' }}>
                            <Sparkles size={18} /> Analyze Medicine
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div onClick={() => fileInputRef.current.click()} style={{ textAlign: 'center', padding: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <Upload size={32} style={{ color: 'var(--primary)' }} />
                      </div>
                      <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>Upload Medicine Label</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '240px', lineHeight: 1.5 }}>
                        Drag and drop packaging, blister packs, bottles, or prescription labels.
                      </p>
                    </div>
                  )}
                  {loading && <LoadingChecklist progress={scanProgress} />}
                </div>

                {!imagePreview && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary" style={{ flex: 1, padding: '14px' }}>
                      <Upload size={18} /> Browse Files
                    </button>
                    <button onClick={startCamera} className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>
                      <Camera size={18} /> Open Camera
                    </button>
                  </div>
                )}
                
                {!imagePreview && (
                  <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                    <p className="caption" style={{ marginBottom: '12px', fontWeight: '600' }}>VERIFICATION DEMO PRESETS</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {PRESET_MEDICINES.map(p => (
                        <button key={p.id} onClick={async () => { const { file, dataUrl } = await generatePresetImageFile(p); setSelectedFile(file); setImagePreview(dataUrl); }} className="badge badge-normal" style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" style={{ marginTop: '16px', flexDirection: 'row', alignItems: 'center' }}>
                    <AlertOctagon size={20} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '14px' }}>{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Results Zone */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={18} />
                  </div>
                  <h2 className="card-heading">{sT.analysisResults}</h2>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {scanTranslating && <Loader2 size={16} className="spin" style={{ color: 'var(--primary)' }} />}
                  {result && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {result.verificationStatus === 'Verified' ? (
                        <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 10px' }}>
                          <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> {sT.verified}
                        </span>
                      ) : result.verificationStatus === 'Partially Verified' ? (
                        <span className="badge badge-warning" style={{ fontSize: '12px', padding: '4px 10px' }}>
                          <AlertTriangle size={14} style={{ marginRight: '6px' }} /> {sT.partiallyVerified}
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: '12px', padding: '4px 10px' }}>
                          <AlertOctagon size={14} style={{ marginRight: '6px' }} /> {sT.notVerified}
                        </span>
                      )}
                      {result.confidenceScore > 0 && (
                        <span className="badge badge-normal" style={{ fontSize: '11px', padding: '3px 8px' }}>
                          {localizeDigits(String(result.confidenceScore), scanLanguage)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!result ? (
                <div className="empty-state" style={{ flex: 1, margin: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Pill size={40} className="empty-state-icon" style={{ margin: 0 }} />
                  </div>
                  <h3 className="empty-state-title" style={{ fontSize: '18px' }}>{sT.awaitingScan}</h3>
                  <p className="empty-state-text" style={{ fontSize: '14px', lineHeight: 1.6 }}>{sT.awaitingScanDesc}</p>
                </div>
              ) : (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px', overflowY: 'auto' }}>
                  
                  {/* Verified Data Header */}
                  <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '220px', paddingRight: '16px' }}>
                        <h3 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '8px' }}>
                          {localizeDigits(result.medicineName, scanLanguage)}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <strong>{sT.generic}:</strong> {localizeDigits(result.genericName || result.activeIngredients || 'N/A', scanLanguage)}
                        </p>
                        {result.manufacturer && (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <strong>{sT.manufacturer}:</strong> {result.manufacturer}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {result.category && <span className="badge badge-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>{result.category}</span>}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {result.dosageForm && <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>{result.dosageForm}</span>}
                          {result.route && <span style={{ fontSize: '12px', color: 'var(--primary)', background: 'rgba(139,92,246,0.1)', padding: '4px 10px', borderRadius: '8px' }}>{result.route}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Ingredients Breakdown Cards (especially for combinations like ACENEXT P & Montypen-LC) */}
                  {result.activeIngredientsList && result.activeIngredientsList.length > 0 && (
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookmarkCheck size={14} style={{ color: 'var(--primary)' }} /> {sT.activeIngredientsBreakdown}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {result.activeIngredientsList.map((ing, idx) => (
                          <div key={idx} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{ing.name}</strong>
                              {ing.class && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({ing.class})</span>}
                              {ing.mechanism && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{ing.mechanism}</p>}
                            </div>
                            <span className="badge badge-normal" style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px' }}>
                              {localizeDigits(ing.strength, scanLanguage)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {result.combinationRationale && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px dashed rgba(139, 92, 246, 0.2)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <strong style={{ color: 'var(--primary)' }}>{sT.combinationRationale}: </strong>
                          {localizeDigits(result.combinationRationale, scanLanguage)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary Tabs */}
                  <div style={{ marginBottom: '20px' }}>
                     <div 
                       className="tab-nav-scroll" 
                       style={{ 
                         margin: 0, 
                         paddingBottom: '0', 
                         borderBottom: '2px solid rgba(255,255,255,0.05)',
                         display: 'flex',
                         gap: '4px',
                         overflowX: 'auto',
                         scrollbarWidth: 'none'
                       }}
                     >
                        {[
                          { id: 'overview', label: sT.overview },
                          { id: 'dosage', label: sT.dosage },
                          { id: 'warnings', label: sT.warnings },
                          { id: 'sideeffects', label: sT.sideEffects }
                        ].map(tab => (
                          <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={activeTab === tab.id ? 'active' : ''}
                            style={{ 
                              padding: '10px 12px', 
                              fontSize: '14px',
                              fontWeight: '600',
                              flex: '1 1 0',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              minWidth: 'fit-content'
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div style={{ flex: 1, fontSize: '15px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                    {activeTab === 'overview' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.clinicalPurpose}</h4>
                          <p>{localizeDigits(result.purposeAndUses || result.usageInstructions, scanLanguage)}</p>
                        </div>
                        {result.clinicalUses && result.clinicalUses.length > 0 && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>{sT.primaryUse}</h4>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {result.clinicalUses.map((use, idx) => (
                                <li key={idx}>{localizeDigits(use, scanLanguage)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building size={16} /> {sT.manufacturer}
                            </h4>
                            <p>{result.manufacturer || 'Licensed Pharmaceutical Manufacturer'}</p>
                          </div>
                          {result.storage && (
                            <div>
                              <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.storage}</h4>
                              <p>{localizeDigits(result.storage, scanLanguage)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'dosage' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="alert alert-primary" style={{ padding: '18px' }}>
                          <strong className="alert-title" style={{ fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} /> {sT.standardDose}
                          </strong>
                          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
                            {localizeDigits(result.dosageReference || result.dosage || sT.referenceDosageNotice, scanLanguage)}
                          </p>
                        </div>

                        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            <Info size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px', color: 'var(--primary)' }} />
                            {sT.referenceDosageNotice}
                          </p>
                        </div>

                        {result.usageInstructions && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.usageInstructions}</h4>
                            <p>{localizeDigits(Array.isArray(result.usageInstructions) ? result.usageInstructions.join(' ') : result.usageInstructions, scanLanguage)}</p>
                          </div>
                        )}

                        {result.missedDose && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.missedDose}</h4>
                            <p>{localizeDigits(Array.isArray(result.missedDose) ? result.missedDose.join(' ') : result.missedDose, scanLanguage)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'warnings' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {result.warnings && (
                          <div className="alert alert-danger" style={{ padding: '18px' }}>
                            <strong className="alert-title" style={{ fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <ShieldAlert size={16} /> {sT.criticalWarnings}
                            </strong>
                            <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
                              {localizeDigits(Array.isArray(result.warnings) ? result.warnings.join(' ') : result.warnings, scanLanguage)}
                            </p>
                          </div>
                        )}

                        {result.precautions && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.generalPrecautions}</h4>
                            <p>{localizeDigits(Array.isArray(result.precautions) ? result.precautions.join(' ') : result.precautions, scanLanguage)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'sideeffects' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {result.sideEffects && (
                          <>
                            {result.sideEffects.common && result.sideEffects.common.length > 0 && (
                              <div className="alert alert-warning" style={{ padding: '18px' }}>
                                <strong className="alert-title" style={{ fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <AlertOctagon size={16} /> {sT.commonSideEffects}
                                </strong>
                                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {result.sideEffects.common.map((s, idx) => (
                                    <li key={idx}>{localizeDigits(s, scanLanguage)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {result.sideEffects.serious && result.sideEffects.serious.length > 0 && (
                              <div className="alert alert-danger" style={{ padding: '18px' }}>
                                <strong className="alert-title" style={{ fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <AlertTriangle size={16} /> {sT.seriousSideEffects}
                                </strong>
                                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {result.sideEffects.serious.map((s, idx) => (
                                    <li key={idx}>{localizeDigits(s, scanLanguage)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {typeof result.sideEffects === 'string' && (
                              <div className="alert alert-warning" style={{ padding: '18px' }}>
                                <strong className="alert-title" style={{ fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <AlertOctagon size={16} /> {sT.knownSideEffects}
                                </strong>
                                <p style={{ fontSize: '14px' }}>{localizeDigits(result.sideEffects, scanLanguage)}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Medical References Citations Bar */}
                  {result.sources && result.sources.length > 0 && (
                    <div style={{ marginTop: '24px', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {sT.medicalReferences}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {result.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '12px', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          >
                            {src.name} {src.citationDate ? `(${localizeDigits(src.citationDate, scanLanguage)})` : ''} <ExternalLink size={11} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '28px' }}>
                    <MedicalDisclaimer />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {scanMode === 'name' && (
        <div className="dashboard-grid fade-in">
          {/* LEFT: Search input */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--info)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={18} />
                  </div>
                  <h2 className="card-heading">{nT.searchTitle}</h2>
                </div>
                {nameResult && (
                  <button onClick={resetNameSearch} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12px', borderRadius: '8px' }}>
                    {nT.reset}
                  </button>
                )}
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className="body-text" style={{ fontSize: '14px' }}>{nT.searchPrompt}</p>
                <form onSubmit={handleNameSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input 
                        type="text" 
                        value={nameQuery} 
                        onChange={(e) => setNameQuery(e.target.value)} 
                        placeholder={nT.searchPlaceholder} 
                        className="input" 
                        style={{ paddingLeft: '44px', fontSize: '15px', width: '100%', height: '48px', borderRadius: '8px' }} 
                        disabled={nameLoading} 
                      />
                    </div>
                    <div style={{ position: 'relative', width: '135px', flexShrink: 0 }}>
                      <Globe size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <select
                        aria-label="Search Language"
                        value={outputLanguage}
                        onChange={e => handleLanguageChange(e.target.value)}
                        className="input"
                        style={{
                          paddingLeft: '34px',
                          paddingRight: '26px',
                          height: '48px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          appearance: 'none',
                          width: '100%',
                          background: 'var(--bg-input)'
                        }}
                      >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी</option>
                        <option value="gu">ગુજરાતી</option>
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={nameLoading || !nameQuery.trim()} style={{ padding: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px' }}>
                    {nameLoading ? <><Loader2 size={18} className="spin" /> {nT.searching}</> : <><Sparkles size={18} /> {nT.searchMedicine}</>}
                  </button>
                </form>
                {nameError && (
                  <div className="alert alert-danger" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                    <AlertOctagon size={20} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '14px' }}>{nameError}</p>
                  </div>
                )}
                {!nameResult && !nameLoading && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                    <p className="caption" style={{ marginBottom: '12px', fontWeight: '600' }}>{nT.quickSuggestions}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['ACENEXT P', 'Montypen-LC', 'Paracetamol', 'Metformin', 'Augmentin', 'Ibuprofen'].map(name => (
                        <button key={name} type="button" onClick={() => setNameQuery(name)} className="badge badge-normal" style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '12px', borderRadius: '8px' }}>{name}</button>
                      ))}
                    </div>
                  </div>
                )}
                {nameLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'rgba(6, 182, 212, 0.03)', borderRadius: '16px', padding: '40px', border: '2px dashed rgba(6, 182, 212, 0.15)' }}>
                    <Loader2 size={44} className="spin" style={{ color: 'var(--info)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{nT.analyzingData}</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{nT.aiRetrieving}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* RIGHT: Search results */}
          <div className="col-6">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={18} />
                  </div>
                  <h2 className="card-heading">{nT.searchResults}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Language Translator Selector in Results Header */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Globe size={14} style={{ position: 'absolute', left: '10px', color: 'var(--primary)', pointerEvents: 'none' }} />
                    <select
                      aria-label="Result Language"
                      value={outputLanguage}
                      onChange={e => handleLanguageChange(e.target.value)}
                      style={{
                        paddingLeft: '30px',
                        paddingRight: '26px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: 'var(--primary)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none'
                      }}
                    >
                      <option value="en" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>English</option>
                      <option value="hi" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>हिन्दी</option>
                      <option value="gu" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>ગુજરાતી</option>
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: '8px', color: 'var(--primary)', pointerEvents: 'none' }} />
                  </div>
                  {nameResult && <span className="badge badge-success"><CheckCircle2 size={14} style={{ marginRight: '6px' }} /> {nT.found}</span>}
                </div>
              </div>
              {!nameResult ? (
                <div className="empty-state" style={{ flex: 1, margin: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Pill size={40} className="empty-state-icon" style={{ margin: 0 }} />
                  </div>
                  <h4 className="empty-state-title" style={{ fontSize: '18px' }}>{nT.awaitingSearch}</h4>
                  <p className="empty-state-text" style={{ fontSize: '15px', lineHeight: 1.6 }}>{nT.awaitingSearchDesc}</p>
                </div>
              ) : (
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>{renderNameResult()}</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isCameraOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8, 10, 22, 0.95)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
             <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Capture Label</h3>
             <button onClick={stopCameraStream} className="btn btn-secondary" style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none' }}><X size={24} color="#fff" /></button>
           </div>
           
           <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
             {cameraError ? (
               <div style={{ padding: '24px', textAlign: 'center' }}>
                 <AlertOctagon size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
                 <p style={{ color: '#fff', fontSize: '16px' }}>{cameraError}</p>
               </div>
             ) : (
               <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '800px', maxHeight: '800px' }}>
                 <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 {/* Camera Overlay Guide */}
                 <div style={{ position: 'absolute', inset: '40px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                 <canvas ref={canvasRef} style={{ display: 'none' }} />
               </div>
             )}
           </div>

           <div className="camera-overlay-actions">
              <button onClick={stopCameraStream} className="btn" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', borderRadius: '50px' }}>Cancel</button>
              {!cameraError && (
                <button onClick={captureCameraFrame} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '50px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Camera size={20} /> Capture Frame
                </button>
              )}
           </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ScannerPage;
