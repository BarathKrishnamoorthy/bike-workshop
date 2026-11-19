const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .get(getPaymentById);

module.exports = router;
