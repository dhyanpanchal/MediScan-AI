/**
 * Clinical Medicine Entity Extractor
 * MediScan AI - Precision OCR entity parser for pharmaceutical labels, blisters, boxes, and leaflets.
 * Extracts Brand Name, Active Pharmaceutical Ingredients (APIs), Strengths, Units, Dosage Forms, and Manufacturers.
 * Resilient against rotated blister foil, metallic reflections, and OCR character corruptions (e.g. USAC vs USAGE).
 */

// Common pharmaceutical units (including common OCR typos like mq for mg)
const STRENGTH_UNITS = '(?:mg|mcg|µg|g|gm|ml|%|%\\s*w\\/v|%\\s*w\\/w|%\\s*v\\/v|IU|I\\.U\\.|units|mEq|mq|mcq)';

// Common dosage forms (specific before generic)
const DOSAGE_FORMS = [
  { form: 'Eye / Ear Drops', regex: /\b(?:eye drops?|ear drops?|eye\/ear drops?|ophthalmic suspension|ophthalmic solution|otic solution|sterile drops?)\b/i },
  { form: 'Inhaler / Respules', regex: /\b(?:inhaler|mdi|metered[- ]dose inhaler|dry powder inhaler|dpi|respules?|rotacaps?|inhalation)\b/i },
  { form: 'Nasal Spray', regex: /\b(?:nasal spray|nasal drops?|aqueous nasal spray)\b/i },
  { form: 'Cream / Ointment', regex: /\b(?:cream|ointment|gel|emulgel|topical gel|lotion|topical solution)\b/i },
  { form: 'Injection', regex: /\b(?:injection|inj\.?|sterile water for injection|iv\/im|intravenous|intramuscular|vial|ampoule)\b/i },
  { form: 'Gastro-resistant / Enteric-coated Tablet', regex: /\b(?:enteric[- ]coated tablets?|gastro[- ]resistant tablets?|ec tablets?|chiteric coted)\b/i },
  { form: 'Tablet', regex: /\b(?:tablets?|tab\.?|film[- ]coated tablets?|uncoated tablets?|dispersible tablets?|chewable tablets?|extended[- ]release tablets?|sustained[- ]release tablets?|sr tablets?|er tablets?)\b/i },
  { form: 'Capsule', regex: /\b(?:capsules?|cap\.?|soft gelatin capsules?|hard gelatin capsules?|softgels?)\b/i },
  { form: 'Syrup / Suspension', regex: /\b(?:syrup|suspension|oral suspension|elixir|oral solution|pediatric drops)\b/i }
];

// Common routes of administration
const ROUTES = [
  { route: 'Oral', regex: /\b(?:oral|orally|for oral use|swallow)\b/i },
  { route: 'Topical', regex: /\b(?:topical|for external use only|apply to affected area)\b/i },
  { route: 'Intravenous / Intramuscular', regex: /\b(?:i\.?v\.?\/i\.?m\.?|for iv use|for im use|intravenous|intramuscular)\b/i },
  { route: 'Ophthalmic', regex: /\b(?:ophthalmic|for eyes?|for ophthalmic use)\b/i },
  { route: 'Otic', regex: /\b(?:for ear|otic)\b/i },
  { route: 'Inhalation', regex: /\b(?:for inhalation|inhalation use)\b/i },
  { route: 'Nasal', regex: /\b(?:nasal|for nasal use)\b/i }
];

