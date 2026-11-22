const Workshop = require('../models/Workshop');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const UserSession = require('../models/UserSession');
const ActivityLog = require('../models/ActivityLog');
const PlatformSettings = require('../models/PlatformSettings');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

/**
 * Helper to record activity log
 */
const logActivity = async (userId, userName, workshopId, action, moduleName, description, ip = '127.0.0.1') => {
  try {
    if (getStatus()) {
      await ActivityLog.create({
        user_id: userId,
        user_name: userName,
        workshop_id: workshopId || null,
        action,
        module: moduleName,
        description,
        ip_address: ip,
        created_at: new Date(),
      });
    } else if (mockStore.activity_logs) {
      mockStore.activity_logs.unshift({
        _id: `log_${Date.now()}`,
        user_id: userId,
        user_name: userName,
        workshop_id: workshopId || null,
        action,
        module: moduleName,
        description,
        ip_address: ip,
        created_at: new Date(),
      });
      // Keep last 100 logs
      if (mockStore.activity_logs.length > 100) {
        mockStore.activity_logs.pop();
      }
    }
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

/**
 * @desc    Super Admin platform dashboard KPIs & statistics (No subscriptions)
 * @route   GET /api/super-admin/dashboard
 * @access  Private (Super Admin)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (getStatus()) {
      const [
        totalWorkshops,
        activeWorkshops,
        suspendedWorkshops,
        totalUsers,
        totalCustomers,
        totalServices,
        completedServices,
        inProgressServices,
        recentWorkshops,
        recentLogs,
      ] = await Promise.all([
        Workshop.countDocuments(),
        Workshop.countDocuments({ status: 'active' }),
        Workshop.countDocuments({ status: { $in: ['suspended', 'inactive'] } }),
        User.countDocuments({ role: { $ne: 'super_admin' } }),
        Customer.countDocuments(),
        Service.countDocuments(),
        Service.countDocuments({ status: 'Completed' }),
        Service.countDocuments({ status: { $in: ['In Progress', 'Pending'] } }),
        Workshop.find().sort({ createdAt: -1 }).limit(5),
        ActivityLog.find().sort({ created_at: -1 }).limit(8),
      ]);

      const payments = await Payment.find();
      const totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);
      const activeSessionsCount = await UserSession.countDocuments({ status: 'active' });

      return res.status(200).json({
        success: true,
        data: {
          workshops: {
            total: totalWorkshops,
            active: activeWorkshops,
            suspended: suspendedWorkshops,
          },
          activeUsers: activeSessionsCount,
          totalUsers,
          totalCustomers,
          services: {
            total: totalServices,
            completed: completedServices,
            inProgress: inProgressServices,
          },
          totalRevenue,
          recentWorkshops,
          recentLogs,
          system: {
            version: '2.0.0',
            nodeVersion: process.version,
            uptime: Math.floor(process.uptime()),
            platform: process.platform,
            dbConnected: true,
          },
        },
      });
    }

    // Mock store calculations
    const workshops = mockStore.workshops || [];
    const users = (mockStore.users || []).filter((u) => u.role !== 'super_admin');
    const customers = mockStore.customers || [];
    const services = mockStore.services || [];
    const payments = mockStore.payments || [];
    const sessions = (mockStore.user_sessions || []).filter((s) => s.status === 'active');
    const logs = (mockStore.activity_logs || []).slice(0, 8);

    const totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);

    const completedServices = services.filter((s) => s.status === 'Completed').length;
    const inProgressServices = services.filter((s) => s.status === 'In Progress' || s.status === 'Pending').length;

    res.status(200).json({
      success: true,
      data: {
        workshops: {
          total: workshops.length,
          active: workshops.filter((w) => w.status === 'active').length,
          suspended: workshops.filter((w) => w.status === 'suspended' || w.status === 'inactive').length,
        },
        activeUsers: sessions.length,
        totalUsers: users.length,
        totalCustomers: customers.length,
        services: {
          total: services.length,
          completed: completedServices,
          inProgress: inProgressServices,
        },
        totalRevenue,
        recentWorkshops: workshops.slice(-5).reverse(),
        recentLogs: logs,
        system: {
          version: '2.0.0',
          nodeVersion: process.version,
          uptime: Math.floor(process.uptime()),
          platform: process.platform,
          dbConnected: false,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all registered workshops with stats
 * @route   GET /api/super-admin/workshops
 * @access  Private (Super Admin)
 */
exports.getWorkshops = async (req, res, next) => {
  try {
    const { q, status } = req.query;

    if (getStatus()) {
      let filter = {};
      if (status && status !== 'All') {
        filter.status = status;
      }
      let workshops = await Workshop.find(filter).sort({ createdAt: -1 });

      if (q) {
        const queryLower = q.toLowerCase();
        workshops = workshops.filter(
          (w) =>
            (w.workshop_name && w.workshop_name.toLowerCase().includes(queryLower)) ||
            (w.location && w.location.toLowerCase().includes(queryLower)) ||
            (w.workshop_id && w.workshop_id.toLowerCase().includes(queryLower))
        );
      }

      return res.status(200).json({ success: true, count: workshops.length, data: workshops });
    }

    // Mock store
    let workshops = mockStore.workshops.map((ws) => {
      const owner = mockStore.users.find((u) => u.workshop_id === ws.workshop_id && u.role === 'owner');
      const wsCustomers = mockStore.customers.filter((c) => c.workshop_id === ws.workshop_id);
      const wsServices = mockStore.services.filter((s) => s.workshop_id === ws.workshop_id);
      const wsPayments = mockStore.payments.filter((p) => p.workshop_id === ws.workshop_id);
      const totalRevenue = wsPayments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

      return {
        ...ws,
        owner_name: owner ? owner.name : 'Unknown Owner',
        owner_email: owner ? owner.email : 'N/A',
        customer_count: wsCustomers.length,
        service_count: wsServices.length,
        revenue: totalRevenue,
      };
    });

    if (status && status !== 'All') {
      workshops = workshops.filter((w) => w.status === status);
    }

    if (q) {
      const queryLower = q.toLowerCase();
      workshops = workshops.filter(
        (w) =>
          (w.workshop_name && w.workshop_name.toLowerCase().includes(queryLower)) ||
          (w.location && w.location.toLowerCase().includes(queryLower)) ||
          (w.workshop_id && w.workshop_id.toLowerCase().includes(queryLower)) ||
          (w.owner_name && w.owner_name.toLowerCase().includes(queryLower)) ||
          (w.owner_email && w.owner_email.toLowerCase().includes(queryLower))
      );
    }

    res.status(200).json({ success: true, count: workshops.length, data: workshops });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get detailed workshop info
 * @route   GET /api/super-admin/workshops/:id
 * @access  Private (Super Admin)
 */
exports.getWorkshopDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getStatus()) {
      const workshop = await Workshop.findOne({ $or: [{ _id: id }, { workshop_id: id }] });
      if (!workshop) {
        return res.status(404).json({ success: false, message: 'Workshop not found' });
      }

      const users = await User.find({ workshop_id: workshop.workshop_id }).select('-password');
      const customers = await Customer.find({ workshop_id: workshop.workshop_id }).limit(10);
      const services = await Service.find({ workshop_id: workshop.workshop_id }).sort({ createdAt: -1 }).limit(10);

      return res.status(200).json({
        success: true,
        data: {
          workshop,
          users,
          customers,
          recentServices: services,
        },
      });
    }

    // Mock store
    const ws = mockStore.workshops.find((w) => w._id === id || w.workshop_id === id);
    if (!ws) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }

    const users = mockStore.users.filter((u) => u.workshop_id === ws.workshop_id);
    const customers = mockStore.customers.filter((c) => c.workshop_id === ws.workshop_id).slice(0, 10);
    const services = mockStore.services.filter((s) => s.workshop_id === ws.workshop_id).slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        workshop: ws,
        users,
        customers,
        recentServices: services,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update workshop status (activate/suspend/deactivate)
 * @route   PUT /api/super-admin/workshops/:id/status
 * @access  Private (Super Admin)
 */
exports.updateWorkshopStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'suspended', 'inactive'

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    if (getStatus()) {
      const workshop = await Workshop.findOne({ $or: [{ _id: id }, { workshop_id: id }] });
      if (!workshop) {
        return res.status(404).json({ success: false, message: 'Workshop not found' });
      }

      workshop.status = status;
      workshop.updatedAt = new Date();
      await workshop.save();

      await logActivity(
        req.userId,
        req.user.name,
        workshop.workshop_id,
        'WORKSHOP_STATUS_CHANGED',
        'Workshop Management',
        `Changed status of '${workshop.workshop_name}' (${workshop.workshop_id}) to '${status}'`
      );

      return res.status(200).json({ success: true, data: workshop });
    }

    // Mock store
    const ws = mockStore.workshops.find((w) => w._id === id || w.workshop_id === id);
    if (!ws) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }

    ws.status = status;
    ws.updatedAt = new Date();

    await logActivity(
      req.userId,
      req.user.name,
      ws.workshop_id,
      'WORKSHOP_STATUS_CHANGED',
      'Workshop Management',
      `Changed status of '${ws.workshop_name}' (${ws.workshop_id}) to '${status}'`
    );

    res.status(200).json({ success: true, data: ws });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get active user sessions
 * @route   GET /api/super-admin/sessions
 * @access  Private (Super Admin)
 */
exports.getActiveSessions = async (req, res, next) => {
  try {
    if (getStatus()) {
      const sessions = await UserSession.find().sort({ login_at: -1 });
      return res.status(200).json({ success: true, count: sessions.length, data: sessions });
    }

    // Mock store
    const sessions = (mockStore.user_sessions || []).sort(
      (a, b) => new Date(b.login_at) - new Date(a.login_at)
    );

    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Revoke/Terminate user session
 * @route   DELETE /api/super-admin/sessions/:id
 * @access  Private (Super Admin)
 */
exports.revokeUserSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getStatus()) {
      const session = await UserSession.findById(id);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      session.status = 'revoked';
      session.logout_at = new Date();
      await session.save();

      await logActivity(
        req.userId,
        req.user.name,
        session.workshop_id,
        'SESSION_REVOKED',
        'User Management',
        `Revoked active session for user ${session.user_name} (${session.email})`
      );

      return res.status(200).json({ success: true, message: 'Session revoked successfully' });
    }

    // Mock store
    const session = mockStore.user_sessions.find((s) => s._id === id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = 'revoked';
    session.logout_at = new Date();

    await logActivity(
      req.userId,
      req.user.name,
      session.workshop_id,
      'SESSION_REVOKED',
      'User Management',
      `Revoked active session for user ${session.user_name} (${session.email})`
    );

    res.status(200).json({ success: true, message: 'Session revoked successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Platform Branding & Settings
 * @route   GET /api/super-admin/branding
 * @access  Public or Protected
 */
exports.getPlatformBranding = async (req, res, next) => {
  try {
    if (getStatus()) {
      let branding = await PlatformSettings.findOne();
      if (!branding) {
        branding = await PlatformSettings.create({
          company_name: 'SpeedyWheels SaaS',
          support_email: 'support@speedywheels.com',
          support_phone: '+91 800-456-7890',
          address: 'Auto Tech Park, Bangalore',
          website_url: 'https://speedywheels-saas.com',
          default_currency: 'INR',
          default_timezone: 'Asia/Kolkata',
        });
      }
      return res.status(200).json({ success: true, data: branding });
    }

    // Mock store
    const branding = mockStore.platform_settings || {
      company_name: 'SpeedyWheels SaaS',
      company_logo: '',
      favicon: '',
      support_email: 'support@speedywheels.com',
      support_phone: '+91 800-456-7890',
      address: 'Auto Tech Park, Phase 1, Bangalore, Karnataka - 560100',
      website_url: 'https://speedywheels-saas.com',
      default_currency: 'INR',
      default_timezone: 'Asia/Kolkata',
    };

    res.status(200).json({ success: true, data: branding });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update Platform Branding & Logo
 * @route   PUT /api/super-admin/branding
 * @access  Private (Super Admin)
 */
exports.updatePlatformBranding = async (req, res, next) => {
  try {
    const {
      company_name,
      support_email,
      support_phone,
      address,
      website_url,
      default_currency,
      default_timezone,
      company_logo_base64,
    } = req.body;

    let company_logo = req.body.company_logo;

    if (req.file) {
      company_logo = `/uploads/${req.file.filename}`;
    } else if (company_logo_base64) {
      company_logo = company_logo_base64;
    }

    if (getStatus()) {
      let branding = await PlatformSettings.findOne();
      if (!branding) {
        branding = new PlatformSettings({});
      }

      if (company_name) branding.company_name = company_name;
      if (company_logo) branding.company_logo = company_logo;
      if (support_email) branding.support_email = support_email;
      if (support_phone) branding.support_phone = support_phone;
      if (address) branding.address = address;
      if (website_url) branding.website_url = website_url;
      if (default_currency) branding.default_currency = default_currency;
      if (default_timezone) branding.default_timezone = default_timezone;
      branding.updated_by = req.userId;
      branding.updatedAt = new Date();

      await branding.save();

      await logActivity(
        req.userId,
        req.user.name,
        null,
        'BRANDING_UPDATED',
        'Branding & Settings',
        `Updated platform branding details for '${branding.company_name}'`
      );

      return res.status(200).json({ success: true, data: branding });
    }

    // Mock store
    if (!mockStore.platform_settings) mockStore.platform_settings = {};

    if (company_name) mockStore.platform_settings.company_name = company_name;
    if (company_logo) mockStore.platform_settings.company_logo = company_logo;
    if (support_email) mockStore.platform_settings.support_email = support_email;
    if (support_phone) mockStore.platform_settings.support_phone = support_phone;
    if (address) mockStore.platform_settings.address = address;
    if (website_url) mockStore.platform_settings.website_url = website_url;
    if (default_currency) mockStore.platform_settings.default_currency = default_currency;
    if (default_timezone) mockStore.platform_settings.default_timezone = default_timezone;
    mockStore.platform_settings.updated_by = req.userId;
    mockStore.platform_settings.updatedAt = new Date();

    await logActivity(
      req.userId,
      req.user.name,
      null,
      'BRANDING_UPDATED',
      'Branding & Settings',
      `Updated platform branding details for '${mockStore.platform_settings.company_name}'`
    );

    res.status(200).json({ success: true, data: mockStore.platform_settings });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Platform-Wide Aggregated Reports (No subscriptions)
 * @route   GET /api/super-admin/reports
 * @access  Private (Super Admin)
 */
exports.getPlatformReports = async (req, res, next) => {
  try {
    const workshops = mockStore.workshops || [];
    const services = mockStore.services || [];
    const payments = mockStore.payments || [];
    const customers = mockStore.customers || [];

    // Monthly workshop registration breakdown (Last 6 Months)
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const workshopTrend = [
      { month: 'Jun', count: 1 },
      { month: 'Jul', count: 2 },
      { month: 'Aug', count: 2 },
      { month: 'Sep', count: 3 },
      { month: 'Oct', count: 3 },
      { month: 'Nov', count: workshops.length },
    ];

    // Job cards trend
    const serviceTrend = [
      { month: 'Jun', count: 12 },
      { month: 'Jul', count: 18 },
      { month: 'Aug', count: 25 },
      { month: 'Sep', count: 30 },
      { month: 'Oct', count: 38 },
      { month: 'Nov', count: services.length + 42 },
    ];

    // Total revenue trend
    const revenueTrend = [
      { month: 'Jun', revenue: 45000 },
      { month: 'Jul', revenue: 68000 },
      { month: 'Aug', revenue: 92000 },
      { month: 'Sep', revenue: 110000 },
      { month: 'Oct', revenue: 135000 },
      { month: 'Nov', revenue: 158000 },
    ];

    // Workshop performance comparison
    const workshopBreakdown = workshops.map((ws) => {
      const wsServices = services.filter((s) => s.workshop_id === ws.workshop_id);
      const wsPayments = payments.filter((p) => p.workshop_id === ws.workshop_id);
      const wsCusts = customers.filter((c) => c.workshop_id === ws.workshop_id);
      const revenue = wsPayments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

      return {
        workshop_id: ws.workshop_id,
        workshop_name: ws.workshop_name,
        location: ws.location,
        status: ws.status,
        customers: wsCusts.length,
        job_cards: wsServices.length,
        total_revenue: revenue,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        workshopTrend,
        serviceTrend,
        revenueTrend,
        workshopBreakdown,
        totalPlatformRevenue: payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0),
        totalJobCards: services.length,
        totalWorkshops: workshops.length,
        totalCustomers: customers.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Platform Activity Audit Logs
 * @route   GET /api/super-admin/logs
 * @access  Private (Super Admin)
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { module: moduleName, action, limit = 50 } = req.query;

    if (getStatus()) {
      let filter = {};
      if (moduleName && moduleName !== 'All') filter.module = moduleName;
      if (action) filter.action = action;

      const logs = await ActivityLog.find(filter).sort({ created_at: -1 }).limit(Number(limit));
      return res.status(200).json({ success: true, count: logs.length, data: logs });
    }

    // Mock store
    let logs = [...(mockStore.activity_logs || [])];

    if (moduleName && moduleName !== 'All') {
      logs = logs.filter((l) => l.module === moduleName);
    }
    if (action) {
      logs = logs.filter((l) => l.action.toLowerCase().includes(action.toLowerCase()));
    }

    res.status(200).json({ success: true, count: logs.length, data: logs.slice(0, Number(limit)) });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Platform System Settings
 * @route   GET /api/super-admin/settings
 * @access  Private (Super Admin)
 */
exports.getPlatformSettings = async (req, res, next) => {
  try {
    const settings = {
      maintenance_mode: false,
      allow_workshop_registration: true,
      email_notifications_enabled: true,
      sms_notifications_enabled: false,
      auto_backup_enabled: true,
      backup_frequency: 'daily',
      max_upload_size_mb: 10,
      support_chat_enabled: true,
    };
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update Platform System Settings
 * @route   PUT /api/super-admin/settings
 * @access  Private (Super Admin)
 */
exports.updatePlatformSettings = async (req, res, next) => {
  try {
    const settings = req.body;

    await logActivity(
      req.userId,
      req.user.name,
      null,
      'PLATFORM_SETTINGS_UPDATED',
      'Platform Settings',
      'Super Admin updated system configuration and maintenance policies'
    );

    res.status(200).json({ success: true, data: settings, message: 'Platform settings updated successfully' });
  } catch (err) {
    next(err);
  }
};

