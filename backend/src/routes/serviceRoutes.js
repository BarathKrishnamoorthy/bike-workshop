const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getServices)
  .post(createService);

router.route('/:id')
  .get(getServiceById)
  .put(updateService)
  .delete(deleteService);

router.patch('/:id/status', updateServiceStatus);

module.exports = router;