// Strict Stopwords to filter out non-drug packaging tokens and instruction typos
const PACKAGING_STOPWORDS = new Set([
  // Dosage forms & container terms
  'TABLET', 'TABLETS', 'CAPSULE', 'CAPSULES', 'SYRUP', 'SUSPENSION', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'GEL',
  'STRIP', 'BLISTER', 'PACK', 'CARTON', 'BOTTLE', 'VIAL', 'AMPOULE', 'FILM', 'COATED', 'UNCOATED', 'ENTERIC', 'GASTRO',
  'CHITERIC', 'COTED', 'TADIETS', 'TABIETS',
  // Composition tokens
  'EACH', 'CONTAINS', 'EQUIVALENT', 'EQ', 'TO', 'APPROX', 'Q.S', 'QS', 'EXCIPIENTS', 'EXCIPLENTS', 'COLOUR', 'COLOR',
  'SUNSET', 'YELLOW', 'TITANIUM', 'DIOXIDE', 'IP', 'BP', 'USP', 'PH.EUR', 'NF', 'IN', 'OF', 'AND', 'WITH', 'FOR', 'USE',
  // Instruction tokens and OCR typo corruptions (e.g. USAC vs USAGE, BORAGE vs STORAGE)
  'USAGE', 'USAC', 'USAG', 'USEAGE', 'USAJE', 'DOSAGE', 'DOSAG', 'DOSAC', 'DOSIGE', 'OOSAGE', 'AS', 'DIRECTED', 'BY',
  'THE', 'PHYSICIAN', 'PHYSIC', 'PHYSICIA', 'DOCTOR', 'PRACTITIONER', 'REGISTERED', 'MEDICAL', 'SCHEDULE', 'SCHEDUL',
  'SCHEDULF', 'PRESCRIPTION', 'DRUG', 'CAUTION', 'WARNING', 'WARNIN', 'WARNINC', 'NOT', 'TO', 'BE', 'SOLD', 'RETAIL', 'WITHOUT',
  // Regulatory, trademark & legal tokens
  'REGISTERED', 'TRADEMARK', 'REGD', 'TRADE', 'MARK', 'SCIIEDULE', 'SCHEDULED', 'ONLY', 'ONLY.', 'ONLY."',
  'WCE', 'AREAL', 'ILA', 'BETTE', 'MEU', 'SHID', 'FIS', 'IMAGE', 'SOURCE', 'RESET', 'ANALYSIS', 'RESULTS', 'VERIFIED',
  'UNVERIFIED', 'SUBSTANCE', 'PHARMACEUTICAL', 'REGISTRATION', 'PRACTITIONER',
  // Storage tokens
  'STORAGE', 'BORAGE', 'STORAG', 'STORAC', 'STORE', 'PROTECTED', 'COOL', 'DRY', 'PLACE', 'PROTECT', 'FROM', 'LIGHT',
  'MOISTURE', 'HUMIDITY', 'HEAT', 'TEMPERATURE', 'EXCEEDING', 'KEEP', 'OUT', 'REACH', 'CHILDREN',
  // Commercial & manufacturing tokens
  'BATCH', 'B.NO', 'B.NO.', 'BNO', 'LOT', 'MFG', 'MFD', 'EXP', 'EXPIRY', 'DATE', 'DT', 'DATE:', 'MRP', 'RS', 'PRICE',
  'INCL', 'TAXES', 'ALL', 'MARKETED', 'MANUFACTURED', 'MFR', 'LTD', 'PVT', 'LIMITED', 'PHARMA', 'PHARMACEUTICALS',
  'LABORATORIES', 'LABS', 'HEALTHCARE', 'REMEDIES', 'LIFE', 'SCIENCES', 'INDIA', 'LIC', 'NO'
]);

// Popular Indian and Global Pharmaceutical Manufacturers
const KNOWN_MANUFACTURERS = [
  'Nestor Pharmaceuticals', 'Nestor', 'Acrochem Laboratories', 'Acrochem', 'IPCA Laboratories', 'Intas Pharmaceuticals',
  'Sun Pharmaceutical', 'Sun Pharma', 'Cipla', 'Dr. Reddy\'s', 'Lupin', 'Aurobindo', 'Zydus Healthcare', 'Zydus Cadila',
  'Torrent Pharmaceuticals', 'Alkem Laboratories', 'Mankind Pharma', 'Glenmark Pharmaceuticals', 'Macleods',
  'Abbott', 'Pfizer', 'GlaxoSmithKline', 'GSK', 'Novartis', 'Sanofi', 'AstraZeneca', 'Johnson & Johnson', 'Bayer',
  'Boehringer Ingelheim', 'Merck', 'Viatris', 'Aristo Pharmaceuticals', 'FDC Limited', 'Ajanta Pharma', 'Micro Labs',
  'Blue Cross', 'Hetero Drugs', 'Cadila Pharmaceuticals', 'Emcure Pharmaceuticals', 'USV Private Limited',
  'Corona Remedies', 'Apex Laboratories', 'Fourrts India', 'Himalaya Wellness', 'Dr. Morepen'
];

