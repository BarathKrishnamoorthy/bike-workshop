const Customer = require('../models/Customer');
const Bike = require('../models/Bike');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// @desc    Get all customers for current workshop with optional search & pagination
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const workshopId = req.workshopId;

    if (getStatus()) {
      let query = { workshop_id: workshopId };
      if (search) {
        query.$and = [
          { workshop_id: workshopId },
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { mobile: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
          },
        ];
      }
      const customers = await Customer.find(query).populate('bikes').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: customers.length, data: customers });
    } else {
      let list = mockStore.customers.filter((c) => c.workshop_id === workshopId);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.mobile.includes(q) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
      }
      // Populate bikes for mock
      const populated = list.map((c) => {
        const customerBikes = mockStore.bikes.filter(
          (b) =>
            b.workshop_id === workshopId &&
            (b.customer === c._id || (c.bikes && c.bikes.includes(b._id)))
        );
        return { ...c, bikes: customerBikes };
      });
      return res.status(200).json({ success: true, count: populated.length, data: populated });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get single customer with bikes and service history
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;

    if (getStatus()) {
      const customer = await Customer.findOne({ _id: id, workshop_id: workshopId }).populate('bikes');
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }

      const services = await Service.find({ customer: id, workshop_id: workshopId })
        .populate('bike')
        .sort({ serviceDate: -1 });

      return res.status(200).json({
        success: true,
        data: {
          ...customer.toObject(),
          serviceHistory: services,
        },
      });
    } else {
      const customer = mockStore.customers.find(
        (c) => c._id === id && c.workshop_id === workshopId
      );
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }

      const customerBikes = mockStore.bikes.filter(
        (b) =>
          b.workshop_id === workshopId &&
          (b.customer === id || (customer.bikes && customer.bikes.includes(b._id)))
      );
      const services = mockStore.services
        .filter((s) => s.customer === id && s.workshop_id === workshopId)
        .map((s) => {
          const b = mockStore.bikes.find((bk) => bk._id === s.bike);
          return { ...s, bike: b };
        })
        .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

      return res.status(200).json({
        success: true,
        data: {
          ...customer,
          bikes: customerBikes,
          serviceHistory: services,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Create customer (with optional initial bike)
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, mobile, email, address, notes, initialBike } = req.body;
    const workshopId = req.workshopId;
    const userId = req.userId;

    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Name and Mobile number are required' });
    }

    if (getStatus()) {
      // Check within tenant workshop
      const existing = await Customer.findOne({ mobile, workshop_id: workshopId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A customer with this mobile number already exists in your workshop',
        });
      }

      const customer = await Customer.create({
        workshop_id: workshopId,
        user_id: userId,
        name,
        mobile,
        email: email || '',
        address: address || '',
        notes: notes || '',
        bikes: [],
      });

      if (initialBike && initialBike.brand && initialBike.model && initialBike.registrationNumber) {
        const bike = await Bike.create({
          workshop_id: workshopId,
          user_id: userId,
          customer: customer._id,
          brand: initialBike.brand,
          model: initialBike.model,
          registrationNumber: initialBike.registrationNumber.toUpperCase(),
          currentKilometre: initialBike.currentKilometre || 0,
          year: initialBike.year || new Date().getFullYear(),
          fuelType: initialBike.fuelType || 'Petrol',
          color: initialBike.color || '',
        });

        customer.bikes.push(bike._id);
        await customer.save();
      }

      const populated = await Customer.findById(customer._id).populate('bikes');
      return res.status(201).json({ success: true, data: populated });
    } else {
      const existing = mockStore.customers.find(
        (c) => c.mobile === mobile && c.workshop_id === workshopId
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A customer with this mobile number already exists in your workshop',
        });
      }

      const newId = 'cust_' + Date.now();
      const newBikes = [];

      if (initialBike && initialBike.brand && initialBike.model && initialBike.registrationNumber) {
        const bikeId = 'bike_' + Date.now();
        const bikeObj = {
          _id: bikeId,
          workshop_id: workshopId,
          user_id: userId,
          customer: newId,
          brand: initialBike.brand,
          model: initialBike.model,
          registrationNumber: initialBike.registrationNumber.toUpperCase(),
          currentKilometre: Number(initialBike.currentKilometre) || 0,
          year: Number(initialBike.year) || new Date().getFullYear(),
          fuelType: initialBike.fuelType || 'Petrol',
          color: initialBike.color || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockStore.bikes.push(bikeObj);
        newBikes.push(bikeId);
      }

      const newCustomer = {
        _id: newId,
        workshop_id: workshopId,
        user_id: userId,
        name,
        mobile,
        email: email || '',
        address: address || '',
        notes: notes || '',
        bikes: newBikes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStore.customers.push(newCustomer);

      const customerBikes = mockStore.bikes.filter(
        (b) => b.workshop_id === workshopId && (b.customer === newId || newBikes.includes(b._id))
      );

      return res.status(201).json({
        success: true,
        data: { ...newCustomer, bikes: customerBikes },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, address, notes } = req.body;
    const workshopId = req.workshopId;

    if (getStatus()) {
      const customer = await Customer.findOneAndUpdate(
        { _id: id, workshop_id: workshopId },
        { name, mobile, email, address, notes, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('bikes');

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }

      return res.status(200).json({ success: true, data: customer });
    } else {
      const index = mockStore.customers.findIndex(
        (c) => c._id === id && c.workshop_id === workshopId
      );
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }

      mockStore.customers[index] = {
        ...mockStore.customers[index],
        name: name || mockStore.customers[index].name,
        mobile: mobile || mockStore.customers[index].mobile,
        email: email !== undefined ? email : mockStore.customers[index].email,
        address: address !== undefined ? address : mockStore.customers[index].address,
        notes: notes !== undefined ? notes : mockStore.customers[index].notes,
        updatedAt: new Date(),
      };

      const customerBikes = mockStore.bikes.filter(
        (b) => b.workshop_id === workshopId && b.customer === id
      );
      return res.status(200).json({
        success: true,
        data: { ...mockStore.customers[index], bikes: customerBikes },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;

    if (getStatus()) {
      const customer = await Customer.findOneAndDelete({ _id: id, workshop_id: workshopId });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }
      await Bike.deleteMany({ customer: id, workshop_id: workshopId });
      await Service.deleteMany({ customer: id, workshop_id: workshopId });
      await Payment.deleteMany({ customer: id, workshop_id: workshopId });
      return res.status(200).json({ success: true, message: 'Customer and associated data removed' });
    } else {
      const index = mockStore.customers.findIndex(
        (c) => c._id === id && c.workshop_id === workshopId
      );
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Customer not found in this workshop' });
      }

      mockStore.customers.splice(index, 1);
      // Clean up mock references for this workshop
      const bikeIndices = [];
      mockStore.bikes.forEach((b, idx) => {
        if (b.customer === id && b.workshop_id === workshopId) bikeIndices.push(idx);
      });
      for (let i = bikeIndices.length - 1; i >= 0; i--) {
        mockStore.bikes.splice(bikeIndices[i], 1);
      }

      return res.status(200).json({ success: true, message: 'Customer and associated data removed' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Customer Identification by Mobile Number (Returns 360 profile within current workshop)
// @route   GET /api/customers/lookup/:mobile
// @access  Private
exports.lookupByMobile = async (req, res, next) => {
  try {
    const rawMobile = req.params.mobile ? req.params.mobile.replace(/\D/g, '') : '';
    const workshopId = req.workshopId;

    if (!rawMobile) {
      return res.status(400).json({ success: false, message: 'Please provide a valid mobile number' });
    }

    if (getStatus()) {
      let customer = await Customer.findOne({
        workshop_id: workshopId,
        mobile: rawMobile,
      }).populate('bikes');

      if (!customer) {
        customer = await Customer.findOne({
          workshop_id: workshopId,
          mobile: { $regex: rawMobile, $options: 'i' },
        }).populate('bikes');
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: `No customer found with mobile number ${rawMobile} in your workshop`,
        });
      }

      const services = await Service.find({ customer: customer._id, workshop_id: workshopId })
        .populate('bike')
        .sort({ serviceDate: -1 });
      const payments = await Payment.find({ customer: customer._id, workshop_id: workshopId })
        .sort({ paymentDate: -1 });

      const totalBilled = services.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      const totalPaid = services.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const pendingBalance = services.reduce((acc, s) => acc + (s.pendingBalance || 0), 0);
      const completedServicesCount = services.filter((s) => ['Ready', 'Delivered'].includes(s.status)).length;

      const upcomingServices = services
        .filter((s) => s.nextServiceDate && new Date(s.nextServiceDate) >= new Date())
        .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
      const nextServiceDate = upcomingServices.length > 0 ? upcomingServices[0].nextServiceDate : null;

      return res.status(200).json({
        success: true,
        data: {
          customer,
          bikes: customer.bikes || [],
          serviceHistory: services,
          payments,
          analytics: {
            totalBilled,
            totalPaid,
            pendingBalance,
            totalVisits: services.length,
            completedServices: completedServicesCount,
            nextServiceDate,
          },
        },
      });
    } else {
      let customer = mockStore.customers.find(
        (c) => c.workshop_id === workshopId && c.mobile.replace(/\D/g, '') === rawMobile
      );

      if (!customer) {
        customer = mockStore.customers.find(
          (c) => c.workshop_id === workshopId && c.mobile.replace(/\D/g, '').includes(rawMobile)
        );
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: `No customer found with mobile number ${rawMobile} in your workshop`,
        });
      }

      const bikes = mockStore.bikes.filter(
        (b) =>
          b.workshop_id === workshopId &&
          (b.customer === customer._id || (customer.bikes && customer.bikes.includes(b._id)))
      );

      const services = mockStore.services
        .filter((s) => s.workshop_id === workshopId && s.customer === customer._id)
        .map((s) => {
          const b = mockStore.bikes.find((bk) => bk._id === s.bike);
          return { ...s, bike: b };
        })
        .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

      const payments = mockStore.payments
        .filter((p) => p.workshop_id === workshopId && p.customer === customer._id)
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

      const totalBilled = services.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      const totalPaid = services.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const pendingBalance = services.reduce((acc, s) => acc + (s.pendingBalance || 0), 0);
      const completedServicesCount = services.filter((s) => ['Ready', 'Delivered'].includes(s.status)).length;

      const upcomingServices = services
        .filter((s) => s.nextServiceDate && new Date(s.nextServiceDate) >= new Date())
        .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
      const nextServiceDate = upcomingServices.length > 0 ? upcomingServices[0].nextServiceDate : null;

      return res.status(200).json({
        success: true,
        data: {
          customer,
          bikes,
          serviceHistory: services,
          payments,
          analytics: {
            totalBilled,
            totalPaid,
            pendingBalance,
            totalVisits: services.length,
            completedServices: completedServicesCount,
            nextServiceDate,
          },
        },
      });
    }
  } catch (err) {
    next(err);
  }
};
