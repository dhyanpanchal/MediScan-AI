# MediScan AI — Read-only audit

Date: 15 November 2026. Audited the current working tree, including pre-existing uncommitted changes. Only this requested report was created; no fixes were applied.

## A. Project summary

### Stack, structure, and entry points

- npm workspace monorepo: `package.json:5`. React 19, React DOM 19, React Router 6, Lucide icons; Vite 8, React Vite plugin, Oxlint: `frontend/package.json:6`. Versions here are manifest ranges, not claims about latest releases.
- Backend: Node.js/CommonJS, Express 4, Mongoose/MongoDB, JWT, bcrypt, Multer, Nodemailer, Tesseract.js, Sharp, pdf-parse, Google GenAI: `backend/package.json:5`. The SQLite comment in `backend/src/app.js:10` is stale; the implementation uses MongoDB (`backend/src/config/db.js:1`).
- `frontend/index.html:26` → `frontend/src/main.jsx:1` → `frontend/src/App.jsx:21`. App provides authentication/application contexts, routing, and protected layouts. All eleven page modules are eagerly imported (`frontend/src/App.jsx:9`).
- `frontend/src/pages/`: landing, login, register, password recovery, dashboard, scanner, report, history, disease search, settings, admin. `components/`: shared layout, route guard, disclaimer, insights. `context/`: auth, language/theme/font preferences. `services/`: API wrapper and clinical translations. `index.css` and `responsive.css` are imported by `main.jsx`; `assets/` and `public/` contain images/icons.
- `backend/src/server.js:2` loads `app.js`; `app.js:33` mounts `/api/auth`, `/api/scan`, `/api/report`, `/api/user`, `/api/admin`, `/api/disease`. `routes/` → middleware → controllers → models/utilities. `utils/` contains OCR/PDF extraction, LLM analysis, medicine extraction/verification, translation, and email. `data/` contains disease data.
- Serverless entry points: `api/index.js:1`, `backend/api/index.js:1`; deployment configuration: root/backend `vercel.json`. Root build copies frontend output to root `dist` (`package.json:11`).
- `scripts/`, `.agents/`, `.agent/`, `.gsd/`, `adapters/`, and project-rule documents are development/workflow material, not automatically disposable application dead code.

### How to run (instructions only; not executed)

1. Install a Node version compatible with the declared packages; this audit used Node **v24.13.0**. Run `npm install` in the root.
2. Configure `backend/.env` using `backend/.env.example:1`: MongoDB URI, a strong JWT secret, SMTP settings, Gemini key/model, and optional Google OAuth configuration. MongoDB defaults to local port 27017 (`backend/src/config/db.js:24`). The current OAuth implementation is unsafe regardless of configuration; see Q01.
3. Use two terminals: in `backend`, run `node src/server.js`; in root, run `npm run dev:frontend`. Frontend is `http://localhost:5000`; `/api` proxies to backend port 5001 (`frontend/vite.config.js:8`). **Current backend startup forcibly kills processes on its port; fix Q11 before using this workflow on a shared machine.**
4. Production frontend build: `npm run build` in root; it creates output directories. For this read-only audit, that writing command was intentionally not run.
5. `npm run lint --workspace=frontend` performs linting. There is no test script in the three package manifests. `backend/test_medicine_scanner.js` exists, but was not run because this audit avoided uncontrolled network/database/file side effects.

### Evidence and limits