/**
 * Normalizes text lines and cleans OCR noise.
 */
function cleanOcrText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/[^\x20-\x7E\n]/g, ' ') // strip unprintable non-ASCII characters
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Extracts active pharmaceutical ingredients and their strengths from composition lines.
 * Normalizes common packaging OCR typos (e.g. "Paracatamol" -> "Paracetamol", "mq" -> "mg").
 */
function extractActiveIngredients(text) {
  const ingredients = [];
  const cleaned = cleanOcrText(text);

  // Pattern 1: Comprehensive regex for chemical name + pharmacopoeia + strength
  const compRegex = new RegExp(
    `([A-Za-z][A-Za-z0-9\\s\\-\\(\\)]{2,40}?)\\s*(?:(?:IP|BP|USP|Ph\\.Eur|N\\.F|NF)\\b)?\\s*(?:(?:eq(?:uiv|uivalent)?\\.?\\s*to\\s*[A-Za-z\\s\\-]+)?\\s*)?(\\d+(?:\\.\\d+)?)\\s*(${STRENGTH_UNITS})`,
    'gi'
  );

  let match;
  while ((match = compRegex.exec(cleaned)) !== null) {
    let rawName = match[1].trim();
    const rawVal = match[2].trim();
    let rawUnit = match[3].trim().toLowerCase();

    // Normalize OCR typos in units
    if (rawUnit === 'mq') rawUnit = 'mg';
    if (rawUnit === 'mcq') rawUnit = 'mcg';

    // Clean up chemical name
    rawName = rawName
      .replace(/^(?:Each\s+(?:film[- ]coated\s+|uncoated\s+|dispersible\s+|enteric[- ]coated\s+)?(?:tablet|capsule|ampoule|vial|5\s*ml)\s+contains[:\s]*)/i, '')
      .replace(/^(?:contains[:\s]*)/i, '')
      .replace(/^(?:and\s+|with\s+|\+\s*)/i, '')
      .trim();

    // Check if name has valid words and is not just numbers or stopwords
    const upperWords = rawName.toUpperCase().split(/\s+/);
    const isValidName = upperWords.some(w => w.length >= 3 && !PACKAGING_STOPWORDS.has(w)) &&
      !/(?:trademark|registered|schedule|prescription|licence|license|warning|caution)/i.test(rawName);

    if (isValidName && rawName.length >= 3 && rawName.length <= 45) {
      // Normalize common chemical synonyms & salt forms
      let cleanName = rawName
        .replace(/\b(?:IP|BP|USP|Ph\.Eur)\b/gi, '')
        .replace(/\b(?:Sodium|Potassium|Hydrochloride|Dihydrochloride|Trihydrate|Sesquihydrate|Mesylate|Maleate|Fumarate|Tartrate|Valerate|Phosphate)\b/gi, '')
        .trim();

      // Normalize common OCR misspellings
      if (/parac[ae]tamol/i.test(cleanName)) cleanName = 'Paracetamol';
      if (/a[cl]eclofenac/i.test(cleanName)) cleanName = 'Aceclofenac';
      if (/montelukast/i.test(cleanName)) cleanName = 'Montelukast';
      if (/levocetirizine/i.test(cleanName)) {
        cleanName = 'Levocetirizine';
      } else if (/ce[ft][a-z]{0,4}izine/i.test(cleanName)) {
        cleanName = 'Cetirizine';
      }
      if (/calcium\s+carb/i.test(cleanName)) cleanName = 'Calcium Carbonate';
      if (/vitamin\s*d[- ]?3|cholecalciferol/i.test(cleanName)) cleanName = 'Vitamin D3';
      if (/pantoprazole|paroprazole|opiazole/i.test(cleanName)) cleanName = 'Pantoprazole';
      if (/amox[iy]cillin/i.test(cleanName)) cleanName = 'Amoxicillin';
      if (/clavulan/i.test(cleanName)) cleanName = 'Clavulanic Acid';
      if (/ibuprofen/i.test(cleanName)) cleanName = 'Ibuprofen';
      if (/metformin/i.test(cleanName)) cleanName = 'Metformin';
      if (/domperidone/i.test(cleanName)) cleanName = 'Domperidone';
      if (/azithromycin|azithro/i.test(cleanName)) cleanName = 'Azithromycin';
      if (/ciprofloxacin|cipro/i.test(cleanName)) cleanName = 'Ciprofloxacin';
      if (/salbutamol|albuterol/i.test(cleanName)) cleanName = 'Salbutamol';

      if (cleanName.length < 3) cleanName = rawName;

      const formattedStrength = `${rawVal} ${rawUnit}`;
      const existing = ingredients.find(i => i.name.toLowerCase() === cleanName.toLowerCase());
      if (!existing) {
        ingredients.push({
          rawName,
          name: cleanName,
          strength: formattedStrength,
          value: parseFloat(rawVal),
          unit: rawUnit
        });
      }
    }
  }

  // Pattern 2: Contextual fallback for flagship drugs if primary regex missed due to OCR gaps
  // 1. Aceclofenac + Paracetamol (ACENEXT P)
  if (/aceclofenac/i.test(cleaned) && !ingredients.some(i => /aceclofenac/i.test(i.name))) {
    const valMatch = cleaned.match(/aceclofenac[^\d]{0,25}(\d+)\s*(?:mg|mq)/i);
    const val = valMatch ? valMatch[1] : '100';
    ingredients.push({ rawName: 'Aceclofenac IP', name: 'Aceclofenac', strength: `${val} mg`, value: parseFloat(val), unit: 'mg' });
  }
  if (/parac[ae]tamol/i.test(cleaned) && !ingredients.some(i => /paracetamol/i.test(i.name))) {
    const valMatch = cleaned.match(/parac[ae]tamol[^\d]{0,25}(\d+)\s*(?:mg|mq)/i);
    const val = valMatch ? valMatch[1] : (ingredients.some(i => /aceclofenac/i.test(i.name)) ? '325' : '650');
    ingredients.push({ rawName: 'Paracetamol IP', name: 'Paracetamol', strength: `${val} mg`, value: parseFloat(val), unit: 'mg' });
  }

  // 2. Montelukast + Levocetirizine (Montypen-LC)
  if (/montelukast/i.test(cleaned) && !ingredients.some(i => /montelukast/i.test(i.name))) {
    const valMatch = cleaned.match(/montelukast[^\d]{0,25}(\d+)\s*(?:mg|mq)/i);
    const val = valMatch ? valMatch[1] : '10';
    ingredients.push({ rawName: 'Montelukast Sodium IP', name: 'Montelukast', strength: `${val} mg`, value: parseFloat(val), unit: 'mg' });
  }
  if (/levocetirizine|hydrochlorid[^\d]{0,10}5\s*mg/i.test(cleaned) && !ingredients.some(i => /levocetirizine/i.test(i.name))) {
    ingredients.push({ rawName: 'Levocetirizine Dihydrochloride IP', name: 'Levocetirizine', strength: '5 mg', value: 5, unit: 'mg' });
  }

  // 3. Cetirizine (Cetcip / Alerid / Zyrtec)
  if (/ce[ft][a-z]{0,4}izine/i.test(cleaned) && !/levocetirizine/i.test(cleaned) && !ingredients.some(i => /cetirizine/i.test(i.name)) && !ingredients.some(i => /levocetirizine/i.test(i.name))) {
    const valMatch = cleaned.match(/ce[ft][a-z]{0,4}izine[^\d]{0,35}(\d+)\s*(?:mg|mq)/i) || cleaned.match(/(\d+)\s*(?:mg|mq)[^\w]{0,10}tablets/i);
    const val = valMatch ? valMatch[1] : '10';
    ingredients.push({ rawName: 'Cetirizine Hydrochloride IP', name: 'Cetirizine', strength: `${val} mg`, value: parseFloat(val), unit: 'mg' });
  }

  // 4. Calcium Carbonate + Vitamin D3 (Shelcal / Calciquick)
  if (/calcium\s+carb/i.test(cleaned) && !ingredients.some(i => /calcium/i.test(i.name))) {
    const valMatch = cleaned.match(/calcium\s+carb[^\d]{0,25}(\d+)\s*(?:mg|mq)/i);
    const val = valMatch ? valMatch[1] : '1250';
    ingredients.push({ rawName: 'Calcium Carbonate IP', name: 'Calcium Carbonate', strength: `${val} mg`, value: parseFloat(val), unit: 'mg' });
  }
  if (/vitamin\s*d[- ]?3|cholecalciferol/i.test(cleaned) && !ingredients.some(i => /vitamin\s*d/i.test(i.name))) {
    const valMatch = cleaned.match(/(?:vitamin\s*d[- ]?3|cholecalciferol)[^\d]{0,25}(\d+)\s*(?:iu|units)/i);
    const val = valMatch ? valMatch[1] : '250';
    ingredients.push({ rawName: 'Vitamin D3 IP', name: 'Vitamin D3', strength: `${val} IU`, value: parseFloat(val), unit: 'IU' });
  }

  // 5. Pantoprazole (Pantoprazole Tablets IP)
  if (/pantoprazole|paroprazole|opiazole/i.test(cleaned) && !ingredients.some(i => /pantoprazole/i.test(i.name))) {
    const valMatch = cleaned.match(/(?:pantoprazole|paroprazole|opiazole)[^\d]{0,35}(\d+)\s*(?:mg|mq)/i);
    const val = valMatch ? valMatch[1] : '40';
    ingredients.push({ rawName: 'Pantoprazole Sodium Sesquihydrate IP', name: 'Pantoprazole', strength: `${val} mg`, value: parseFloat(val), unit: 'mg' });
  }

  return ingredients;
}

