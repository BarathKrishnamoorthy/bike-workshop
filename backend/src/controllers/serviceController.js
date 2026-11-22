const Service = require('../models/Service');
const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// Helper to generate next Job Card number per workshop
const generateJobCardNumber = async (workshopId) => {
  const year = new Date().getFullYear();
  if (getStatus()) {
    const count = await Service.countDocuments({ workshop_id: workshopId });
    return `JC-${year}-${String(count + 1).padStart(4, '0')}`;
  } else {
    const count = mockStore.services.filter((s) => s.workshop_id === workshopId).length;
    return `JC-${year}-${String(count + 1).padStart(4, '0')}`;
  }
};

// Helper to generate Invoice Number for advance payments
const generateInvoiceNumber = async (workshopId = null) => {
  const year = new Date().getFullYear();
  if (getStatus()) {
    const filter = workshopId ? { workshop_id: workshopId } : {};
    const count = await Payment.countDocuments(filter);
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  } else {
    const count = workshopId
      ? mockStore.payments.filter((p) => p.workshop_id === workshopId).length
      : mockStore.payments.length;
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
};

// @desc    Get all services / job cards for current workshop
// @route   GET /api/services
// @access  Private
exports.getServices = async (req, res, next) => {
  try {
    const { status, customerId, bikeId, paymentStatus, search, date, mobile } = req.query;
    const workshopId = req.workshopId;

    if (getStatus()) {
      let query = { workshop_id: workshopId };
      if (status) query.status = status;
      if (customerId) query.customer = customerId;
      if (bikeId) query.bike = bikeId;
      if (paymentStatus) query.paymentStatus = paymentStatus;

      // Filter by customer mobile within workshop
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        const matchingCustomers = await Customer.find({
          workshop_id: workshopId,
          mobile: { $regex: cleanMobile, $options: 'i' },
        }).select('_id');
        const customerIds = matchingCustomers.map((c) => c._id);
        query.customer = { $in: customerIds };
      }

      if (search) {
        const matchingCustomers = await Customer.find({
          workshop_id: workshopId,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } },
          ],
        }).select('_id');
        const customerIds = matchingCustomers.map((c) => c._id);

        const matchingBikes = await Bike.find({
          workshop_id: workshopId,
          $or: [
            { registrationNumber: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
            { model: { $regex: search, $options: 'i' } },
          ],
        }).select('_id');
        const bikeIds = matchingBikes.map((b) => b._id);

        query.$and = [
          { workshop_id: workshopId },
          {
            $or: [
              { jobCardNumber: { $regex: search, $options: 'i' } },
              { serviceType: { $regex: search, $options: 'i' } },
              { customer: { $in: customerIds } },
              { bike: { $in: bikeIds } },
            ],
          },
        ];
      }

      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query.serviceDate = { $gte: start, $lte: end };
      }

      const services = await Service.find(query)
        .populate('customer', 'name mobile email address')
        .populate('bike', 'brand model registrationNumber currentKilometre fuelType color')
        .sort({ serviceDate: -1, createdAt: -1 });

      return res.status(200).json({ success: true, count: services.length, data: services });
    } else {
      let list = mockStore.services.filter((s) => s.workshop_id === workshopId);
      if (status) list = list.filter((s) => s.status === status);
      if (customerId) list = list.filter((s) => s.customer === customerId);
      if (bikeId) list = list.filter((s) => s.bike === bikeId);
      if (paymentStatus) list = list.filter((s) => s.paymentStatus === paymentStatus);

      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        list = list.filter((s) => {
          const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
          return c && c.mobile.replace(/\D/g, '').includes(cleanMobile);
        });
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter((s) => {
          const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
          const b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);
          const customerMatch = c && (c.name.toLowerCase().includes(q) || c.mobile.includes(q));
          const bikeMatch = b && (b.registrationNumber.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q));
          const cardMatch = s.jobCardNumber.toLowerCase().includes(q) || s.serviceType.toLowerCase().includes(q);
          const compMatch = s.customerComplaints && s.customerComplaints.some((complaint) => complaint.toLowerCase().includes(q));
          return customerMatch || bikeMatch || cardMatch || compMatch;
        });
      }

      if (date) {
        const targetDate = new Date(date).toDateString();
        list = list.filter((s) => new Date(s.serviceDate).toDateString() === targetDate);
      }

      const populated = list.map((s) => {
        const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
        const b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);
        return {
          ...s,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email, address: c.address } : null,
          bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber, currentKilometre: b.currentKilometre, fuelType: b.fuelType, color: b.color } : null,
        };
      });

      return res.status(200).json({ success: true, count: populated.length, data: populated });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get single service / job card by ID