- **PASS:** 35 backend/API JavaScript files passed `node --check`.
- **PASS:** Vite programmatic build using the installed React plugin, `configFile:false`, `build.write:false`, and `emptyOutDir:false`; all emitted output remained in memory. JS: **703,322 bytes**, CSS: **29,284 bytes**, HTML: **1,296 bytes**. This checks application bundling/imports, not the exact configured deployment pipeline.
- **FAIL:** `npm run lint --workspace=frontend`, exit 1: invalid Unicode escape/syntax in `frontend/update-i18n.js:248`; unused imports/functions, duplicate translation keys, and hook dependency warnings also reported. Warnings alone are not counted as demonstrated runtime bugs.
- Whole-project reference searches excluded dependencies/Git internals and checked code, config, and documentation. Dictionary evaluation found no keys missing from Hindi/Gujarati relative to English, but found a consumed key absent from **all three** dictionaries (Q14).
- Isolated, in-memory evaluations reproduced: substring admin authorization (Q02); mock report replacing supplied values (Q03); invented unknown medicine details (Q04); incorrect status badges (Q15). No real accounts, medical records, emails, or live API calls were used.
- Tracked-file inspection found only `backend/.env.example` matching `*env*`. A tracked-text pattern scan found no Google API-key, private-key header, or credential-bearing MongoDB-URI matches. This is **not** a Git-history or comprehensive secret scan.
- **UNVERIFIED:** actual browser console/network behavior, live MongoDB/SMTP/Gemini/OAuth availability, deployment success, screenshots, mobile/tablet/desktop overlap or clipping, camera hardware behavior, and printed/exported page quality. No live backend was started because startup kills processes, uploads can create files, and some reads can update records. No dependency vulnerability claims are made.
- Responsive breakpoints and scrollable tables exist (`frontend/src/responsive.css:269`); a `min-width` table alone is not classified as a layout bug. Theme/font/language preferences are stored (`frontend/src/context/AppContext.jsx:508`); pre-paint theme restoration exists (`frontend/index.html:13`). No verified persistence or wrong-theme-flash bug is claimed. English/Hindi/Gujarati are LTR; RTL support is not currently advertised.
- Typography uses a shared font stack (`frontend/src/index.css:47`) but many fixed pixel sizes (`frontend/src/index.css:48`, `frontend/src/pages/SettingsPage.jsx:195`). Font settings also apply page zoom (`frontend/src/context/AppContext.jsx:577`), so fixed pixels do not prove a broken font toggle. Readability/reflow at enlarged sizes remains UNVERIFIED.

## B. Unused/removable files

“Yes” means safe for the currently referenced app, subject to preserving anything wanted for future work. No files were deleted. Binary assets have no meaningful source line number.

| Path | Reason | Safe to delete? Yes/No/Check |
|---|---|---|
| `frontend/src/App.css:1` | No filename reference/import anywhere searched; actual CSS entry points are `main.jsx:3–4`. | Yes |
| `frontend/src/assets/hero.png` | No filename reference; 13,057 bytes, not a large-image performance problem. | Yes |
| `frontend/src/assets/react.svg:1` | No filename reference. | Yes |
| `frontend/src/assets/vite.svg:1` | No filename reference. | Yes |
| `frontend/public/icons.svg:1` | No internal reference; public assets can still be consumed by external URLs. | Check |
| `backend/src/fixScanner.js:1` | No reference or package-script invocation found. | Check |
| `frontend/refactor.js:1` | No reference/script invocation; standalone maintenance script may be intentional. | Check |
| `frontend/update-i18n.js:1` | No invocation reference; broken maintenance script is nevertheless parsed by lint. See Q12. | Check |
| `frontend/src/services/api.js:703` — `translateClientMedicine` only | Definition is its only reference; active calls use imported `translateMedicinePayload`. Do not delete `api.js`. | Yes, function only |
| `backend/src/utils/llm.js:712` — `generateMockMedicineAnalysis` only | Definition is its only reference. Do not delete `llm.js`. | Yes, function only |
| `frontend/src/components/HighlightedInsights.jsx:1` | Imported by `HistoryPage.jsx:4` but unused there according to lint. Remove that import before deleting the component. | Check |
| Unused imports/local bindings in live pages | Lint identifies examples at `SettingsPage.jsx:4`, `DiseasePage.jsx:6,48`, `ReportPage.jsx:5–7`, `AdminPage.jsx:400,427,542`. Remove bindings, not whole pages. | Yes, bindings only |
| Runtime packages / lockfiles / deployment entry points / workflow files | No package is proven wholly unused across runtime, tooling, deployment, and optional platform roles. Duplicate declarations alone do not prove safe removal. | No, without further review |

## C. Bugs and errors

All locations below are relative to project root **`D:/Medisacn-Ai FINAL/`** and refer to the audited contents. Each row is verified from code; where applicable, isolated execution supplements the evidence. Critical denotes authentication/authorization bypass or fabricated clinical output on a normal failure path.