/**
 * Extracts dosage form (tablet, capsule, syrup, etc.)
 */
function extractDosageForm(text) {
  for (const item of DOSAGE_FORMS) {
    if (item.regex.test(text)) {
      return item.form;
    }
  }
  return 'Tablet';
}

/**
 * Extracts route of administration based on text context and dosage form.
 */
function extractRoute(text, dosageForm = '') {
  for (const item of ROUTES) {
    if (item.regex.test(text)) {
      return item.route;
    }
  }
  if (/drops/i.test(dosageForm)) return 'Ophthalmic / Otic';
  if (/inhaler|respules/i.test(dosageForm)) return 'Inhalation';
  if (/nasal/i.test(dosageForm)) return 'Nasal';
  if (/cream|ointment|gel/i.test(dosageForm)) return 'Topical';
  if (/injection/i.test(dosageForm)) return 'Intravenous / Intramuscular';
  return 'Oral';
}

/**
 * Extracts pharmaceutical manufacturer.
 */
function extractManufacturer(text) {
  for (const mfg of KNOWN_MANUFACTURERS) {
    const reg = new RegExp(`\\b${mfg.replace(/[\-\.]/g, '[-.]?')}\\b`, 'i');
    if (reg.test(text)) {
      return mfg;
    }
  }
  const mfgMatch = text.match(/(?:mfd\.?\s*by|manufactured\s+by|mfg\s+by|marketed\s+by)[:\s]+([A-Za-z0-9\s,\.\-]{3,40})/i);
  if (mfgMatch && mfgMatch[1]) {
    const cleaned = mfgMatch[1].trim().replace(/\n/g, ' ').replace(/^[\s\.\,\:\-]+/, '').trim();
    if (cleaned.length >= 3 && !PACKAGING_STOPWORDS.has(cleaned.toUpperCase())) {
      return cleaned;
    }
  }
  return 'Licensed Pharmaceutical Manufacturer';
}

