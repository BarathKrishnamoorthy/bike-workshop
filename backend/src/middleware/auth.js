const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workshop = require('../models/Workshop');
const UserSession = require('../models/UserSession');
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

    let user = null;
    let workshop = null;

    if (getStatus()) {
      user = await User.findOne({
        $or: [{ _id: decoded.id }, { user_id: decoded.id }],
      }).select('-password');

      if (user && user.workshop_id) {
        workshop = await Workshop.findOne({ workshop_id: user.workshop_id });
      }
    } else {
      user = mockStore.users.find(
        (u) =>
          u._id === decoded.id ||
          u.user_id === decoded.id ||
          (u.email && u.email.toLowerCase() === (decoded.email || '').toLowerCase())
      );

      if (user && user.workshop_id) {
        workshop = mockStore.workshops.find(
          (w) => w.workshop_id === user.workshop_id
        );
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found for this token',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your user account is suspended or inactive',
      });
    }

    const isSuperAdmin = user.role === 'super_admin';

    // For workshop users, verify workshop status
    if (!isSuperAdmin) {
      if (workshop && (workshop.status === 'inactive' || workshop.status === 'suspended')) {
        return res.status(403).json({
          success: false,
          message: `Your workshop account is currently ${workshop.status}. Please contact platform support.`,
        });
      }
    }

    // Attach user and tenant context to request
    req.user = user;
    req.userId = user.user_id || String(user._id);
    req.workshopId = user.workshop_id || null;
    req.isSuperAdmin = isSuperAdmin;
    req.workshop = workshop || (isSuperAdmin ? null : {
      workshop_id: user.workshop_id,
      workshop_name: user.workshopName || 'My Workshop',
      location: user.address || '',
      phone_number: user.phone || user.phone_number || '',
      status: 'active',
    });

    // Update active session last activity timestamp (for active user monitoring)
    try {
      const uId = req.userId;
      if (getStatus()) {
        await UserSession.updateOne(
          { user_id: uId, status: 'active' },
          { last_activity_at: new Date() }
        );
      } else if (mockStore.user_sessions) {
        const session = mockStore.user_sessions.find(
          (s) => s.user_id === uId && s.status === 'active'
        );
        if (session) {
          session.last_activity_at = new Date();
        }
      }
    } catch (e) {
      // Non-blocking session timestamp update
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed',
    });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin privilege required for this action',
    });
  }
  next();
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

module.exports = { protect, requireSuperAdmin, authorize };