| ID | Severity | Category | File: Line | Problem | Root cause |
|---|---|---|---|---|---|
| Q01 | Critical | Authentication | `backend/src/controllers/authController.js:371,378,404`; `backend/src/routes/authRoutes.js:21` | Public Google login can issue a JWT for an existing supplied email without proof of identity. | Client email/token trusted; no provider signature, audience, issuer, or expiry verification. |
| Q02 | Critical | Authorization | `backend/src/middleware/adminMiddleware.js:4` | An address such as `panchaldhyan007.attacker@example.com` passes admin authorization; isolated evaluation returned true. | Substring matching grants administrator privileges. |
| Q03 | Critical | Report integrity | `backend/src/utils/llm.js:701,1049,1065,1084`; `backend/src/controllers/reportController.js:64` | Failed/unconfigured AI produces and saves invented report data. Input Hb 14.0/cholesterol 150 produced Hb 10.5/cholesterol 240 plus fabricated patient/provider details. | Mock report generation is the production fallback without a distinct demo contract. |
| Q04 | Critical | Medicine integrity | `frontend/src/services/api.js:369,376,964`; `frontend/src/pages/ScannerPage.jsx:485` | Failed medicine lookup returns successful invented details, including `Not-a-real-drug 400mg` and a purported verified manufacturer. | All request failures fall through to generic clinical fabrication; UI uses `res.data` without surfacing `isFallback`. |
| Q05 | High | Upload security | `backend/src/middleware/uploadMiddleware.js:21,27`; `backend/src/app.js:27` | Authenticated clients can upload arbitrary HTML/SVG content; original extension is preserved and content is publicly served on the application origin. This enables a stored active-content attack surface. | File filter accepts everything; no content-signature validation or safe attachment handling. Exploit was not sent to a live server. |
| Q06 | High | Medical-file privacy | `backend/src/app.js:25–29`; `backend/src/controllers/reportController.js:19` | Anyone who obtains an upload URL can retrieve the medical document without authentication or ownership checks. | Static upload routes precede protected API routes; filenames are not access control. |
| Q07 | High | Cross-account privacy | `frontend/src/pages/ScannerPage.jsx:503`; `frontend/src/services/api.js:278`; `frontend/src/context/AuthContext.jsx:121` | Account B in the same browser can inherit account A's medicine-search cache. | One global storage key is merged into each account's history; logout removes only the token. |
| Q08 | High | Confidence integrity | `backend/src/controllers/scanController.js:25,69–70`; `backend/src/controllers/reportController.js:90–93`; `backend/src/utils/llm.js:520–521` | Missing verification becomes “Verified”; missing or zero confidence becomes 90/95 (or OCR-derived confidence). | Positive defaults and truthy `||` replace unknown/zero evidence with high-confidence claims. |
| Q09 | High | Data deletion | `backend/src/controllers/userController.js:319,342,364–366` | Deleting a scan/report/history leaves its uploaded document on disk and accessible through the static upload URL. | Only MongoDB records are removed; no corresponding storage deletion exists. |
| Q10 | Medium | Deployment/storage | `backend/src/middleware/uploadMiddleware.js:8`; `backend/src/app.js:25–29` | Vercel uploads go to the OS temp directory, but GET `/uploads` reads repository directories. Custom `UPLOADS_DIR` is also ignored by serving. | Writer and reader calculate different storage locations; temp files are also unsuitable for durable history. |
| Q11 | Medium | Startup/process safety | `package.json:12`; `backend/package.json:7–10`; `backend/clear-ports.js:6`; `backend/src/server.js:34` | Development launch can terminate unrelated services on ports 5000/5001 and launch frontend twice. On Windows the root `&` is a command separator, not concurrent startup. | Root/backend scripts both own frontend startup; unconditional port killing and platform-dependent shell syntax. |
| Q12 | Medium | Tooling syntax | `frontend/update-i18n.js:248,252,256` | Repository frontend lint fails with syntax errors. | Escaped backticks occur outside a valid string/template expression. |
| Q13 | Medium | Translation/toggle | `frontend/src/pages/ReportPage.jsx:81,104,157` | Report language selector translates selected headings only; report content stays unchanged and global language preference is ignored. | Local state defaults to English; handler only calls `setSelectedLanguage`; neither analysis nor selector invokes translation. |
| Q14 | Medium | i18n completeness | `frontend/src/pages/DashboardPage.jsx:317`; `frontend/src/pages/SettingsPage.jsx:195,251`; `frontend/src/context/AppContext.jsx:499` | “Text Searches” always falls back to English; settings explanatory/save text stays English in Hindi/Gujarati. | `totalMedicineSearches` absent from all dictionaries, plus hardcoded JSX strings. |
| Q15 | High | Result severity display | `frontend/src/pages/ReportPage.jsx:131–136` | `Abnormal` receives success, `Critical Low` info, `Critical High` warning. All three were reproduced in memory. | Broad substring checks precede critical severity and match “normal” inside “abnormal”. |
| Q16 | Medium | Light theme/contrast | `frontend/src/pages/ReportPage.jsx:50,54`; `frontend/src/context/AppContext.jsx:542` | Loading heading uses dark light-theme text on a fixed dark overlay. Computed opaque-card color contrast is approximately **1.18:1**. | Theme-dependent foreground paired with a theme-independent dark background; fails the 4.5:1 normal-text threshold. Screenshot not captured. |
| Q17 | Medium | Upload UX/errors | `frontend/src/pages/ScannerPage.jsx:358`; `frontend/src/pages/ReportPage.jsx:85`; `backend/src/middleware/uploadMiddleware.js:35`; `backend/src/app.js:64` | UI reads arbitrary-size files before rejection; oversized uploads surface as generic HTTP 500 rather than a useful 413. | No client size/type validation; generic handler uses `err.status || 500`, while Multer limit errors carry a code. |
| Q18 | High | Sensitive logging | `backend/src/controllers/reportController.js:46–60` | Full extracted report and analyzed patient data are written to application logs. | Unconditional raw-text/JSON diagnostic logging in normal request path. |
| Q19 | Medium | History clearing | `backend/src/controllers/userController.js:356,364–366` | “Clear all” leaves disease history in the database despite the handler's stated scope. | Deletes scans, reports, and medicine searches, but omits `DiseaseHistory.deleteMany`. |
| Q20 | Medium | Accessibility | `frontend/src/pages/HistoryPage.jsx:288–289`; `frontend/src/pages/ReportPage.jsx:156–157` | History delete icon has no accessible name; report-language select has no associated label. | Decorative SVG alone inside button; adjacent span is not a label. |
| Q21 | Low | Performance | `frontend/src/App.jsx:9–19` | Initial route bundle includes every page, including admin/scanner/translation code; in-memory JS output is 703,322 bytes uncompressed. | Eager route imports; no route-level lazy boundaries. Actual network/render latency unmeasured. |
| Q22 | Low | Language accessibility | `frontend/index.html:2`; `frontend/src/context/AppContext.jsx:508–510` | Document language stays English after choosing Hindi/Gujarati, affecting assistive pronunciation. | Language effect persists storage but never updates `document.documentElement.lang`. |
| Q23 | Medium | History integrity | `frontend/src/services/api.js:100,275–276` | First history load creates preset searches that the user never performed. | Production storage is seeded with `DEFAULT_INITIAL_SEARCHES`. |
| Q24 | Medium | Loading/error handling | `frontend/src/services/api.js:37`; `frontend/src/pages/ReportPage.jsx:107,121` | An indefinitely pending request leaves report loading/progress active indefinitely; retry cannot start until fetch rejects. | Fetch has no abort deadline; interval stops only after settlement. This is a verified missing termination path, not a measured live outage. |

