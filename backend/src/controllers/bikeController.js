const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// @desc    Get all bikes for current workshop
// @route   GET /api/bikes
// @access  Private
exports.getBikes = async (req, res, next) => {
  try {
    const { search, customerId } = req.query;
    const workshopId = req.workshopId;

    if (getStatus()) {
      let query = { workshop_id: workshopId };
      if (customerId) query.customer = customerId;
      if (search) {
        query.$and = [
          { workshop_id: workshopId },
          {
            $or: [
              { registrationNumber: { $regex: search, $options: 'i' } },
              { brand: { $regex: search, $options: 'i' } },
              { model: { $regex: search, $options: 'i' } },
            ],
          },
        ];
      }
      const bikes = await Bike.find(query).populate('customer', 'name mobile email').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: bikes.length, data: bikes });
    } else {
      let list = mockStore.bikes.filter((b) => b.workshop_id === workshopId);
      if (customerId) {
        list = list.filter((b) => b.customer === customerId);
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (b) =>
            b.registrationNumber.toLowerCase().includes(q) ||
            b.brand.toLowerCase().includes(q) ||
            b.model.toLowerCase().includes(q)
        );
      }
      const populated = list.map((b) => {
        const c = mockStore.customers.find((cust) => cust._id === b.customer && cust.workshop_id === workshopId);
        return {
          ...b,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email } : null,
        };
      });
      return res.status(200).json({ success: true, count: populated.length, data: populated });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get single bike with service history
// @route   GET /api/bikes/:id
// @access  Private
exports.getBikeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;

    if (getStatus()) {
      const bike = await Bike.findOne({ _id: id, workshop_id: workshopId }).populate('customer');
      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found in this workshop' });
      }

      const services = await Service.find({ bike: id, workshop_id: workshopId }).sort({ serviceDate: -1 });

      return res.status(200).json({
        success: true,
        data: {
          ...bike.toObject(),
          serviceHistory: services,
        },
      });
    } else {
      const bike = mockStore.bikes.find((b) => b._id === id && b.workshop_id === workshopId);
      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found in this workshop' });
      }

      const c = mockStore.customers.find((cust) => cust._id === bike.customer && cust.workshop_id === workshopId);
      const services = mockStore.services
        .filter((s) => s.bike === id && s.workshop_id === workshopId)
        .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

      return res.status(200).json({
        success: true,
        data: {
          ...bike,
          customer: c,
          serviceHistory: services,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Add new bike to existing customer in current workshop
// @route   POST /api/bikes
// @access  Private
exports.createBike = async (req, res, next) => {
  try {
    const { customerId, brand, model, registrationNumber, currentKilometre, year, fuelType, color, chassisNumber, engineNumber } = req.body;
    const workshopId = req.workshopId;
    const userId = req.userId;

    if (!customerId || !brand || !model || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, Brand, Model and Registration Number are required',
      });
    }

    if (getStatus()) {
      const customer = await Customer.findOne({ _id: customerId, workshop_id: workshopId });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }

      const bike = await Bike.create({
        workshop_id: workshopId,
        user_id: userId,
        customer: customerId,
        brand,
        model,
        registrationNumber: registrationNumber.toUpperCase(),
        currentKilometre: currentKilometre || 0,
        year: year || new Date().getFullYear(),
        fuelType: fuelType || 'Petrol',
        color: color || '',
        chassisNumber: chassisNumber || '',
        engineNumber: engineNumber || '',
      });

      customer.bikes.push(bike._id);
      await customer.save();

      const populated = await Bike.findById(bike._id).populate('customer', 'name mobile email');
      return res.status(201).json({ success: true, data: populated });
    } else {
      const customer = mockStore.customers.find((c) => c._id === customerId && c.workshop_id === workshopId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }

      const newId = 'bike_' + Date.now();
      const newBike = {
        _id: newId,
        workshop_id: workshopId,
        user_id: userId,
        customer: customerId,
        brand,
        model,
        registrationNumber: registrationNumber.toUpperCase(),
        currentKilometre: Number(currentKilometre) || 0,
        year: Number(year) || new Date().getFullYear(),
        fuelType: fuelType || 'Petrol',
        color: color || '',
        chassisNumber: chassisNumber || '',
        engineNumber: engineNumber || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStore.bikes.push(newBike);
      if (!customer.bikes) customer.bikes = [];
      customer.bikes.push(newId);

      return res.status(201).json({
        success: true,
        data: {
          ...newBike,
          customer: { _id: customer._id, name: customer.name, mobile: customer.mobile, email: customer.email },
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Update bike
// @route   PUT /api/bikes/:id
// @access  Private
exports.updateBike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;
    const { brand, model, registrationNumber, currentKilometre, year, fuelType, color, chassisNumber, engineNumber } = req.body;

    if (getStatus()) {
      const bike = await Bike.findOneAndUpdate(
        { _id: id, workshop_id: workshopId },
        {
          brand,
          model,
          registrationNumber: registrationNumber ? registrationNumber.toUpperCase() : undefined,
          currentKilometre,
          year,
          fuelType,
          color,
          chassisNumber,
          engineNumber,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).populate('customer', 'name mobile email');

      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found in this workshop' });
      }

      return res.status(200).json({ success: true, data: bike });
    } else {
      const index = mockStore.bikes.findIndex((b) => b._id === id && b.workshop_id === workshopId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Bike not found in this workshop' });
      }

      mockStore.bikes[index] = {
        ...mockStore.bikes[index],
        brand: brand || mockStore.bikes[index].brand,
        model: model || mockStore.bikes[index].model,
        registrationNumber: registrationNumber ? registrationNumber.toUpperCase() : mockStore.bikes[index].registrationNumber,
        currentKilometre: currentKilometre !== undefined ? Number(currentKilometre) : mockStore.bikes[index].currentKilometre,
        year: year !== undefined ? Number(year) : mockStore.bikes[index].year,
        fuelType: fuelType || mockStore.bikes[index].fuelType,
        color: color !== undefined ? color : mockStore.bikes[index].color,
        chassisNumber: chassisNumber !== undefined ? chassisNumber : mockStore.bikes[index].chassisNumber,
        engineNumber: engineNumber !== undefined ? engineNumber : mockStore.bikes[index].engineNumber,
        updatedAt: new Date(),
      };

      const c = mockStore.customers.find((cust) => cust._id === mockStore.bikes[index].customer && cust.workshop_id === workshopId);
      return res.status(200).json({
        success: true,
        data: {
          ...mockStore.bikes[index],
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email } : null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Delete bike
// @route   DELETE /api/bikes/:id
// @access  Private
exports.deleteBike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;

    if (getStatus()) {
      const bike = await Bike.findOneAndDelete({ _id: id, workshop_id: workshopId });
      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found in this workshop' });
      }

      // Remove from customer's bikes array
      await Customer.updateOne(
        { _id: bike.customer, workshop_id: workshopId },
        { $pull: { bikes: id } }
      );

      return res.status(200).json({ success: true, message: 'Bike deleted successfully' });
    } else {
      const index = mockStore.bikes.findIndex((b) => b._id === id && b.workshop_id === workshopId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Bike not found in this workshop' });
      }

      const customerId = mockStore.bikes[index].customer;
      mockStore.bikes.splice(index, 1);

      // Remove from mock customer's bike array
      const customer = mockStore.customers.find((c) => c._id === customerId && c.workshop_id === workshopId);
      if (customer && customer.bikes) {
        customer.bikes = customer.bikes.filter((bId) => bId !== id);
      }

      return res.status(200).json({ success: true, message: 'Bike deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};
