const fs = require('fs/promises');
const pdf = require('pdf-parse');
async function extractTextFromPDF(filePath) {
  const buffer = await fs.readFile(filePath);
  if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw Object.assign(new Error('The file is not a valid PDF document.'), { status: 415 });
  const data = await pdf(buffer);
  return data.text || '';
}
module.exports = { extractTextFromPDF };
