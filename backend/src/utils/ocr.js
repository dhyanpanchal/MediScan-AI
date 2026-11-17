const fs = require('node:fs');
const path = require('node:path');
const { fork } = require('node:child_process');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
let activeJobs = 0;
const failure = (message, status, code) => Object.assign(new Error(message), { status, code });

function isValidImage(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const bytes = Buffer.alloc(12);
    if (fs.readSync(fd, bytes, 0, 12, 0) < 12) return false;
    const hex = bytes.toString('hex');
    return hex.startsWith('89504e470d0a1a0a') || hex.startsWith('ffd8ff') ||
      hex.startsWith('474946383761') || hex.startsWith('474946383961') ||
      (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') ||
      hex.startsWith('49492a00') || hex.startsWith('4d4d002a') || hex.startsWith('424d');
  } catch { return false; }
  finally { if (fd !== undefined) fs.closeSync(fd); }
}

function workerOptions() {
  const directory = process.env.OCR_LANG_PATH || path.resolve(__dirname, '../..');
  const local = fs.existsSync(path.join(directory, 'eng.traineddata'));
  return {
    ...(local ? { langPath: directory, gzip: false } : {}),
    cacheMethod: 'none',
    // Rejections are handled by the caller, never thrown from worker event callbacks.
    errorHandler: () => {},
  };
}

async function preprocessImage(imagePath) {
  if (!isValidImage(imagePath)) throw failure('Upload a readable PNG, JPEG, WebP, GIF or TIFF image.', 415, 'INVALID_IMAGE');
  try {
    const input = sharp(imagePath, { limitInputPixels: 40000000, failOn: 'error' });
    const metadata = await input.metadata();
    if (!metadata.width || !metadata.height) throw new Error('Missing dimensions');
    const original = await input.autoOrient().flatten({ background: '#ffffff' })
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    const size = await sharp(original).metadata();
    const scale = Math.min(2, 2400 / Math.max(size.width, size.height));
    const enhanced = await sharp(original)
      .resize({ width: Math.round(size.width * scale), height: Math.round(size.height * scale), fit: 'inside' })
      .grayscale().median(3).normalise({ lower: 1, upper: 99 }).sharpen({ sigma: 1 }).png().toBuffer();
    return { original, enhanced };
  } catch (error) {
    if (error.status) throw error;
    throw failure('The image is damaged, unsupported, or exceeds the 40 megapixel limit.', 415, 'INVALID_IMAGE');
  }
}

function scoreResult(data) {
  const text = String(data.text || '').trim();
  const confidence = typeof data.confidence === 'number' && Number.isFinite(data.confidence)
    ? Math.max(0, Math.min(100, data.confidence)) : 0;
  const letters = (text.match(/[\p{L}\p{N}]/gu) || []).length;
  return { text, confidence: Math.round(confidence), score: confidence * letters / Math.max(text.length, 1) + Math.min(letters, 300) / 15 };
}

async function recognizeImage(imagePath) {
  const { original, enhanced } = await preprocessImage(imagePath);
  const worker = await Tesseract.createWorker('eng', 1, workerOptions());
  try {
    await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.AUTO, preserve_interword_spaces: '1' });
    let best = { text: '', confidence: 0, score: 0, rotation: 0 };
    // Reuse one worker. Original pass protects small text from filtering loss.
    const variants = [{ buffer: original, rotation: 0 }, { buffer: enhanced, rotation: 0 },
      ...[180, 90, 270].map(rotation => ({ rotation }))];
    for (const variant of variants) {
      const buffer = variant.buffer || await sharp(enhanced).rotate(variant.rotation).png().toBuffer();
      const result = await worker.recognize(buffer, { rotateAuto: true });
      const candidate = { ...scoreResult(result.data), rotation: variant.rotation };
      if (candidate.score > best.score) best = candidate;
      if (best.confidence >= 85 && best.text.length >= 80 && /\d\s*(mg|mcg|ml|g|IU)\b/i.test(best.text)) break;
    }
    // Never concatenate contradictory passes or promote OCR confidence to clinical certainty.
    return { text: best.text, confidence: best.confidence, rotation: best.rotation, engine: 'tesseract' };
  } finally { await worker.terminate(); }
}

function extractMedicineOcrData(imagePath, options = {}) {
  if (!isValidImage(imagePath)) return Promise.reject(failure('The upload is not a valid image.', 415, 'INVALID_IMAGE'));
  if (activeJobs >= 2) return Promise.reject(failure('OCR is busy. Please retry shortly.', 503, 'OCR_BUSY'));
  if (options.signal?.aborted) return Promise.reject(failure('OCR cancelled.', 499, 'ABORTED'));
  const configured = Number(options.timeoutMs ?? process.env.OCR_TIMEOUT_MS ?? 90000);
  const timeoutMs = Number.isFinite(configured) && configured > 0 ? Math.min(configured, 120000) : 90000;
  activeJobs++;
  return new Promise((resolve, reject) => {
    // Process isolation lets deadlines terminate WASM and stalled worker initialization.
    let child;
    let timer;
    let settled = false;
    const onAbort = () => finish(failure('OCR cancelled.', 499, 'ABORTED'));
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
      child?.kill();
      activeJobs--;
      if (error) reject(error); else resolve(result);
    };
    try {
      child = fork(__filename, [], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true });
      timer = setTimeout(() => finish(failure('OCR timed out. Try a clearer, tightly cropped label image.', 504, 'OCR_TIMEOUT')), timeoutMs);
      options.signal?.addEventListener('abort', onAbort, { once: true });
      child.on('message', message => message.error
        ? finish(failure(message.error.message, message.error.status || 502, message.error.code || 'OCR_FAILED'))
        : finish(null, message.result));
      child.on('error', () => finish(failure('OCR could not start.', 503, 'OCR_UNAVAILABLE')));
      child.on('exit', () => { if (!settled) finish(failure('OCR stopped unexpectedly.', 502, 'OCR_FAILED')); });
      child.send({ imagePath: path.resolve(imagePath) });
    } catch { finish(failure('OCR could not start.', 503, 'OCR_UNAVAILABLE')); }
  });
}

if (require.main === module && process.send) {
  process.once('message', async ({ imagePath }) => {
    try { process.send({ result: await recognizeImage(imagePath) }); }
    catch (error) { process.send({ error: { message: error.message, status: error.status, code: error.code } }); }
  });
}
const extractTextFromImage = async (imagePath, options) => (await extractMedicineOcrData(imagePath, options)).text;
module.exports = { isValidImage, extractMedicineOcrData, extractTextFromImage, preprocessImage, scoreResult };
