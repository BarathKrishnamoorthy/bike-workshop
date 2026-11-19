const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  lookupByMobile,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/lookup/:mobile', lookupByMobile);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
