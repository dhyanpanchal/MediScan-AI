const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { uploadDir } = require('../config/storage');
const invalid = () => Object.assign(new Error('Upload a valid PNG, JPEG, WebP, GIF image or PDF report.'), { status: 415 });
async function validateBuffer(file, allowPdf) {
  const buffer = file.buffer;
  if (allowPdf && file.mimetype === 'application/pdf') {
    if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-')) || !buffer.includes(Buffer.from('%%EOF'))) throw invalid();
    try { await require('pdf-parse')(buffer); } catch { throw invalid(); }
    return { buffer, extension: '.pdf', mimetype: 'application/pdf' };
  }
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype)) throw invalid();
  try {
    // Decode and re-encode to reject malformed images and strip active/trailing content.
    const output = await sharp(buffer, { limitInputPixels: 40000000, failOn: 'error' }).rotate().png().toBuffer();
    return { buffer: output, extension: '.png', mimetype: 'image/png' };
  } catch { throw invalid(); }
}
const parser = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
function single(field) {
  return (req, res, next) => parser.single(field)(req, res, async error => {
    if (error) return next(error);
    if (!req.file) return next();
    try {
      const valid = await validateBuffer(req.file, field === 'file');
      await fs.mkdir(uploadDir, { recursive: true });
      const filename = field + '-' + crypto.randomUUID() + valid.extension;
      const destination = path.join(uploadDir, filename);
      await fs.writeFile(destination, valid.buffer, { flag: 'wx' });
      req.file = { ...req.file, filename, destination: uploadDir, path: destination, mimetype: valid.mimetype, size: valid.buffer.length };
      delete req.file.buffer;
      next();
    } catch (error) { next(error); }
  });
}
module.exports = { single, validateBuffer };