## D. Exact fix steps (proposals only)

Snippets are short replacement patterns, not applied patches. Any introduced helper must be implemented as described; examples must not be pasted with undefined helpers.

### Q01 — Verify provider identity before looking up an account

In `backend/src/controllers/authController.js:371`, accept a Google ID-token credential and verify it server-side with a maintained Google token-verification library (declare that dependency in `backend/package.json`). Require configured audience, valid signature/issuer/expiry, and verified email; derive `email`, `name`, and provider ID from verified claims only. Reject absent/invalid credentials with 401 and never auto-link using unverified request fields.

```js
// Before
const userEmail = email || 'google.user@gmail.com';
const oauthId = oauthToken || 'google_mock_id_998877';
// After (OAuth2Client imported and initialized with configured client ID)
const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
const claims = ticket.getPayload();
if (!claims?.email_verified) return res.status(401).json({ success: false });
const userEmail = claims.email;
const oauthId = claims.sub;
```

Update Google credential submission in the frontend auth flow to match the new contract. Verification errors must return 401, not the existing generic success path.

### Q02 — Use explicit administrative authorization

Replace substring authorization in `backend/src/middleware/adminMiddleware.js:4`. Immediate containment is a server-controlled exact-address allowlist, after Q01 is fixed; preferably use a database role provisioned outside public registration. Keep frontend admin visibility consistent, but treat the server as authoritative.

```js
// Before
if (email.includes('premkardani2006') || email.includes('panchaldhyan007')) return next();
// After: load normalized exact addresses from trusted server configuration
const admins = new Set((process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
if (admins.has(email)) return next();
```

### Q03 — Fail closed instead of returning mock clinical reports

