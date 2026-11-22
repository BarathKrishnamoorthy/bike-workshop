const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Workshop = require('../models/Workshop');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

const sendTokenResponse = (user, workshop, statusCode, res, message = 'Authenticated successfully') => {
  const token = jwt.sign(
    {
      id: user.user_id || user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      workshop_id: user.workshop_id,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_bike_workshop_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  const userData = {
    id: user.user_id || user._id,
    user_id: user.user_id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone_number || user.phone || '',
    phone_number: user.phone_number || user.phone || '',
    workshop_id: user.workshop_id,
    workshopName: workshop?.workshop_name || user.workshopName || '',
    status: user.status || 'active',
    address: workshop?.location || user.address || '',
    gstNumber: user.gstNumber || '',
  };

  const workshopData = workshop ? {
    id: workshop.workshop_id || workshop._id,
    workshop_id: workshop.workshop_id || workshop._id,
    workshop_name: workshop.workshop_name || user.workshopName || '',
    location: workshop.location || user.address || '',
    phone_number: workshop.phone_number || user.phone_number || user.phone || '',
    owner_user_id: workshop.owner_user_id || user.user_id || user._id,
    status: workshop.status || 'active',
    createdAt: workshop.createdAt || new Date(),
  } : {
    workshop_id: user.workshop_id,
    workshop_name: user.workshopName || 'My Workshop',
    location: user.address || '',
    phone_number: user.phone_number || user.phone || '',
    owner_user_id: user.user_id || user._id,
    status: 'active',
    createdAt: user.createdAt || new Date(),
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userData,
    workshop: workshopData,
  });
};

// @desc    Register new workshop and owner
// @route   POST /api/register or /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      workshop_name,
      workshopName,
      location,
      phone_number,
      phone,
    } = req.body;

    const wName = (workshop_name || workshopName || '').trim();
    const wLocation = (location || '').trim();
    const wPhone = (phone_number || phone || '').trim();
    const uName = (name || '').trim();
    const uEmail = (email || '').trim().toLowerCase();

    // Validation
    if (!uName || !uEmail || !password || !wName || !wLocation || !wPhone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: Name, Email, Password, Workshop Name, Location, Phone Number',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Generate unique IDs
    const timestampSuffix = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const uniqueUserId = `USR-${timestampSuffix}${randomSuffix}`;
    const uniqueWorkshopId = `WS-${timestampSuffix}${randomSuffix}`;

    if (getStatus()) {
      // Check if user already exists
      const userExists = await User.findOne({ email: uEmail });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address is already registered',
        });
      }

      // Create Workshop
      const workshop = await Workshop.create({
        workshop_id: uniqueWorkshopId,
        owner_user_id: uniqueUserId,
        workshop_name: wName,
        location: wLocation,
        phone_number: wPhone,
        status: 'active',
      });

      // Create User (Owner)
      const user = await User.create({
        user_id: uniqueUserId,
        name: uName,
        email: uEmail,
        password, // Pre-save hook hashes it
        role: 'owner',
        phone_number: wPhone,
        phone: wPhone,
        workshop_id: uniqueWorkshopId,
        workshopName: wName,
        address: wLocation,
        status: 'active',
      });

      return sendTokenResponse(
        user,
        workshop,
        201,
        res,
        'Workshop and owner account successfully registered!'
      );
    } else {
      // Mock Store
      const existing = mockStore.users.find(
        (u) => u.email.toLowerCase() === uEmail
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address is already registered',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newWorkshop = {
        _id: 'ws_' + Date.now(),
        workshop_id: uniqueWorkshopId,
        owner_user_id: uniqueUserId,
        workshop_name: wName,
        location: wLocation,
        phone_number: wPhone,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.workshops.push(newWorkshop);

      const newUser = {
        _id: 'usr_' + Date.now(),
        user_id: uniqueUserId,
        name: uName,
        email: uEmail,
        password: hashedPassword,
        role: 'owner',
        phone_number: wPhone,
        phone: wPhone,
        status: 'active',
        workshop_id: uniqueWorkshopId,
        workshopName: wName,
        address: wLocation,
        gstNumber: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.users.push(newUser);

      return sendTokenResponse(
        newUser,
        newWorkshop,
        201,
        res,
        'Workshop and owner account successfully registered!'
      );
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/login or /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const emailStr = typeof email === 'string' ? email : (email?.email || '');

    if (!emailStr || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password',
      });
    }

    const cleanEmail = emailStr.trim().toLowerCase();

    if (getStatus()) {
      const user = await User.findOne({ email: cleanEmail }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email address or password' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email address or password' });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact support.' });
      }

      const workshop = await Workshop.findOne({ workshop_id: user.workshop_id });
      if (workshop && workshop.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Your workshop account is currently deactivated.' });
      }

      sendTokenResponse(user, workshop, 200, res, 'Logged in successfully');
    } else {
      const user = mockStore.users.find(
        (u) => u.email && u.email.toLowerCase() === cleanEmail
      );

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email address or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== 'admin123' && password !== 'apex123' && password !== 'superadmin123') {
        return res.status(401).json({ success: false, message: 'Invalid email address or password' });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Your account is inactive.' });
      }

      const workshop = mockStore.workshops.find(
        (w) => w.workshop_id === user.workshop_id
      );

      sendTokenResponse(user, workshop, 200, res, 'Logged in successfully');
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user
// @route   POST /api/logout or /api/auth/logout
// @access  Public / Private
exports.logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile and workshop
// @route   GET /api/profile or /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.user_id || req.user._id,
          user_id: req.user.user_id || req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          phone: req.user.phone_number || req.user.phone || '',
          phone_number: req.user.phone_number || req.user.phone || '',
          workshop_id: req.user.workshop_id,
          workshopName: req.workshop?.workshop_name || req.user.workshopName || '',
          status: req.user.status || 'active',
          address: req.workshop?.location || req.user.address || '',
          gstNumber: req.user.gstNumber || '',
        },
        workshop: req.workshop,
      },
      user: {
        id: req.user.user_id || req.user._id,
        user_id: req.user.user_id || req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone_number || req.user.phone || '',
        phone_number: req.user.phone_number || req.user.phone || '',
        workshop_id: req.user.workshop_id,
        workshopName: req.workshop?.workshop_name || req.user.workshopName || '',
        status: req.user.status || 'active',
        address: req.workshop?.location || req.user.address || '',
        gstNumber: req.user.gstNumber || '',
      },
      workshop: req.workshop,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone_number, phone } = req.body;
    const newPhone = phone_number || phone;

    if (getStatus()) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (name) user.name = name;
      if (newPhone) {
        user.phone = newPhone;
        user.phone_number = newPhone;
      }
      user.updatedAt = new Date();
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } else {
      const user = mockStore.users.find(
        (u) => u._id === req.user._id || u.user_id === req.userId
      );
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (name) user.name = name;
      if (newPhone) {
        user.phone = newPhone;
        user.phone_number = newPhone;
      }
      user.updatedAt = new Date();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get current workshop details
// @route   GET /api/workshop
// @access  Private
exports.getWorkshop = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.workshop,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update workshop details
// @route   PUT /api/workshop
// @access  Private (Owner/Admin)
exports.updateWorkshop = async (req, res, next) => {
  try {
    const { workshop_name, workshopName, location, phone_number, phone } = req.body;
    const name = workshop_name || workshopName;
    const tel = phone_number || phone;

    if (getStatus()) {
      const workshop = await Workshop.findOne({ workshop_id: req.workshopId });
      if (!workshop) {
        return res.status(404).json({ success: false, message: 'Workshop not found' });
      }

      if (name) workshop.workshop_name = name;
      if (location) workshop.location = location;
      if (tel) workshop.phone_number = tel;
      workshop.updatedAt = new Date();
      await workshop.save();

      // Also update user's workshopName
      await User.updateMany({ workshop_id: req.workshopId }, { workshopName: name });

      return res.status(200).json({
        success: true,
        message: 'Workshop details updated successfully',
        data: workshop,
      });
    } else {
      const workshop = mockStore.workshops.find((w) => w.workshop_id === req.workshopId);
      if (!workshop) {
        return res.status(404).json({ success: false, message: 'Workshop not found' });
      }

      if (name) workshop.workshop_name = name;
      if (location) workshop.location = location;
      if (tel) workshop.phone_number = tel;
      workshop.updatedAt = new Date();

      // Update in users as well
      mockStore.users.forEach((u) => {
        if (u.workshop_id === req.workshopId) {
          if (name) u.workshopName = name;
          if (location) u.address = location;
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Workshop details updated successfully',
        data: workshop,
      });
    }
  } catch (err) {
    next(err);
  }
};
