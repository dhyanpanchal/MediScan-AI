const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyGoogleIdentity } = require('../src/utils/googleIdentity');
const { adminOnly } = require('../src/middleware/adminMiddleware');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModule(relative, overrides) {
  const filename = path.join(__dirname, relative);
  const nativeRequire = require('node:module').createRequire(filename);
  const context = { module: { exports: {} }, require: key => overrides[key] || nativeRequire(key), console, process, Buffer, __dirname: path.dirname(filename) };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return context.module.exports;
}

test('Q05: reject active content and corrupt files; decode a valid image', async () => {
  const { validateBuffer } = require('../src/middleware/uploadMiddleware');
  for (const mimetype of ['text/html', 'image/svg+xml', 'image/png', 'application/pdf']) {
    await assert.rejects(validateBuffer({ mimetype, buffer: Buffer.from('<svg><script>alert(1)</script></svg>') }, true), { status: 415 });
  }
  const buffer = await require('sharp')({ create: { width: 2, height: 2, channels: 3, background: 'white' } }).png().toBuffer();
  assert.equal((await validateBuffer({ mimetype: 'image/png', buffer }, false)).extension, '.png');
});

test('Q06: download rejects traversal and cross-account access before touching storage', async () => {
  let queries = 0;
  const model = { findOne: async filter => { queries++; assert.equal(filter.userId, 'owner-b'); return null; } };
  const { downloadFile } = loadModule('../src/controllers/fileController.js', { '../models/ScanHistory': model, '../models/ReportHistory': model });
  for (const filename of ['../private.pdf', 'file-owned-by-a.pdf']) {
    let status;
    await downloadFile({ params: { filename }, user: { id: 'owner-b' } }, { sendStatus: code => { status = code; } }, error => { throw error; });
    assert.equal(status, 404);
  }
  assert.equal(queries, 2);
});

test('Q10: configured storage uses an absolute shared path and refuses traversal', () => {
  const { uploadDir, pathsForUpload } = require('../src/config/storage');
  assert.equal(path.isAbsolute(uploadDir), true);
  assert.equal(pathsForUpload('/uploads/report-123.pdf')[0], path.join(uploadDir, 'report-123.pdf'));
  assert.throws(() => pathsForUpload('/uploads/../secret.pdf'));
});

test('Q09: file deletion precedes record deletion and storage failures preserve retryable records', async () => {
  for (const fail of [false, true]) {
    const events = [];
    const record = { imageUrl: '/uploads/test.png', deleteOne: async () => events.push('record') };
    const { deleteScanItem } = loadModule('../src/controllers/userController.js', {
      '../models/ScanHistory': { findOne: async filter => { assert.equal(filter.userId, 'owner'); return record; } },
      '../utils/uploadCleanup': { removeOwnedUpload: async () => { events.push('file'); if (fail) throw new Error('Storage unavailable'); } }
    });
    let status = 200;
    await deleteScanItem({ user: { id: 'owner' }, params: { id: 'record' } }, { status(code) { status = code; return this; }, json() {} });
    assert.deepEqual(events, fail ? ['file'] : ['file', 'record']);
    assert.equal(status, fail ? 500 : 200);
  }
});

test('Q07: account cache keys differ and logout clears history without changing preferences', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/historyCache.js'), 'utf8').replaceAll('export ', '');
  const data = new Map([['mediscan_theme', 'light'], ['mediscan_lang', 'gu'], ['mediscan_text_searches', 'legacy']]);
  const localStorage = { get length() { return data.size; }, key: i => [...data.keys()][i], getItem: key => data.get(key), removeItem: key => data.delete(key) };
  const helpers = vm.runInNewContext(source + ';({getHistoryCacheKey,clearHistoryCache})', { localStorage, atob });
  const token = id => 'header.' + Buffer.from(JSON.stringify({ id })).toString('base64url') + '.signature';
  data.set('mediscan_token', token('a')); const a = helpers.getHistoryCacheKey(); data.set(a, 'private-a');
  data.set('mediscan_token', token('b')); assert.notEqual(helpers.getHistoryCacheKey(), a);
  helpers.clearHistoryCache(); assert.equal(data.has(a), false); assert.equal(data.has('mediscan_text_searches'), false);
  assert.equal(data.get('mediscan_theme'), 'light'); assert.equal(data.get('mediscan_lang'), 'gu');
});

test('Q08: confidence preserves zero and rejects missing, malformed, and out-of-range evidence', () => {
  const { confidence, verificationStatus } = require('../src/utils/confidence');
  for (const value of [undefined, null, -1, 101, NaN, Infinity, '95']) assert.equal(confidence(value), null);
  for (const value of [0, 50, 100]) assert.equal(confidence(value), value);
  assert.equal(verificationStatus(undefined), 'Information Not Verified');
  const Scan = require('../src/models/ScanHistory');
  const record = new Scan({}); assert.equal(record.confidenceScore, null); assert.equal(record.verificationStatus, 'Information Not Verified');
});

test('Q03: unavailable AI never creates mock clinical results', async () => {
  delete process.env.GEMINI_API_KEY;
  const { analyzeMedicalReport } = require('../src/utils/llm');
  await assert.rejects(analyzeMedicalReport('Hemoglobin: 14.0; Cholesterol: 150'), { status: 503 });
});

test('Q04: failed unknown-medicine lookup rejects instead of returning fabricated details', async () => {
  let source = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/api.js'), 'utf8');
  source = source.replace(/^import .*;\r?\n/gm, '').replaceAll('import.meta.env', '{}').replace('export const api', 'const api');
  const sandbox = { localStorage: { getItem: () => null }, FormData, console, setTimeout,
    translateMedicinePayload: x => x, fetch: async () => { throw new Error('offline'); } };
  const api = vm.runInNewContext(source + '\napi', sandbox);
  await assert.rejects(api.searchMedicineByName('not-a-real-drug'), /offline/);
});

test('Q01: reject unverified, expired and wrong-audience Google credentials', async () => {
  process.env.GOOGLE_CLIENT_ID = 'audit-client';
  await assert.rejects(verifyGoogleIdentity({ email: 'victim@example.com' }), { status: 401 });
  for (const info of [{ aud: 'wrong', expiry_date: Date.now() + 60000 }, { aud: 'audit-client', expiry_date: 1 }]) {
    await assert.rejects(verifyGoogleIdentity({ oauthToken: 'token' }, { getTokenInfo: async () => info }), { status: 401 });
  }
  const client = { getTokenInfo: async () => ({ aud: 'audit-client', sub: 'subject', expiry_date: Date.now() + 60000 }) };
  const fetcher = async () => ({ ok: true, json: async () => ({ sub: 'subject', email: 'owner@example.com', email_verified: true }) });
  const owner = await verifyGoogleIdentity({ oauthToken: 'token', email: 'victim@example.com' }, client, fetcher);
  assert.equal(owner.email, 'owner@example.com');
  await assert.rejects(verifyGoogleIdentity({ credential: 'bad' }, { verifyIdToken: async () => { throw new Error(); } }), { status: 401 });
});

test('Q02: names and email lookalikes cannot grant administrator access', () => {
  for (const user of [{ email: 'panchaldhyan007.attacker@example.com' }, { isAdmin: false }, { isAdmin: 'true' }, null]) {
    let status;
    adminOnly({ user }, { status(code) { status = code; return this; }, json() {} }, () => assert.fail('Unauthorized access'));
    assert.equal(status, 403);
  }
  let allowed = false;
  adminOnly({ user: { isAdmin: true } }, {}, () => { allowed = true; });
  assert.equal(allowed, true);
});
