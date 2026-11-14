/**
 * Verification Test Suite for MediScan AI Medicine Scanner
 */

const { extractMedicineDetailsFromOcr } = require('./src/utils/medicineExtractor');
const { verifyAndEnrichMedicine } = require('./src/utils/drugVerification');
const { analyzeMedicineLabel } = require('./src/utils/llm');

async function runTests() {
  console.log('================================================================');
  console.log('   MEDISCAN AI - CLINICAL MEDICINE SCANNER TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: ACENEXT P (Aceclofenac 100 mg + Paracetamol 325 mg)
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: ACENEXT P Combination Extraction & Verification ---');
  const acenextOcr = `
    ACENEXT P
    Each film coated tablet contains:
    Aceclofenac IP 100 mg
    Paracetamol IP 325 mg
    Excipients q.s.
    Mfg. Lic. No.: M/742/2016
    Batch No: ACP-9042
    Mfg Date: 03/2025
    Exp Date: 02/2028
    MRP Rs. 75.50 (Inclusive of all taxes)
    Manufactured by: Acrochem Laboratories Ltd.
  `;

  const acenextExtracted = extractMedicineDetailsFromOcr(acenextOcr);
  assert(acenextExtracted.brandName === 'ACENEXT P', 'Entity Extractor identified brand as ACENEXT P');
  assert(acenextExtracted.ingredients.length === 2, 'Entity Extractor found 2 active pharmaceutical ingredients');
  assert(acenextExtracted.ingredients.some(i => i.name.toLowerCase().includes('aceclofenac') && i.strength.includes('100')), 'Aceclofenac 100 mg extracted accurately');
  assert(acenextExtracted.ingredients.some(i => i.name.toLowerCase().includes('paracetamol') && i.strength.includes('325')), 'Paracetamol 325 mg extracted accurately');

  const acenextVerified = await verifyAndEnrichMedicine({ rawOcrText: acenextOcr, extractedData: acenextExtracted });
  assert(acenextVerified.verificationStatus === 'Verified', 'Verification status is Verified');
  assert(acenextVerified.confidenceScore >= 95, 'High clinical confidence score >= 95%');
  assert(acenextVerified.activeIngredients.includes('Aceclofenac') && acenextVerified.activeIngredients.includes('Paracetamol'), 'Active ingredients verified');
  assert(acenextVerified.isCombination === true, 'Flagged as combination drug');
  assert(!!acenextVerified.combinationRationale, 'Combination synergy rationale provided');
  assert(acenextVerified.activeIngredientsList.length === 2, 'Both APIs broken down with mechanisms');
  assert(acenextVerified.clinicalUses.some(u => u.toLowerCase().includes('osteoarthritis') || u.toLowerCase().includes('pain')), 'Authoritative clinical uses verified');
  assert(!JSON.stringify(acenextVerified).includes('Active pharmaceutical ingredients identified from packaging label'), 'Zero generic filler');

  console.log('\n--- TEST 2: Montypen-LC (Montelukast 10 mg + Levocetirizine 5 mg) ---');
  const montypenOcr = `
    Montypen-LC Tablets
    Composition:
    Each film-coated tablet contains:
    Montelukast Sodium IP equivalent to Montelukast 10 mg
    Levocetirizine Dihydrochloride IP 5 mg
    Dosage: As directed by the physician.
    Store in a cool and dry place, protected from light.
    Manufactured in India by: Acrochem Laboratories
    B.No. ML-2201 EXP. 11/2027
  `;

  const montypenExtracted = extractMedicineDetailsFromOcr(montypenOcr);
  assert(montypenExtracted.brandName === 'Montypen-LC', 'Brand identified as Montypen-LC');
  assert(montypenExtracted.ingredients.length === 2, 'Entity Extractor found 2 active pharmaceutical ingredients');
  assert(montypenExtracted.ingredients.some(i => i.name.toLowerCase().includes('montelukast') && i.strength.includes('10')), 'Montelukast 10 mg extracted');
  assert(montypenExtracted.ingredients.some(i => i.name.toLowerCase().includes('levocetirizine') && i.strength.includes('5')), 'Levocetirizine 5 mg extracted');

  const montypenVerified = await verifyAndEnrichMedicine({ rawOcrText: montypenOcr, extractedData: montypenExtracted });
  assert(montypenVerified.verificationStatus === 'Verified', 'Verification status is Verified');
  assert(montypenVerified.activeIngredients.includes('Montelukast') && montypenVerified.activeIngredients.includes('Levocetirizine'), 'Ingredients verified');
  assert(montypenVerified.warnings.includes('FDA Black Box') || montypenVerified.warnings.includes('neuropsychiatric'), 'FDA Black Box alert included for Montelukast');
  assert(montypenVerified.sideEffects.common.some(s => s.toLowerCase().includes('drowsiness') || s.toLowerCase().includes('somnolence')), 'Known antihistamine side effects present');
  assert(!JSON.stringify(montypenVerified).includes('Active pharmaceutical ingredients identified from packaging label'), 'Zero generic filler');

  console.log('\n--- TEST 3: Salbutamol Inhaler (Aerosol Formulation) ---');
  const inhalerOcr = `
    Asthalin Inhaler
    Salbutamol Inhalation Aerosol IP
    Each metered dose contains:
    Salbutamol Sulfate IP equivalent to Salbutamol 100 mcg
    Pressurized canister. Shake well before use.
    Cipla Limited
  `;
  const inhalerExtracted = extractMedicineDetailsFromOcr(inhalerOcr);
  assert(inhalerExtracted.dosageForm === 'Inhaler / Respules', 'Dosage form detected as Inhaler');
  assert(inhalerExtracted.route === 'Inhalation', 'Route detected as Inhalation');
  const inhalerVerified = await verifyAndEnrichMedicine({ rawOcrText: inhalerOcr, extractedData: inhalerExtracted });
  assert(inhalerVerified.verificationStatus === 'Verified', 'Inhaler Verified against monographs');
  assert(inhalerVerified.category.includes('Bronchodilator') || inhalerVerified.category.includes('SABA'), 'Correct bronchodilator category');

  console.log('\n--- TEST 4: Moxifloxacin Eye Drops (Ophthalmic Formulation) ---');
  const dropsOcr = `
    Moxicip Eye Drops
    Moxifloxacin Ophthalmic Solution 0.5% w/v
    Sterile Eye Drops 5ml
    Cipla Ltd. For Ophthalmic Use Only.
  `;
  const dropsExtracted = extractMedicineDetailsFromOcr(dropsOcr);
  assert(dropsExtracted.dosageForm === 'Eye / Ear Drops', 'Dosage form detected as Eye/Ear Drops');
  assert(dropsExtracted.route === 'Ophthalmic', 'Route detected as Ophthalmic');
  const dropsVerified = await verifyAndEnrichMedicine({ rawOcrText: dropsOcr, extractedData: dropsExtracted });
  assert(dropsVerified.verificationStatus === 'Verified', 'Eye drops verified');

  console.log('\n--- TEST 5: Ceftriaxone Injection (Parenteral Formulation) ---');
  const injOcr = `
    Monocef 1g Injection
    Ceftriaxone Sodium for Injection IP 1 g
    For IV / IM use only
    Aristo Pharmaceuticals
  `;
  const injExtracted = extractMedicineDetailsFromOcr(injOcr);
  assert(injExtracted.dosageForm === 'Injection', 'Dosage form detected as Injection');
  const injVerified = await verifyAndEnrichMedicine({ rawOcrText: injOcr, extractedData: injExtracted });
  assert(injVerified.verificationStatus === 'Verified', 'Injection verified');
  assert(injVerified.warnings.includes('Calcium') || injVerified.warnings.includes('precipitation'), 'Calcium contraindication alert present');

  console.log('\n--- TEST 5.5: Pantoprazole Tablets IP (Packaging with USAC/USAGE OCR text) ---');
  const pantoOcr = `
    USAC A Cled Dy Ae PHYSIC
    Borage; Sf atg temperature not FF:
    <5 ORaRding 30°C in a dry place
    from light & moisture
    Keep out of reach of children
    NESTOR Pharmaceuticals
    Pantoprazole Tablets IP
    Each enteric coated tablet contains:
    Pantoprazole Sodium Sesquihydrate IP
    eq. to Pantoprazole 40 mg
  `;
  const pantoExtracted = extractMedicineDetailsFromOcr(pantoOcr);
  assert(pantoExtracted.brandName === 'Pantoprazole Tablets IP', 'Brand correctly extracted as Pantoprazole Tablets IP (NOT "USAC A")');
  assert(pantoExtracted.ingredients.some(i => i.name === 'Pantoprazole'), 'Active ingredient identified as Pantoprazole');
  const pantoVerified = await verifyAndEnrichMedicine({ rawOcrText: pantoOcr, extractedData: pantoExtracted });
  assert(pantoVerified.verificationStatus === 'Verified', 'Pantoprazole verified against clinical monographs');
  assert(pantoVerified.activeIngredients.includes('40 mg'), 'Strength verified as 40 mg');
  assert(pantoVerified.category.includes('Proton Pump Inhibitor'), 'PPI classification verified');
  assert(!pantoVerified.medicineName.includes('USAC'), 'Zero USAC misidentification in output');

  console.log('\n--- TEST 6: Unverified / Unrecognized Substance ---');
  const garbageOcr = `
    XYZ-NOT-A-REAL-DRUG-998877
    Unidentifiable batch text lorem ipsum 100 200
  `;
  const garbageExtracted = extractMedicineDetailsFromOcr(garbageOcr);
  const garbageVerified = await verifyAndEnrichMedicine({ rawOcrText: garbageOcr, extractedData: garbageExtracted });
  assert(garbageVerified.verificationStatus === 'Information Not Verified', 'Flagged as Information Not Verified');
  assert(garbageVerified.confidenceScore === 0, 'Confidence score is 0%');
  assert(garbageVerified.warnings.includes('IDENTIFICATION WARNING'), 'Identification warning rendered');
  assert(!JSON.stringify(garbageVerified).includes('Active pharmaceutical ingredients identified from packaging label'), 'Zero generic filler on unverified item');

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('----------------------------------------------------------------\n');

  if (passed === total) {
    console.log('ALL CLINICAL MEDICINE SCANNER TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

