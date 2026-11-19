const Customer = require('../models/Customer');
const Bike = require('../models/Bike');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// @desc    Get dashboard metrics & statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    if (getStatus()) {
      // Live MongoDB aggregations
      const totalCustomers = await Customer.countDocuments();
      const totalBikes = await Bike.countDocuments();

      const todayBookings = await Service.countDocuments({
        serviceDate: { $gte: today, $lt: tomorrow },
      });

      const completedServices = await Service.countDocuments({
        status: { $in: ['Ready', 'Delivered'] },
      });

      const pendingServices = await Service.countDocuments({
        status: { $in: ['Booked', 'In Progress'] },
      });

      // Today's collections
      const todayPayments = await Payment.aggregate([
        { $match: { paymentDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]);
      const todayCollection = todayPayments.length > 0 ? todayPayments[0].total : 0;

      // Monthly revenue
      const monthlyPayments = await Payment.aggregate([
        { $match: { paymentDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]);
      const monthlyRevenue = monthlyPayments.length > 0 ? monthlyPayments[0].total : 0;

      // Outstanding balance across services
      const outstandingData = await Service.aggregate([
        { $match: { pendingBalance: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$pendingBalance' } } },
      ]);
      const outstandingPayments = outstandingData.length > 0 ? outstandingData[0].total : 0;

      // Upcoming service reminders (in the next 30 days)
      const next30Days = new Date(today);
      next30Days.setDate(next30Days.getDate() + 30);
      const upcomingReminders = await Service.find({
        nextServiceDate: { $gte: today, $lte: next30Days },
      })
        .populate('customer', 'name mobile email')
        .populate('bike', 'brand model registrationNumber')
        .sort({ nextServiceDate: 1 })
        .limit(10);

      // Recent 5 services
      const recentServices = await Service.find()
        .populate('customer', 'name mobile')
        .populate('bike', 'brand model registrationNumber')
        .sort({ createdAt: -1 })
        .limit(6);

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalCustomers,
            totalBikes,
            todayBookings,
            completedServices,
            pendingServices,
            todayCollection,
            monthlyRevenue,
            outstandingPayments,
          },
          upcomingReminders,
          recentServices,
        },
      });
    } else {
      // In-Memory store computations
      const totalCustomers = mockStore.customers.length;
      const totalBikes = mockStore.bikes.length;

      const todayStr = today.toDateString();

      const todayBookings = mockStore.services.filter(
        (s) => new Date(s.serviceDate).toDateString() === todayStr
      ).length;

      const completedServices = mockStore.services.filter((s) =>
        ['Ready', 'Delivered'].includes(s.status)
      ).length;

      const pendingServices = mockStore.services.filter((s) =>
        ['Booked', 'In Progress'].includes(s.status)
      ).length;

      const todayCollection = mockStore.payments
        .filter((p) => new Date(p.paymentDate).toDateString() === todayStr)
        .reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const monthlyRevenue = mockStore.payments
        .filter((p) => {
          const d = new Date(p.paymentDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

      const outstandingPayments = mockStore.services.reduce(
        (acc, s) => acc + (Number(s.pendingBalance) || 0),
        0
      );

      // Upcoming service reminders
      const next30Days = new Date(today);
      next30Days.setDate(next30Days.getDate() + 30);

      const upcomingReminders = mockStore.services
        .filter((s) => s.nextServiceDate && new Date(s.nextServiceDate) >= today)
        .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate))
        .slice(0, 10)
        .map((s) => {
          const c = mockStore.customers.find((cust) => cust._id === s.customer);
          const b = mockStore.bikes.find((bk) => bk._id === s.bike);
          return {
            ...s,
            customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email } : null,
            bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null,
          };
        });

      // Recent 6 services
      const recentServices = mockStore.services.slice(0, 6).map((s) => {
        const c = mockStore.customers.find((cust) => cust._id === s.customer);
        const b = mockStore.bikes.find((bk) => bk._id === s.bike);
        return {
          ...s,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile } : null,
          bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalCustomers,
            totalBikes,
            todayBookings,
            completedServices,
            pendingServices,
            todayCollection,
            monthlyRevenue,
            outstandingPayments,
          },
          upcomingReminders,
          recentServices,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Customer Specific Dashboard Summary by Phone
// @route   GET /api/dashboard/customer-summary/:mobile
// @access  Private
exports.getCustomerDashboardSummary = async (req, res, next) => {
  try {
    const rawMobile = req.params.mobile ? req.params.mobile.replace(/\D/g, '') : '';
    if (!rawMobile) {
      return res.status(400).json({ success: false, message: 'Please provide mobile number' });
    }

    let customer = null;
    let bikes = [];
    let services = [];
    let payments = [];

    if (getStatus()) {
      customer = await Customer.findOne({ mobile: rawMobile }).populate('bikes').lean();
      if (!customer) {
        customer = await Customer.findOne({ mobile: { $regex: rawMobile, $options: 'i' } }).populate('bikes').lean();
      }
      if (!customer) {
        return res.status(404).json({ success: false, message: `No customer record found for mobile ${rawMobile}` });
      }

      bikes = customer.bikes || [];
      services = await Service.find({ customer: customer._id }).populate('bike').sort({ serviceDate: -1 }).lean();
      payments = await Payment.find({ customer: customer._id }).sort({ paymentDate: -1 }).lean();
    } else {
      customer = mockStore.customers.find((c) => c.mobile.replace(/\D/g, '') === rawMobile);
      if (!customer) {
        customer = mockStore.customers.find((c) => c.mobile.replace(/\D/g, '').includes(rawMobile));
      }
      if (!customer) {
        return res.status(404).json({ success: false, message: `No customer record found for mobile ${rawMobile}` });
      }

      bikes = mockStore.bikes.filter((b) => b.customer === customer._id || (customer.bikes && customer.bikes.includes(b._id)));
      services = mockStore.services
        .filter((s) => s.customer === customer._id)
        .map((s) => ({
          ...s,
          bike: mockStore.bikes.find((b) => b._id === s.bike) || s.bike,
        }))
        .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
      payments = mockStore.payments
        .filter((p) => p.customer === customer._id)
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    }

    const totalBilled = services.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalPaid = services.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const pendingBalance = services.reduce((acc, s) => acc + (s.pendingBalance || 0), 0);

    const completedServices = services.filter((s) => ['Ready', 'Delivered'].includes(s.status)).length;
    const activeServices = services.filter((s) => ['Booked', 'In Progress'].includes(s.status)).length;

    const upcomingServices = services
      .filter((s) => s.nextServiceDate && new Date(s.nextServiceDate) >= new Date())
      .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
    const nextServiceDate = upcomingServices.length > 0 ? upcomingServices[0].nextServiceDate : null;

    return res.status(200).json({
      success: true,
      data: {
        customer,
        bikes,
        serviceSummary: {
          totalServices: services.length,
          completedServices,
          activeServices,
          latestService: services[0] || null,
          nextServiceDate,
        },
        paymentOverview: {
          totalBilled,
          totalPaid,
          pendingBalance,
          recentPayments: payments.slice(0, 5),
        },
        recentServices: services.slice(0, 5),
      },
    });
  } catch (err) {
    next(err);
  }
};
