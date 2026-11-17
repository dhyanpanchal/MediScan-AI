const fs = require('fs/promises');
const { pathsForUpload } = require('../config/storage');

// Called only with a URL from a record already selected by authenticated owner.
async function removeOwnedUpload(url) {
  if (!url) return;
  for (const file of pathsForUpload(url)) {
    try {
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe stored upload path');
      await fs.unlink(file);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
module.exports = { removeOwnedUpload };
