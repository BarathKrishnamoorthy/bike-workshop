const Customer = require('../models/Customer');
const Bike = require('../models/Bike');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

// Helper to convert array of objects to CSV string
const convertToCSV = (arr) => {
  if (!arr || arr.length === 0) return '';
  const headers = Object.keys(arr[0]);
  const rows = arr.map((obj) =>
    headers
      .map((header) => {
        let val = obj[header] === undefined || obj[header] === null ? '' : obj[header];
        if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
};

// @desc    Customer Summary Report (with optional mobile filter) for current workshop
// @route   GET /api/reports/customers
// @access  Private
exports.getCustomerReport = async (req, res, next) => {
  try {
    const { format, mobile } = req.query;
    const workshopId = req.workshopId;

    let report = [];

    if (getStatus()) {
      let query = { workshop_id: workshopId };
      if (mobile) {
        query.mobile = { $regex: mobile.replace(/\D/g, ''), $options: 'i' };
      }
      const customers = await Customer.find(query).populate('bikes').lean();
      const services = await Service.find({ workshop_id: workshopId }).lean();

      report = customers.map((c) => {
        const custServices = services.filter((s) => String(s.customer) === String(c._id));
        const totalSpent = custServices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const totalPaid = custServices.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        const totalPending = custServices.reduce((sum, s) => sum + (s.pendingBalance || 0), 0);
        return {
          id: c._id,
          name: c.name,
          mobile: c.mobile,
          email: c.email || 'N/A',
          address: c.address || 'N/A',
          bikesRegistered: c.bikes ? c.bikes.length : 0,
          totalVisits: custServices.length,
          totalBilled: totalSpent,
          totalPaid,
          pendingBalance: totalPending,
          joinedDate: new Date(c.createdAt).toLocaleDateString(),
        };
      });
    } else {
      let custList = mockStore.customers.filter((c) => c.workshop_id === workshopId);
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        custList = custList.filter((c) => c.mobile.replace(/\D/g, '').includes(cleanMobile));
      }

      report = custList.map((c) => {
        const custBikes = mockStore.bikes.filter((b) => b.customer === c._id && b.workshop_id === workshopId);
        const custServices = mockStore.services.filter((s) => s.customer === c._id && s.workshop_id === workshopId);
        const totalSpent = custServices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const totalPaid = custServices.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        const totalPending = custServices.reduce((sum, s) => sum + (s.pendingBalance || 0), 0);
        return {
          id: c._id,
          name: c.name,
          mobile: c.mobile,
          email: c.email || 'N/A',
          address: c.address || 'N/A',
          bikesRegistered: custBikes.length,
          totalVisits: custServices.length,
          totalBilled: totalSpent,
          totalPaid,
          pendingBalance: totalPending,
          joinedDate: new Date(c.createdAt).toLocaleDateString(),
        };
      });
    }

    if (format === 'csv') {
      const csv = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customers-report.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, count: report.length, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Service Performance Report for current workshop
// @route   GET /api/reports/services
// @access  Private
exports.getServiceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format, mobile } = req.query;
    const workshopId = req.workshopId;

    let services = [];

    if (getStatus()) {
      let query = { workshop_id: workshopId };
      if (startDate || endDate) {
        query.serviceDate = {};
        if (startDate) query.serviceDate.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.serviceDate.$lte = end;
        }
      }
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        const matchingCustomers = await Customer.find({
          workshop_id: workshopId,
          mobile: { $regex: cleanMobile, $options: 'i' },
        }).select('_id');
        query.customer = { $in: matchingCustomers.map((c) => c._id) };
      }
      services = await Service.find(query)
        .populate('customer', 'name mobile')
        .populate('bike', 'brand model registrationNumber')
        .sort({ serviceDate: -1 })
        .lean();
    } else {
      services = mockStore.services.filter((s) => s.workshop_id === workshopId);
      if (startDate) {
        services = services.filter((s) => new Date(s.serviceDate) >= new Date(startDate));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        services = services.filter((s) => new Date(s.serviceDate) <= end);
      }
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        services = services.filter((s) => {
          const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
          return c && c.mobile.replace(/\D/g, '').includes(cleanMobile);
        });
      }
      services = services.map((s) => {
        const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
        const b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);
        return {
          ...s,
          customer: c ? { name: c.name, mobile: c.mobile } : null,
          bike: b ? { brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null,
        };
      });
    }

    const report = services.map((s) => ({
      jobCardNumber: s.jobCardNumber,
      serviceDate: new Date(s.serviceDate).toLocaleDateString(),
      customerName: s.customer ? s.customer.name : 'Unknown',
      customerMobile: s.customer ? s.customer.mobile : 'N/A',
      bike: s.bike ? `${s.bike.brand} ${s.bike.model} (${s.bike.registrationNumber})` : 'N/A',
      serviceType: s.serviceType,
      sparePartsCost: s.sparePartsTotal || 0,
      labourCost: s.labourTotal || 0,
      discount: s.discount || 0,
      taxAmount: s.taxAmount || 0,
      totalAmount: s.totalAmount || 0,
      paidAmount: s.paidAmount || 0,
      pendingBalance: s.pendingBalance || 0,
      status: s.status,
      paymentStatus: s.paymentStatus,
    }));

    if (format === 'csv') {
      const csv = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="services-report.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, count: report.length, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Service Reminders Report for current workshop
// @route   GET /api/reports/reminders
// @access  Private
exports.getRemindersReport = async (req, res, next) => {
  try {
    const { format, mobile } = req.query;
    const workshopId = req.workshopId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let list = [];

    if (getStatus()) {
      let query = { workshop_id: workshopId, nextServiceDate: { $exists: true } };
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        const matchingCustomers = await Customer.find({
          workshop_id: workshopId,
          mobile: { $regex: cleanMobile, $options: 'i' },
        }).select('_id');
        query.customer = { $in: matchingCustomers.map((c) => c._id) };
      }
      list = await Service.find(query)
        .populate('customer', 'name mobile email')
        .populate('bike', 'brand model registrationNumber currentKilometre')
        .lean();
    } else {
      list = mockStore.services
        .filter((s) => s.workshop_id === workshopId && s.nextServiceDate)
        .map((s) => {
          const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
          const b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);
          return {
            ...s,
            customer: c ? { name: c.name, mobile: c.mobile, email: c.email } : null,
            bike: b ? { brand: b.brand, model: b.model, registrationNumber: b.registrationNumber, currentKilometre: b.currentKilometre } : null,
          };
        });

      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        list = list.filter((s) => s.customer && s.customer.mobile.replace(/\D/g, '').includes(cleanMobile));
      }
    }

    const report = list
      .map((s) => {
        const dueDate = new Date(s.nextServiceDate);
        const isOverdue = dueDate < today;
        const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

        return {
          jobCardNumber: s.jobCardNumber,
          customerName: s.customer ? s.customer.name : 'Unknown',
          mobile: s.customer ? s.customer.mobile : 'N/A',
          bike: s.bike ? `${s.bike.brand} ${s.bike.model}` : 'N/A',
          registrationNumber: s.bike ? s.bike.registrationNumber : 'N/A',
          lastServiceDate: new Date(s.serviceDate).toLocaleDateString(),
          lastServiceKm: s.currentKilometre,
          nextServiceDueDate: dueDate.toLocaleDateString(),
          nextServiceDueKm: s.nextServiceKilometre,
          status: isOverdue ? 'Overdue' : 'Upcoming',
          daysDifference: diffDays,
        };
      })
      .sort((a, b) => a.daysDifference - b.daysDifference);

    if (format === 'csv') {
      const csv = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="service-reminders-report.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, count: report.length, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Pending Payments Report for current workshop
// @route   GET /api/reports/pending-payments
// @access  Private
exports.getPendingPaymentsReport = async (req, res, next) => {
  try {
    const { format, mobile } = req.query;
    const workshopId = req.workshopId;

    let pendingList = [];

    if (getStatus()) {
      let query = { workshop_id: workshopId, pendingBalance: { $gt: 0 } };
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        const matchingCustomers = await Customer.find({
          workshop_id: workshopId,
          mobile: { $regex: cleanMobile, $options: 'i' },
        }).select('_id');
        query.customer = { $in: matchingCustomers.map((c) => c._id) };
      }
      pendingList = await Service.find(query)
        .populate('customer', 'name mobile email')
        .populate('bike', 'brand model registrationNumber')
        .sort({ pendingBalance: -1 })
        .lean();
    } else {
      pendingList = mockStore.services
        .filter((s) => s.workshop_id === workshopId && s.pendingBalance > 0)
        .map((s) => {
          const c = mockStore.customers.find((cust) => cust._id === s.customer && cust.workshop_id === workshopId);
          const b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);
          return {
            ...s,
            customer: c ? { name: c.name, mobile: c.mobile, email: c.email } : null,
            bike: b ? { brand: b.brand, model: b.model, registrationNumber: b.registrationNumber } : null,
          };
        });

      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        pendingList = pendingList.filter((s) => s.customer && s.customer.mobile.replace(/\D/g, '').includes(cleanMobile));
      }

      pendingList.sort((a, b) => b.pendingBalance - a.pendingBalance);
    }

    const report = pendingList.map((s) => ({
      jobCardNumber: s.jobCardNumber,
      serviceDate: new Date(s.serviceDate).toLocaleDateString(),
      customerName: s.customer ? s.customer.name : 'Unknown',
      customerMobile: s.customer ? s.customer.mobile : 'N/A',
      bike: s.bike ? `${s.bike.brand} ${s.bike.model} (${s.bike.registrationNumber})` : 'N/A',
      totalBillAmount: s.totalAmount,
      amountReceived: s.paidAmount,
      pendingBalance: s.pendingBalance,
      serviceStatus: s.status,
      paymentStatus: s.paymentStatus,
    }));

    if (format === 'csv') {
      const csv = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="pending-payments-report.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, count: report.length, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Collections Report for current workshop
// @route   GET /api/reports/collections
// @access  Private
exports.getCollectionsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format, mobile } = req.query;
    const workshopId = req.workshopId;

    let payments = [];

    if (getStatus()) {
      let query = { workshop_id: workshopId };
      if (startDate || endDate) {
        query.paymentDate = {};
        if (startDate) query.paymentDate.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.paymentDate.$lte = end;
        }
      }
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        const matchingCustomers = await Customer.find({
          workshop_id: workshopId,
          mobile: { $regex: cleanMobile, $options: 'i' },
        }).select('_id');
        query.customer = { $in: matchingCustomers.map((c) => c._id) };
      }
      payments = await Payment.find(query)
        .populate('customer', 'name mobile')
        .populate({
          path: 'service',
          populate: { path: 'bike', select: 'brand model registrationNumber' },
        })
        .sort({ paymentDate: -1 })
        .lean();
    } else {
      payments = mockStore.payments.filter((p) => p.workshop_id === workshopId);
      if (startDate) {
        payments = payments.filter((p) => new Date(p.paymentDate) >= new Date(startDate));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        payments = payments.filter((p) => new Date(p.paymentDate) <= end);
      }
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        payments = payments.filter((p) => {
          const c = mockStore.customers.find((cust) => cust._id === p.customer && cust.workshop_id === workshopId);
          return c && c.mobile.replace(/\D/g, '').includes(cleanMobile);
        });
      }
      payments = payments.map((p) => {
        const c = mockStore.customers.find((cust) => cust._id === p.customer && cust.workshop_id === workshopId);
        const s = mockStore.services.find((srv) => srv._id === p.service && srv.workshop_id === workshopId);
        let b = null;
        if (s) {
          b = mockStore.bikes.find((bk) => bk._id === s.bike && bk.workshop_id === workshopId);
        }
        return {
          ...p,
          customer: c ? { name: c.name, mobile: c.mobile } : null,
          service: s ? { jobCardNumber: s.jobCardNumber, serviceType: s.serviceType, bike: b } : null,
        };
      });
    }

    const report = payments.map((p) => ({
      invoiceNumber: p.invoiceNumber,
      paymentDate: new Date(p.paymentDate).toLocaleDateString(),
      customerName: p.customer ? p.customer.name : 'Unknown',
      customerMobile: p.customer ? p.customer.mobile : 'N/A',
      jobCardNumber: p.service ? p.service.jobCardNumber : 'N/A',
      bike: p.service && p.service.bike ? `${p.service.bike.brand} ${p.service.bike.model} (${p.service.bike.registrationNumber})` : 'N/A',
      paymentType: p.paymentType,
      paymentMethod: p.paymentMethod,
      transactionRef: p.transactionReference || 'N/A',
      amountPaid: p.amountPaid,
      pendingBalance: p.pendingBalance,
      receivedBy: p.receivedBy,
    }));

    if (format === 'csv') {
      const csv = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="collections-report.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, count: report.length, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Customer 360-degree Dossier & Comprehensive Service History by Phone for current workshop
// @route   GET /api/reports/customer-dossier/:mobile
// @access  Private
exports.getCustomerDossierReport = async (req, res, next) => {
  try {
    const rawMobile = req.params.mobile ? req.params.mobile.replace(/\D/g, '') : '';
    const { format } = req.query;
    const workshopId = req.workshopId;

    if (!rawMobile) {
      return res.status(400).json({ success: false, message: 'Please provide mobile number' });
    }

    let customer = null;
    let customerBikes = [];
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
      customerBikes = customer.bikes || [];
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
      customerBikes = mockStore.bikes.filter(
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

    const totalServicesCompleted = services.filter((s) => ['Ready', 'Delivered'].includes(s.status)).length;
    const totalBilled = services.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalPaid = services.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const pendingBalance = services.reduce((acc, s) => acc + (s.pendingBalance || 0), 0);

    const upcomingServices = services
      .filter((s) => s.nextServiceDate && new Date(s.nextServiceDate) >= new Date())
      .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
    const nextServiceDate = upcomingServices.length > 0 ? new Date(upcomingServices[0].nextServiceDate).toLocaleDateString() : 'None Scheduled';

    const serviceHistoryRows = services.map((s) => ({
      customerName: customer.name,
      customerMobile: customer.mobile,
      totalRegisteredBikes: customerBikes.length,
      totalServicesCompleted,
      jobCardNumber: s.jobCardNumber,
      serviceDate: new Date(s.serviceDate).toLocaleDateString(),
      bikeRegistrationNumber: s.bike?.registrationNumber || 'N/A',
      bikeModel: s.bike ? `${s.bike.brand} ${s.bike.model}` : 'N/A',
      serviceType: s.serviceType,
      servicesPerformed: s.workPerformed || (s.customerComplaints && s.customerComplaints.length > 0 ? s.customerComplaints.join(', ') : s.serviceType),
      previousServiceAmount: s.totalAmount,
      amountPaid: s.paidAmount,
      pendingPaymentAmount: s.pendingBalance,
      nextServiceDate: s.nextServiceDate ? new Date(s.nextServiceDate).toLocaleDateString() : 'N/A',
      serviceStatus: s.status,
      paymentStatus: s.paymentStatus,
    }));

    if (format === 'csv') {
      const csv = convertToCSV(serviceHistoryRows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customer-${customer.mobile}-service-history.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      data: {
        customer,
        summary: {
          customerName: customer.name,
          customerMobile: customer.mobile,
          totalRegisteredBikes: customerBikes.length,
          totalServicesCompleted,
          totalServicesRecorded: services.length,
          totalBilled,
          totalPaid,
          pendingBalance,
          nextServiceDate,
        },
        bikes: customerBikes,
        serviceHistory: serviceHistoryRows,
        payments,
      },
    });
  } catch (err) {
    next(err);
  }
};
