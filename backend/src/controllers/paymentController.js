const Payment = require('../models/Payment');
const Service = require('../models/Service');
const Customer = require('../models/Customer');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// Helper to generate Invoice Number per workshop
const generateInvoiceNumber = async (workshopId) => {
  const year = new Date().getFullYear();
  if (getStatus()) {
    const count = await Payment.countDocuments({ workshop_id: workshopId });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  } else {
    const count = mockStore.payments.filter((p) => p.workshop_id === workshopId).length;
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
};

// @desc    Get all payments for current workshop
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { serviceId, customerId, paymentMethod, paymentType, search, mobile } = req.query;
    const workshopId = req.workshopId;

    if (getStatus()) {
      let query = { workshop_id: workshopId };
      if (serviceId) query.service = serviceId;
      if (customerId) query.customer = customerId;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (paymentType) query.paymentType = paymentType;

      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        const matchingCustomers = await Customer.find({
          workshop_id: workshopId,
          mobile: { $regex: cleanMobile, $options: 'i' },
        }).select('_id');
        query.customer = { $in: matchingCustomers.map((c) => c._id) };
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

        query.$and = [
          { workshop_id: workshopId },
          {
            $or: [
              { invoiceNumber: { $regex: search, $options: 'i' } },
              { transactionReference: { $regex: search, $options: 'i' } },
              { customer: { $in: customerIds } },
            ],
          },
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
      let list = mockStore.payments.filter((p) => p.workshop_id === workshopId);
      if (serviceId) list = list.filter((p) => p.service === serviceId);
      if (customerId) list = list.filter((p) => p.customer === customerId);
      if (paymentMethod) list = list.filter((p) => p.paymentMethod === paymentMethod);
      if (paymentType) list = list.filter((p) => p.paymentType === paymentType);

      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        list = list.filter((p) => {
          const c = mockStore.customers.find((cust) => cust._id === p.customer && cust.workshop_id === workshopId);
          return c && c.mobile.replace(/\D/g, '').includes(cleanMobile);
        });
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter((p) => {
          const c = mockStore.customers.find((cust) => cust._id === p.customer && cust.workshop_id === workshopId);
          const custMatch = c && (c.name.toLowerCase().includes(q) || c.mobile.includes(q));
          const invMatch = p.invoiceNumber.toLowerCase().includes(q);
          const refMatch = p.transactionReference && p.transactionReference.toLowerCase().includes(q);
          return custMatch || invMatch || refMatch;
        });
      }

      const populated = list.map((p) => {
        const c = mockStore.customers.find((cust) => cust._id === p.customer && cust.workshop_id === workshopId);
        const s = mockStore.services.find((srv) => srv._id === p.service && srv.workshop_id === workshopId);
        let b = null;
        if (s) {
          b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);
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
    const workshopId = req.workshopId;

    if (getStatus()) {
      const payment = await Payment.findOne({ _id: id, workshop_id: workshopId })
        .populate('customer', 'name mobile email address')
        .populate({
          path: 'service',
          populate: { path: 'bike', select: 'brand model registrationNumber currentKilometre fuelType' },
        });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found in this workshop' });
      }

      return res.status(200).json({ success: true, data: payment });
    } else {
      const payment = mockStore.payments.find((p) => p._id === id && p.workshop_id === workshopId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found in this workshop' });
      }

      const c = mockStore.customers.find((cust) => cust._id === payment.customer && cust.workshop_id === workshopId);
      const s = mockStore.services.find((srv) => srv._id === payment.service && srv.workshop_id === workshopId);
      const b = s ? mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId) : null;

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

    const workshopId = req.workshopId;
    const userId = req.userId;

    if (!serviceId || !amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid serviceId and positive amountPaid are required',
      });
    }

    const payAmt = Number(amountPaid);
    const invoiceNumber = await generateInvoiceNumber(workshopId);

    if (getStatus()) {
      const service = await Service.findOne({ _id: serviceId, workshop_id: workshopId });
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found in this workshop' });
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
      service.updatedAt = new Date();
      await service.save();

      const payment = await Payment.create({
        workshop_id: workshopId,
        user_id: userId,
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
      const service = mockStore.services.find((s) => s._id === serviceId && s.workshop_id === workshopId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found in this workshop' });
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
      service.updatedAt = new Date();

      const newId = 'pay_' + Date.now();
      const newPayment = {
        _id: newId,
        workshop_id: workshopId,
        user_id: userId,
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
        updatedAt: new Date(),
      };

      mockStore.payments.unshift(newPayment);

      const c = mockStore.customers.find((cust) => cust._id === newPayment.customer && cust.workshop_id === workshopId);
      const b = mockStore.bikes.find((bk) => bk._id === service.bike && bk.workshop_id === workshopId);

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
