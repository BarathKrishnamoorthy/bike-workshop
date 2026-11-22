const Customer = require('../models/Customer');
const Bike = require('../models/Bike');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// @desc    Get dashboard metrics & statistics for the logged-in workshop
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const workshopId = req.workshopId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    if (getStatus()) {
      // Live MongoDB aggregations scoped to current tenant
      const totalCustomers = await Customer.countDocuments({ workshop_id: workshopId });
      const totalBikes = await Bike.countDocuments({ workshop_id: workshopId });

      const todayBookings = await Service.countDocuments({
        workshop_id: workshopId,
        serviceDate: { $gte: today, $lt: tomorrow },
      });

      const completedServices = await Service.countDocuments({
        workshop_id: workshopId,
        status: { $in: ['Ready', 'Delivered'] },
      });

      const pendingServices = await Service.countDocuments({
        workshop_id: workshopId,
        status: { $in: ['Booked', 'In Progress'] },
      });

      // Today's collections
      const todayPayments = await Payment.aggregate([
        { $match: { workshop_id: workshopId, paymentDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]);
      const todayCollection = todayPayments.length > 0 ? todayPayments[0].total : 0;

      // Monthly revenue
      const monthlyPayments = await Payment.aggregate([
        { $match: { workshop_id: workshopId, paymentDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]);
      const monthlyRevenue = monthlyPayments.length > 0 ? monthlyPayments[0].total : 0;

      // Outstanding balance across services
      const outstandingData = await Service.aggregate([
        { $match: { workshop_id: workshopId, pendingBalance: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$pendingBalance' } } },
      ]);
      const outstandingPayments = outstandingData.length > 0 ? outstandingData[0].total : 0;

      // Upcoming service reminders (in next 30 days)
      const next30Days = new Date(today);
      next30Days.setDate(next30Days.getDate() + 30);
      const upcomingReminders = await Service.find({
        workshop_id: workshopId,
        nextServiceDate: { $gte: today, $lte: next30Days },
      })
        .populate('customer', 'name mobile email')
        .populate('bike', 'brand model registrationNumber')
        .sort({ nextServiceDate: 1 })
        .limit(10);

      // Recent 6 services
      const recentServices = await Service.find({ workshop_id: workshopId })
        .populate('customer', 'name mobile')
        .populate('bike', 'brand model registrationNumber')
        .sort({ createdAt: -1 })
        .limit(6);

      return res.status(200).json({
        success: true,
        data: {
          workshopId,
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
      // Filter mock store for this specific workshop
      const tenantCustomers = mockStore.customers.filter((c) => c.workshop_id === workshopId);
      const tenantBikes = mockStore.bikes.filter((b) => b.workshop_id === workshopId);
      const tenantServices = mockStore.services.filter((s) => s.workshop_id === workshopId);
      const tenantPayments = mockStore.payments.filter((p) => p.workshop_id === workshopId);

      const totalCustomers = tenantCustomers.length;
      const totalBikes = tenantBikes.length;

      const todayStr = today.toDateString();
      const todayBookings = tenantServices.filter(
        (s) => new Date(s.serviceDate).toDateString() === todayStr
      ).length;

      const completedServices = tenantServices.filter((s) =>
        ['Ready', 'Delivered'].includes(s.status)
      ).length;

      const pendingServices = tenantServices.filter((s) =>
        ['Booked', 'In Progress'].includes(s.status)
      ).length;

      const todayCollection = tenantPayments
        .filter((p) => new Date(p.paymentDate).toDateString() === todayStr)
        .reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const monthlyRevenue = tenantPayments
        .filter((p) => {
          const d = new Date(p.paymentDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

      const outstandingPayments = tenantServices.reduce(
        (acc, s) => acc + (Number(s.pendingBalance) || 0),
        0
      );

      // Upcoming service reminders
      const next30Days = new Date(today);
      next30Days.setDate(next30Days.getDate() + 30);

      const upcomingReminders = tenantServices
        .filter((s) => s.nextServiceDate && new Date(s.nextServiceDate) >= today)
        .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate))
        .slice(0, 10)
        .map((s) => {
          const c = tenantCustomers.find((cust) => cust._id === s.customer);
          const b = tenantBikes.find((bk) => bk._id === s.bike);
          return {
            ...s,
            customer: c ? { _id: c._id, name: c.name, mobile: c.mobile, email: c.email } : null,
            bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null,
          };
        });

      // Recent 6 services
      const recentServices = tenantServices.slice(0, 6).map((s) => {
        const c = tenantCustomers.find((cust) => cust._id === s.customer);
        const b = tenantBikes.find((bk) => bk._id === s.bike);
        return {
          ...s,
          customer: c ? { _id: c._id, name: c.name, mobile: c.mobile } : null,
          bike: b ? { _id: b._id, brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          workshopId,
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

// @desc    Customer Specific Dashboard Summary by Phone for current workshop
// @route   GET /api/dashboard/customer-summary/:mobile
// @access  Private
exports.getCustomerDashboardSummary = async (req, res, next) => {
  try {
    const rawMobile = req.params.mobile ? req.params.mobile.replace(/\D/g, '') : '';
    const workshopId = req.workshopId;

    if (!rawMobile) {
      return res.status(400).json({ success: false, message: 'Please provide mobile number' });
    }

    let customer = null;
    let bikes = [];
    let services = [];
    let payments = [];

    if (getStatus()) {
      customer = await Customer.findOne({ workshop_id: workshopId, mobile: rawMobile }).populate('bikes').lean();
      if (!customer) {
        customer = await Customer.findOne({
          workshop_id: workshopId,
          mobile: { $regex: rawMobile, $options: 'i' },
        }).populate('bikes').lean();
      }
      if (!customer) {
        return res.status(404).json({ success: false, message: `No customer record found for mobile ${rawMobile} in this workshop` });
      }

      bikes = customer.bikes || [];
      services = await Service.find({ customer: customer._id, workshop_id: workshopId }).populate('bike').sort({ serviceDate: -1 }).lean();
      payments = await Payment.find({ customer: customer._id, workshop_id: workshopId }).sort({ paymentDate: -1 }).lean();
    } else {
      customer = mockStore.customers.find(
        (c) => c.workshop_id === workshopId && c.mobile.replace(/\D/g, '') === rawMobile
      );
      if (!customer) {
        customer = mockStore.customers.find(
          (c) => c.workshop_id === workshopId && c.mobile.replace(/\D/g, '').includes(rawMobile)
        );
      }
      if (!customer) {
        return res.status(404).json({ success: false, message: `No customer record found for mobile ${rawMobile} in this workshop` });
      }

      bikes = mockStore.bikes.filter(
        (b) => b.workshop_id === workshopId && (b.customer === customer._id || (customer.bikes && customer.bikes.includes(b._id)))
      );
      services = mockStore.services
        .filter((s) => s.workshop_id === workshopId && s.customer === customer._id)
        .map((s) => ({
          ...s,
          bike: mockStore.bikes.find((b) => b._id === s.bike && b.workshop_id === workshopId) || s.bike,
        }))
        .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
      payments = mockStore.payments
        .filter((p) => p.workshop_id === workshopId && p.customer === customer._id)
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
