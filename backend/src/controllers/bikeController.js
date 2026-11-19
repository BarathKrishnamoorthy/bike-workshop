const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// @desc    Get all bikes
// @route   GET /api/bikes
// @access  Private
exports.getBikes = async (req, res, next) => {
  try {
    const { search, customerId } = req.query;

    if (getStatus()) {
      let query = {};
      if (customerId) query.customer = customerId; 
      if (search) {
        query.$or = [
          { registrationNumber: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
        ];
      }
      const bikes = await Bike.find(query).populate('customer', 'name mobile email').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: bikes.length, data: bikes });
    } else {
      let list = [...mockStore.bikes];
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
        const c = mockStore.customers.find((cust) => cust._id === b.customer);
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

    if (getStatus()) {
      const bike = await Bike.findById(id).populate('customer');
      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found' });
      }

      const services = await Service.find({ bike: id }).sort({ serviceDate: -1 });

      return res.status(200).json({
        success: true,
        data: {
          ...bike.toObject(),
          serviceHistory: services,
        },
      });
    } else {
      const bike = mockStore.bikes.find((b) => b._id === id);
      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found' });
      }

      const customer = mockStore.customers.find((c) => c._id === bike.customer);
      const services = mockStore.services.filter((s) => s.bike === id).sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

      return res.status(200).json({
        success: true,
        data: {
          ...bike,
          customer,
          serviceHistory: services,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Add new bike to existing customer
// @route   POST /api/bikes
// @access  Private
exports.createBike = async (req, res, next) => {
  try {
    const { customerId, brand, model, registrationNumber, currentKilometre, year, fuelType, color, chassisNumber, engineNumber } = req.body;

    if (!customerId || !brand || !model || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, Brand, Model and Registration Number are required',
      });
    }

    if (getStatus()) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const bike = await Bike.create({
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
      const customer = mockStore.customers.find((c) => c._id === customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const newId = 'bike_' + Date.now();
      const newBike = {
        _id: newId,
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

// @desc    Update bike details / current kilometre reading
// @route   PUT /api/bikes/:id
// @access  Private
exports.updateBike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model, registrationNumber, currentKilometre, year, fuelType, color, chassisNumber, engineNumber } = req.body;

    if (getStatus()) {
      const bike = await Bike.findByIdAndUpdate(
        id,
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
        },
        { new: true, runValidators: true }
      ).populate('customer', 'name mobile email');

      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found' });
      }

      return res.status(200).json({ success: true, data: bike });
    } else {
      const index = mockStore.bikes.findIndex((b) => b._id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Bike not found' });
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
      };

      const c = mockStore.customers.find((cust) => cust._id === mockStore.bikes[index].customer);
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

    if (getStatus()) {
      const bike = await Bike.findByIdAndDelete(id);
      if (!bike) {
        return res.status(404).json({ success: false, message: 'Bike not found' });
      }
      await Customer.findByIdAndUpdate(bike.customer, { $pull: { bikes: id } });
      return res.status(200).json({ success: true, message: 'Bike removed successfully' });
    } else {
      const index = mockStore.bikes.findIndex((b) => b._id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Bike not found' });
      }
      const [deleted] = mockStore.bikes.splice(index, 1);
      const cust = mockStore.customers.find((c) => c._id === deleted.customer);
      if (cust && cust.bikes) {
        cust.bikes = cust.bikes.filter((bikeId) => bikeId !== id);
      }
      return res.status(200).json({ success: true, message: 'Bike removed successfully' });
    }
  } catch (err) {
    next(err);
  }
};