In `backend/src/utils/llm.js:701`, remove mock fallback from real requests; in `reportController.js:54`, map unavailable analysis to 503 and do not save a record. If retaining demonstrations, expose them as explicit sample data outside real upload/history flows.

```js
// Before
if (!result) result = generateMockReportAnalysis(rawReportText);
// After
if (!result) throw Object.assign(new Error('Report analysis unavailable; no result generated.'), { status: 503 });
```

The controller must preserve this status in its catch. Do not replace missing patient fields or laboratory values with sample identities/results.

### Q04 — Remove invented medicine fallback

In `frontend/src/services/api.js:369–384`, propagate lookup errors; do not call `generateClientFallbackMedicine`. Return “not found/unavailable” for unknown names. If an offline reference remains, give it explicit provenance and an offline UI state in `ScannerPage.jsx`, without inferred strength/manufacturer or user-specific dosage.

```js
// Before
let data = matched ? matched.data : generateClientFallbackMedicine(q, language, ageGroup);
return { success: true, data, isFallback: true };
// After: inside the request catch
throw new Error('Medicine lookup unavailable. No verified result was generated.');
```

### Q05 — Restrict and inspect uploaded content

In `backend/src/middleware/uploadMiddleware.js:27`, allow route-specific JPEG/PNG/WebP for scan and those formats plus PDF for reports. MIME filtering is only the first check: validate magic bytes/decode images and PDFs before analysis, remove invalid temporary files, reject HTML/SVG, and derive stored extension from the detected format. Use attachment responses or isolated storage origins for originals.

```js
// Before
cb(null, true);
// After: allowedTypes supplied by a route-specific upload factory
if (!allowedTypes.has(file.mimetype)) return cb(Object.assign(new Error('Unsupported file type'), { status: 415 }));
cb(null, true); // still perform content-signature validation after upload
```

### Q06 — Authorize file downloads

Remove public static upload mounting in `backend/src/app.js:27–29`. Add authenticated record-based download routes, loading the record by ID **and** `req.user.id`, then resolving its storage object internally. Change frontend image/document access to authenticated fetch-to-blob, or short-lived signed URLs issued only after authorization; ordinary `<img>` tags do not send the existing bearer header.

```js
// Before
app.use('/uploads', express.static(primaryUploads, { setHeaders: setUploadHeaders }));
// After: implement handler to check ownership and stream the authorized object
app.get('/api/files/:recordId', protect, downloadOwnedRecord);
```

Do not turn an arbitrary path parameter into a filesystem path.

### Q07 — Isolate browser cache by account

In `ScannerPage.jsx:503` and all `api.js` cache read/write/delete paths, use the authenticated stable user ID in the key (or eliminate local medical-history caching). Delete the legacy shared key and clear account data on logout in `AuthContext.jsx:121`.

```js
// Before
localStorage.getItem('mediscan_text_searches');
// After: userId obtained from the authenticated account
localStorage.getItem(`mediscan_text_searches:${userId}`);
// Logout/migration
localStorage.removeItem('mediscan_text_searches');
```

### Q08 — Preserve unknown/zero confidence

Change the defaults in `scanController.js:25,69–70`, `reportController.js:90–93`, and `llm.js:520–521`. Represent absent confidence as null, validate range/type, and default verification to unverified. Update model defaults and result UI as needed to render “Unknown”; do not conflate OCR confidence with clinical verification.

```js
// Before
verificationStatus: analysisResult.verificationStatus || 'Verified',
reportConfidence: analysisResult.reportConfidence || 95,
// After
verificationStatus: analysisResult.verificationStatus || 'Unverified',
reportConfidence: analysisResult.reportConfidence ?? null,
```

### Q09 — Delete stored objects with their history

In `userController.js:314–369`, retrieve owned records first, delete their stored objects, then delete records; use a retryable cleanup strategy for partial failures. Implement `removeOwnedUpload` using the same storage abstraction as Q10, validate ownership and resolved path/object key, and treat already-absent objects idempotently. Apply this to both individual and bulk deletion.

```js
// Before
await ReportHistory.findOneAndDelete({ _id: id, userId });
// After: helper must validate the stored object's ownership/path
const report = await ReportHistory.findOne({ _id: id, userId });
if (!report) return res.sendStatus(404);
await removeOwnedUpload(report.fileUrl);
await report.deleteOne();
```

### Q10 — Share storage configuration and use durable serverless storage