// @route   GET /api/services/:id
// @access  Private
exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;

    if (getStatus()) {
      const service = await Service.findOne({ _id: id, workshop_id: workshopId })
        .populate('customer', 'name mobile email address')
        .populate('bike', 'brand model registrationNumber currentKilometre fuelType color chassisNumber engineNumber');

      if (!service) {
        return res.status(404).json({ success: false, message: 'Service job card not found in this workshop' });
      }

      return res.status(200).json({ success: true, data: service });
    } else {
      const service = mockStore.services.find((s) => s._id === id && s.workshop_id === workshopId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service job card not found in this workshop' });
      }

      const c = mockStore.customers.find((cust) => cust._id === service.customer && cust.workshop_id === workshopId);
      const b = mockStore.bikes.find((bk) => bk._id === service.bike && bk.workshop_id === workshopId);

      return res.status(200).json({
        success: true,
        data: {
          ...service,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email, address: c.address } : null,
          bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber, currentKilometre: b.currentKilometre, fuelType: b.fuelType, color: b.color, chassisNumber: b.chassisNumber, engineNumber: b.engineNumber } : null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Create service booking / Job card
// @route   POST /api/services
// @access  Private
exports.createService = async (req, res, next) => {
  try {
    const {
      customerId,
      bikeId,
      serviceDate,
      deliveryDate,
      serviceType,
      customerComplaints,
      workPerformed,
      spareParts,
      labourCharges,
      discount,
      taxRate,
      currentKilometre,
      nextServiceDate,
      nextServiceKilometre,
      status,
      assignedMechanic,
      paidAmount,
      notes,
    } = req.body;

    const workshopId = req.workshopId;
    const userId = req.userId;

    if (!customerId || !bikeId) {
      return res.status(400).json({
        success: false,
        message: 'Customer and Bike selection are required to create a Job Card',
      });
    }

    const jobCardNumber = await generateJobCardNumber(workshopId);

    // Calculate totals
    const parts = Array.isArray(spareParts) ? spareParts : [];
    const labour = Array.isArray(labourCharges) ? labourCharges : [];

    const sparePartsTotal = parts.reduce((acc, p) => acc + (Number(p.quantity || 1) * Number(p.unitPrice || 0)), 0);
    const labourTotal = labour.reduce((acc, l) => acc + Number(l.amount || 0), 0);
    const discountVal = Number(discount) || 0;
    const subtotal = Math.max(0, sparePartsTotal + labourTotal - discountVal);
    const taxR = taxRate !== undefined ? Number(taxRate) : 18;
    const taxAmount = Math.round((subtotal * taxR) / 100);
    const totalAmount = Math.round(subtotal + taxAmount);
    const paid = Number(paidAmount) || 0;
    const pendingBalance = Math.max(0, totalAmount - paid);

    let paymentStatus = 'Pending';
    if (paid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Paid';
    } else if (paid > 0) {
      paymentStatus = 'Partial';
    }

    const curKm = Number(currentKilometre) || 0;
    const calculatedNextKm = nextServiceKilometre ? Number(nextServiceKilometre) : curKm + 3000;
    const calculatedNextDate = nextServiceDate ? new Date(nextServiceDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    if (getStatus()) {
      // Validate customer & bike belong to this workshop
      const cust = await Customer.findOne({ _id: customerId, workshop_id: workshopId });
      if (!cust) {
        return res.status(404).json({ success: false, message: 'Selected customer not found in this workshop' });
      }

      const service = await Service.create({
        workshop_id: workshopId,
        user_id: userId,
        jobCardNumber,
        customer: customerId,
        bike: bikeId,
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        serviceType: serviceType || 'General Service',
        customerComplaints: customerComplaints || [],
        workPerformed: workPerformed || '',
        spareParts: parts,
        labourCharges: labour,
        sparePartsTotal,
        labourTotal,
        discount: discountVal,
        taxRate: taxR,
        taxAmount,
        totalAmount,
        paidAmount: paid,
        pendingBalance,
        currentKilometre: curKm,
        nextServiceDate: calculatedNextDate,
        nextServiceKilometre: calculatedNextKm,
        status: status || 'Booked',
        paymentStatus,
        notes: notes || '',
      });

      if (curKm > 0) {
        await Bike.findOneAndUpdate({ _id: bikeId, workshop_id: workshopId }, { currentKilometre: curKm });
      }

      // Automatically create advance Payment receipt if advance payment was collected
      if (paid > 0) {
        const invNumber = await generateInvoiceNumber();
        await Payment.create({
          invoiceNumber: invNumber,
          service: service._id,
          customer: customerId,
          totalAmount,
          amountPaid: paid,
          paymentType: 'Advance',
          paymentMethod: req.body.paymentMethod || 'UPI',
          transactionReference: req.body.transactionReference || '',
          pendingBalance,
          paymentDate: new Date(),
          receivedBy: req.user ? req.user.name : 'Admin',
          notes: 'Advance booking payment',
        });
      }

      const populated = await Service.findById(service._id)
        .populate('customer', 'name mobile email address')
        .populate('bike', 'brand model registrationNumber currentKilometre fuelType color');

      return res.status(201).json({ success: true, data: populated });
    } else {
      const cust = mockStore.customers.find((c) => c._id === customerId && c.workshop_id === workshopId);
      if (!cust) {
        return res.status(404).json({ success: false, message: 'Selected customer not found in this workshop' });
      }

      const newId = 'srv_' + Date.now();
      const newService = {
        _id: newId,
        workshop_id: workshopId,
        user_id: userId,
        jobCardNumber,
        customer: customerId,
        bike: bikeId,
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        serviceType: serviceType || 'General Service',
        customerComplaints: customerComplaints || [],
        workPerformed: workPerformed || '',
        spareParts: parts.map((p, i) => ({
          ...p,
          _id: 'sp_' + i + '_' + Date.now(),
          total: (Number(p.quantity) || 1) * (Number(p.unitPrice) || 0),
        })),
        labourCharges: labour.map((l, i) => ({
          ...l,
          _id: 'lc_' + i + '_' + Date.now(),
        })),
        sparePartsTotal,
        labourTotal,
        discount: discountVal,
        taxRate: taxR,
        taxAmount,
        totalAmount,
        paidAmount: paid,
        pendingBalance,
        currentKilometre: curKm,
        nextServiceDate: calculatedNextDate,
        nextServiceKilometre: calculatedNextKm,
        status: status || 'Booked',
        paymentStatus,
        assignedMechanic: assignedMechanic || 'Chief Mechanic',
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStore.services.unshift(newService);

      // Automatically create advance Payment receipt in mockStore if advance was collected
      if (paid > 0) {
        const invNumber = await generateInvoiceNumber(workshopId);
        mockStore.payments.unshift({
          _id: 'pay_' + Date.now(),
          workshop_id: workshopId,
          user_id: req.userId,
          invoiceNumber: invNumber,
          service: newId,
          customer: customerId,
          totalAmount,
          amountPaid: paid,
          paymentType: 'Advance',
          paymentMethod: req.body.paymentMethod || 'UPI',
          transactionReference: req.body.transactionReference || '',
          pendingBalance,
          paymentDate: new Date(),
          receivedBy: req.user ? req.user.name : 'Admin',
          notes: 'Advance booking payment',
        });
      }

      // Update bike kilometre in mock
      const targetBike = mockStore.bikes.find((b) => b._id === bikeId && b.workshop_id === workshopId);
      if (targetBike && curKm > 0) {
        targetBike.currentKilometre = curKm;
      }

      return res.status(201).json({
        success: true,
        data: {
          ...newService,
          customer: { _id: cust._id, name: cust.name, mobile: cust.mobile, email: cust.email, address: cust.address },
          bike: targetBike ? { _id: targetBike._id, brand: targetBike.brand, model: targetBike.model, registrationNumber: targetBike.registrationNumber, currentKilometre: targetBike.currentKilometre, fuelType: targetBike.fuelType, color: targetBike.color } : null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Update service / Job card
// @route   PUT /api/services/:id
// @access  Private
exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;
    const {
      serviceDate,
      deliveryDate,
      serviceType,
      customerComplaints,
      workPerformed,
      spareParts,
      labourCharges,
      discount,
      taxRate,
      currentKilometre,
      nextServiceDate,
      nextServiceKilometre,
      status,
      assignedMechanic,
      paidAmount,
      notes,
    } = req.body;

    const parts = Array.isArray(spareParts) ? spareParts : [];
    const labour = Array.isArray(labourCharges) ? labourCharges : [];
    const sparePartsTotal = parts.reduce((acc, p) => acc + (Number(p.quantity || 1) * Number(p.unitPrice || 0)), 0);
    const labourTotal = labour.reduce((acc, l) => acc + Number(l.amount || 0), 0);
    const discountVal = Number(discount) || 0;
    const subtotal = Math.max(0, sparePartsTotal + labourTotal - discountVal);
    const taxR = taxRate !== undefined ? Number(taxRate) : 18;
    const taxAmount = Math.round((subtotal * taxR) / 100);
    const totalAmount = Math.round(subtotal + taxAmount);
    const paid = Number(paidAmount) || 0;
    const pendingBalance = Math.max(0, totalAmount - paid);

    let paymentStatus = 'Pending';
    if (paid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Paid';
    } else if (paid > 0) {
      paymentStatus = 'Partial';
    }

    if (getStatus()) {
      const updateData = {
        serviceDate,
        deliveryDate,
        serviceType,
        customerComplaints,
        workPerformed,
        spareParts: parts,
        labourCharges: labour,
        sparePartsTotal,
        labourTotal,
        discount: discountVal,
        taxRate: taxR,
        taxAmount,
        totalAmount,
        paidAmount: paid,
        pendingBalance,
        currentKilometre: Number(currentKilometre) || 0,
        nextServiceDate,
        nextServiceKilometre: Number(nextServiceKilometre) || 0,
        status,
        paymentStatus,
        assignedMechanic,
        notes,
        updatedAt: new Date(),
      };

      const service = await Service.findOneAndUpdate(
        { _id: id, workshop_id: workshopId },
        updateData,
        { new: true, runValidators: true }
      )
        .populate('customer', 'name mobile email address')
        .populate('bike', 'brand model registrationNumber currentKilometre fuelType color');

      if (!service) {
        return res.status(404).json({ success: false, message: 'Service job card not found in this workshop' });
      }

      if (currentKilometre && service.bike) {
        await Bike.findOneAndUpdate({ _id: service.bike._id, workshop_id: workshopId }, { currentKilometre });
      }

      return res.status(200).json({ success: true, data: service });
    } else {
      const index = mockStore.services.findIndex((s) => s._id === id && s.workshop_id === workshopId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Service job card not found in this workshop' });
      }

      const existing = mockStore.services[index];
      const updated = {
        ...existing,
        serviceDate: serviceDate ? new Date(serviceDate) : existing.serviceDate,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : existing.deliveryDate,
        serviceType: serviceType || existing.serviceType,
        customerComplaints: customerComplaints !== undefined ? customerComplaints : existing.customerComplaints,
        workPerformed: workPerformed !== undefined ? workPerformed : existing.workPerformed,
        spareParts: parts.length > 0 ? parts : existing.spareParts,
        labourCharges: labour.length > 0 ? labour : existing.labourCharges,
        sparePartsTotal,
        labourTotal,
        discount: discountVal,
        taxRate: taxR,
        taxAmount,
        totalAmount,
        paidAmount: paid,
        pendingBalance,
        currentKilometre: currentKilometre !== undefined ? Number(currentKilometre) : existing.currentKilometre,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : existing.nextServiceDate,
        nextServiceKilometre: nextServiceKilometre !== undefined ? Number(nextServiceKilometre) : existing.nextServiceKilometre,
        status: status || existing.status,
        paymentStatus,
        assignedMechanic: assignedMechanic || existing.assignedMechanic,
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: new Date(),
      };

      mockStore.services[index] = updated;

      if (currentKilometre) {
        const bk = mockStore.bikes.find((b) => b._id === updated.bike && b.workshop_id === workshopId);
        if (bk) bk.currentKilometre = Number(currentKilometre);
      }

      const c = mockStore.customers.find((cust) => cust._id === updated.customer && cust.workshop_id === workshopId);
      const b = mockStore.bikes.find((bk) => bk._id === updated.bike && bk.workshop_id === workshopId);

      return res.status(200).json({
        success: true,
        data: {
          ...updated,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email, address: c.address } : null,
          bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber, currentKilometre: b.currentKilometre, fuelType: b.fuelType, color: b.color } : null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Update service status only
// @route   PATCH /api/services/:id/status
// @access  Private
exports.updateServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const workshopId = req.workshopId;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    if (getStatus()) {
      const updatePayload = { status, updatedAt: new Date() };
      if (status === 'Delivered') {
        updatePayload.deliveryDate = new Date();
      }

      const service = await Service.findOneAndUpdate(
        { _id: id, workshop_id: workshopId },
        updatePayload,
        { new: true }
      )
        .populate('customer', 'name mobile email')
        .populate('bike', 'brand model registrationNumber');

      if (!service) {
        return res.status(404).json({ success: false, message: 'Service job card not found in this workshop' });
      }

      return res.status(200).json({ success: true, data: service });
    } else {
      const index = mockStore.services.findIndex((s) => s._id === id && s.workshop_id === workshopId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Service job card not found in this workshop' });
      }

      mockStore.services[index].status = status;
      mockStore.services[index].updatedAt = new Date();
      if (status === 'Delivered') {
        mockStore.services[index].deliveryDate = new Date();
      }

      const s = mockStore.services[index];
      const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
      const b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);

      return res.status(200).json({
        success: true,
        data: {
          ...s,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email } : null,
          bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshopId = req.workshopId;

    if (getStatus()) {
      const service = await Service.findOneAndDelete({ _id: id, workshop_id: workshopId });
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found in this workshop' });
      }
      return res.status(200).json({ success: true, message: 'Service job card removed successfully' });
    } else {
      const index = mockStore.services.findIndex((s) => s._id === id && s.workshop_id === workshopId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Service not found in this workshop' });
      }

      mockStore.services.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Service job card removed successfully' });
    }
  } catch (err) {
    next(err);
  }
};
