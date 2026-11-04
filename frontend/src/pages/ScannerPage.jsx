import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { 
  Upload, Camera, Pill, FileCheck,
  Sparkles, Loader2, AlertOctagon,
  ShieldAlert, Clock, Building, X, Search, CheckCircle2, AlertTriangle,
  Globe, ChevronDown, Check
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'हिन्दी', native: 'Hindi' },
  { code: 'gu', label: 'ગુજરાતી', native: 'Gujarati' }
];

const SCAN_LABELS = {
  en: {
    analysisResults: 'Analysis Results',
    verified: 'Verified',
    awaitingScan: 'Awaiting Scan',
    awaitingScanDesc: 'Upload an image and analyze it to view the structured clinical breakdown here.',
    generic: 'Generic',
    overview: 'Overview',
    dosage: 'Dosage',
    warnings: 'Warnings',
    sideEffects: 'Side Effects',
    clinicalPurpose: 'Clinical Purpose',
    manufacturer: 'Manufacturer',
    storage: 'Storage',
    prescribedDosage: 'Prescribed Dosage',
    usageInstructions: 'Usage Instructions',
    missedDose: 'If you miss a dose',
    criticalWarnings: 'Critical Warnings',
    generalPrecautions: 'General Precautions',
    knownSideEffects: 'Known Side Effects',
    // ── Manual name-search labels ──
    searchResults: 'Search Results',
    found: 'Found',
    medicineNameSearch: 'Medicine Name Search',
    medicineNameSearchDesc: 'Type the name of any medicine or drug to get detailed clinical information \u2014 dosage, warnings, side effects, and interactions.',
    searchMedicine: 'Search Medicine',
    searching: 'Searching...',
    awaitingSearch: 'Awaiting Search',
    awaitingSearchDesc: 'Enter a medicine name on the left and click Search to view detailed clinical information here.',
    quickSuggestions: 'QUICK SUGGESTIONS',
    analyzingMedicineData: 'Analyzing Medicine Data',
    analyzingMedicineDataDesc: 'AI is retrieving clinical information...',
    reset: 'Reset',
    maker: 'Maker',
    primaryUse: 'Primary Use',
    drugClass: 'Drug Class',
    activeIngredient: 'Active Ingredient',
    ageSpecificInfo: 'Age-Specific Info',
    drugInteractions: 'Drug Interactions',
    standardDose: 'Standard Dose',
    frequency: 'Frequency',
    duration: 'Duration',
    howToTake: 'How to Take',
    precautions: 'Precautions',
    commonSideEffects: 'Common Side Effects',
    seriousSideEffects: 'Serious Side Effects',
    // ── Image scan mode labels ──
    clinicalOcrEngine: 'Clinical OCR Engine',
    scannerPageDesc: 'Upload pill bottles, packaging, or prescription labels. Our system extracts textual data and generates structured clinical dosages, active ingredients, warnings, and safety information.',
    scanImage: 'Scan Image',
    manualSearch: 'Manual Search',
    imageSource: 'Image Source',
    translateResultTo: 'Translate Result To:',
    analyzeMedicine: 'Analyze Medicine',
    uploadMedicineLabel: 'Upload Medicine Label',
    uploadDesc: 'Drag and drop an image, click to browse, or use your camera.',
    browseFiles: 'Browse Files',
    openCamera: 'Open Camera',
    demoPresets: 'DEMO PRESETS',
    captureLabel: 'Capture Label',
    captureFrame: 'Capture Frame',
    cancel: 'Cancel',
    analyzingMedicine: 'Analyzing Medicine',
    imageUploaded: 'Image uploaded securely',
    ocrExtracted: 'OCR text extracted',
    medicineIdentified: 'Medicine identified via AI',
    crossReferencing: 'Cross-referencing clinical data',
    preparingSummary: 'Preparing safety summary',
  },
  hi: {
    analysisResults: '\u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u092a\u0930\u093f\u0923\u093e\u092e',
    verified: '\u0938\u0924\u094d\u092f\u093e\u092a\u093f\u0924',
    awaitingScan: '\u0938\u094d\u0915\u0948\u0928 \u0915\u0940 \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e \u0939\u0948',
    awaitingScanDesc: '\u0938\u0902\u0930\u091a\u093f\u0924 \u0915\u094d\u0932\u093f\u0928\u093f\u0915\u0932 \u0935\u093f\u0935\u0930\u0923 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u090f\u0915 \u091b\u0935\u093f \u0905\u092a\u0932\u094b\u0921 \u0915\u0930\u0947\u0902 \u0914\u0930 \u0909\u0938\u0915\u093e \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u0915\u0930\u0947\u0902\u0964',
    generic: '\u091c\u0947\u0928\u0947\u0930\u093f\u0915 \u0928\u093e\u092e',
    overview: '\u0905\u0935\u0932\u094b\u0915\u0928',
    dosage: '\u0916\u0941\u0930\u093e\u0915',
    warnings: '\u091a\u0947\u0924\u093e\u0935\u0928\u093f\u092f\u093e\u0902',
    sideEffects: '\u0926\u0941\u0937\u094d\u092a\u094d\u0930\u092d\u093e\u0935',
    clinicalPurpose: '\u091a\u093f\u0915\u093f\u0924\u094d\u0938\u0940\u092f \u0909\u092a\u092f\u094b\u0917',
    manufacturer: '\u0928\u093f\u0930\u094d\u092e\u093e\u0924\u093e',
    storage: '\u092d\u0902\u0921\u093e\u0930\u0923',
    prescribedDosage: '\u0928\u093f\u0930\u094d\u0927\u093e\u0930\u093f\u0924 \u0916\u0941\u0930\u093e\u0915',
    usageInstructions: '\u0909\u092a\u092f\u094b\u0917 \u0928\u093f\u0930\u094d\u0926\u0947\u0936',
    missedDose: '\u092f\u0926\u093f \u0916\u0941\u0930\u093e\u0915 \u091b\u0942\u091f \u091c\u093e\u090f',
    criticalWarnings: '\u092e\u0939\u0924\u094d\u0935\u092a\u0942\u0930\u094d\u0923 \u091a\u0947\u0924\u093e\u0935\u0928\u093f\u092f\u093e\u0902',
    generalPrecautions: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u0938\u093e\u0935\u0927\u093e\u0928\u093f\u092f\u093e\u0902',
    knownSideEffects: '\u091c\u094d\u091e\u093e\u0924 \u0926\u0941\u0937\u094d\u092a\u094d\u0930\u092d\u093e\u0935',
    searchResults: '\u0916\u094b\u091c \u092a\u0930\u093f\u0923\u093e\u092e',
    found: '\u092e\u093f\u0932\u093e',
    medicineNameSearch: '\u0926\u0935\u093e\u0908 \u0915\u093e \u0928\u093e\u092e \u0916\u094b\u091c\u0947\u0902',
    medicineNameSearchDesc: '\u0935\u093f\u0938\u094d\u0924\u0943\u0924 \u091a\u093f\u0915\u093f\u0924\u094d\u0938\u0940\u092f \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u092a\u094d\u0930\u093e\u092a\u094d\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0915\u093f\u0938\u0940 \u092d\u0940 \u0926\u0935\u093e\u0908 \u0915\u093e \u0928\u093e\u092e \u091f\u093e\u0907\u092a \u0915\u0930\u0947\u0902 \u2014 \u0916\u0941\u0930\u093e\u0915, \u091a\u0947\u0924\u093e\u0935\u0928\u093f\u092f\u093e\u0902, \u0926\u0941\u0937\u094d\u092a\u094d\u0930\u092d\u093e\u0935 \u0914\u0930 \u0926\u0935\u093e\u0908 \u0915\u0940 \u092a\u0930\u0938\u094d\u092a\u0930 \u0915\u094d\u0930\u093f\u092f\u093e\u0964',
    searchMedicine: '\u0926\u0935\u093e\u0908 \u0916\u094b\u091c\u0947\u0902',
    searching: '\u0916\u094b\u091c \u0930\u0939\u093e \u0939\u0948...',
    awaitingSearch: '\u0916\u094b\u091c \u0915\u0940 \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e',
    awaitingSearchDesc: '\u092c\u093e\u0908\u0902 \u0913\u0930 \u0926\u0935\u093e\u0908 \u0915\u093e \u0928\u093e\u092e \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902 \u0914\u0930 \u0935\u093f\u0938\u094d\u0924\u0943\u0924 \u091a\u093f\u0915\u093f\u0924\u094d\u0938\u0940\u092f \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u092f\u0939\u093e\u0902 \u0926\u0947\u0916\u0947\u0902\u0964',
    quickSuggestions: '\u0924\u094d\u0935\u0930\u093f\u0924 \u0938\u0941\u091d\u093e\u0935',
    analyzingMedicineData: '\u0926\u0935\u093e\u0908 \u0921\u0947\u091f\u093e \u0915\u093e \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923',
    analyzingMedicineDataDesc: 'AI \u091a\u093f\u0915\u093f\u0924\u094d\u0938\u0940\u092f \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u092a\u094d\u0930\u093e\u092a\u094d\u0924 \u0915\u0930 \u0930\u0939\u093e \u0939\u0948...',
    reset: '\u0930\u0940\u0938\u0947\u091f',
    maker: '\u0928\u093f\u0930\u094d\u092e\u093e\u0924\u093e',
    primaryUse: '\u092a\u094d\u0930\u093e\u0925\u092e\u093f\u0915 \u0909\u092a\u092f\u094b\u0917',
    drugClass: '\u0926\u0935\u093e\u0908 \u0935\u0930\u094d\u0917',
    activeIngredient: '\u0938\u0915\u094d\u0930\u093f\u092f \u0924\u0924\u094d\u0935',
    ageSpecificInfo: '\u0906\u092f\u0941-\u0935\u093f\u0936\u093f\u0937\u094d\u091f \u091c\u093e\u0928\u0915\u093e\u0930\u0940',
    drugInteractions: '\u0926\u0935\u093e\u0908 \u092a\u0930\u0938\u094d\u092a\u0930 \u0915\u094d\u0930\u093f\u092f\u093e',
    standardDose: '\u092e\u093e\u0928\u0915 \u0916\u0941\u0930\u093e\u0915',
    frequency: '\u0906\u0935\u0943\u0924\u094d\u0924\u093f',
    duration: '\u0905\u0935\u0927\u093f',
    howToTake: '\u0915\u0948\u0938\u0947 \u0932\u0947\u0902',
    precautions: '\u0938\u093e\u0935\u0927\u093e\u0928\u093f\u092f\u093e\u0902',
    commonSideEffects: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u0926\u0941\u0937\u094d\u092a\u094d\u0930\u092d\u093e\u0935',
    seriousSideEffects: '\u0917\u0902\u092d\u0940\u0930 \u0926\u0941\u0937\u094d\u092a\u094d\u0930\u092d\u093e\u0935',
    clinicalOcrEngine: '\u0915\u094d\u0932\u093f\u0928\u093f\u0915\u0932 OCR \u0907\u0902\u091c\u0928',
    scannerPageDesc: '\u0926\u0935\u093e\u0908 \u0915\u0940 \u092c\u094b\u0924\u0932, \u092a\u0948\u0915\u0947\u091c\u093f\u0902\u0917 \u092f\u093e \u092a\u094d\u0930\u093f\u0938\u094d\u0915\u094d\u0930\u093f\u092a\u094d\u0936\u0928 \u0932\u0947\u092c\u0932 \u0905\u092a\u0932\u094b\u0921 \u0915\u0930\u0947\u0902\u0964 \u0939\u092e\u093e\u0930\u0940 \u092a\u094d\u0930\u0923\u093e\u0932\u0940 \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u0921\u0947\u091f\u093e \u0928\u093f\u0915\u093e\u0932\u0924\u0940 \u0939\u0948 \u0914\u0930 \u0938\u0902\u0930\u091a\u093f\u0924 \u0916\u0941\u0930\u093e\u0915, \u0938\u0915\u094d\u0930\u093f\u092f \u0924\u0924\u094d\u0935, \u091a\u0947\u0924\u093e\u0935\u0928\u093f\u092f\u093e\u0902 \u0914\u0930 \u0938\u0941\u0930\u0915\u094d\u0937\u093e \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u0924\u0948\u092f\u093e\u0930 \u0915\u0930\u0924\u0940 \u0939\u0948\u0964',
    scanImage: '\u091b\u0935\u093f \u0938\u094d\u0915\u0948\u0928 \u0915\u0930\u0947\u0902',
    manualSearch: '\u092e\u0948\u0928\u0941\u0905\u0932 \u0916\u094b\u091c',
    imageSource: '\u091b\u0935\u093f \u0938\u094d\u0930\u094b\u0924',
    translateResultTo: '\u092a\u0930\u093f\u0923\u093e\u092e \u0905\u0928\u0941\u0935\u093e\u0926 \u0915\u0930\u0947\u0902:',
    analyzeMedicine: '\u0926\u0935\u093e\u0908 \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u0915\u0930\u0947\u0902',
    uploadMedicineLabel: '\u0926\u0935\u093e\u0908 \u0915\u093e \u0932\u0947\u092c\u0932 \u0905\u092a\u0932\u094b\u0921 \u0915\u0930\u0947\u0902',
    uploadDesc: '\u091b\u0935\u093f \u0921\u094d\u0930\u0948\u0917 \u0914\u0930 \u0921\u094d\u0930\u0949\u092a \u0915\u0930\u0947\u0902, \u092c\u094d\u0930\u093e\u0909\u091c \u0915\u0930\u0947\u0902, \u092f\u093e \u0915\u0948\u092e\u0930\u093e \u0916\u094b\u0932\u0947\u0902\u0964',
    browseFiles: '\u092b\u093e\u0907\u0932 \u091a\u0941\u0928\u0947\u0902',
    openCamera: '\u0915\u0948\u092e\u0930\u093e \u0916\u094b\u0932\u0947\u0902',
    demoPresets: '\u0921\u0947\u092e\u094b \u092a\u094d\u0930\u0940\u0938\u0947\u091f',
    captureLabel: '\u0932\u0947\u092c\u0932 \u0915\u0948\u092a\u094d\u091a\u0930 \u0915\u0930\u0947\u0902',
    captureFrame: '\u092b\u094d\u0930\u0947\u092e \u0915\u0948\u092a\u094d\u091a\u0930 \u0915\u0930\u0947\u0902',
    cancel: '\u0930\u0926\u094d\u0926 \u0915\u0930\u0947\u0902',
    analyzingMedicine: '\u0926\u0935\u093e\u0908 \u0915\u093e \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923',
    imageUploaded: '\u091b\u0935\u093f \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0930\u0942\u092a \u0938\u0947 \u0905\u092a\u0932\u094b\u0921 \u0939\u0941\u0908',
    ocrExtracted: 'OCR \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u0928\u093f\u0915\u093e\u0932\u093e \u0917\u092f\u093e',
    medicineIdentified: 'AI \u0926\u094d\u0935\u093e\u0930\u093e \u0926\u0935\u093e\u0908 \u092a\u0939\u091a\u093e\u0928\u0940 \u0917\u0908',
    crossReferencing: '\u0915\u094d\u0932\u093f\u0928\u093f\u0915\u0932 \u0921\u0947\u091f\u093e \u0915\u094d\u0930\u0949\u0938-\u0930\u0947\u092b\u0930\u0947\u0902\u0938 \u0939\u094b \u0930\u0939\u093e \u0939\u0948',
    preparingSummary: '\u0938\u0941\u0930\u0915\u094d\u0937\u093e \u0938\u093e\u0930\u093e\u0902\u0936 \u0924\u0948\u092f\u093e\u0930 \u0939\u094b \u0930\u0939\u093e \u0939\u0948',
  },
  gu: {
    analysisResults: '\u0AB5\u0ABF\u0AB6\u0ACD\u0AB2\u0AC7\u0AB7\u0AA3 \u0AAA\u0AB0\u0ABF\u0AA3\u0ABE\u0AAE\u0ACB',
    verified: '\u0A9A\u0A95\u0ABE\u0AB8\u0ABE\u0AAF\u0AC7\u0AB2',
    awaitingScan: '\u0AB8\u0ACD\u0A95\u0AC7\u0AA8 \u0AAE\u0ABE\u0A9F\u0AC7 \u0AAA\u0ACD\u0AB0\u0AA4\u0AC0\u0A95\u0ACD\u0AB7\u0ABE\u0AB0\u0AA4',
    awaitingScanDesc: '\u0A95\u0ACD\u0AB2\u0ABF\u0AA8\u0ABF\u0A95\u0AB2 \u0AB5\u0ABF\u0A97\u0AA4\u0ACB \u0A9C\u0ACB\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0AA6\u0AB5\u0ABE\u0AA8\u0ABE \u0AB2\u0AC7\u0AAC\u0AB2\u0AA8\u0ACB \u0AAB\u0ACB\u0A9F\u0ACB \u0A85\u0AAA\u0AB2\u0ACB\u0AA1 \u0A95\u0AB0\u0ACB \u0A85\u0AA8\u0AC7 \u0AB5\u0ABF\u0AB6\u0ACD\u0AB2\u0AC7\u0AB7\u0AA3 \u0A95\u0AB0\u0ACB.',
    generic: '\u0A9C\u0AC7\u0AA8\u0AC7\u0AB0\u0ABF\u0A95 \u0AA8\u0ABE\u0AAE',
    overview: '\u0AB5\u0ABF\u0AB9\u0A82\u0A97\u0ABE\u0AB5\u0AB2\u0ACB\u0A95\u0AA8',
    dosage: '\u0AAE\u0ABE\u0AA4\u0ACD\u0AB0\u0ABE / \u0AA1\u0ACB\u0A9D',
    warnings: '\u0A9A\u0AC7\u0AA4\u0AB5\u0AA3\u0AC0\u0A93',
    sideEffects: '\u0A86\u0AA1\u0A85\u0AB8\u0AB0\u0ACB',
    clinicalPurpose: '\u0AA4\u0AAC\u0AC0\u0AAC\u0AC0 \u0A89\u0AAA\u0AAF\u0ACB\u0A97',
    manufacturer: '\u0A89\u0AA4\u0ACD\u0AAA\u0ABE\u0AA6\u0A95',
    storage: '\u0AB8\u0A82\u0A97\u0ACD\u0AB0\u0AB9',
    prescribedDosage: '\u0AAD\u0AB2\u0ABE\u0AAE\u0AA3 \u0A95\u0AB0\u0AC7\u0AB2 \u0AA1\u0ACB\u0A9D',
    usageInstructions: '\u0AB5\u0AAA\u0AB0\u0ABE\u0AB6 \u0AAE\u0ABE\u0AB0\u0ACD\u0A97\u0AA6\u0AB0\u0ACD\u0AB6\u0ABF\u0A95\u0ABE',
    missedDose: '\u0A9C\u0ACB \u0AA1\u0ACB\u0A9D \u0A9A\u0AC2\u0A95\u0AC0 \u0A9C\u0ABE\u0A93',
    criticalWarnings: '\u0AAE\u0AB9\u0AA4\u0ACD\u0AB5\u0AAA\u0AC2\u0AB0\u0ACD\u0AA3 \u0A9A\u0AC7\u0AA4\u0AB5\u0AA3\u0AC0\u0A93',
    generalPrecautions: '\u0AB8\u0ABE\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB8\u0ABE\u0AB5\u0A9A\u0AC7\u0AA4\u0AC0\u0A93',
    knownSideEffects: '\u0A9C\u0ABE\u0AA3\u0AC0\u0AA4\u0AC0 \u0A86\u0AA1\u0A85\u0AB8\u0AB0\u0ACB',
    searchResults: '\u0AB6\u0ACB\u0AA7 \u0AAA\u0AB0\u0ABF\u0AA3\u0ABE\u0AAE\u0ACB',
    found: '\u0AAE\u0AB3\u0ACD\u0AAF\u0AC1\u0A82',
    medicineNameSearch: '\u0AA6\u0AB5\u0ABE\u0AA8\u0AC1\u0A82 \u0AA8\u0ABE\u0AAE \u0AB6\u0ACB\u0AA7\u0ACB',
    medicineNameSearchDesc: '\u0AB5\u0ABF\u0AB8\u0ACD\u0AA4\u0AC3\u0AA4 \u0AA4\u0AAC\u0AC0\u0AAC\u0AC0 \u0AAE\u0ABE\u0AB9\u0ABF\u0AA4\u0AC0 \u0AAE\u0AC7\u0AB3\u0AB5\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0A95\u0ACB\u0A88\u0AAA\u0AA3 \u0AA6\u0AB5\u0ABE\u0AA8\u0AC1\u0A82 \u0AA8\u0ABE\u0AAE \u0A9F\u0ABE\u0A87\u0AAA \u0A95\u0AB0\u0ACB \u2014 \u0AAE\u0ABE\u0AA4\u0ACD\u0AB0\u0ABE, \u0A9A\u0AC7\u0AA4\u0AB5\u0AA3\u0AC0\u0A93, \u0A86\u0AA1\u0A85\u0AB8\u0AB0\u0ACB \u0A85\u0AA8\u0AC7 \u0AA6\u0AB5\u0ABE\u0AA8\u0AC0 \u0A86\u0A82\u0AA4\u0AB0\u0A95\u0ACD\u0AB0\u0ABF\u0AAF\u0ABE.',
    searchMedicine: '\u0AA6\u0AB5\u0ABE \u0AB6\u0ACB\u0AA7\u0ACB',
    searching: '\u0AB6\u0ACB\u0AA7\u0AC0 \u0AB0\u0AB9\u0ACD\u0AAF\u0ABE \u0A9B\u0AC0\u0A8F...',
    awaitingSearch: '\u0AB6\u0ACB\u0AA7\u0AA8\u0AC0 \u0AAA\u0ACD\u0AB0\u0AA4\u0AC0\u0A95\u0ACD\u0AB7\u0ABE',
    awaitingSearchDesc: '\u0AA1\u0ABE\u0AAC\u0AC0 \u0AAC\u0ABE\u0A9C\u0AC1 \u0AA6\u0AB5\u0ABE\u0AA8\u0AC1\u0A82 \u0AA8\u0ABE\u0AAE \u0AA6\u0ABE\u0A96\u0AB2 \u0A95\u0AB0\u0ACB \u0A85\u0AA8\u0AC7 \u0AB5\u0ABF\u0AB8\u0ACD\u0AA4\u0AC3\u0AA4 \u0AA4\u0AAC\u0AC0\u0AAC\u0AC0 \u0AAE\u0ABE\u0AB9\u0ABF\u0AA4\u0AC0 \u0A85\u0AB9\u0AC0\u0A82 \u0A9C\u0AC1\u0A93.',
    quickSuggestions: '\u0AA4\u0ACD\u0AB5\u0AB0\u0ABF\u0AA4 \u0AB8\u0AC2\u0A9A\u0AA8\u0ACB',
    analyzingMedicineData: '\u0AA6\u0AB5\u0ABE\u0AA8\u0AC0 \u0AAE\u0ABE\u0AB9\u0ABF\u0AA4\u0AC0\u0AA8\u0AC1\u0A82 \u0AB5\u0ABF\u0AB6\u0ACD\u0AB2\u0AC7\u0AB7\u0AA3',
    analyzingMedicineDataDesc: 'AI \u0A95\u0ACD\u0AB2\u0ABF\u0AA8\u0ABF\u0A95\u0AB2 \u0AAE\u0ABE\u0AB9\u0ABF\u0AA4\u0AC0 \u0AAE\u0AC7\u0AB3\u0AB5\u0AC0 \u0AB0\u0AB9\u0ACD\u0AAF\u0AC1\u0A82 \u0A9B\u0AC7...',
    reset: '\u0AB0\u0AC0\u0AB8\u0AC7\u0A9F',
    maker: '\u0A89\u0AA4\u0ACD\u0AAA\u0ABE\u0AA6\u0A95',
    primaryUse: '\u0AAA\u0ACD\u0AB0\u0ABE\u0AA5\u0AAE\u0ABF\u0A95 \u0A89\u0AAA\u0AAF\u0ACB\u0A97',
    drugClass: '\u0AA6\u0AB5\u0ABE \u0AB5\u0AB0\u0ACD\u0A97',
    activeIngredient: '\u0AB8\u0A95\u0ACD\u0AB0\u0ABF\u0AAF \u0A98\u0A9F\u0A95',
    ageSpecificInfo: '\u0A89\u0A82\u0AAE\u0AB0-\u0AB5\u0ABF\u0AB6\u0ABF\u0AB7\u0ACD\u0A9F \u0AAE\u0ABE\u0AB9\u0ABF\u0AA4\u0AC0',
    drugInteractions: '\u0AA6\u0AB5\u0ABE\u0AA8\u0AC0 \u0A86\u0A82\u0AA4\u0AB0\u0A95\u0ACD\u0AB0\u0ABF\u0AAF\u0ABE',
    standardDose: '\u0AAE\u0ABE\u0AA8\u0A95 \u0AA1\u0ACB\u0A9D',
    frequency: '\u0A86\u0AB5\u0AC3\u0AA4\u0ACD\u0AA4\u0ABF',
    duration: '\u0AB8\u0AAE\u0AAF\u0A97\u0ABE\u0AB3\u0ACB',
    howToTake: '\u0A95\u0AC7\u0AB5\u0AC0 \u0AB0\u0AC0\u0AA4\u0AC7 \u0AB2\u0AC7\u0AB5\u0AC0',
    precautions: '\u0AB8\u0ABE\u0AB5\u0A9A\u0AC7\u0AA4\u0AC0\u0A93',
    commonSideEffects: '\u0AB8\u0ABE\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0A86\u0AA1\u0A85\u0AB8\u0AB0\u0ACB',
    seriousSideEffects: '\u0A97\u0A82\u0AAD\u0AC0\u0AB0 \u0A86\u0AA1\u0A85\u0AB8\u0AB0\u0ACB',
    clinicalOcrEngine: '\u0A95\u0ACD\u0AB2\u0ABF\u0AA8\u0ABF\u0A95\u0AB2 OCR \u0A8F\u0AA8\u0ACD\u0A9C\u0ABF\u0AA8',
    scannerPageDesc: '\u0AA6\u0AB5\u0ABE\u0AA8\u0AC0 \u0AAC\u0ACB\u0AA4\u0AB2, \u0AAA\u0AC7\u0A95\u0AC7\u0A9C\u0ABF\u0A82\u0A97 \u0A85\u0AA5\u0AB5\u0ABE \u0AAA\u0ACD\u0AB0\u0ABF\u0AB8\u0ACD\u0A95\u0ACD\u0AB0\u0ABF\u0AAA\u0ACD\u0AB6\u0AA8 \u0AB2\u0AC7\u0AAC\u0AB2 \u0A85\u0AAA\u0AB2\u0ACB\u0AA1 \u0A95\u0AB0\u0ACB. \u0A85\u0AAE\u0ABE\u0AB0\u0AC0 \u0AB8\u0ABF\u0AB8\u0ACD\u0A9F\u0AAE \u0A9F\u0AC7\u0A95\u0ACD\u0AB8\u0ACD\u0A9F \u0AA1\u0AC7\u0A9F\u0ABE \u0A95\u0ABE\u0AA2\u0AC7 \u0A9B\u0AC7 \u0A85\u0AA8\u0AC7 \u0AB8\u0A82\u0AB0\u0A9A\u0ABF\u0AA4 \u0AAE\u0ABE\u0AA4\u0ACD\u0AB0\u0ABE, \u0AB8\u0A95\u0ACD\u0AB0\u0ABF\u0AAF \u0A98\u0A9F\u0A95\u0ACB, \u0A9A\u0AC7\u0AA4\u0AB5\u0AA3\u0AC0\u0A93 \u0A85\u0AA8\u0AC7 \u0AB8\u0AC1\u0AB0\u0A95\u0ACD\u0AB7\u0ABE \u0AAE\u0ABE\u0AB9\u0ABF\u0AA4\u0AC0 \u0AA4\u0AC8\u0AAF\u0ABE\u0AB0 \u0A95\u0AB0\u0AC7 \u0A9B\u0AC7.',
    scanImage: '\u0A9B\u0AAC\u0AC0 \u0AB8\u0ACD\u0A95\u0AC7\u0AA8 \u0A95\u0AB0\u0ACB',
    manualSearch: '\u0AAE\u0AC7\u0AA8\u0ACD\u0AAF\u0AC1\u0A85\u0AB2 \u0AB6\u0ACB\u0AA7',
    imageSource: '\u0A9B\u0AAC\u0AC0 \u0AB8\u0ACD\u0AB0\u0ACB\u0AA4',
    translateResultTo: '\u0AAA\u0AB0\u0ABF\u0AA3\u0ABE\u0AAE \u0A85\u0AA8\u0AC1\u0AB5\u0ABE\u0AA6 \u0A95\u0AB0\u0ACB:',
    analyzeMedicine: '\u0AA6\u0AB5\u0ABE\u0AA8\u0AC1\u0A82 \u0AB5\u0ABF\u0AB6\u0ACD\u0AB2\u0AC7\u0AB7\u0AA3 \u0A95\u0AB0\u0ACB',
    uploadMedicineLabel: '\u0AA6\u0AB5\u0ABE\u0AA8\u0AC1\u0A82 \u0AB2\u0AC7\u0AAC\u0AB2 \u0A85\u0AAA\u0AB2\u0ACB\u0AA1 \u0A95\u0AB0\u0ACB',
    uploadDesc: '\u0A9B\u0AAC\u0AC0 \u0AA1\u0ACD\u0AB0\u0AC7\u0A97 \u0A85\u0AA8\u0AC7 \u0AA1\u0ACD\u0AB0\u0ACB\u0AAA \u0A95\u0AB0\u0ACB, \u0AAC\u0ACD\u0AB0\u0ABE\u0A89\u0A9D \u0A95\u0AB0\u0ACB, \u0A85\u0AA5\u0AB5\u0ABE \u0A95\u0AC7\u0AAE\u0AB0\u0ACB \u0A96\u0ACB\u0AB2\u0ACB.',
    browseFiles: '\u0AAB\u0ABE\u0A87\u0AB2 \u0AAC\u0ACD\u0AB0\u0ABE\u0A89\u0A9D \u0A95\u0AB0\u0ACB',
    openCamera: '\u0A95\u0AC7\u0AAE\u0AB0\u0ACB \u0A96\u0ACB\u0AB2\u0ACB',
    demoPresets: '\u0AA1\u0AC7\u0AAE\u0ACB \u0AAA\u0ACD\u0AB0\u0AC0\u0AB8\u0AC7\u0A9F',
    captureLabel: '\u0AB2\u0AC7\u0AAC\u0AB2 \u0A95\u0AC7\u0AAA\u0ACD\u0A9A\u0AB0 \u0A95\u0AB0\u0ACB',
    captureFrame: '\u0AAB\u0ACD\u0AB0\u0AC7\u0AAE \u0A95\u0AC7\u0AAA\u0ACD\u0A9A\u0AB0 \u0A95\u0AB0\u0ACB',
    cancel: '\u0AB0\u0AA6 \u0A95\u0AB0\u0ACB',
    analyzingMedicine: '\u0AA6\u0AB5\u0ABE\u0AA8\u0AC1\u0A82 \u0AB5\u0ABF\u0AB6\u0ACD\u0AB2\u0AC7\u0AB7\u0AA3',
    imageUploaded: '\u0A9B\u0AAC\u0AC0 \u0AB8\u0AC1\u0AB0\u0A95\u0ACD\u0AB7\u0ABF\u0AA4 \u0AB0\u0AC0\u0AA4\u0AC7 \u0A85\u0AAA\u0AB2\u0ACB\u0AA1 \u0AA5\u0A88',
    ocrExtracted: 'OCR \u0A9F\u0AC7\u0A95\u0ACD\u0AB8\u0ACD\u0A9F \u0A95\u0ABE\u0AA2\u0AB5\u0ABE\u0AAE\u0ABE\u0A82 \u0A86\u0AB5\u0ACD\u0AAF\u0ACB',
    medicineIdentified: 'AI \u0AA6\u0ACD\u0AB5\u0ABE\u0AB0\u0ABE \u0AA6\u0AB5\u0ABE \u0A93\u0AB3\u0A96\u0ABE\u0A88',
    crossReferencing: '\u0A95\u0ACD\u0AB2\u0ABF\u0AA8\u0ABF\u0A95\u0AB2 \u0AA1\u0AC7\u0A9F\u0ABE \u0A95\u0ACD\u0AB0\u0ACB\u0AB8-\u0AB0\u0AC7\u0AAB\u0AB0\u0AC7\u0AA8\u0ACD\u0AB8 \u0AA5\u0A88 \u0AB0\u0AB9\u0ACD\u0AAF\u0AC1\u0A82 \u0A9B\u0AC7',
    preparingSummary: '\u0AB8\u0AC1\u0AB0\u0A95\u0ACD\u0AB7\u0ABE \u0AB8\u0ABE\u0AB0\u0ABE\u0A82\u0AB6 \u0AA4\u0AC8\u0AAF\u0ABE\u0AB0 \u0AA5\u0A88 \u0AB0\u0AB9\u0ACD\u0AAF\u0ACB \u0A9B\u0AC7',
  }
};