Replace independent upload-directory calculations in `uploadMiddleware.js:8` and `app.js:25`. Centralize local path resolution; for serverless deployment, store originals in durable private object storage and persist object keys, not instance-local temp URLs. Use temp storage only for processing and clean it afterward.

```js
// Before: reader ignores writer configuration
const primaryUploads = path.join(__dirname, '..', 'uploads');
// After: both writer and authorized reader import one configuration
const { uploadDir } = require('./config/storage');
```

Create that helper during implementation, using an absolute resolved path relative to a documented base. This audit did not create it.

### Q11 — Start each service once and stop killing ports

In root `package.json`, use a declared root development dependency such as `concurrently` to run two independent workspace scripts. In `backend/package.json`, make `dev` backend-only and `start` non-watch production execution; remove `predev`/`prestart` port-killing hooks. Remove automatic `killPortProcess` calls from `server.js`; report `EADDRINUSE` and exit.

```json
// Before (root)
"dev": "npm run dev --workspace=frontend & npm run dev --workspace=backend"
// After (root)
"dev": "concurrently \"npm run dev --workspace=frontend\" \"npm run dev --workspace=backend\""
// After (backend)
"dev": "node --watch src/server.js",
"start": "node src/server.js"
```

### Q12 — Repair or retire the one-off i18n script

If still needed, fix the template literal in `frontend/update-i18n.js:248–256`, including the malformed nested replacement string at line 252. Validate with `node --check`, without executing this source-writing maintenance script. Otherwise explicitly retire it after confirming it is unnecessary.

```js
// Before: a backslash precedes the opening/closing template delimiters
// const updatedTFunction = \` ... \`;
// After: avoid nested template escaping
const updatedTFunction = `const t = (key, params) => {
  let text = translations[language]?.[key] || translations.en?.[key] || key;
  for (const p of Object.keys(params || {})) text = text.replace('{' + p + '}', params[p]);
  return text;
};`;
```

### Q13 — Translate report content and synchronize language

In `ReportPage.jsx:81,157`, initialize from `useApp().language`, map `en/hi/gu` to the backend language contract, preserve an immutable original result, and call `api.translateReport` when needed. Add loading/error state and discard stale responses when toggling quickly. Apply the selected language after a fresh analysis too.

```jsx
// Before
onChange={e => setSelectedLanguage(e.target.value)}
// After: implemented handler translates the original result, then updates result/state
onChange={e => handleReportLanguageChange(e.target.value)}
```

The handler should call `await api.translateReport(originalResult, targetLanguage)` and retain the original result if translation fails.

### Q14 — Complete consumed keys and localize visible text

Add `totalMedicineSearches` to each dictionary in `AppContext.jsx`. Add translated keys for the settings explanation and saving/saved/save labels, and replace hardcoded JSX at `SettingsPage.jsx:195,251`. Review other page-owned English UI strings using the same pattern.

```js
// Dictionary additions
// en: totalMedicineSearches: 'Text Searches'
// hi: totalMedicineSearches: 'दवा खोजें'
// gu: totalMedicineSearches: 'દવાની શોધ'
// Before
// 'Save Preferences'
// After (with all three translations added)
t('savePreferences')
```

### Q15 — Use normalized, explicit severity precedence

Replace `getStatusBadge` in `ReportPage.jsx:131` and retain canonical status codes separately from translated labels.

```js
// Before
if (s.includes('normal')) return 'badge-success';
// After: before any high/low checks
if (s.includes('critical')) return 'badge-danger';
if (s === 'normal') return 'badge-success';
if (s === 'abnormal') return 'badge-warning';
// Then handle high/low explicitly; unknown remains neutral.
```

### Q16 — Make loading overlay colors coherent

In `ReportPage.jsx:50`, replace the fixed dark overlay with the current theme's card background, preserving readable foreground tokens. Alternatively use a dedicated fixed-dark palette for every overlay text/icon. Verify every progress state, including reduced-opacity rows.

```js
// Before
background: 'rgba(11, 13, 28, 0.9)'
// After
background: 'var(--bg-card)'
```

### Q17 — Validate before reading; map server errors

Before `setSelectedFile`/FileReader in both upload handlers, check size (10 MiB) and supported types. Clear invalid selections and show translated errors. Keep server checks authoritative. In `app.js` error middleware map Multer's limit code explicitly.

