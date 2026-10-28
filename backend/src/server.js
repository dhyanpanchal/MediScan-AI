const { execSync } = require('child_process');
const app = require('./app');
const { verifySmtpConnection, maskEmail } = require('./utils/mailer');

const PORT = process.env.PORT || 5001;

// Helper to kill any orphaned process occupying the target port on Windows
const killPortProcess = (port) => {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano -p tcp | findstr :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && parseInt(pid, 10) !== process.pid) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch (_) {}
        }
      }
    }
  } catch (_) {
    // Port was not occupied or command returned no matches
  }
};

let server;
let retryCount = 0;

const startServer = () => {
  // Preemptively clear any zombie processes holding backend (5001)
  if (retryCount === 0) {
    killPortProcess(PORT);
  }

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediScan AI Backend running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retryCount === 0) {
        retryCount++;
        console.log(`\n⚠️ Port ${PORT} is occupied by an earlier instance. Attempting automatic cleanup...`);
        killPortProcess(PORT);
        setTimeout(() => {
          console.log(`🔄 Re-binding port ${PORT}...`);
          startServer();
        }, 1200);
      } else {
        console.error(`\n❌ Port ${PORT} is still in use by another running instance of MediScan backend.`);
        console.error(`👉 Run in PowerShell: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();

// Handle unhandled promise rejections as warnings rather than crashing
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection warning:', err.stack || err.message || err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception warning:', err.stack || err.message || err);
});
