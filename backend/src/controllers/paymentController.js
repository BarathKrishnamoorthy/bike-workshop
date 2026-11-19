const Payment = require('../models/Payment');
const Service = require('../models/Service');
const Customer = require('../models/Customer');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// Helper to generate Invoice Number
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  if (getStatus()) {
    const count = await Payment.countDocuments();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  } else {
    const count = mockStore.payments.length;
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { serviceId, customerId, paymentMethod, paymentType, search, mobile } = req.query;

    if (getStatus()) {
      let query = {};
      if (serviceId) query.service = serviceId;
      if (customerId) query.customer = customerId;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (paymentType) query.paymentType = paymentType;

      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        const matchingCustomers = await Customer.find({
          mobile: { $regex: cleanMobile, $options: 'i' },
        }).select('_id');
        query.customer = { $in: matchingCustomers.map((c) => c._id) };
      }

      if (search) {
        const matchingCustomers = await Customer.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } },
          ],
        }).select('_id');
        const customerIds = matchingCustomers.map((c) => c._id);

        query.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { transactionReference: { $regex: search, $options: 'i' } },
          { customer: { $in: customerIds } },
        ];
      }

      const payments = await Payment.find(query)
        .populate('customer', 'name mobile email')
        .populate({
          path: 'service',
          populate: { path: 'bike', select: 'brand model registrationNumber' },
        })
        .sort({ paymentDate: -1, createdAt: -1 });

      return res.status(200).json({ success: true, count: payments.length, data: payments });
    } else {
      let list = [...mockStore.payments];
      if (serviceId) list = list.filter((p) => p.service === serviceId);
      if (customerId) list = list.filter((p) => p.customer === customerId);
      if (paymentMethod) list = list.filter((p) => p.paymentMethod === paymentMethod);
      if (paymentType) list = list.filter((p) => p.paymentType === paymentType);

      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        list = list.filter((p) => {
          const c = mockStore.customers.find((cust) => cust._id === p.customer);
          return c && c.mobile.replace(/\D/g, '').includes(cleanMobile);
        });
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter((p) => {
          const c = mockStore.customers.find((cust) => cust._id === p.customer);
          const custMatch = c && (c.name.toLowerCase().includes(q) || c.mobile.includes(q));
          const invMatch = p.invoiceNumber.toLowerCase().includes(q);
          const refMatch = p.transactionReference && p.transactionReference.toLowerCase().includes(q);
          return custMatch || invMatch || refMatch;
        });
      }

      const populated = list.map((p) => {
        const c = mockStore.customers.find((cust) => cust._id === p.customer);
        const s = mockStore.services.find((srv) => srv._id === p.service);
        let b = null;
        if (s) {
          b = mockStore.bikes.find((bk) => bk._id === s.bike);
        }
        return {
          ...p,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email } : null,
          service: s ? { ...s, bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null } : null,
        };
      });

      return res.status(200).json({ success: true, count: populated.length, data: populated });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get single payment receipt / invoice by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getStatus()) {
      const payment = await Payment.findById(id)
        .populate('customer', 'name mobile email address')
        .populate({
          path: 'service',
          populate: { path: 'bike', select: 'brand model registrationNumber currentKilometre fuelType' },
        });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      return res.status(200).json({ success: true, data: payment });
    } else {
      const payment = mockStore.payments.find((p) => p._id === id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      const c = mockStore.customers.find((cust) => cust._id === payment.customer);
      const s = mockStore.services.find((srv) => srv._id === payment.service);
      const b = s ? mockStore.bikes.find((bk) => bk._id === s.bike) : null;

      return res.status(200).json({
        success: true,
        data: {
          ...payment,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email, address: c.address } : null,
          service: s ? { ...s, bike: b } : null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Record new payment (Advance, Partial, or Final)
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const {
      serviceId,
      customerId,
      amountPaid,
      paymentType,
      paymentMethod,
      transactionReference,
      notes,
    } = req.body;

    if (!serviceId || !amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid serviceId and positive amountPaid are required',
      });
    }

    const payAmt = Number(amountPaid);
    const invoiceNumber = await generateInvoiceNumber();

    if (getStatus()) {
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const totalAmount = service.totalAmount;
      const previouslyPaid = service.paidAmount || 0;
      const newPaidTotal = previouslyPaid + payAmt;
      const newPendingBalance = Math.max(0, totalAmount - newPaidTotal);

      // Determine payment status on service
      let newPaymentStatus = 'Pending';
      if (newPaidTotal >= totalAmount && totalAmount > 0) {
        newPaymentStatus = 'Paid';
      } else if (newPaidTotal > 0) {
        newPaymentStatus = 'Partial';
      }

      // Update Service record
      service.paidAmount = newPaidTotal;
      service.pendingBalance = newPendingBalance;
      service.paymentStatus = newPaymentStatus;
      await service.save();

      const payment = await Payment.create({
        invoiceNumber,
        service: serviceId,
        customer: customerId || service.customer,
        totalAmount,
        amountPaid: payAmt,
        paymentType: paymentType || (newPendingBalance === 0 ? 'Final' : 'Partial'),
        paymentMethod: paymentMethod || 'UPI',
        transactionReference: transactionReference || '',
        pendingBalance: newPendingBalance,
        paymentDate: new Date(),
        receivedBy: req.user ? req.user.name : 'Admin',
        notes: notes || '',
      });

      const populated = await Payment.findById(payment._id)
        .populate('customer', 'name mobile email')
        .populate({
          path: 'service',
          populate: { path: 'bike', select: 'brand model registrationNumber' },
        });

      return res.status(201).json({ success: true, data: populated });
    } else {
      const service = mockStore.services.find((s) => s._id === serviceId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const totalAmount = service.totalAmount;
      const previouslyPaid = service.paidAmount || 0;
      const newPaidTotal = previouslyPaid + payAmt;
      const newPendingBalance = Math.max(0, totalAmount - newPaidTotal);

      let newPaymentStatus = 'Pending';
      if (newPaidTotal >= totalAmount && totalAmount > 0) {
        newPaymentStatus = 'Paid';
      } else if (newPaidTotal > 0) {
        newPaymentStatus = 'Partial';
      }

      service.paidAmount = newPaidTotal;
      service.pendingBalance = newPendingBalance;
      service.paymentStatus = newPaymentStatus;

      const newId = 'pay_' + Date.now();
      const newPayment = {
        _id: newId,
        invoiceNumber,
        service: serviceId,
        customer: customerId || service.customer,
        totalAmount,
        amountPaid: payAmt,
        paymentType: paymentType || (newPendingBalance === 0 ? 'Final' : 'Partial'),
        paymentMethod: paymentMethod || 'UPI',
        transactionReference: transactionReference || '',
        pendingBalance: newPendingBalance,
        paymentDate: new Date(),
        receivedBy: req.user ? req.user.name : 'Admin',
        notes: notes || '',
        createdAt: new Date(),
      };

      mockStore.payments.unshift(newPayment);

      const c = mockStore.customers.find((cust) => cust._id === newPayment.customer);
      const b = mockStore.bikes.find((bk) => bk._id === service.bike);

      return res.status(201).json({
        success: true,
        data: {
          ...newPayment,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email } : null,
          service: { ...service, bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null },
        },
      });
    }
  } catch (err) {
    next(err);
  }
};
