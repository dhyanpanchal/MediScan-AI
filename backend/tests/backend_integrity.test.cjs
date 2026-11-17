const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function load(relative, overrides = {}) {
  const filename = path.join(__dirname, relative);
  const native = require('node:module').createRequire(filename);
  const sandbox = { module: { exports: {} }, require: key => overrides[key] || native(key), console, process, Buffer, setTimeout, clearTimeout, __dirname: path.dirname(filename) };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}
test('Google route rejects forged identity before account access', async () => {
  let accountAccess = false;
  const controller = load('../src/controllers/authController.js', { '../utils/googleIdentity': { verifyGoogleIdentity: async () => { throw Object.assign(new Error('Invalid credential'), { status: 401 }); } }, '../models/User': { findOne: () => { accountAccess = true; } } });
  let status;
  await controller.googleOAuthLogin({ body: { email: 'victim@example.com' } }, { status(code) { status = code; return this; }, json() {} });
  assert.equal(status, 401); assert.equal(accountAccess, false);
});
test('history reads preserve original stored medicine evidence', async () => {
  const original = { _id: 'record', medicineName: 'Unknown', rawOcrText: 'paracetamol', imageUrl: '/uploads/image-1790763277729.png' };
  let writes = 0;
  const controller = load('../src/controllers/userController.js', { '../models/ScanHistory': { find: () => ({ sort: async () => [original] }), findByIdAndUpdate: () => { writes++; } } });
  let response;
  await controller.getScanHistory({ user: { id: 'owner' }, query: {} }, { json(body) { response = body; } });
  assert.equal(response.data[0].medicineName, 'Unknown'); assert.equal(writes, 0);
});
test('scan preserves zero OCR confidence and unknown verification with response id', async () => {
  let stored;
  const controller = load('../src/controllers/scanController.js', {
    '../utils/ocr': { extractMedicineOcrData: async () => ({ text: '', confidence: 0 }) },
    '../utils/llm': { analyzeMedicineLabel: async () => ({ medicineName: 'Unidentified medicine', identificationStatus: 'unverified', packagingEvidence: { brandName: null } }) },
    '../models/ScanHistory': { create: async data => { stored = data; return { toJSON: () => ({ ...data, id: 'record' }) }; } }
  });
  let response;
  await controller.scanMedicineLabel({ file: { filename: 'image-a.png', path: '/unused' }, user: { id: 'owner' } }, { status() { return this; }, json(body) { response = body; } });
  assert.equal(stored.ocrConfidence, 0); assert.equal(stored.confidenceScore, null); assert.equal(stored.verificationStatus, 'Information Not Verified'); assert.equal(stored.manufacturer, undefined); assert.equal(response.data.id, 'record');
});
test('HTTP upload and API routes reject unauthenticated access with JSON', async () => {
  const app = load('../src/app.js', { './config/db': { connectDB: async () => {} } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const [url, method] of [['/uploads/image-private.png', 'GET'], ['/api/scan', 'POST'], ['/api/report', 'POST']]) {
      const response = await fetch(base + url, { method });
      assert.equal(response.status, 401); assert.equal((await response.json()).success, false);
    }
    const missing = await fetch(base + '/api/not-found'); assert.equal(missing.status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('user JSON never serializes password and OTP secrets', () => {
  const User = require('../src/models/User');
  const user = new User({ name: 'Test', email: 'test@example.com', password: 'secret', otp: 'hashed-code', oauthId: 'subject' });
  const data = user.toJSON();
  assert.equal(data.password, undefined); assert.equal(data.otp, undefined); assert.equal(data.oauthId, undefined); assert.equal(data.isAdmin, false);
});
