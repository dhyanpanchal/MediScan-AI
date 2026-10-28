import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext(null);

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    diseaseSearch: 'Disease Search',
    medicineScanner: 'Medicine Scanner',
    reportAnalyzer: 'Report Analyzer',
    medicalHistory: 'Medical History',
    adminPanel: 'Admin Panel',
    settings: 'Settings',
    logOut: 'Log Out',
    // Disease Search Page
    diseaseSearchTitle: 'Disease Search',
    diseaseSearchSubtitle: 'Search for diseases, symptoms, treatments and medicines',
    searchPlaceholder: 'Search disease (e.g., Diabetes, Cancer, Fever...)',
    searchBtn: 'Search',
    selectAge: 'Select Age',
    ageGroup: 'Age Group',
    child: 'Child (0-12)',
    teen: 'Teen (13-17)',
    adult: 'Adult (18-59)',
    senior: 'Senior (60+)',
    commonSymptoms: 'Common Symptoms',
    homeRemedies: 'Home Remedies',
    recommendedMedicines: 'Recommended Medicines & Side Effects',
    causes: 'Causes',
    prevention: 'Prevention',
    whenToSeeDoctor: 'When to See a Doctor',
    purpose: 'Purpose',
    dosage: 'Dosage',
    sideEffects: 'Side Effects',
    searching: 'Searching...',
    noResults: 'No results found. Try a different disease name.',
    diseaseOverview: 'Disease Overview',
    treatmentAndRemedies: 'Treatment & Remedies',
    clinicalMedicines: 'Clinical Medicines',
    ageSpecificAdvice: 'Age-Specific Advice',
    profileApplied: 'Profile Applied',
    // Scanner Page
    scannerTitle: 'AI Medicine & Drug Scanner',
    searchByName: 'Search by Medicine Name',
    searchMedicinePlaceholder: 'Enter medicine name (e.g., Paracetamol, Amoxicillin...)',
    orUploadImage: 'Or Upload Medicine Image',
    overview: 'Overview',
    warnings: 'Warnings',
    // Settings Page
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    darkTheme: 'Dark Theme',
    lightTheme: 'Light Theme',
    language: 'Language',
    fontSize: 'Font Size',
    standard: 'Standard',
    large: 'Large',
    extraLarge: 'Extra Large',
    accountDetails: 'Account Details',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    save: 'Save Changes',
    saved: 'Saved!',
    // Common
    loading: 'Loading...',
    error: 'An error occurred',
    close: 'Close',
    copy: 'Copy',
    print: 'Print',
    delete: 'Delete',
    cancel: 'Cancel',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    clinicalDashboard: 'Clinical Dashboard',
    welcomeBack: 'Welcome back, {name}. Here is your healthcare summary.',
    medicineScans: 'Medicine Scans',
    diseaseSearches: 'Disease Searches',
    reportsParsed: 'Reports Parsed',
    lastActivity: 'Last Activity',
    noActivity: 'No activity',
    healthTip: 'Health Tip of the Day',
    defaultTip: 'Keep record scans up to date to easily review them in consultation with your doctor.',
    recentMedicineScans: 'Recent Medicine Scans',
    viewAll: 'View all →',
    noMedicineScans: 'No medicine scans completed yet.',
    active: 'Active: ',
    recentDocumentAnalyses: 'Recent Document Analyses',
    noMedicalReports: 'No medical reports analyzed yet.',
    quickActions: 'Quick Actions',
    scanMedicineLabel: 'Scan Medicine Label',
    analyzeLabReport: 'Analyze Lab Report',
    searchDiseaseQuick: 'Search Disease',
    clinicalProfile: 'Clinical Profile',
    dateOfBirth: 'Date of Birth',
    phone: 'Phone',
    authProvider: 'Auth Provider',
    emailPassword: 'Email / Password',
    notSpecified: 'Not specified',
    recentDiseaseSearches: 'Recent Disease Searches',
    noDiseaseSearches: 'No disease searches yet.',
    loadingMetrics: 'Loading health metrics…',
    accessDenied: 'Access Denied',
    accessDeniedMsg: 'This panel is restricted to system administrators. Your credentials are not authorized to view this page.',
    returnToDashboard: 'Return to Dashboard',
    adminPortal: 'Administrative Portal',
    adminPortalDesc: 'System-wide logs, user directories, and patient diagnostic search histories.',
    adminMode: 'Admin Mode',
    overviewStats: 'Overview Stats',
    userRegistry: 'User Registry',
    reportAnalyses: 'Report Analyses',
    fetchingAdminData: 'Fetching administrative data...',
    registeredPatients: 'Registered Patients',
    totalMedicineScans: 'Total Medicine Scans',
    reportsAnalyzed: 'Reports Analyzed',
    registrationMethods: 'Registration Methods',
    emailPasswordLogins: 'Email & Password Logins',
    googleOauthSignups: 'Google OAuth Signups',
    demographicsGender: 'Demographics (Gender)',
    noGenderMetrics: 'No gender metrics available.',
    recentRegistrations: 'Recent Registrations',
    searchPatientsPlaceholder: 'Search patients by name or email address...',
    searchScanHistoryPlaceholder: 'Search global scan history by medicine name...',
    searchReportsPlaceholder: 'Search global report analyses by file name or keywords...',
    searchDiseasePlaceholder: 'Search global disease searches by name or keywords...',
    patientName: 'Patient Name',
    emailAddress: 'Email Address',
    phoneNumber: 'Phone Number',
    provider: 'Provider',
    registeredDate: 'Registered Date',
    inspectPatient: 'Inspect Patient',
    noPatientsFound: 'No patients found matching the search criteria.',
    patientDetails: 'Patient Details',
    medicineName: 'Medicine Name',
    activeIngredients: 'Active Ingredients',
    scanDate: 'Scan Date',
    viewAnalysis: 'View Analysis',
    noMedicineScanLogs: 'No medicine scan logs found.',
    fileName: 'File Name',
    type: 'Type',
    summaryExtract: 'Summary Extract',
    parsedDate: 'Parsed Date',
    viewDiagnostic: 'View Diagnostic',
    noDiagnosticReportLogs: 'No diagnostic report logs found.',
    diseaseName: 'Disease Name',
    query: 'Query',
    searchedDate: 'Searched Date',
    noDiseaseSearchLogs: 'No disease search logs found.',
    patientRecordsPortfolio: 'Patient Records Portfolio',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    diseaseSearch: 'रोग खोज',
    medicineScanner: 'दवा स्कैनर',
    reportAnalyzer: 'रिपोर्ट विश्लेषक',
    medicalHistory: 'चिकित्सा इतिहास',
    adminPanel: 'एडमिन पैनल',
    settings: 'सेटिंग्स',
    logOut: 'लॉग आउट',
    // Disease Search Page
    diseaseSearchTitle: 'रोग खोज',
    diseaseSearchSubtitle: 'बीमारियों, लक्षणों, उपचार और दवाओं की खोज करें',
    searchPlaceholder: 'बीमारी खोजें (जैसे, मधुमेह, कैंसर, बुखार...)',
    searchBtn: 'खोजें',
    selectAge: 'आयु चुनें',
    ageGroup: 'आयु समूह',
    child: 'बच्चा (0-12)',
    teen: 'किशोर (13-17)',
    adult: 'वयस्क (18-59)',
    senior: 'वृद्ध (60+)',
    commonSymptoms: 'सामान्य लक्षण',
    homeRemedies: 'घरेलू उपाय',
    recommendedMedicines: 'अनुशंसित दवाएं और दुष्प्रभाव',
    causes: 'कारण',
    prevention: 'रोकथाम',
    whenToSeeDoctor: 'डॉक्टर कब देखें',
    purpose: 'उद्देश्य',
    dosage: 'खुराक',
    sideEffects: 'दुष्प्रभाव',
    searching: 'खोज रहे हैं...',
    noResults: 'कोई परिणाम नहीं मिला। कोई अन्य बीमारी का नाम आज़माएं।',
    diseaseOverview: 'रोग अवलोकन',
    treatmentAndRemedies: 'उपचार और उपाय',
    clinicalMedicines: 'नैदानिक दवाएं',
    ageSpecificAdvice: 'आयु-विशिष्ट सलाह',
    profileApplied: 'प्रोफ़ाइल लागू',
    // Scanner Page
    scannerTitle: 'AI दवा और ड्रग स्कैनर',
    searchByName: 'दवा के नाम से खोजें',
    searchMedicinePlaceholder: 'दवा का नाम दर्ज करें (जैसे, पैरासिटामोल, एमोक्सिसिलिन...)',
    orUploadImage: 'या दवा की छवि अपलोड करें',
    overview: 'अवलोकन',
    warnings: 'चेतावनियाँ',
    // Settings Page
    settingsTitle: 'सेटिंग्स',
    appearance: 'रूप-रंग',
    darkTheme: 'डार्क थीम',
    lightTheme: 'लाइट थीम',
    language: 'भाषा',
    fontSize: 'फ़ॉन्ट आकार',
    standard: 'सामान्य',
    large: 'बड़ा',
    extraLarge: 'अतिरिक्त बड़ा',
    accountDetails: 'खाता विवरण',
    name: 'नाम',
    email: 'ईमेल',
    phone: 'फ़ोन',
    dateOfBirth: 'जन्म तिथि',
    gender: 'लिंग',
    save: 'परिवर्तन सहेजें',
    saved: 'सहेजा गया!',
    // Common
    loading: 'लोड हो रहा है...',
    error: 'एक त्रुटि हुई',
    close: 'बंद करें',
    copy: 'कॉपी करें',
    print: 'प्रिंट करें',
    delete: 'हटाएं',
    cancel: 'रद्द करें',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    clinicalDashboard: 'क्लिनिकल डैशबोर्ड',
    welcomeBack: 'वापसी पर स्वागत है, {name}। यहाँ आपका स्वास्थ्य सारांश है।',
    medicineScans: 'दवा स्कैन',
    diseaseSearches: 'रोग खोजें',
    reportsParsed: 'रिपोर्ट विश्लेषित',
    lastActivity: 'अंतिम गतिविधि',
    noActivity: 'कोई गतिविधि नहीं',
    healthTip: 'आज का स्वास्थ्य टिप',
    defaultTip: 'अपने डॉक्टर से परामर्श में आसानी से समीक्षा करने के लिए रिकॉर्ड स्कैन को अपडेट रखें।',
    recentMedicineScans: 'हाल के दवा स्कैन',
    viewAll: 'सभी देखें →',
    noMedicineScans: 'अभी तक कोई दवा स्कैन पूरा नहीं हुआ है।',
    active: 'सक्रिय: ',
    recentDocumentAnalyses: 'हाल के दस्तावेज़ विश्लेषण',
    noMedicalReports: 'अभी तक कोई मेडिकल रिपोर्ट विश्लेषित नहीं की गई है।',
    quickActions: 'त्वरित कार्रवाई',
    scanMedicineLabel: 'दवा लेबल स्कैन करें',
    analyzeLabReport: 'लैब रिपोर्ट का विश्लेषण करें',
    searchDiseaseQuick: 'रोग खोजें',
    clinicalProfile: 'क्लिनिकल प्रोफ़ाइल',
    dateOfBirth: 'जन्म तिथि',
    phone: 'फ़ोन',
    authProvider: 'प्रमाणीकरण प्रदाता',
    emailPassword: 'ईमेल / पासवर्ड',
    notSpecified: 'निर्दिष्ट नहीं है',
    recentDiseaseSearches: 'हाल की रोग खोजें',
    noDiseaseSearches: 'अभी तक कोई रोग खोज नहीं है।',
    loadingMetrics: 'स्वास्थ्य मेट्रिक्स लोड हो रहे हैं...',
    accessDenied: 'पहुंच अस्वीकृत',
    accessDeniedMsg: 'यह पैनल सिस्टम प्रशासकों तक सीमित है। आपके क्रेडेंशियल इस पृष्ठ को देखने के लिए अधिकृत नहीं हैं।',
    returnToDashboard: 'डैशबोर्ड पर वापस लौटें',
    adminPortal: 'प्रशासनिक पोर्टल',
    adminPortalDesc: 'सिस्टम-वाइड लॉग, उपयोगकर्ता निर्देशिकाएं और रोगी नैदानिक खोज इतिहास।',
    adminMode: 'एडमिन मोड',
    overviewStats: 'अवलोकन आँकड़े',
    userRegistry: 'उपयोगकर्ता रजिस्ट्री',
    reportAnalyses: 'रिपोर्ट विश्लेषण',
    fetchingAdminData: 'प्रशासनिक डेटा लाया जा रहा है...',
    registeredPatients: 'पंजीकृत मरीज',
    totalMedicineScans: 'कुल दवा स्कैन',
    reportsAnalyzed: 'रिपोर्ट विश्लेषित',
    registrationMethods: 'पंजीकरण के तरीके',
    emailPasswordLogins: 'ईमेल और पासवर्ड लॉगिन',
    googleOauthSignups: 'Google OAuth साइनअप',
    demographicsGender: 'जनसांख्यिकी (लिंग)',
    noGenderMetrics: 'कोई लिंग मीट्रिक उपलब्ध नहीं है।',
    recentRegistrations: 'हाल के पंजीकरण',
    searchPatientsPlaceholder: 'नाम या ईमेल पते से रोगियों की खोज करें...',
    searchScanHistoryPlaceholder: 'दवा के नाम से वैश्विक स्कैन इतिहास खोजें...',
    searchReportsPlaceholder: 'फ़ाइल नाम या कीवर्ड द्वारा वैश्विक रिपोर्ट विश्लेषण खोजें...',
    searchDiseasePlaceholder: 'नाम या कीवर्ड द्वारा वैश्विक रोग खोजें खोजें...',
    patientName: 'रोगी का नाम',
    emailAddress: 'ईमेल पता',
    phoneNumber: 'फ़ोन नंबर',
    provider: 'प्रदाता',
    registeredDate: 'पंजीकृत तिथि',
    inspectPatient: 'रोगी का निरीक्षण करें',
    noPatientsFound: 'खोज मानदंडों से मेल खाने वाला कोई रोगी नहीं मिला।',
    patientDetails: 'रोगी का विवरण',
    medicineName: 'दवा का नाम',
    activeIngredients: 'सक्रिय सामग्री',
    scanDate: 'स्कैन तिथि',
    viewAnalysis: 'विश्लेषण देखें',
    noMedicineScanLogs: 'कोई दवा स्कैन लॉग नहीं मिला।',
    fileName: 'फ़ाइल का नाम',
    type: 'प्रकार',
    summaryExtract: 'सारांश निकालें',
    parsedDate: 'पार्स की गई तिथि',
    viewDiagnostic: 'नैदानिक ​​देखें',
    noDiagnosticReportLogs: 'कोई नैदानिक ​​रिपोर्ट लॉग नहीं मिला।',
    diseaseName: 'रोग का नाम',
    query: 'क्वेरी',
    searchedDate: 'खोज की तिथि',
    noDiseaseSearchLogs: 'कोई रोग खोज लॉग नहीं मिला।',
    patientRecordsPortfolio: 'रोगी रिकॉर्ड पोर्टफोलियो',
    // Dynamic Sentences
    "Always check the expiry date of medicines before consumption.": "सेवन से पहले हमेशा दवाओं की समाप्ति तिथि जांचें।",
    "Antibiotics should always be completed as prescribed, even if you feel better.": "एंटीबायोटिक्स हमेशा निर्धारित अनुसार पूरे किए जाने चाहिए, भले ही आप बेहतर महसूस करें।",
    "Keep a list of all your allergies handy, especially when scanning new drugs.": "अपनी सभी एलर्जी की सूची हमेशा साथ रखें, खासकर नई दवाओं को स्कैन करते समय।",
    "Most medical report levels are reference ranges; a minor variance does not immediately indicate a disease.": "अधिकांश मेडिकल रिपोर्ट स्तर संदर्भ सीमाएं हैं; थोड़ा सा अंतर तुरंत किसी बीमारी का संकेत नहीं देता है।",
    "Avoid drinking alcohol while taking NSAIDs (like Ibuprofen) to protect your stomach lining.": "अपने पेट की परत को बचाने के लिए NSAIDs (जैसे इबुप्रोफेन) लेते समय शराब पीने से बचें।",
    "Most of your report is stable. However, your hemoglobin is low and cholesterol is high. Following a balanced diet and consulting a doctor can help.": "आपकी अधिकांश रिपोर्ट स्थिर है। हालांकि, आपका हीमोग्लोबिन कम है और कोलेस्ट्रॉल अधिक है। संतुलित आहार लेना और डॉक्टर से परामर्श करना मदद कर सकता है।",
    "Most of your report is stable. However, your Oxygen-carrying blood protein (Hemoglobin) is low and Blood cholesterol is high. Following a balanced diet and consulting a doctor can help.": "आपकी अधिकांश रिपोर्ट स्थिर है। हालांकि, आपका ऑक्सीजन ले जाने वाला रक्त प्रोटीन (हीमोग्लोबिन) कम है और रक्त कोलेस्ट्रॉल अधिक है। संतुलित आहार लेना और डॉक्टर से परामर्श करना मदद कर सकता है।",
    "Most of your report is stable. However, your Oxygen-carrying blood protein (Hemoglobin) is low and Blood cholesterol/fat is high. Following a balanced diet and consulting a doctor can help.": "आपकी अधिकांश रिपोर्ट स्थिर है। हालांकि, आपका ऑक्सीजन ले जाने वाला रक्त प्रोटीन (हीमोग्लोबिन) कम है और रक्त कोलेस्ट्रॉल/वसा अधिक है। संतुलित आहार लेना और डॉक्टर से परामर्श करना मदद कर सकता है।",
    "Your dental report shows moderate plaque buildup and minor irritation. Overall health is fair.": "आपकी दंत रिपोर्ट मध्यम पट्टिका निर्माण और मामूली जलन दिखाती है। कुल मिलाकर स्वास्थ्य ठीक है।",
    "Summary not generated": "सारांश उत्पन्न नहीं हुआ",
  },
  gu: {
    // Navigation
    dashboard: 'ડેશબોર્ડ',
    diseaseSearch: 'રોગ શોધ',
    medicineScanner: 'દવા સ્કેનર',
    reportAnalyzer: 'અહેવાલ વિશ્લેષક',
    medicalHistory: 'તબીબી ઇતિહાસ',
    adminPanel: 'એડમિન પેનલ',
    settings: 'સેટિંગ્સ',
    logOut: 'લૉગ આઉટ',
    // Disease Search Page
    diseaseSearchTitle: 'રોગ શોધ',
    diseaseSearchSubtitle: 'રોગો, લક્ષણો, સારવાર અને દવાઓ શોધો',
    searchPlaceholder: 'રોગ શોધો (જેમ કે, ડાયાબિટીસ, કેન્સર, તાવ...)',
    searchBtn: 'શોધો',
    selectAge: 'ઉંમર પસંદ કરો',
    ageGroup: 'ઉંમર જૂથ',
    child: 'બાળક (0-12)',
    teen: 'કિશોર (13-17)',
    adult: 'પ્રૌઢ (18-59)',
    senior: 'વૃદ્ધ (60+)',
    commonSymptoms: 'સામાન્ય લક્ષણો',
    homeRemedies: 'ઘરેલું ઉપાય',
    recommendedMedicines: 'ભલામણ કરેલ દવાઓ અને આડ અસરો',
    causes: 'કારણો',
    prevention: 'નિવારણ',
    whenToSeeDoctor: 'ડૉક્ટર ક્યારે મળવું',
    purpose: 'હેતુ',
    dosage: 'ડોઝ',
    sideEffects: 'આડ અસરો',
    searching: 'શોધી રહ્યા છીએ...',
    noResults: 'કોઈ પરિણામ મળ્યું નહીં. અન્ય રોગ નામ અજમાવો.',
    diseaseOverview: 'રોગની ઝાંખી',
    treatmentAndRemedies: 'સારવાર અને ઉપાય',
    clinicalMedicines: 'ક્લિનિકલ દવાઓ',
    ageSpecificAdvice: 'ઉંમર-વિશિષ્ટ સલાહ',
    profileApplied: 'પ્રોફાઇલ લાગુ',
    // Scanner Page
    scannerTitle: 'AI દવા અને ડ્રગ સ્કેનર',
    searchByName: 'દવાના નામ દ્વારા શોધો',
    searchMedicinePlaceholder: 'દવાનું નામ દાખલ કરો (જેમ કે, પેરાસિટામોલ, એમોક્સિસિલિન...)',
    orUploadImage: 'અથવા દવાની છબી અપલોડ કરો',
    overview: 'વિહંગાવલોકન',
    warnings: 'ચેતવણીઓ',
    // Settings Page
    settingsTitle: 'સેટિંગ્સ',
    appearance: 'દેખાવ',
    darkTheme: 'ડાર્ક થીમ',
    lightTheme: 'લાઇટ થીમ',
    language: 'ભાષા',
    fontSize: 'ફૉન્ટ કદ',
    standard: 'સ્ટાન્ડર્ડ',
    large: 'મોટો',
    extraLarge: 'વધારે મોટો',
    accountDetails: 'ખાતા વિગતો',
    name: 'નામ',
    email: 'ઇમેઇલ',
    phone: 'ફોન',
    dateOfBirth: 'જન્મ તારીખ',
    gender: 'જાતિ',
    save: 'ફેરફારો સાચવો',
    saved: 'સાચવ્યું!',
    // Common
    loading: 'લોડ થઈ રહ્યું છે...',
    error: 'એક ભૂલ આવી',
    close: 'બંધ કરો',
    copy: 'નકલ કરો',
    print: 'પ્રિન્ટ કરો',
    delete: 'કાઢી નાખો',
    cancel: 'રદ કરો',
    male: 'પુરુષ',
    female: 'સ્ત્રી',
    other: 'અન્ય',
    clinicalDashboard: 'ક્લિનિકલ ડેશબોર્ડ',
    welcomeBack: 'ફરી સ્વાગત છે, {name}. આ તમારો આરોગ્ય સારાંશ છે.',
    medicineScans: 'દવા સ્કેન',
    diseaseSearches: 'રોગ શોધ',
    reportsParsed: 'અહેવાલ વિશ્લેષણ',
    lastActivity: 'છેલ્લી પ્રવૃત્તિ',
    noActivity: 'કોઈ પ્રવૃત્તિ નથી',
    healthTip: 'આજની હેલ્થ ટિપ',
    defaultTip: 'તમારા ડૉક્ટરની સલાહમાં સરળતાથી સમીક્ષા કરવા માટે રેકોર્ડ સ્કેન અપડેટ રાખો.',
    recentMedicineScans: 'તાજેતરના દવા સ્કેન',
    viewAll: 'બધા જુઓ →',
    noMedicineScans: 'હજુ સુધી કોઈ દવા સ્કેન પૂર્ણ થયું નથી.',
    active: 'સક્રિય: ',
    recentDocumentAnalyses: 'તાજેતરના દસ્તાવેજ વિશ્લેષણ',
    noMedicalReports: 'હજુ સુધી કોઈ તબીબી અહેવાલનું વિશ્લેષણ કરવામાં આવ્યું નથી.',
    quickActions: 'ઝડપી ક્રિયાઓ',
    scanMedicineLabel: 'દવા લેબલ સ્કેન કરો',
    analyzeLabReport: 'લેબ રિપોર્ટનું વિશ્લેષણ કરો',
    searchDiseaseQuick: 'રોગ શોધો',
    clinicalProfile: 'ક્લિનિકલ પ્રોફાઇલ',
    dateOfBirth: 'જન્મ તારીખ',
    phone: 'ફોન',
    authProvider: 'સત્તાધિકરણ પ્રદાતા',
    emailPassword: 'ઇમેઇલ / પાસવર્ડ',
    notSpecified: 'સ્પષ્ટ કરેલ નથી',
    recentDiseaseSearches: 'તાજેતરની રોગ શોધો',
    noDiseaseSearches: 'હજુ સુધી કોઈ રોગ શોધ નથી.',
    loadingMetrics: 'આરોગ્ય મેટ્રિક્સ લોડ થઈ રહ્યાં છે...',
    accessDenied: 'પ્રવેશ નામંજૂર',
    accessDeniedMsg: 'આ પેનલ સિસ્ટમ સંચાલકો સુધી મર્યાદિત છે. તમારા ઓળખપત્રો આ પૃષ્ઠને જોવા માટે અધિકૃત નથી.',
    returnToDashboard: 'ડેશબોર્ડ પર પાછા ફરો',
    adminPortal: 'વહીવટી પોર્ટલ',
    adminPortalDesc: 'સિસ્ટમ-વ્યાપી લૉગ્સ, વપરાશકર્તા ડિરેક્ટરીઓ અને દર્દી નિદાન શોધ ઇતિહાસ.',
    adminMode: 'એડમિન મોડ',
    overviewStats: 'વિહંગાવલોકન આંકડા',
    userRegistry: 'વપરાશકર્તા રજિસ્ટ્રી',
    reportAnalyses: 'અહેવાલ વિશ્લેષણ',
    fetchingAdminData: 'વહીવટી ડેટા લાવી રહ્યા છીએ...',
    registeredPatients: 'નોંધાયેલા દર્દીઓ',
    totalMedicineScans: 'કુલ દવા સ્કેન',
    reportsAnalyzed: 'અહેવાલ વિશ્લેષિત',
    registrationMethods: 'નોંધણી પદ્ધતિઓ',
    emailPasswordLogins: 'ઇમેઇલ અને પાસવર્ડ લૉગિન',
    googleOauthSignups: 'Google OAuth સાઇનઅપ્સ',
    demographicsGender: 'વસ્તી વિષયક (જાતિ)',
    noGenderMetrics: 'કોઈ જાતિ મેટ્રિક્સ ઉપલબ્ધ નથી.',
    recentRegistrations: 'તાજેતરની નોંધણીઓ',
    searchPatientsPlaceholder: 'નામ અથવા ઇમેઇલ સરનામા દ્વારા દર્દીઓની શોધ કરો...',
    searchScanHistoryPlaceholder: 'દવાના નામ દ્વારા વૈશ્વિક સ્કેન ઇતિહાસ શોધો...',
    searchReportsPlaceholder: 'ફાઇલ નામ અથવા કીવર્ડ્સ દ્વારા વૈશ્વિક અહેવાલ વિશ્લેષણ શોધો...',
    searchDiseasePlaceholder: 'નામ અથવા કીવર્ડ્સ દ્વારા વૈશ્વિક રોગ શોધો શોધો...',
    patientName: 'દર્દીનું નામ',
    emailAddress: 'ઇમેઇલ સરનામું',
    phoneNumber: 'ફોન નંબર',
    provider: 'પ્રદાતા',
    registeredDate: 'નોંધણી તારીખ',
    inspectPatient: 'દર્દીની તપાસ કરો',
    noPatientsFound: 'શોધ માપદંડો સાથે મેળ ખાતા કોઈ દર્દી મળ્યા નથી.',
    patientDetails: 'દર્દીની વિગતો',
    medicineName: 'દવાનું નામ',
    activeIngredients: 'સક્રિય ઘટકો',
    scanDate: 'સ્કેન તારીખ',
    viewAnalysis: 'વિશ્લેષણ જુઓ',
    noMedicineScanLogs: 'કોઈ દવા સ્કેન લૉગ મળ્યા નથી.',
    fileName: 'ફાઇલનું નામ',
    type: 'પ્રકાર',
    summaryExtract: 'સારાંશ અર્ક',
    parsedDate: 'પાર્સ કરેલી તારીખ',
    viewDiagnostic: 'નિદાનાત્મક જુઓ',
    noDiagnosticReportLogs: 'કોઈ નિદાનાત્મક રિપોર્ટ લૉગ મળ્યા નથી.',
    diseaseName: 'રોગનું નામ',
    query: 'ક્વેરી',
    searchedDate: 'શોધેલી તારીખ',
    noDiseaseSearchLogs: 'કોઈ રોગ શોધ લૉગ મળ્યા નથી.',
    patientRecordsPortfolio: 'દર્દી રેકોર્ડ્સ પોર્ટફોલિયો',
    // Dynamic Sentences
    "Always check the expiry date of medicines before consumption.": "ઉપયોગ કરતા પહેલા હંમેશા દવાઓની એક્સપાયરી તારીખ તપાસો.",
    "Antibiotics should always be completed as prescribed, even if you feel better.": "તમને સારું લાગે તો પણ એન્ટિબાયોટિક્સનો કોર્સ પૂરો કરવો જોઈએ.",
    "Keep a list of all your allergies handy, especially when scanning new drugs.": "નવી દવાઓ સ્કેન કરતી વખતે તમારી બધી એલર્જીની સૂચિ હાથમાં રાખો.",
    "Most medical report levels are reference ranges; a minor variance does not immediately indicate a disease.": "મોટાભાગના તબીબી રિપોર્ટ સ્તરો સંદર્ભ શ્રેણીઓ છે; થોડો ફેરફાર તાત્કાલિક કોઈ રોગ સૂચવતો નથી.",
    "Avoid drinking alcohol while taking NSAIDs (like Ibuprofen) to protect your stomach lining.": "તમારા પેટના અસ્તરને બચાવવા માટે NSAIDs લેતી વખતે આલ્કોહોલ પીવાનું ટાળો.",
    "Most of your report is stable. However, your hemoglobin is low and cholesterol is high. Following a balanced diet and consulting a doctor can help.": "તમારો રિપોર્ટ મોટાભાગે સ્થિર છે. જો કે, તમારું હિમોગ્લોબિન ઓછું છે અને કોલેસ્ટ્રોલ વધારે છે. સંતુલિત આહાર લેવો અને ડૉક્ટરની સલાહ લેવી મદદરૂપ થઈ શકે છે.",
    "Most of your report is stable. However, your Oxygen-carrying blood protein (Hemoglobin) is low and Blood cholesterol is high. Following a balanced diet and consulting a doctor can help.": "તમારો રિપોર્ટ મોટાભાગે સ્થિર છે. જો કે, તમારું ઓક્સિજન-વહન કરતું બ્લડ પ્રોટીન (હિમોગ્લોબિન) ઓછું છે અને બ્લડ કોલેસ્ટ્રોલ વધારે છે. સંતુલિત આહાર લેવો અને ડૉક્ટરની સલાહ લેવી મદદરૂપ થઈ શકે છે.",
    "Most of your report is stable. However, your Oxygen-carrying blood protein (Hemoglobin) is low and Blood cholesterol/fat is high. Following a balanced diet and consulting a doctor can help.": "તમારો રિપોર્ટ મોટાભાગે સ્થિર છે. જો કે, તમારું ઓક્સિજન-વહન કરતું બ્લડ પ્રોટીન (હિમોગ્લોબિન) ઓછું છે અને બ્લડ કોલેસ્ટ્રોલ/ચરબી વધારે છે. સંતુલિત આહાર લેવો અને ડૉક્ટરની સલાહ લેવી મદદરૂપ થઈ શકે છે.",
    "Your dental report shows moderate plaque buildup and minor irritation. Overall health is fair.": "તમારો ડેન્ટલ રિપોર્ટ મધ્યમ પ્લેક બિલ્ડઅપ અને સામાન્ય બળતરા દર્શાવે છે. એકંદરે આરોગ્ય સારું છે.",
    "Summary not generated": "સારાંશ ઉત્પન્ન થયો નથી",
  }
};

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('mediscan_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('mediscan_theme') || 'dark');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('mediscan_fontsize') || 'standard');

  const t = (key, params) => {
    let text = translations[language]?.[key] || translations['en']?.[key] || key;
    if (params && typeof text === 'string') {
      Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
      });
    }
    return text;
  };

  useEffect(() => {
    localStorage.setItem('mediscan_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('mediscan_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mediscan_fontsize', fontSize);
    applyFontSize(fontSize);
  }, [fontSize]);

  // Apply theme on initial mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applyTheme(theme);
    applyFontSize(fontSize);
  }, []);

  const applyTheme = (t) => {
    const root = document.documentElement;
    if (t === 'light') {
      root.style.setProperty('--bg-main', '#f0f4ff');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--bg-card-hover', '#f8f9ff');
      root.style.setProperty('--border-color', '#e2e8f0');
      root.style.setProperty('--text-main', '#0f0f1a');
      root.style.setProperty('--text-muted', '#4a5568');
      root.style.setProperty('--text-dark', '#718096');
      root.style.setProperty('--primary', '#7c3aed');
      root.style.setProperty('--primary-glow', 'rgba(124, 58, 237, 0.3)');
      root.style.setProperty('--primary-hover', '#6d28d9');
      root.style.setProperty('--secondary', '#06b6d4');
      root.style.setProperty('--secondary-glow', 'rgba(6, 182, 212, 0.2)');
    } else {
      root.style.setProperty('--bg-main', '#0d0d1a');
      root.style.setProperty('--bg-card', '#13132a');
      root.style.setProperty('--bg-card-hover', '#1a1a35');
      root.style.setProperty('--border-color', '#2a2a4a');
      root.style.setProperty('--text-main', '#f0f0ff');
      root.style.setProperty('--text-muted', '#9090bb');
      root.style.setProperty('--text-dark', '#6060aa');
      root.style.setProperty('--primary', '#a855f7');
      root.style.setProperty('--primary-glow', 'rgba(168, 85, 247, 0.35)');
      root.style.setProperty('--primary-hover', '#9333ea');
      root.style.setProperty('--secondary', '#06b6d4');
      root.style.setProperty('--secondary-glow', 'rgba(6, 182, 212, 0.25)');
    }
  };

  const applyFontSize = (size) => {
    const root = document.documentElement;
    if (size === 'large') {
      root.style.fontSize = '18px';
      root.style.zoom = '1.1';
    } else if (size === 'extraLarge') {
      root.style.fontSize = '20px';
      root.style.zoom = '1.25';
    } else {
      root.style.fontSize = '16px';
      root.style.zoom = '1';
    }
  };

  const value = {
    language,
    setLanguage,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    t,
    translations,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
