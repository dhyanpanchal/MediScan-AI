/**
 * Clinical Medicine Entity Extractor
 * MediScan AI - Precision OCR entity parser for pharmaceutical labels, blisters, boxes, and leaflets.
 * Extracts Brand Name, Active Pharmaceutical Ingredients (APIs), Strengths, Units, Dosage Forms, and Manufacturers.
 */

// Common pharmaceutical units
const STRENGTH_UNITS = '(?:mg|mcg|µg|g|gm|ml|%|%\\s*w\\/v|%\\s*w\\/w|%\\s*v\\/v|IU|I\\.U\\.|units|mEq)';

// Common dosage forms (specific before generic)
const DOSAGE_FORMS = [
  { form: 'Eye / Ear Drops', regex: /\b(?:eye drops?|ear drops?|eye\/ear drops?|ophthalmic suspension|ophthalmic solution|otic solution|sterile drops?)\b/i },
  { form: 'Inhaler / Respules', regex: /\b(?:inhaler|mdi|metered[- ]dose inhaler|dry powder inhaler|dpi|respules?|rotacaps?|inhalation)\b/i },
  { form: 'Nasal Spray', regex: /\b(?:nasal spray|nasal drops?|aqueous nasal spray)\b/i },
  { form: 'Cream / Ointment', regex: /\b(?:cream|ointment|gel|emulgel|topical gel|lotion|topical solution)\b/i },
  { form: 'Injection', regex: /\b(?:injection|inj\.?|sterile water for injection|iv\/im|intravenous|intramuscular|vial|ampoule)\b/i },
  { form: 'Tablet', regex: /\b(?:tablets?|tab\.?|film[- ]coated tablets?|uncoated tablets?|dispersible tablets?|chewable tablets?|effervescent tablets?|extended[- ]release tablets?|sustained[- ]release tablets?|sr tablets?|er tablets?)\b/i },
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

// Strict Stopwords to filter out non-drug packaging tokens
const PACKAGING_STOPWORDS = new Set([
  'TABLET', 'TABLETS', 'CAPSULE', 'CAPSULES', 'SYRUP', 'SUSPENSION', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'GEL',
  'EACH', 'FILM', 'COATED', 'UNCOATED', 'CONTAINS', 'EQUIVALENT', 'EQ', 'TO', 'APPROX', 'Q.S', 'QS',
  'IP', 'BP', 'USP', 'PH.EUR', 'NF', 'IN', 'OF', 'AND', 'WITH', 'FOR', 'USE', 'ONLY',
  'BATCH', 'B.NO', 'B.NO.', 'LOT', 'MFG', 'MFD', 'EXP', 'EXPIRY', 'DATE', 'DT', 'DATE:', 'MRP', 'RS', 'PRICE',
  'INCL', 'TAXES', 'ALL', 'STORE', 'COOL', 'DRY', 'PLACE', 'PROTECT', 'FROM', 'LIGHT', 'MOISTURE',
  'KEEP', 'OUT', 'REACH', 'CHILDREN', 'DOSAGE', 'DIRECTED', 'PHYSICIAN', 'DOCTOR', 'SCHEDULE',
  'PRESCRIPTION', 'DRUG', 'CAUTION', 'WARNING', 'NOT', 'TO', 'BE', 'SOLD', 'RETAIL', 'WITHOUT',
  'REGISTERED', 'MEDICAL', 'PRACTITIONER', 'MARKETED', 'MANUFACTURED', 'MFR', 'LTD', 'PVT',
  'LIMITED', 'PHARMA', 'PHARMACEUTICALS', 'LABORATORIES', 'LABS', 'HEALTHCARE', 'REMEDIES', 'LIFE'
]);

// Popular Indian and Global Pharmaceutical Manufacturers
const KNOWN_MANUFACTURERS = [
  'Sun Pharmaceutical', 'Sun Pharma', 'Cipla', 'Dr. Reddy\'s', 'Lupin', 'Aurobindo',
  'Zydus Healthcare', 'Zydus Cadila', 'Torrent Pharmaceuticals', 'Alkem Laboratories',
  'Mankind Pharma', 'Intas Pharmaceuticals', 'Glenmark Pharmaceuticals', 'Macleods',
  'Abbott', 'Pfizer', 'GlaxoSmithKline', 'GSK', 'Novartis', 'Sanofi', 'AstraZeneca',
  'Johnson & Johnson', 'Bayer', 'Boehringer Ingelheim', 'Merck', 'Viatris', 'Acrochem',
  'Aristo Pharmaceuticals', 'FDC Limited', 'Ajanta Pharma', 'Micro Labs', 'Blue Cross',
  'Hetero Drugs', 'Cadila Pharmaceuticals', 'Emcure Pharmaceuticals', 'USV Private Limited',
  'Corona Remedies', 'Apex Laboratories', 'Fourrts India', 'Himalaya Wellness'
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
 * Example target text:
 * - "Each film coated tablet contains: Aceclofenac IP 100 mg, Paracetamol IP 325 mg"
 * - "Montelukast Sodium IP eq. to Montelukast 10 mg + Levocetirizine Dihydrochloride IP 5 mg"
 * - "Amoxicillin Trihydrate IP eq. to Amoxicillin 500 mg, Potassium Clavulanate Diluted IP eq. to Clavulanic Acid 125 mg"
 */
function extractActiveIngredients(text) {
  const ingredients = [];
  const cleaned = cleanOcrText(text);

  // Pattern 1: Comprehensive regex for chemical name + pharmacopoeia + strength
  // Matches "Aceclofenac IP 100 mg", "Paracetamol IP 325mg", "Levocetirizine Dihydrochloride IP 5 mg", "Montelukast 10mg"
  const compRegex = new RegExp(
    `([A-Za-z][A-Za-z0-9\\s\\-\\(\\)]{2,40}?)\\s*(?:(?:IP|BP|USP|Ph\\.Eur|N\\.F|NF)\\b)?\\s*(?:(?:eq(?:uiv|uivalent)?\\.?\\s*to\\s*[A-Za-z\\s\\-]+)?\\s*)?(\\d+(?:\\.\\d+)?)\\s*(${STRENGTH_UNITS})`,
    'gi'
  );

  let match;
  while ((match = compRegex.exec(cleaned)) !== null) {
    let rawName = match[1].trim();
    const rawStrength = match[2].trim();
    const rawUnit = match[3].trim().toLowerCase();

    // Clean up chemical name
    rawName = rawName
      .replace(/^(?:Each\s+(?:film[- ]coated\s+|uncoated\s+|dispersible\s+)?(?:tablet|capsule|ampoule|vial|5\s*ml)\s+contains[:\s]*)/i, '')
      .replace(/^(?:contains[:\s]*)/i, '')
      .replace(/^(?:and\s+|with\s+|\+\s*)/i, '')
      .trim();

    // Check if name has valid words and is not just numbers or stopwords
    const upperWords = rawName.toUpperCase().split(/\s+/);
    const isValidName = upperWords.some(w => w.length >= 3 && !PACKAGING_STOPWORDS.has(w));

    if (isValidName && rawName.length >= 3 && rawName.length <= 45) {
      // Normalize common synonyms
      let cleanName = rawName
        .replace(/\b(?:IP|BP|USP|Ph\.Eur)\b/gi, '')
        .replace(/\b(?:Sodium|Potassium|Hydrochloride|Dihydrochloride|Trihydrate|Mesylate|Maleate|Fumarate|Tartrate|Valerate|Phosphate)\b/gi, '')
        .trim();

      if (cleanName.length < 3) cleanName = rawName;

      const formattedStrength = `${rawStrength} ${rawUnit}`;
      const existing = ingredients.find(i => i.name.toLowerCase() === cleanName.toLowerCase());
      if (!existing) {
        ingredients.push({
          rawName,
          name: cleanName,
          strength: formattedStrength,
          value: parseFloat(rawStrength),
          unit: rawUnit
        });
      }
    }
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
  return 'Oral Tablet / Capsule';
}

/**
 * Extracts route of administration
 */
function extractRoute(text, dosageForm) {
  for (const item of ROUTES) {
    if (item.regex.test(text)) {
      return item.route;
    }
  }

  if (/Syrup|Suspension|Drops/i.test(dosageForm)) return 'Oral';
  if (/Cream|Ointment|Gel/i.test(dosageForm)) return 'Topical';
  if (/Injection/i.test(dosageForm)) return 'Intramuscular / Intravenous';
  if (/Inhaler|Respules/i.test(dosageForm)) return 'Inhalation';
  if (/Eye|Ophthalmic/i.test(dosageForm)) return 'Ophthalmic';
  if (/Ear|Otic/i.test(dosageForm)) return 'Otic';
  return 'Oral';
}

/**
 * Detects pharmaceutical manufacturer
 */
function extractManufacturer(text) {
  const cleaned = cleanOcrText(text);

  // 1. Check known manufacturers list
  for (const mfr of KNOWN_MANUFACTURERS) {
    const reg = new RegExp(`\\b${mfr.replace('.', '\\.')}\\b`, 'i');
    if (reg.test(cleaned)) {
      return mfr;
    }
  }

  // 2. Check "Mfg by:", "Manufactured by:", "Marketed by:" patterns
  const mfrPattern = /(?:Mfg\.?\s*by|Manufactured\s*by|Marketed\s*by|Mfd\.?\s*by|Made\s*in\s*India\s*by)[:\s]+([A-Za-z0-9\s,\.]{3,40}?)(?:\n|Lic|Batch|Plot|Regd|At:|$)/i;
  const match = cleaned.match(mfrPattern);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (candidate.length >= 4 && !PACKAGING_STOPWORDS.has(candidate.toUpperCase())) {
      return candidate;
    }
  }

  return 'Licensed Pharmaceutical Manufacturer';
}

/**
 * Extracts candidate medicine brand name.
 * Excludes packaging boilerplate, batch/mfg/expiry lines, and dosage headers.
 */
function extractBrandName(text) {
  const lines = cleanOcrText(text)
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Check top lines for Brand Name patterns
  for (const line of lines.slice(0, 10)) {
    // Skip lines with batch, date, expiry, price, mrp
    if (/\b(?:b\.?no|batch|mfg|exp|mrp|rs\.|lic\.?|schedule|rx)\b/i.test(line)) continue;
    if (/\b(?:each|film|contains|tablet|capsule|keep|store)\b/i.test(line)) continue;

    // Specific well-known brand matches
    if (/\bacenext[- ]?p\b/i.test(line)) return 'ACENEXT P';
    if (/\bmontypen[- ]?lc\b/i.test(line)) return 'Montypen-LC';
    if (/\bzerodol[- ]?p\b/i.test(line)) return 'Zerodol-P';
    if (/\bmontek[- ]?lc\b/i.test(line)) return 'Montek-LC';
    if (/\bmontair[- ]?lc\b/i.test(line)) return 'Montair-LC';
    if (/\bhifenac[- ]?p\b/i.test(line)) return 'Hifenac-P';
    if (/\bcombiflam\b/i.test(line)) return 'Combiflam';
    if (/\bpan[- ]?d\b/i.test(line)) return 'Pan-D';
    if (/\baugmentin\b/i.test(line)) return 'Augmentin';
    if (/\bascoril\b/i.test(line)) return 'Ascoril-LS';

    // Candidate brand: Uppercase word or PascalCase word with length 3-25
    const brandMatch = line.match(/\b([A-Z][a-zA-Z0-9'-]+(?:\s+[A-Z0-9]+)?)\b/);
    if (brandMatch && brandMatch[1]) {
      const candidate = brandMatch[1].trim();
      const upper = candidate.toUpperCase();
      if (candidate.length >= 3 && !PACKAGING_STOPWORDS.has(upper)) {
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
  const brandName = extractBrandName(cleaned);

  // Check specific flagship combinations
  let recognizedFormulation = null;
  const isAcenextP = /acenext\s*p/i.test(cleaned) ||
    (ingredients.some(i => /aceclofenac/i.test(i.name)) && ingredients.some(i => /paracetamol/i.test(i.name)));
  
  const isMontypenLC = /montypen\s*lc|montek\s*lc|montair\s*lc/i.test(cleaned) ||
    (ingredients.some(i => /montelukast/i.test(i.name)) && ingredients.some(i => /levocetirizine/i.test(i.name)));

  if (isAcenextP) {
    recognizedFormulation = 'ACENEXT_P';
  } else if (isMontypenLC) {
    recognizedFormulation = 'MONTYPEN_LC';
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
