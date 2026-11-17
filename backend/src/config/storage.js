const path = require('path');
const os = require('os');

const backendRoot = path.resolve(__dirname, '../..');
const isServerless = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
// Relative overrides always resolve from backend/, independent of launch cwd.
const uploadDir = process.env.UPLOADS_DIR
  ? path.resolve(backendRoot, process.env.UPLOADS_DIR)
  : isServerless ? path.join(os.tmpdir(), 'uploads') : path.join(backendRoot, 'uploads');
// Keep existing local uploads readable while using the same primary location.
const uploadRoots = [...new Set([uploadDir, path.join(backendRoot, 'uploads'), path.resolve(backendRoot, '../uploads')])];

function pathsForUpload(url) {
  if (!/^\/uploads\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif|bmp|pdf)$/i.test(url || '')) {
    throw Object.assign(new Error('Invalid stored upload reference'), { status: 400 });
  }
  const filename = url.slice('/uploads/'.length);
  return uploadRoots.map(root => {
    const target = path.resolve(root, filename);
    if (path.dirname(target) !== path.resolve(root)) throw new Error('Invalid upload path');
    return target;
  });
}
module.exports = { uploadDir, uploadRoots, pathsForUpload, isServerless };
