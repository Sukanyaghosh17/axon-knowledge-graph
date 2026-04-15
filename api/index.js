const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const noteRoutes = require('./routes/noteRoutes');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
// On Vercel, the frontend and backend share the same domain, so CORS is
// only needed for external clients (e.g. Postman, mobile apps).
// We still allow the CLIENT_URL env var for custom domain setups.
const allowedOrigins = [
  ...(process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Postman, same-origin on Vercel)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      // On Vercel, allow any vercel.app subdomain automatically
      if (process.env.VERCEL && origin && origin.endsWith('.vercel.app')) {
        return cb(null, true);
      }
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
// Skip morgan in production to reduce noise in Vercel logs
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/notes', noteRoutes);
// Graph endpoint (mounted separately for clean URL)
app.get('/api/graph', require('./controllers/noteController').getGraphData);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'OK', app: 'Axon API' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 Axon server running on http://localhost:${PORT}`));
}

// Export for Vercel Serverless deployment
module.exports = app;
