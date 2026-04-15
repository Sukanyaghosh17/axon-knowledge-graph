const mongoose = require('mongoose');

const connectDB = async () => {
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
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log('✅ MongoDB Memory Server started');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