const PRESET_MEDICINES = [
  {
    id: 'amoxicillin', name: 'Amoxicillin 500mg', category: 'Antibiotic',
    labelText: 'AMOXICILLIN 500mg CAPSULES - GSK Pharma. Take 1 capsule every 8 hours.'
  },
  {
    id: 'metformin', name: 'Metformin 850mg', category: 'Diabetes',
    labelText: 'METFORMIN HYDROCHLORIDE 850mg. Take 1 tablet twice daily with meals.'
  }
];

const generatePresetImageFile = (preset) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0B0D1C'; ctx.fillRect(0, 0, 600, 400);
    ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, 560, 360);
    ctx.fillStyle = '#8B5CF6'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(preset.name, 40, 60);
    ctx.fillStyle = '#A8AEC7'; ctx.font = '16px monospace'; ctx.fillText(preset.labelText, 40, 100);
    canvas.toBlob((blob) => {
      resolve({ file: new File([blob], `${preset.id}.jpg`, { type: 'image/jpeg' }), dataUrl: canvas.toDataURL('image/jpeg') });
    }, 'image/jpeg', 0.95);
  });
};

const LoadingChecklist = ({ progress }) => {
  const steps = [
    { label: 'Image uploaded securely', threshold: 15 },
    { label: 'OCR text extracted', threshold: 40 },
    { label: 'Medicine identified via AI', threshold: 65 },
    { label: 'Cross-referencing clinical data', threshold: 85 },
    { label: 'Preparing safety summary', threshold: 95 }
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(11, 13, 28, 0.9)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20
    }}>
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Analyzing Medicine</h3>
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

    // 2. Fetch full AI translation if possible
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
    }, 800);

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

        // Store to local medicine searches cache so Medical History immediately displays it
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
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '6px' }}>{r.medicineName}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>{nT.generic || 'Generic'}:</strong> {r.genericName || 'N/A'}</p>
              {r.manufacturer && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}><strong>{nT.maker || 'Maker'}:</strong> {r.manufacturer}</p>}
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
              { id: 'overview', label: nT.overview || 'Overview' }, 
              { id: 'dosage', label: nT.dosage || 'Dosage' }, 
              { id: 'warnings', label: nT.warnings || 'Warnings' }, 
              { id: 'sideeffects', label: nT.sideEffects || 'Side Effects' }
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
              {r.overview?.primaryUse && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.primaryUse || 'Primary Use'}</h4><p>{r.overview.primaryUse}</p></div>}
              {r.overview?.drugClass && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.drugClass || 'Drug Class'}</h4><p>{r.overview.drugClass}</p></div>}
              {r.activeIngredient && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.activeIngredient || 'Active Ingredient'}</h4><p>{r.activeIngredient}</p></div>}
              {r.ageSpecificInfo && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.ageSpecificInfo || 'Age-Specific Info'}</h4><p>{r.ageSpecificInfo}</p></div>}
              {r.storage && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={14} /> {nT.storage || 'Storage'}</h4><p>{r.storage}</p></div>}
              {r.interactions && r.interactions.length > 0 && (
                <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>{nT.drugInteractions || 'Drug Interactions'}</h4>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{r.interactions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          {nameTab === 'dosage' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.dosageAndUsage?.standardDose && (<div className="alert alert-primary" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={15} /> {nT.standardDose || 'Standard Dose'}</strong><p>{r.dosageAndUsage.standardDose}</p></div>)}
              {r.dosageAndUsage?.frequency && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.frequency || 'Frequency'}</h4><p>{r.dosageAndUsage.frequency}</p></div>}
              {r.dosageAndUsage?.duration && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.duration || 'Duration'}</h4><p>{r.dosageAndUsage.duration}</p></div>}
              {r.dosageAndUsage?.howToTake && <div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{nT.howToTake || 'How to Take'}</h4><p>{r.dosageAndUsage.howToTake}</p></div>}
            </div>
          )}
          {nameTab === 'warnings' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.warnings && r.warnings.length > 0 && (<div className="alert alert-danger" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={15} /> {nT.warnings || 'Warnings'}</strong><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>{r.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>)}
              {r.precautions && r.precautions.length > 0 && (<div><h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>{nT.precautions || 'Precautions'}</h4><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{r.precautions.map((p, i) => <li key={i}>{p}</li>)}</ul></div>)}
            </div>
          )}
          {nameTab === 'sideeffects' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {r.sideEffects?.common && r.sideEffects.common.length > 0 && (<div className="alert alert-warning" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertOctagon size={15} /> {nT.commonSideEffects || 'Common Side Effects'}</strong><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>{r.sideEffects.common.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
              {r.sideEffects?.serious && r.sideEffects.serious.length > 0 && (<div className="alert alert-danger" style={{ padding: '16px' }}><strong className="alert-title" style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={15} /> {nT.seriousSideEffects || 'Serious Side Effects'}</strong><ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>{r.sideEffects.serious.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
            </div>
          )}
        </div>
        <div style={{ marginTop: '24px' }}><MedicalDisclaimer lang={outputLanguage} /></div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-primary"><Sparkles size={12} style={{marginRight:'4px'}}/> {sT.clinicalOcrEngine || 'Clinical OCR Engine'}</span>
        </div>
        <h1 className="page-title">{t('scannerTitle') || 'Medicine Scanner'}</h1>
        <p className="body-text" style={{ marginTop: '8px', maxWidth: '800px', fontSize: '16px' }}>
          Upload pill bottles, packaging, or prescription labels. Our system extracts textual data and generates structured clinical dosages, active ingredients, warnings, and safety information.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => { setScanMode('image'); setNameResult(null); setNameError(''); }} className={`btn ${scanMode === 'image' ? 'btn-primary' : 'btn-secondary'}`}>
          <Upload size={16} /> {sT.scanImage || 'Scan Image'}
        </button>
        <button onClick={() => { setScanMode('name'); setResult(null); setError(''); }} className={`btn ${scanMode === 'name' ? 'btn-primary' : 'btn-secondary'}`}>
          <Search size={16} /> {sT.manualSearch || 'Manual Search'}
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
                  <h2 className="card-heading">{sT.imageSource || 'Image Source'}</h2>
                </div>
                {imagePreview && (
                  <button onClick={resetScanner} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12px', borderRadius: '8px' }}>
                    {sT.reset || 'Reset'}
                  </button>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>{sT.translateResultTo || 'Translate Result To:'}</span>
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
                            <Sparkles size={18} /> {sT.analyzeMedicine || 'Analyze Medicine'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div onClick={() => fileInputRef.current.click()} style={{ textAlign: 'center', padding: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <Upload size={32} style={{ color: 'var(--primary)' }} />
                      </div>
                      <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>{sT.uploadMedicineLabel || 'Upload Medicine Label'}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '240px', lineHeight: 1.5 }}>
                        Drag and drop an image, click to browse, or use your camera.
                      </p>
                    </div>
                  )}
                  {loading && <LoadingChecklist progress={scanProgress} lang={scanLanguage} />}
                </div>

                {!imagePreview && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary" style={{ flex: 1, padding: '14px' }}>
                      <Upload size={18} /> {sT.browseFiles || 'Browse Files'}
                    </button>
                    <button onClick={startCamera} className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>
                      <Camera size={18} /> {sT.openCamera || 'Open Camera'}
                    </button>
                  </div>
                )}
                
                {!imagePreview && (
                  <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                    <p className="caption" style={{ marginBottom: '12px', fontWeight: '600' }}>DEMO PRESETS</p>
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
                  {result && <span className="badge badge-success"><CheckCircle2 size={14} style={{marginRight:'6px'}}/> {sT.verified}</span>}
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
                  <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                        <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '8px' }}>{result.medicineName}</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><strong>{sT.generic}:</strong> {result.genericName || result.activeIngredients || 'N/A'}</p>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span className="badge badge-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>{result.category}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>{result.dosageForm}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary Tabs */}
                  <div style={{ marginBottom: '24px' }}>
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
                          <p>{result.purposeAndUses || result.usageInstructions}</p>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={16} /> {sT.manufacturer}</h4>
                            <p>{result.manufacturer || 'N/A'}</p>
                          </div>
                          {result.storage && (
                            <div>
                              <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.storage}</h4>
                              <p>{result.storage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === 'dosage' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="alert alert-primary" style={{ padding: '20px' }}>
                          <strong className="alert-title" style={{ fontSize: '16px', marginBottom: '8px' }}><Clock size={18} /> {sT.prescribedDosage}</strong>
                          <p style={{ fontSize: '15px' }}>{Array.isArray(result.dosage) ? result.dosage.join(' ') : result.dosage}</p>
                        </div>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.usageInstructions}</h4>
                          <p>{Array.isArray(result.usageInstructions) ? result.usageInstructions.join(' ') : result.usageInstructions}</p>
                        </div>
                        {result.missedDose && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.missedDose}</h4>
                            <p>{Array.isArray(result.missedDose) ? result.missedDose.join(' ') : result.missedDose}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'warnings' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="alert alert-danger" style={{ padding: '20px' }}>
                          <strong className="alert-title" style={{ fontSize: '16px', marginBottom: '8px' }}><ShieldAlert size={18} /> {sT.criticalWarnings}</strong>
                          <p style={{ fontSize: '15px' }}>{Array.isArray(result.warnings) ? result.warnings.join(' ') : result.warnings}</p>
                        </div>
                        {result.precautions && (
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>{sT.generalPrecautions}</h4>
                            <p>{Array.isArray(result.precautions) ? result.precautions.join(' ') : result.precautions}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'sideeffects' && (
                      <div className="fade-in">
                        <div className="alert alert-warning" style={{ padding: '20px' }}>
                          <strong className="alert-title" style={{ fontSize: '16px', marginBottom: '8px' }}><AlertOctagon size={18} /> {sT.knownSideEffects}</strong>
                          <p style={{ fontSize: '15px' }}>{Array.isArray(result.sideEffects) ? result.sideEffects.join(', ') : (typeof result.sideEffects === 'object' && result.sideEffects !== null ? (result.sideEffects.common ? (Array.isArray(result.sideEffects.common) ? result.sideEffects.common.join(', ') : result.sideEffects.common) : JSON.stringify(result.sideEffects)) : result.sideEffects)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '32px' }}>
                    <MedicalDisclaimer lang={scanLanguage} />
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
                  <h2 className="card-heading">{nT.medicineNameSearch || 'Medicine Name Search'}</h2>
                </div>
                {nameResult && (
                  <button onClick={resetNameSearch} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12px', borderRadius: '8px' }}>{nT.reset || 'Reset'}</button>
                )}
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className="body-text" style={{ fontSize: '14px' }}>{nT.medicineNameSearchDesc || 'Type the name of any medicine or drug to get detailed clinical information — dosage, warnings, side effects, and interactions.'}</p>
                <form onSubmit={handleNameSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input type="text" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="e.g. Paracetamol, Amoxicillin, Metformin..." className="input" style={{ paddingLeft: '44px', fontSize: '15px', width: '100%', height: '48px', borderRadius: '8px' }} disabled={nameLoading} />
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
                    {nameLoading ? <><Loader2 size={18} className="spin" /> {nT.searching || 'Searching...'}</> : <><Sparkles size={18} /> {nT.searchMedicine || 'Search Medicine'}</>}
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
                    <p className="caption" style={{ marginBottom: '12px', fontWeight: '600' }}>QUICK SUGGESTIONS</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['Paracetamol', 'Amoxicillin', 'Metformin', 'Ibuprofen', 'Aspirin', 'Omeprazole'].map(name => (
                        <button key={name} type="button" onClick={() => setNameQuery(name)} className="badge badge-normal" style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '12px', borderRadius: '8px' }}>{name}</button>
                      ))}
                    </div>
                  </div>
                )}
                {nameLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'rgba(6, 182, 212, 0.03)', borderRadius: '16px', padding: '40px', border: '2px dashed rgba(6, 182, 212, 0.15)' }}>
                    <Loader2 size={44} className="spin" style={{ color: 'var(--info)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{nT.analyzingMedicineData || 'Analyzing Medicine Data'}</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{nT.analyzingMedicineDataDesc || 'AI is retrieving clinical information...'}</p>
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
                  <h2 className="card-heading">{nT.searchResults || 'Search Results'}</h2>
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
                  {nameResult && <span className="badge badge-success"><CheckCircle2 size={14} style={{ marginRight: '6px' }} /> {nT.found || 'Found'}</span>}
                </div>
              </div>
              {!nameResult ? (
                <div className="empty-state" style={{ flex: 1, margin: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Pill size={40} className="empty-state-icon" style={{ margin: 0 }} />
                  </div>
                  <h4 className="empty-state-title" style={{ fontSize: '18px' }}>{nT.awaitingSearch || 'Awaiting Search'}</h4>
                  <p className="empty-state-text" style={{ fontSize: '15px', lineHeight: 1.6 }}>{nT.awaitingSearchDesc || 'Enter a medicine name on the left and click Search to view detailed clinical information here.'}</p>
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
             <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{sT.captureLabel || 'Capture Label'}</h3>
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
              <button onClick={stopCameraStream} className="btn" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', borderRadius: '50px' }}>{sT.cancel || 'Cancel'}</button>
              {!cameraError && (
                <button onClick={captureCameraFrame} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '50px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Camera size={20} /> {sT.captureFrame || 'Capture Frame'}
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
