const app = require('./app');

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`MediScan AI Backend running in production mode on port ${PORT}`);
});

// Handle unhandled promise rejections as warnings rather than crashing
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection warning:', err.stack || err.message || err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception warning:', err.stack || err.message || err);
});
