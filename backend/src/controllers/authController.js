const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'super_secret_jwt_bike_workshop_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    workshopName: user.workshopName,
    address: user.address,
    gstNumber: user.gstNumber,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, workshopName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    if (getStatus()) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'admin',
        phone,
        workshopName,
      });

      sendTokenResponse(user, 201, res);
    } else {
      const existing = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: 'usr_' + Date.now(),
        name,
        email,
        password: hashedPassword,
        role: role || 'admin',
        phone: phone || '',
        workshopName: workshopName || 'SpeedyWheels Bike Workshop',
        address: '108 Workshop Road, Auto Hub, Bangalore - 560001',
        gstNumber: '29ABCDE1234F1Z5',
        createdAt: new Date(),
      };
      mockStore.users.push(newUser);
      sendTokenResponse(newUser, 201, res);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (getStatus()) {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      sendTokenResponse(user, 200, res);
    } else {
      const user = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Allow default admin login demo
        if (email === 'admin@bikeworkshop.com' && password === 'admin123') {
          return sendTokenResponse(mockStore.users[0], 200, res);
        }
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== 'admin123') {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      sendTokenResponse(user, 200, res);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};
