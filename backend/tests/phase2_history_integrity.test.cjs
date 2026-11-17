const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModule(relative, overrides) {
  const filename = path.join(__dirname, relative);
  const nativeRequire = require('node:module').createRequire(filename);
  const context = {
    module: { exports: {} },
    require: key => overrides[key] || nativeRequire(key),
    console,
    process,
    Buffer,
    __dirname: path.dirname(filename)
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return context.module.exports;
}

test('Q19: clearAllHistory removes DiseaseHistory alongside scans, reports, and medicine searches', async () => {
  const deletedModels = [];
  const removedUploads = [];

  const mockScan = {
    find: () => ({ select: async () => [{ imageUrl: '/uploads/scan-1.png' }] }),
    deleteMany: async filter => { deletedModels.push({ model: 'ScanHistory', filter }); }
  };
  const mockReport = {
    find: () => ({ select: async () => [{ fileUrl: '/uploads/report-1.pdf' }] }),
    deleteMany: async filter => { deletedModels.push({ model: 'ReportHistory', filter }); }
  };
  const mockDisease = {
    deleteMany: async filter => { deletedModels.push({ model: 'DiseaseHistory', filter }); }
  };
  const mockMedicine = {
    deleteMany: async filter => { deletedModels.push({ model: 'MedicineSearchHistory', filter }); }
  };

  const { clearAllHistory } = loadModule('../src/controllers/userController.js', {
    '../models/ScanHistory': mockScan,
    '../models/ReportHistory': mockReport,
    '../models/DiseaseHistory': mockDisease,
    '../models/MedicineSearchHistory': mockMedicine,
    '../utils/uploadCleanup': {
      removeOwnedUpload: async url => { removedUploads.push(url); }
    }
  });

  let responseBody = null;
  const res = {
    json(body) { responseBody = body; }
  };

  await clearAllHistory({ user: { id: 'patient-42' } }, res);

  assert.equal(responseBody.success, true);
  assert.deepEqual(removedUploads, ['/uploads/scan-1.png', '/uploads/report-1.pdf']);
  
  const deletedModelNames = deletedModels.map(d => d.model);
  assert.ok(deletedModelNames.includes('DiseaseHistory'), 'DiseaseHistory must be deleted during clearAllHistory');
  assert.ok(deletedModelNames.includes('ScanHistory'));
  assert.ok(deletedModelNames.includes('ReportHistory'));
  assert.ok(deletedModelNames.includes('MedicineSearchHistory'));
  assert.equal(deletedModels.every(d => d.filter.userId === 'patient-42'), true);
});

test('Q23: new accounts start with genuinely empty history and no fabricated searches are seeded', async () => {
  let source = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/api.js'), 'utf8');
  source = source.replace(/^import .*;\r?\n/gm, '').replaceAll('import.meta.env', '{}').replace('export const api', 'const api');

  const cache = new Map();
  const sandbox = {
    localStorage: {
      getItem: key => cache.get(key) || null,
      setItem: (key, val) => cache.set(key, val),
      removeItem: key => cache.delete(key),
      get length() { return cache.size; },
      key: i => [...cache.keys()][i]
    },
    getHistoryCacheKey: () => 'mediscan_text_searches:user-new',
    clearHistoryCache: () => {
      for (const k of [...cache.keys()]) {
        if (k.startsWith('mediscan_text_searches')) cache.delete(k);
      }
    },
    FormData,
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    fetch: async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, data: [] })
    })
  };

  const api = vm.runInNewContext(source + '\napi', sandbox);

  // Initial call with a clean cache
  const result = await api.getMedicineSearches();
  assert.equal(result.success, true);
  assert.deepEqual(result.data, [], 'New account history must be genuinely empty ([])');
  assert.equal(cache.has('mediscan_text_searches'), false, 'Must not seed global mediscan_text_searches');
});

