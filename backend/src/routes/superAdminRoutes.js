const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  getWorkshops,
  getWorkshopDetails,
  updateWorkshopStatus,
  getActiveSessions,
  revokeUserSession,
  getPlatformBranding,
  updatePlatformBranding,
  getPlatformReports,
  getActivityLogs,
  getPlatformSettings,
  updatePlatformSettings,
} = require('../controllers/superAdminController');

// Public or auth branding read
router.get('/branding', getPlatformBranding);

// Protected Super Admin Routes (Require Super Admin Role)
router.use(protect);
router.use(requireSuperAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Workshop Management
router.get('/workshops', getWorkshops);
router.get('/workshops/:id', getWorkshopDetails);
router.put('/workshops/:id/status', updateWorkshopStatus);

// Active User Sessions Monitoring
router.get('/sessions', getActiveSessions);
router.delete('/sessions/:id', revokeUserSession);

// Branding Management
router.put('/branding', upload.single('logo'), updatePlatformBranding);

// Reports
router.get('/reports', getPlatformReports);

// Activity Logs
router.get('/logs', getActivityLogs);

// System Settings
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

module.exports = router;

