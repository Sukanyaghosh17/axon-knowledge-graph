const mongoose = require('mongoose');

// Cache the connection promise across serverless invocations (Vercel re-uses warm instances)
let cachedPromise = null;

const connectDB = async () => {
  // If already connected, reuse
  if (mongoose.connection.readyState === 1) return;

  // If a connection is in progress, wait for it
  if (cachedPromise) return cachedPromise;

  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      // In production (Vercel), MONGO_URI must be set — memory server won't work.
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        console.error('❌ MONGO_URI environment variable is required in production.');
        console.error('   Set it in your Vercel project → Settings → Environment Variables');
        console.error('   Use a free MongoDB Atlas cluster: https://cloud.mongodb.com');
        process.exit(1);
      }

      console.log('⏳ MONGO_URI not set. Starting MongoDB Memory Server for local dev...');
      let MongoMemoryServer;
      try {
        ({ MongoMemoryServer } = require('mongodb-memory-server'));
      } catch {
        console.error('❌ mongodb-memory-server is not installed. Run: npm install --prefix api');
        process.exit(1);
      }
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log('✅ MongoDB Memory Server started');
    }

    cachedPromise = mongoose.connect(mongoUri, {
      // Recommended settings for serverless
      bufferCommands: false,
      maxPoolSize: 10,
    });

    const conn = await cachedPromise;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    cachedPromise = null; // allow retry on next request
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
