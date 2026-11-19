const express = require('express');
const router = express.Router();
const {
  getBikes,
  getBikeById,
  createBike,
  updateBike,
  deleteBike,
} = require('../controllers/bikeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getBikes)
  .post(createBike);

router.route('/:id')
  .get(getBikeById)
  .put(updateBike)
  .delete(deleteBike);

module.exports = router;
