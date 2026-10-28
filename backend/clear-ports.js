const { execSync } = require('child_process');

function killPorts() {
  if (process.platform === 'win32') {
    try {
      execSync('powershell -NoProfile -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000,5001 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"', { stdio: 'ignore' });
    } catch (_) {}

    try {
      const output = execSync('netstat -ano | findstr :5000', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
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
    } catch (_) {}

    try {
      const output = execSync('netstat -ano | findstr :5001', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
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
    } catch (_) {}
  }
}

killPorts();
