const app = require('./app');
const PORT = Number(process.env.PORT || 5001);
const server = app.listen(PORT, '0.0.0.0', () => console.log('MediScan AI Backend running on port ' + PORT));
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port ' + PORT + ' is already in use. Stop the existing server or configure PORT.' : error.message);
  process.exitCode = 1;
});
