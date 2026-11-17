const test = require('node:test');
const assert = require('node:assert/strict');
const {extractMedicineDetailsFromOcr: extract} = require('../src/utils/medicineExtractor');
const {verifyAndEnrichMedicine: verify} = require('../src/utils/drugVerification');
const {translateMedicinePayload: translate} = require('../src/utils/clinicalTranslations');
const label = (overrides = {}) => ({set_id:'test-source-1', openfda:{brand_name:['Example'], generic_name:['Ingredient'], substance_name:['Ingredient'], manufacturer_name:['Maker'], route:['ORAL']}, active_ingredient:['Ingredient 100 mg'], description:['Ingredient 100 mg tablet'], indications_and_usage:['Source indication'], ...overrides});
const lookup = results => async () => ({results,status:'ok'});
test('no guessed strengths, brands, routes or manufacturers from generic names', () => {
  const result = extract('Paracetamol\nPantoprazole');
  assert.equal(result.ingredients.length,0);
  assert.equal(result.route,null); assert.equal(result.manufacturer,null); assert.equal(result.dosageForm,null);
  assert.equal(result.recognizedFormulation,null); assert.notEqual(result.brandName,'Dolo-650');
});
test('Limcee never accepts unrelated Vita Soluball zinc topical result', async () => {
  const result = await verify({extractedData:extract('LIMCEE\nVitamin C 500 mg\nChewable tablets'), lookup:lookup([label({openfda:{brand_name:['Vita Soluball'],generic_name:['Zinc oxide'],route:['TOPICAL']}})])});
  assert.equal(result.medicineName,'LIMCEE'); assert.equal(result.verificationStatus,'Information Not Verified'); assert.deepEqual(result.sources,[]); assert.deepEqual(result.clinicalUses,[]);
});
test('substring, wrong strength, route, manufacturer and formulation are rejected', async () => {
  for (const observed of [{brandName:'Exam'}, {brandName:'Example', ingredients:[{name:'Ingredient',strength:'200 mg'}]}, {brandName:'Example',route:'Topical'}, {brandName:'Example',manufacturer:'Other'}, {brandName:'Example',dosageForm:'cream'}]) {
    const result = await verify({extractedData:observed,lookup:lookup([label()])});
    assert.equal(result.identificationStatus,'unverified');
  }
});
test('strength cannot be borrowed from another ingredient', async () => {
  const result = await verify({extractedData:{brandName:'Example',ingredients:[{name:'Ingredient',strength:'200 mg'}]},lookup:lookup([label({active_ingredient:['Ingredient 100 mg + Other 200 mg'],description:[]})])});
  assert.equal(result.identificationStatus,'unverified');
});
test('exact accepted label returns only supplied source facts and no numeric confidence', async () => {
  const result = await verify({extractedData:{brandName:'Example',ingredients:[{name:'Ingredient',strength:'100 mg'}],route:'Oral',dosageForm:'tablet'},lookup:lookup([label()])});
  assert.equal(result.identificationStatus,'source_matched'); assert.deepEqual(result.clinicalUses,['Source indication']); assert.equal(result.confidenceScore,null); assert.equal(result.storage,null); assert.equal(result.dosage,null); assert.equal(result.sideEffects.common.length,0); assert.match(result.sources[0].url,/test-source-1$/);
});
test('multiple label formulations remain ambiguous and registry outage remains unknown', async () => {
  const result = await verify({extractedData:{brandName:'Example'},lookup:lookup([label(),label({set_id:'test-source-2'})])});
  assert.equal(result.identificationStatus,'ambiguous'); assert.deepEqual(result.sources,[]);
  const unavailable = await verify({extractedData:{brandName:'Example'},lookup:async()=>{throw Error('offline')}});
  assert.equal(unavailable.identificationStatus,'unverified'); assert.deepEqual(unavailable.clinicalUses,[]);
});
test('translations preserve identity, all quantities, structure and original data', async () => {
  const data = {medicineName:'Example 100',activeIngredients:'Ingredient 100 mg',sources:[{url:'https://example.com/100'}],warnings:'Keep 100 mg unchanged'};
  const result = await translate(data,'hi',{generate:async()=>JSON.stringify({translations:['100 mg अपरिवर्तित रखें']})});
  assert.equal(result.medicineName,data.medicineName); assert.equal(result.activeIngredients,data.activeIngredients); assert.deepEqual(result.sources,data.sources);
  assert.deepEqual(result._originalEnglish,data); assert.equal(data.warnings,'Keep 100 mg unchanged');
  await assert.rejects(translate(data,'gu',{generate:async()=>JSON.stringify({translations:['200 mg રાખો']})}),{status:503});
  await assert.rejects(translate(data,'hi',{generate:async()=>null}),{status:503});
});
