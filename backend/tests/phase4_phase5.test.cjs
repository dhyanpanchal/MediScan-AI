const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

test('Q16: LoadingChecklist uses CSS theme variables for proper contrast in light and dark mode', () => {
  const reportPageSrc = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/ReportPage.jsx'), 'utf8');
  const scannerPageSrc = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/ScannerPage.jsx'), 'utf8');

  // Verify ReportPage LoadingChecklist uses var(--bg-card)
  assert.ok(reportPageSrc.includes("background: 'var(--bg-card)'"), 'ReportPage LoadingChecklist must use var(--bg-card)');
  assert.ok(!reportPageSrc.includes("background: 'rgba(11, 13, 28, 0.9)'"), 'ReportPage LoadingChecklist must not use hardcoded dark rgba');

  // Verify ScannerPage LoadingChecklist uses var(--bg-card)
  assert.ok(scannerPageSrc.includes("background: 'var(--bg-card)'"), 'ScannerPage LoadingChecklist must use var(--bg-card)');
  assert.ok(!scannerPageSrc.includes("background: 'rgba(11, 13, 28, 0.92)'"), 'ScannerPage LoadingChecklist must not use hardcoded dark rgba');
});

test('Q20: Icon-only controls and selects have accessible aria-labels and proper attributes', () => {
  const historyPageSrc = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/HistoryPage.jsx'), 'utf8');
  const scannerPageSrc = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/ScannerPage.jsx'), 'utf8');

  // History delete button
  assert.ok(historyPageSrc.includes('aria-label="Delete history item"'), 'History delete button must have aria-label');
  // History close drawer button
  assert.ok(historyPageSrc.includes('aria-label="Close details drawer"'), 'History drawer close button must have aria-label');
  // History language select
  assert.ok(historyPageSrc.includes('aria-label="Select report display language"'), 'History modal language select must have aria-label');
  // Scanner camera close button
  assert.ok(scannerPageSrc.includes('aria-label="Close camera capture"'), 'Scanner camera close button must have aria-label');
});

test('Q21: Code splitting with React.lazy and Suspense configured in App.jsx', () => {
  const appSrc = fs.readFileSync(path.join(repoRoot, 'frontend/src/App.jsx'), 'utf8');

  assert.ok(appSrc.includes('lazy('), 'App.jsx must use lazy() for route code splitting');
  assert.ok(appSrc.includes('<Suspense'), 'App.jsx must wrap routes in Suspense');
  assert.ok(appSrc.includes("const ScannerPage = lazy(() => import('./pages/ScannerPage'))"), 'ScannerPage must be lazy loaded');
  assert.ok(appSrc.includes("const ReportPage = lazy(() => import('./pages/ReportPage'))"), 'ReportPage must be lazy loaded');
  assert.ok(appSrc.includes("const AdminPage = lazy(() => import('./pages/AdminPage'))"), 'AdminPage must be lazy loaded');
});

test('Theme & Contrast: index.css and Layout.jsx provide high contrast across light and dark themes', () => {
  const indexCss = fs.readFileSync(path.join(repoRoot, 'frontend/src/index.css'), 'utf8');
  const layoutSrc = fs.readFileSync(path.join(repoRoot, 'frontend/src/components/Layout.jsx'), 'utf8');

  // Autofill light theme override
  assert.ok(indexCss.includes('[data-theme="light"] input:-webkit-autofill'), 'index.css must provide light theme autofill overrides');
  assert.ok(indexCss.includes('#F1F5F9'), 'index.css light theme autofill must use #F1F5F9 background');

  // Layout active nav item high-contrast color
  assert.ok(layoutSrc.includes('#6D28D9'), 'Layout.jsx light theme active item must use high-contrast #6D28D9');
  assert.ok(layoutSrc.includes('background: none !important'), 'Layout.jsx active label span must not have background gradient');
});
