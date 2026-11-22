require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

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
const chatRoutes = require('./routes/chatRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Attach io to express app so controllers can emit events
app.set('io', io);

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logger in dev mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'SaaS Bike Workshop Multi-Tenant Portal API & Super Admin Console',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // Exposes /api/register, /api/login, /api/logout, /api/profile, /api/workshop directly
app.use('/api/customers', customerRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Error handler middleware
app.use(errorHandler);

// Socket.IO Real-time messaging connection handlers
io.on('connection', (socket) => {
  // Join workshop specific room or admin room
  socket.on('join_room', (data) => {
    if (data.role === 'super_admin') {
      socket.join('admin_room');
    } else if (data.workshop_id) {
      const room = `room_${data.workshop_id}`;
      socket.join(room);
    }
  });

  // Client typing indicator
  socket.on('typing', (data) => {
    if (data.workshop_id) {
      socket.to(`room_${data.workshop_id}`).emit('user_typing', data);
      socket.to('admin_room').emit('user_typing', data);
    }
  });

  socket.on('stop_typing', (data) => {
    if (data.workshop_id) {
      socket.to(`room_${data.workshop_id}`).emit('user_stop_typing', data);
      socket.to('admin_room').emit('user_stop_typing', data);
    }
  });

  socket.on('disconnect', () => {
    // Clean disconnection
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to DB or init mock
  const connected = await connectDB();
  if (!connected) {
    await mockStore.initMockData();
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🏍️  SaaS Multi-Tenant Workshop API running on port ${PORT}`);
    console.log(`💬  Live Support Chat & Real-Time Socket.IO Online`);
    console.log(`👑  Super Admin Platform Management API Online`);
    console.log(`🌐  Local URL:   http://localhost:${PORT}/api`);
    console.log(`📱  Mobile URL:  http://192.168.0.104:${PORT}/api`);
    console.log(`🩺  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
};

startServer();
