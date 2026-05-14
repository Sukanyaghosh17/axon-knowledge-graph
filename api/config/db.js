const mongoose = require('mongoose');

// MODULE-LEVEL state — Vercel reuses warm instances so this persists between requests
let isConnecting = false;
let isConnected = false;

const connectDB = async () => {
  // Already connected — fast path
  if (isConnected && mongoose.connection.readyState === 1) return;

  // Connection already in progress — wait for it rather than opening a second socket
  if (isConnecting) {
    // Poll until done (max 10s)
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (mongoose.connection.readyState === 1) { isConnected = true; return; }
    }
    throw new Error('MongoDB connection timed out while waiting for in-progress connect');
  }

  isConnecting = true;

  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        // DO NOT call process.exit() — it crashes the serverless worker and swallows the error.
        // Throw instead so requireDB can return a clean 503.
        throw new Error(
          'MONGO_URI environment variable is not set. ' +
          'Go to Vercel Dashboard → Your Project → Settings → Environment Variables ' +
          'and add MONGO_URI with your MongoDB Atlas connection string.'
        );
      }

      // Local dev fallback — use in-memory MongoDB
      console.log('⏳ MONGO_URI not set — starting MongoDB Memory Server for local dev...');
      let MongoMemoryServer;
      try {
        ({ MongoMemoryServer } = require('mongodb-memory-server'));
      } catch {
        throw new Error('mongodb-memory-server is not installed. Run: npm install --prefix api');
      }
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log('✅ MongoDB Memory Server started at', mongoUri);
    }

    await mongoose.connect(mongoUri, {
      bufferCommands: false,
      maxPoolSize: 5,       // Atlas M0 free tier supports max 500 connections total
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });

    isConnected = true;
    console.log('✅ MongoDB Connected:', mongoose.connection.host);
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;           // Let requireDB catch this and return 503
  } finally {
    isConnecting = false;
  }
};

module.exports = connectDB;
