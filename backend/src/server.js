require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const mockStore = require('./utils/mockStore');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logger in dev mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Bike Workshop Management Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to DB or init mock
  const connected = await connectDB();
  if (!connected) {
    await mockStore.initMockData();
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🏍️  Bike Workshop Management Server running on port ${PORT}`);
    console.log(`🌐  API URL: http://localhost:${PORT}/api`);
    console.log(`🩺  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
};

startServer();
