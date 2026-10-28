const mongoose = require('mongoose');
const dns = require('dns');

// Use Google Public DNS to resolve MongoDB Atlas SRV records
// (fixes ECONNREFUSED on networks that block SRV lookups)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS not supported in environment
}

mongoose.set('bufferCommands', true);

let connectingPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mediscan';
  console.log('Connecting to MongoDB...');

  connectingPromise = mongoose.connect(connString, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  }).then(conn => {
    console.log('MongoDB Connected successfully to database:', mongoose.connection.db ? mongoose.connection.db.databaseName : 'connected');
    connectingPromise = null;
    return conn;
  }).catch(error => {
    connectingPromise = null;
    console.error('Unable to connect to the MongoDB database:', error.message || error);
    // Auto-retry connection after 3 seconds
    setTimeout(() => {
      connectDB().catch(() => {});
    }, 3000);
    throw error;
  });

  return connectingPromise;
};

// Reconnect automatically if connection drops
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Attempting reconnection...');
  setTimeout(() => {
    connectDB().catch(() => {});
  }, 3000);
});

module.exports = { connectDB };
