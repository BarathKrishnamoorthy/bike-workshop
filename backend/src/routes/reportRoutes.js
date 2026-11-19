const express = require('express');
const router = express.Router();
const {
  getCustomerReport,
  getServiceReport,
  getRemindersReport,
  getPendingPaymentsReport,
  getCollectionsReport,
  getCustomerDossierReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/customer-dossier/:mobile', getCustomerDossierReport);
router.get('/customers', getCustomerReport);
router.get('/services', getServiceReport);
router.get('/reminders', getRemindersReport);
router.get('/pending-payments', getPendingPaymentsReport);
router.get('/collections', getCollectionsReport);

module.exports = router;
