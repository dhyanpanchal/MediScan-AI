import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const MedicalDisclaimer = () => {
  return (
    <div className="alert alert-warning" style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            Clinical Information Disclaimer & Terms
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: '1.5' }}>
            MediScan AI utilizes optical character recognition (OCR) and advanced artificial intelligence models (Gemini AI) to parse and interpret labels and documents. These results are generated automatically, are strictly for educational and reference purposes, and <strong>must not</strong> be used to diagnose, treat, or make medical decisions.
          </p>
          <ul style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.825rem', 
            lineHeight: '1.5',
            marginTop: '0.5rem',
            paddingLeft: '1.25rem'
          }}>
            <li>OCR processing may introduce transcription errors due to handwriting, camera glare, or print quality.</li>
            <li>AI evaluations do not account for your individual medical history, existing prescriptions, or allergies.</li>
            <li>Consult a licensed physician, pharmacist, or clinical professional before taking any new medications, altering dosages, or drawing conclusions from clinical tests.</li>
          </ul>
        </div>
    </div>
  );
};

export default MedicalDisclaimer;
