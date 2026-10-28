import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy Error]:', err.message);
            if (res && res.writeHead && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Backend service is restarting or unavailable. Please retry momentarily.',
                isProxyError: true
              }));
            }
          });
        }
      },
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: path.basename(process.cwd()) === 'frontend' ? 'dist' : '../dist',
    emptyOutDir: true,
  }
})