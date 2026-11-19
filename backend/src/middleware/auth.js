const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token missing',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_bike_workshop_key_2026'
    );

    if (getStatus()) {
      req.user = await User.findById(decoded.id).select('-password');
    } else {
      req.user = mockStore.users.find((u) => u._id === decoded.id || u.email === decoded.email);
    }

    if (!req.user) {
      // Fallback dummy user if token was valid
      req.user = {
        _id: decoded.id || 'usr_001',
        name: decoded.name || 'Workshop Admin',
        email: decoded.email || 'admin@bikeworkshop.com',
        role: decoded.role || 'admin',
      };
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
