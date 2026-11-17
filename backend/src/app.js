const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false });

// Connect without leaving a rejected startup promise unhandled.
connectDB().catch(() => {});

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Files remain private and use the same configured storage as uploads.
const { protect } = require('./middleware/authMiddleware');
const { downloadFile } = require('./controllers/fileController');
app.get('/uploads/:filename', protect, downloadFile);

// Routes mapping
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scan', require('./routes/scanRoutes'));
app.use('/api/report', require('./routes/reportRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/disease', require('./routes/diseaseRoutes'));

// Fallback for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Serve frontend statically if built
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
const rootDistPath = path.join(__dirname, '..', '..', 'dist');

let activeDistPath = null;
if (fs.existsSync(frontendDistPath)) {
  activeDistPath = frontendDistPath;
} else if (fs.existsSync(rootDistPath)) {
  activeDistPath = rootDistPath;
}

if (activeDistPath) {
  app.use(express.static(activeDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(activeDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'MediScan AI Backend API is active. (Frontend build not found)' });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File size exceeds maximum allowed limit (10MB)'
    });
  }
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  console.error('Unhandled Server Error:', err.message);
  res.status(status).json({
    success: false,
    error: err.message || 'An internal server error occurred.'
  });
});

module.exports = app;