```js
// Before
setSelectedFile(file);
// After: before preview generation
if (file.size > 10 * 1024 * 1024) return setError(t('fileTooLarge'));
if (!allowedTypes.has(file.type)) return setError(t('unsupportedFile'));
setSelectedFile(file);
// Server error handler
const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 500);
```

Define the type set per page and add error translations; ReportPage needs `useApp` integration from Q13.

### Q18 — Remove patient-data logging

Remove `console.log(rawText)` and full analysis serialization in `reportController.js:46–60`. Log a request ID, operation outcome, and timing only; redact sensitive error payloads as well.

```js
// Before
console.log(rawText);
console.log(JSON.stringify(analysisResult, null, 2));
// After
console.info('Report analysis completed');
```

### Q19 — Clear disease history too

In `userController.js:364–366`, add deletion for the already-imported `DiseaseHistory` model. Coordinate database and file cleanup with Q09; don't report success after a partially failed clear operation.

```js
// Before
await MedicineSearchHistory.deleteMany({ userId });
// After: retain existing deletions and add
await DiseaseHistory.deleteMany({ userId });
```

### Q20 — Name controls for assistive technology

In `HistoryPage.jsx:288`, add a localized accessible name to the delete button. In `ReportPage.jsx:156`, use a real associated label and matching ID on the select. Verify other icon-only controls similarly.

```jsx
// Before
<button onClick={...}><Trash2 size={16} /></button>
// After: retain actual existing handler and styles
<button aria-label="Delete history item" onClick={...}><Trash2 aria-hidden="true" size={16} /></button>
<label htmlFor="report-language">Language</label>
<select id="report-language" ... />
```

Replace the example English names with dictionary values when integrating Q14.

### Q21 — Split routes

Replace eager page imports in `App.jsx:9–19` with `React.lazy` and wrap the route tree in `Suspense` with an accessible loading state. Measure output again; do not split tiny shared components merely to increase chunk count.

```jsx
// Before
import AdminPage from './pages/AdminPage';
// After
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
// Wrap routes:
<React.Suspense fallback={<p role="status">Loading…</p>}><Routes>...</Routes></React.Suspense>
```

### Q22 — Update document language

In `AppContext.jsx:508`, update HTML language alongside persistence. All currently supported languages are LTR.

```js
// Before
localStorage.setItem('mediscan_lang', normalizeLang(language));
// After: retain persistence and add
document.documentElement.lang = normalizeLang(language);
document.documentElement.dir = 'ltr';
```

### Q23 — Start history empty

Remove seeding with `DEFAULT_INITIAL_SEARCHES` in `api.js:275–276`. Keep samples behind an explicit demo mode and never merge them into a real user's saved history. Migrate existing known seeded IDs carefully without deleting real searches.

```js
// Before
localStorage.setItem('mediscan_text_searches', JSON.stringify(DEFAULT_INITIAL_SEARCHES));
// After: account-scoped key from Q07, if local caching is retained
localStorage.setItem(cacheKey, '[]');
```

### Q24 — Bound requests and clean up loading work

In `api.js:37`, give requests explicit deadlines with `AbortController` (choose a longer configured limit for OCR/AI than normal account requests). Preserve caller cancellation. Clear timers in `finally`; in `ReportPage.jsx`, clear progress intervals and abort requests on unmount. Retry only classified transient failures, with a bounded total duration.

```js
// Before
const response = await fetch(url, options);
// After: simplified pattern; integrate existing headers/options
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
try { return await fetch(url, { ...options, signal: controller.signal }); }
finally { clearTimeout(timer); }
```

Keep response parsing in the actual request helper; map AbortError to a localized retry message. Align development proxy deadlines (`frontend/vite.config.js:14–15`) with the supported AI request duration.

## E. Recommended fix order

1. **Critical:** Q01, Q02 — close account/admin bypasses before exposing the application. Q03, Q04 — stop fabricated clinical results immediately.
2. **High:** Q05/Q06/Q10 together for private, validated, durable uploads; Q09 for complete deletion; Q07 for account isolation; Q18 for log privacy; Q08/Q15 for honest confidence and severity presentation.
3. **Medium:** Q11/Q12 to stabilize development and verification; Q17/Q24 for bounded upload/error flow; Q19/Q23 for trustworthy history; Q13/Q14 for translation; Q16/Q20 for contrast and accessibility.
4. **Low:** Q22 for document-language metadata, Q21 for measured initial-load improvement. Review unused files/bindings last; do not remove live modules merely because they contain unused imports.

## F. Test checklist

