const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Q14: dictionaries have consumed keys totalMedicineSearches, savePreferences in en, hi, and gu', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/src/context/AppContext.jsx'), 'utf8');

  // Extract translations block safely
  const startIndex = source.indexOf('const translations = {');
  assert.ok(startIndex !== -1, 'const translations must exist');
  const endIndex = source.indexOf('const normalizeLang', startIndex);
  assert.ok(endIndex !== -1, 'const normalizeLang must exist after translations');
  const translationsCode = source.substring(startIndex, endIndex);

  const sandbox = {};
  vm.runInNewContext(translationsCode + '\nsandbox.translations = translations;', { sandbox });
  const translations = sandbox.translations;

  for (const lang of ['en', 'hi', 'gu']) {
    assert.ok(translations[lang], `Dictionary for ${lang} must exist`);
    assert.ok(translations[lang].totalMedicineSearches, `totalMedicineSearches must exist in ${lang}`);
    assert.ok(translations[lang].savePreferences, `savePreferences must exist in ${lang}`);
    assert.ok(translations[lang].preferencesSaved, `preferencesSaved must exist in ${lang}`);
    assert.ok(translations[lang].localizationEngine, `localizationEngine must exist in ${lang}`);
  }

  assert.equal(translations.en.totalMedicineSearches, 'Text Searches');
  assert.equal(translations.hi.totalMedicineSearches, 'दवा खोजें (टेक्स्ट)');
  assert.equal(translations.gu.totalMedicineSearches, 'દવાની શોધ (ટેક્સ્ટ)');
});

test('Q22: language normalizer and document lang updates are coherent', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/src/context/AppContext.jsx'), 'utf8');
  assert.match(source, /document\.documentElement\.lang\s*=\s*norm/);
  assert.match(source, /document\.documentElement\.dir\s*=\s*'ltr'/);

  const startIdx = source.indexOf('const normalizeLang =');
  const endIdx = source.indexOf('export const AppProvider', startIdx);
  const helperCode = source.substring(startIdx, endIdx);

  const sandbox = {};
  vm.runInNewContext(helperCode + '\nsandbox.normalizeLang = normalizeLang;', { sandbox });

  assert.equal(sandbox.normalizeLang('en'), 'en');
  assert.equal(sandbox.normalizeLang('Hindi'), 'hi');
  assert.equal(sandbox.normalizeLang('Gujarati'), 'gu');
  assert.equal(sandbox.normalizeLang('gu-IN'), 'gu');
  assert.equal(sandbox.normalizeLang(null), 'en');
});
