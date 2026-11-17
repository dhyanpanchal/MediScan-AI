const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function checkTree(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) checkTree(file);
    else if (file.endsWith('.js')) {
      new (require('node:vm').Script)(fs.readFileSync(file, 'utf8'), { filename: file });
    }
  }
}
checkTree(path.join(root, 'backend/src'));
const build = spawnSync(process.execPath, [path.join(root, 'frontend/node_modules/vite/bin/vite.js'), 'build'], { cwd: path.join(root, 'frontend'), encoding: 'utf8' });
if (build.status !== 0) { console.error(build.stdout, build.stderr); process.exit(1); }
console.log(`${process.argv[2] || 'Final'}: backend syntax and production build PASS`);
console.log(build.stdout.split('\n').filter(line => /built in|\.js\s/.test(line)).join('\n'));
