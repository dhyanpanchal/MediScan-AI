const { pathsForUpload } = require('../config/storage');
const fs = require('fs/promises');
const ScanHistory = require('../models/ScanHistory');
const ReportHistory = require('../models/ReportHistory');

async function downloadFile(req, res, next) {
  try {
    const filename = req.params.filename;
    if (!/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif|bmp|pdf)$/i.test(filename)) return res.sendStatus(404);
    const url = `/uploads/${filename}`;
    const owner = req.user.isAdmin === true ? {} : { userId: req.user.id };
    const record = await ScanHistory.findOne({ ...owner, imageUrl: url }) || await ReportHistory.findOne({ ...owner, fileUrl: url });
    if (!record) return res.sendStatus(404);
    for (const file of pathsForUpload(url)) {
      try {
        const stat = await fs.lstat(file);
        if (!stat.isFile() || stat.isSymbolicLink()) continue;
        res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" });
        return res.download(file, filename);
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    res.sendStatus(404);
  } catch (error) { next(error); }
}
module.exports = { downloadFile };