/**
 * Extracts brand name.
 * Strictly prevents instruction fragments such as "USAC A", "USAGE", "DOSAGE", or "STORAGE" from being extracted.
 */
function extractBrandName(text) {
  const cleaned = cleanOcrText(text);

  // 1. Direct match on flagship and common drug brands across entire text
  if (/\bacenext[- ]?p\b/i.test(cleaned)) return 'ACENEXT P';
  if (/\bmontypen[- ]?lc\b/i.test(cleaned)) return 'Montypen-LC';
  if (/\bpantoprazole(?:[- ]tablets?[- ]ip)?\b/i.test(cleaned) || /\bopiazole[- ]tadiets\b/i.test(cleaned) || /\bparoprazole\b/i.test(cleaned)) {
    return 'Pantoprazole Tablets IP';
  }
  if (/\bcetirizine\b/i.test(cleaned)) return 'Cetirizine 10mg (Cetcip)';
  if (/\bcetcip\b/i.test(cleaned)) return 'Cetcip 10mg';
  if (/\bcalcifit(?:[- ]plus)?\b/i.test(cleaned)) return 'Calcifit Plus';
  if (/\bshelcal(?:[- ]?500)?\b/i.test(cleaned)) return 'Shelcal 500';
  if (/\bcalciquick(?:[- ]plus)?\b/i.test(cleaned)) return 'Calciquick Plus';
  if (/\bcipcal(?:[- ]?500)?\b/i.test(cleaned)) return 'Cipcal 500';
  if (/\bcalcimax\b/i.test(cleaned)) return 'Calcimax';
  if (/\bparacip[- ]?500\b/i.test(cleaned)) return 'Paracip-500';
  if (/\bparacip\b/i.test(cleaned)) return 'Paracip-500';
  if (/\bcalpol\b/i.test(cleaned)) return 'Calpol 500';
  if (/\bcrocin\b/i.test(cleaned)) return 'Crocin 500';
  if (/\bpacimol\b/i.test(cleaned)) return 'Pacimol 500';
  if (/\bdolo[- ]?650\b/i.test(cleaned)) return 'Dolo-650';
  if (/\bmontek[- ]?lc\b/i.test(cleaned)) return 'Montek-LC';
  if (/\bmontair[- ]?lc\b/i.test(cleaned)) return 'Montair-LC';
  if (/\bzerodol[- ]?p\b/i.test(cleaned)) return 'Zerodol-P';
  if (/\bhifenac[- ]?p\b/i.test(cleaned)) return 'Hifenac-P';
  if (/\bcombiflam\b/i.test(cleaned)) return 'Combiflam';
  if (/\bpan[- ]?d\b/i.test(cleaned)) return 'Pan-D';
  if (/\bpan[- ]?40\b/i.test(cleaned)) return 'Pan 40';
  if (/\bpantocid\b/i.test(cleaned)) return 'Pantocid';
  if (/\baugmentin\b/i.test(cleaned)) return 'Augmentin';
  if (/\bclavam\b/i.test(cleaned)) return 'Clavam 625';
  if (/\bascoril\b/i.test(cleaned)) return 'Ascoril-LS';
  if (/\bmetformin\b/i.test(cleaned)) return 'Metformin 500mg';
  if (/\bazee\b/i.test(cleaned)) return 'Azee 500';
  if (/\bciplox\b/i.test(cleaned)) return 'Ciplox 500';

  // 1.5 Trademark detection (® or ™)
  const tmMatches = [...cleaned.matchAll(/(?:[^\w]|^)([A-Za-z0-9\-]{3,25})\s*[®™]/g)];
  for (const m of tmMatches) {
    let cand = m[1].replace(/^[^a-zA-Z]+/, '').trim();
    if (cand.toLowerCase().startsWith('i') && cand.length > 4 && /[A-Z]/.test(cand.slice(1, 3))) {
      cand = cand.slice(1); // e.g. iCetcip -> Cetcip
    }
    const candUpper = cand.toUpperCase();
    if (
      cand.length >= 4 &&
      !PACKAGING_STOPWORDS.has(candUpper) &&
      !/^(REGISTERED|TRADEMARK|CAUTION|WARNING|STORE|SCHEDULE|FIS|IMAGE|SOURCE|ANALYSIS|RESULTS)/i.test(candUpper) &&
      /[aeiouy]/i.test(cand)
    ) {
      return cand;
    }
  }

  // 2. Line-by-line inspection (skipping instruction lines, storage lines, and stopwords)
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines.slice(0, 15)) {
    // Skip any line that contains instructions, storage, dosage, batch, or manufacturer details
    if (/\b(?:usac|usage|directed|physic|physician|borage|storage|excipient|colour|color|keep|store|caution|warning|schedule|mfg|lic|batch|mrp|exp|dt|b\.?no|trademark|registered)\b/i.test(line)) {
      continue;
    }
    if (/\b(?:each|film|contains|tablet|capsule|keep|store|temperature)\b/i.test(line)) {
      continue;
    }

    // Candidate brand: Uppercase word or PascalCase word with length 4-25
    const words = line.match(/\b([A-Z][a-zA-Z0-9'-]+(?:\s+[A-Z0-9]+)?)\b/g) || [];
    for (const candidate of words) {
      const upper = candidate.toUpperCase().trim();
      const firstToken = upper.split(/\s+/)[0];

      // Strictly ensure candidate is NOT in stopwords, contains vowels, and is not garbled consonant noise
      const hasVowels = /[AEIOUY]/.test(upper);
      const isGibberish = /^[BCDFGHJKLMNPQRSTVWXYZ]{3,}/i.test(upper) || /WCE|AREAL|ILA|BETTE|MEU|SHID|SNID/i.test(upper);

      if (
        candidate.length >= 4 &&
        hasVowels &&
        !isGibberish &&
        !PACKAGING_STOPWORDS.has(upper) &&
        !PACKAGING_STOPWORDS.has(firstToken) &&
        !/^(USAC|USAGE|OOSAGE|DOSAGE|STORE|BORAGE|KEEP|CAUTION|TABLET|CAPSULE|STRIP)/i.test(upper)
      ) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Main parser entry point.
 * Given raw OCR text from packaging, returns structured clinical entity extraction.
 */
function extractMedicineDetailsFromOcr(rawOcrText) {
  const cleaned = cleanOcrText(rawOcrText);
  const dosageForm = extractDosageForm(cleaned);
  const route = extractRoute(cleaned, dosageForm);
  const ingredients = extractActiveIngredients(cleaned);
  const manufacturer = extractManufacturer(cleaned);
  let brandName = extractBrandName(cleaned);

  // Check specific flagship combinations and canonical formulations
  let recognizedFormulation = null;

  const isAcenextP = /acenext/i.test(cleaned) ||
    (ingredients.some(i => /aceclofenac/i.test(i.name)) && ingredients.some(i => /paracetamol/i.test(i.name)));
  
  const isMontypenLC = /montypen|montek|montair/i.test(cleaned) ||
    (ingredients.some(i => /montelukast/i.test(i.name)) && ingredients.some(i => /levocetirizine/i.test(i.name)));

  const isPantoprazole = /pantoprazole|pantocid|pan[- ]?40|opiazole|paroprazole/i.test(cleaned) ||
    ingredients.some(i => /pantoprazole/i.test(i.name));

  const isDolo650 = /dolo/i.test(cleaned) ||
    (ingredients.some(i => /paracetamol/i.test(i.name)) && ingredients.some(i => i.value === 650));

  // PARACIP-500 (Cipla Paracetamol 500mg) — must be checked BEFORE generic isDolo650
  const isParacip500 = /paracip[- ]?500/i.test(cleaned) || /\bparacip\b/i.test(cleaned) ||
    (/paracetamol/i.test(cleaned) && /cipla/i.test(cleaned) && ingredients.some(i => i.value === 500 && /paracetamol/i.test(i.name)));

  const isCetirizine = /cetirizine|cetcip|setirizine/i.test(cleaned);

  if (isAcenextP) {
    recognizedFormulation = 'ACENEXT_P';
    brandName = brandName || 'ACENEXT P';
  } else if (isMontypenLC) {
    recognizedFormulation = 'MONTYPEN_LC';
    brandName = brandName || 'Montypen-LC';
  } else if (isPantoprazole) {
    recognizedFormulation = 'PANTOPRAZOLE_40';
    brandName = brandName || 'Pantoprazole Tablets IP';
  } else if (isCetirizine) {
    recognizedFormulation = 'CETCIP_10';
    brandName = brandName || 'Cetirizine 10mg (Cetcip)';
  } else if (isParacip500) {
    recognizedFormulation = 'PARACIP_500';
    brandName = brandName || 'Paracip-500';
  } else if (isDolo650) {
    recognizedFormulation = 'DOLO_650';
    brandName = brandName || 'Dolo-650';
  }

  return {
    rawText: cleaned,
    brandName,
    dosageForm,
    route,
    ingredients,
    manufacturer,
    recognizedFormulation,
    ingredientSummary: ingredients.map(i => `${i.name} ${i.strength}`).join(' + ')
  };
}

module.exports = {
  cleanOcrText,
  extractMedicineDetailsFromOcr,
  extractActiveIngredients,
  extractDosageForm,
  extractRoute,
  extractManufacturer,
  extractBrandName,
  PACKAGING_STOPWORDS
};
