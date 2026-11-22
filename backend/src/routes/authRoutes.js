const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  getWorkshop,
  updateWorkshop,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);
router.put('/profile', protect, updateProfile);

router.get('/workshop', protect, getWorkshop);
router.put('/workshop', protect, updateWorkshop);

module.exports = router;
