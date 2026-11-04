
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load local .env only during development.
// Vercel production environment variables take priority.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({
    path: path.join(__dirname, '..', '.env')
  });
}

const app = express();

// ==========================================
// DATABASE CONNECTION
// ==========================================

try {
  Promise.resolve(connectDB()).catch((error) => {
    console.error('Database connection failed:', error);
  });
} catch (error) {
  console.error('Database initialization failed:', error);
}

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : []),
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173'
]
  .filter(Boolean)
  .map((url) => String(url).trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header (health checks, etc.)
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// STANDARD MIDDLEWARE
// ==========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// UPLOADS
// ==========================================

const setUploadHeaders = (res) => {
  res.setHeader(
    'Cross-Origin-Resource-Policy',
    'cross-origin'
  );
};

const primaryUploads = path.join(__dirname, '..', 'uploads');
const altUploads = path.join(__dirname, '..', '..', 'uploads');

if (fs.existsSync(primaryUploads)) {
  app.use(
    '/uploads',
    express.static(primaryUploads, {
      setHeaders: setUploadHeaders
    })
  );
}

if (fs.existsSync(altUploads)) {
  app.use(
    '/uploads',
    express.static(altUploads, {
      setHeaders: setUploadHeaders
    })
  );
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediScan AI Backend is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediScan AI Backend API is active'
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scan', require('./routes/scanRoutes'));
app.use('/api/report', require('./routes/reportRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/disease', require('./routes/diseaseRoutes'));

// ==========================================
// API NOT FOUND
// ==========================================

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// ==========================================
// GENERAL NOT FOUND
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred.'
        : err.message
  });
});

module.exports = app;
