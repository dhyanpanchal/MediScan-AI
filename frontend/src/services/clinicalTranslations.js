/** Translate the exact result, never replace its clinical facts with a monograph. */
export async function translateMedicinePayload(data, language = 'en', translate) {
  if (!data) return data;
  if (!['en', 'hi', 'gu'].includes(language)) throw new Error('Unsupported language');
  if (data._currentLang === language) return data;
  if (language === 'en' && data._originalEnglish) {
    return { ...structuredClone(data._originalEnglish), _currentLang: 'en' };
  }
  if (typeof translate !== 'function') throw new Error('Translation service is unavailable');
  return translate(data, language);
}
export default translateMedicinePayload;
