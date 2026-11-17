const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { extractMedicineOcrData, preprocessImage, scoreResult } = require('../src/utils/ocr');

async function fixture(t, rotation = 0, lowContrast = false) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'mediscan-ocr-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'label.png');
  // Synthetic typography fixture; never used as production medicine or clinical data.
  const svg = `<svg width="1200" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${lowContrast ? '#bcbcbc' : 'white'}"/><g fill="${lowContrast ? '#888888' : 'black'}" font-family="Arial" font-size="48"><text x="50" y="80">OCR TEST LABEL</text><text x="50" y="160">Sample tablets 500 mg</text><text x="50" y="240">Batch: TEST123</text><text x="50" y="320">EXP: 12/2028</text><text x="50" y="400">Read the printed label carefully</text></g></svg>`;
  await sharp(Buffer.from(svg)).rotate(rotation).png().toFile(file);
  return file;
}

test('OCR refuses fake text images and damaged raster bytes', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'mediscan-invalid-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'fake.png');
  await fs.writeFile(file, 'mock_tablet label report');
  await assert.rejects(extractMedicineOcrData(file), { code: 'INVALID_IMAGE', status: 415 });
  await fs.writeFile(file, Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(20)]));
  await assert.rejects(preprocessImage(file), { code: 'INVALID_IMAGE', status: 415 });
});

test('OCR score preserves unknown/zero confidence', () => {
  assert.equal(scoreResult({ text: 'sample', confidence: 0 }).confidence, 0);
  assert.equal(scoreResult({ text: 'sample' }).confidence, 0);
  assert.equal(scoreResult({ text: 'sample', confidence: NaN }).confidence, 0);
});

test('OCR deadline terminates work and allows the next request', async t => {
  const file = await fixture(t);
  await assert.rejects(extractMedicineOcrData(file, { timeoutMs: 1 }), { code: 'OCR_TIMEOUT' });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(extractMedicineOcrData(file, { signal: controller.signal }), { code: 'ABORTED' });
});

for (const rotation of [0, 90, 180, 270]) {
  test(`real Tesseract recognizes ${rotation} degree label and preserves printed strength`, { timeout: 100000 }, async t => {
    const file = await fixture(t, rotation, rotation === 0);
    const result = await extractMedicineOcrData(file);
    assert.match(result.text, /500\s*mg/i);
    assert.match(result.text, /12\s*\/\s*2028/);
    assert.ok(result.confidence > 40 && result.confidence <= 100);
    assert.equal(result.engine, 'tesseract');
    assert.doesNotMatch(result.text, /ORIENTATION/);
  });
}
