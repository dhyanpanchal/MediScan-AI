import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DISCLAIMER_TEXTS = {
  en: {
    title: 'Clinical Information Disclaimer & Terms',
    bodyPrefix: 'MediScan AI utilizes optical character recognition (OCR) and advanced artificial intelligence models (Gemini AI) to parse and interpret labels and documents. These results are generated automatically, are strictly for educational and reference purposes, and ',
    bodyBold: 'must not',
    bodySuffix: ' be used to diagnose, treat, or make medical decisions.',
    items: [
      'OCR processing may introduce transcription errors due to handwriting, camera glare, or print quality.',
      'AI evaluations do not account for your individual medical history, existing prescriptions, or allergies.',
      'Consult a licensed physician, pharmacist, or clinical professional before taking any new medications, altering dosages, or drawing conclusions from clinical tests.'
    ]
  },
  hi: {
    title: 'चिकित्सीय सूचना अस्वीकरण एवं नियम',
    bodyPrefix: 'मेडिस्कैन एआई लेबल और चिकित्सा पर्चियों के विश्लेषण के लिए कृत्रिम बुद्धिमत्ता (Gemini AI) का उपयोग करता है। ये परिणाम स्वचालित रूप से उत्पन्न होते हैं, केवल शैक्षिक और संदर्भ उद्देश्यों के लिए हैं, और इनका उपयोग ',
    bodyBold: 'कदापि नहीं',
    bodySuffix: ' चिकित्सीय निदान, उपचार या अंतिम चिकित्सा निर्णय लेने के लिए किया जाना चाहिए।',
    items: [
      'हस्तलेखन, कैमरे की रोशनी या प्रिंट गुणवत्ता के कारण ट्रांसक्रिप्शन में त्रुटियां हो सकती हैं।',
      'एआई मूल्यांकन आपके व्यक्तिगत चिकित्सा इतिहास, मौजूदा दवाओं या एलर्जी को ध्यान में नहीं रखता है।',
      'कोई भी नई दवा लेने, खुराक बदलने या चिकित्सकीय निर्णय लेने से पहले किसी योग्य चिकित्सक या फार्मासिस्ट से परामर्श अवश्य लें।'
    ]
  },
  gu: {
    title: 'તબીબી માહિતી અસ્વીકરણ અને શરતો',
    bodyPrefix: 'મેડિસ્કેન એઆઈ લેબલ અને પ્રિસ્ક્રિપ્શનના વિશ્લેષણ માટે કૃત્રિમ બુદ્ધિ (Gemini AI) નો ઉપયોગ કરે છે. આ પરિણામો આપમેળે જનરેટ થાય છે, માત્ર શૈક્ષણિક અને સંદર્ભ હેતુ માટે છે, અને તેનો ઉપયોગ ',
    bodyBold: 'ક્યારેય નહીં',
    bodySuffix: ' તબીબી નિદાન, સારવાર અથવા અંતિમ તબીબી નિર્ણય લેવા માટે થવો જોઈએ નહીં.',
    items: [
      'હસ્તાક્ષર, કેમેરા ગ્લેર અથવા પ્રિન્ટ ગુણવત્તાને કારણે વિશ્લેષણમાં ભૂલો થઈ શકે છે.',
      'એઆઈ મૂલ્યાંકન તમારા વ્યક્તિગત તબીબી ઇતિહાસ, ચાલુ દવાઓ અથવા એલર્જીને ધ્યાનમાં લેતું નથી.',
      'કોઈપણ નવી દવા લેતા પહેલાં, માત્રામાં ફેરફાર કરતા પહેલાં અથવા તબીબી નિર્ણય લેતા પહેલાં માન્યતા પ્રાપ્ત ડૉક્ટર અથવા ફાર્માસિસ્ટની સલાહ લો.'
    ]
  }
};

const MedicalDisclaimer = ({ lang }) => {
  const { language: appLang } = useApp();
  const currentLang = lang || appLang || 'en';
  const content = DISCLAIMER_TEXTS[currentLang] || DISCLAIMER_TEXTS.en;

  return (
    <div className="alert alert-warning" style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.25rem' }}>
          {content.title}
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: '1.5' }}>
          {content.bodyPrefix}<strong>{content.bodyBold}</strong>{content.bodySuffix}
        </p>
        <ul style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.825rem', 
          lineHeight: '1.5',
          marginTop: '0.5rem',
          paddingLeft: '1.25rem'
        }}>
          {content.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MedicalDisclaimer;
