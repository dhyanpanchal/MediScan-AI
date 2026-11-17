const test = require('node:test');
const assert = require('node:assert/strict');

test('Q17: server global error handler returns HTTP 413 on LIMIT_FILE_SIZE', async () => {
  const app = require('../src/app');

  // Find global error handler
  const routes = app._router.stack;
  const errorHandlerLayer = routes.find(layer => layer.handle && layer.handle.length === 4);
  assert.ok(errorHandlerLayer, 'Global error handler with 4 parameters must exist in app.js');
  const errorHandler = errorHandlerLayer.handle;

  let statusCode = null;
  let responseBody = null;

  const mockReq = {};
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };
  const mockNext = () => { };

  const multerErr = new Error('File too large');
  multerErr.code = 'LIMIT_FILE_SIZE';

  errorHandler(multerErr, mockReq, mockRes, mockNext);

  assert.equal(statusCode, 413, 'Status code must be 413 on LIMIT_FILE_SIZE');
  assert.equal(responseBody.success, false);
  assert.match(responseBody.error, /10MB/i);
});

test('Q24: request timeout and cancellation via AbortController in api.js', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');

  let source = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/api.js'), 'utf8');
  source = source.replace(/^import .*;\r?\n/gm, '').replaceAll('import.meta.env', '{}').replace('export const api', 'const api');

  // Test 1: Immediate abort cancellation
  const abortController = new AbortController();
  abortController.abort(new Error('User cancelled'));

  const sandbox = {
    localStorage: { getItem: () => null },
    FormData,
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    fetch: async (_url, options) => {
      if (options.signal?.aborted) {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        throw err;
      }
      return new Promise(() => { }); // never resolves
    }
  };

  const api = vm.runInNewContext(source + '\napi', sandbox);
  await assert.rejects(
    api.scanMedicine(new FormData(), { signal: abortController.signal }),
    /cancelled/i
  );
});

test('Q24: request timeout triggers when endpoint hangs beyond deadline', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');

  let source = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/api.js'), 'utf8');
  source = source.replace(/^import .*;\r?\n/gm, '').replaceAll('import.meta.env', '{}').replace('export const api', 'const api');

  const sandbox = {
    localStorage: { getItem: () => null },
    FormData,
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    fetch: async (_url, options) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 500);
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          }, { once: true });
        }
      });
    }
  };

  const api = vm.runInNewContext(source + '\napi', sandbox);
  // Using short timeout of 50ms
  await assert.rejects(
    api.scanMedicine(new FormData(), { timeout: 50 }),
    /timed out/i
  );

  setTimeout(() => process.exit(0), 100);
});
