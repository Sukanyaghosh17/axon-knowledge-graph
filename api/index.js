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
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/notes', noteRoutes);
// Graph endpoint (mounted separately for clean URL)
app.get('/api/graph', require('./controllers/noteController').getGraphData);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'Axon API' }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 Axon server running on http://localhost:${PORT}`));
}

// Export for Vercel Serverless deployment
module.exports = app;