Use synthetic fixtures and isolated test accounts/storage. This is a proposed post-fix checklist, not a claim that these tests passed during this audit.

| Findings | Verification required |
|---|---|
| Q01 | Missing/fake/expired/wrong-audience Google credentials return 401; supplied victim email cannot mint a session; valid provider identity signs in only to its own account. |
| Q02 | Substring lookalikes and normal users receive 403 for every admin route; only explicitly provisioned administrators succeed. |
| Q03 | Remove/disable AI configuration and simulate timeout/429/invalid JSON; no report with invented values is returned or saved. Distinct source values remain exact on successful analysis. |
| Q04 | Unknown medicine + API outage produces an unavailable state, never a fabricated strength/manufacturer; offline reference mode, if retained, is visibly labeled. |
| Q05/Q17 | Accept supported valid image/PDF fixtures; reject HTML, SVG, spoofed MIME, executable content, corrupt files, and >10 MiB files. Oversize returns 413 and understandable UI error; no unsafe files remain stored. |
| Q06 | Unauthenticated/cross-account downloads fail; authorized downloads succeed; authenticated image previews still load; expired signed URLs fail if used. |
| Q07/Q23 | Fresh account has zero invented history; search as A, log out, sign in as B on same browser: no A data. Reload and clear-history behavior remains correct. |
| Q08 | Feed missing, null, zero, negative, >100, and valid confidence values; no unknown becomes verified/high-confidence. Validate model serialization and UI labels. |
| Q09/Q19 | Individual delete and clear-all remove every relevant record and stored object, including disease history; old file URL fails; another user's data survives. Test partial storage/database failures. |
| Q10 | Test custom absolute upload directory and deployed serverless multi-instance/cold-start access; uploaded history files remain retrievable only by authorized users. |
| Q11 | Start from Windows and a POSIX environment; exactly one frontend/backend starts. An unrelated listener remains alive and startup gives a clear occupied-port error. |
| Q12 | `node --check frontend/update-i18n.js` and frontend lint pass. Do not execute the source-rewriting maintenance script merely to validate syntax. |
| Q13/Q14/Q22 | English → Hindi → Gujarati → English, reload, and navigate between settings/scanner/report/history. Headings, errors, controls, and report content follow selection; numerical clinical values/IDs remain unchanged; HTML lang matches. Test rapid switching and failed translation. |
| Q15 | Normal, Abnormal, High, Low, Critical High, Critical Low, and unknown statuses map to correct semantic labels/colors independently of display language. |
| Q16/Q20 | Both themes: inspect loading, error, empty, populated, and disabled states; measure contrast. Keyboard navigation, visible focus, screen-reader names, select labels, and dialog close behavior work. |
| Q18 | Capture logs during analysis/failure using synthetic recognizable patient markers; no marker/raw report/full clinical JSON appears. |
| Q21 | Production bundle inspection shows deferred route chunks; landing/login do not download admin/scanner code up front. Navigate directly to every route and test slow-network loading/error behavior. |
| Q24 | Never-settling fetch, slow OCR, proxy timeout, network loss, server 4xx/5xx, and navigation during analysis all terminate cleanly with retry/cancel behavior and no lingering intervals. |

Cross-cutting visual/manual checks still required:

- At **320/375/768/1024/1440 px**, both themes and all three languages: no page-level overflow, overlapping nav/cards, clipped controls, or inaccessible action buttons. Test long medicine names, long Hindi/Gujarati strings, long filenames and unbroken text.
- Test standard/large/extra-large font settings and browser zoom to 200%; content reflows and actions remain usable. Hardcoded pixels must not prevent enlargement.
- Scan flow: file selection, replacement, camera permission granted/denied, preview, processing, success, retry, invalid/empty OCR, malformed model response, history revisit, and deletion. Report flow: text PDF, scanned PDF/image, empty/corrupt documents, long lab tables, no findings, critical findings, and missing optional fields.
- Inspect actual browser console/network for failed resources/API calls and React warnings. Recheck installed imports, lint, and the exact production build after fixes.
- Print preview/PDF export, if required for the project: no navigation overlays, clipped tables/cards, blank dark-background text, or missing language glyphs; preserve patient/report identifiers and disclaimers. **Print/export usability is UNVERIFIED in this audit; no working export feature is asserted.**

**Verified issue counts: Critical 4 · High 7 · Medium 11 · Low 2 — Total 24.** Unused-code candidates, lint warnings without proven behavior, and UNVERIFIED checks are not added to these counts.
