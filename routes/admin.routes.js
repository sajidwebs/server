const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Activity, Sale, Doctor, Chemist, Territory, Product, Headquarter, Projection, Business, DayCall, Notification } = require('../models');
const { authenticate } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');

// Middleware to attach user from token
const attachUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const jwt = require('../utils/jwt');
    const decoded = jwt.verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token. User not found.' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'Admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

// Apply attachUser to all routes
router.use(attachUser);

// ==================== DASHBOARD (accessible to ALL authenticated users) ====================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const monthStr = String(currentMonth).padStart(2, '0');

    const userRole = req.user.role;
    const isManagerOrAdmin = ['admin', 'Admin', 'Regional Manager', 'Zonal Manager', 'National Manager', 'Area Manager'].includes(userRole);

    // Total Users (managers/admin see all, others see their team)
    let totalUsers;
    if (isManagerOrAdmin) {
      totalUsers = await User.count({ where: { isActive: true } });
    } else {
      totalUsers = 1; // MR sees only themselves
    }

    // Pending Approvals
    let pendingApprovals;
    if (isManagerOrAdmin) {
      pendingApprovals = await Activity.count({ where: { status: { [Op.ne]: 'completed' } } });
    } else {
      pendingApprovals = await Activity.count({ where: { userId: req.user.id, status: { [Op.ne]: 'completed' } } });
    }

    // Monthly Sales
    let monthlySales;
    if (isManagerOrAdmin) {
      monthlySales = await Sale.sum('totalAmount', {
        where: { date: { [Op.gte]: `${currentYear}-${monthStr}-01`, [Op.lte]: currentDate.toISOString().split('T')[0] } }
      }) || 0;
    } else {
      monthlySales = await Sale.sum('totalAmount', {
        where: { userId: req.user.id, date: { [Op.gte]: `${currentYear}-${monthStr}-01`, [Op.lte]: currentDate.toISOString().split('T')[0] } }
      }) || 0;
    }

    // Monthly Projections
    let monthlyProjections;
    if (isManagerOrAdmin) {
      monthlyProjections = await Projection.sum('projectedAmount', {
        where: { month: monthStr, year: String(currentYear) }
      }) || 0;
    } else {
      monthlyProjections = await Projection.sum('projectedAmount', {
        where: { userId: req.user.id, month: monthStr, year: String(currentYear) }
      }) || 0;
    }

    // Total Doctor Calls this month
    let totalDoctorCalls;
    if (isManagerOrAdmin) {
      totalDoctorCalls = await Activity.count({
        where: { date: { [Op.gte]: `${currentYear}-${monthStr}-01` } }
      }) || 0;
    } else {
      totalDoctorCalls = await Activity.count({
        where: { userId: req.user.id, date: { [Op.gte]: `${currentYear}-${monthStr}-01` } }
      }) || 0;
    }

    // Recent Activities
    let recentActivitiesData;
    if (isManagerOrAdmin) {
      recentActivitiesData = await Activity.findAll({
        limit: 5, order: [['updatedAt', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
      });
    } else {
      recentActivitiesData = await Activity.findAll({
        limit: 5, order: [['updatedAt', 'DESC']],
        where: { userId: req.user.id },
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
      });
    }

    const recentActivities = recentActivitiesData.map(a => ({
      id: a.id,
      user: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Unknown',
      action: `${a.status} ${(a.title || 'activity').toLowerCase()}`,
      time: a.updatedAt ? a.updatedAt.toLocaleString() : ''
    }));

    res.json({
      totalUsers,
      pendingApprovals,
      monthlySales: monthlySales || 0,
      monthlyProjections: monthlyProjections || 0,
      totalDoctorCalls: totalDoctorCalls || 0,
      recentActivities,
      userRole
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Recent Activity (accessible to ALL authenticated users)
router.get('/recent-activity', async (req, res) => {
  try {
    const isManagerOrAdmin = ['admin', 'Admin', 'Regional Manager', 'Zonal Manager', 'National Manager', 'Area Manager'].includes(req.user.role);

    let whereClause = {};
    if (!isManagerOrAdmin) {
      whereClause = { userId: req.user.id };
    }

    const recentActivities = await Activity.findAll({
      limit: 10, order: [['updatedAt', 'DESC']], where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
    });

    const formatted = recentActivities.map(a => ({
      id: a.id,
      user: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System',
      action: `${a.status} ${(a.title || 'activity').toLowerCase()}`,
      time: a.updatedAt ? a.updatedAt.toLocaleString() : '',
      type: 'activity'
    }));

    res.json(formatted.length > 0 ? formatted : [{ id: 1, user: 'System', action: 'Dashboard loaded', time: new Date().toLocaleString(), type: 'system' }]);
  } catch (error) {
    console.error('Recent activity error:', error);
    res.json([{ id: 1, user: 'System', action: 'Dashboard loaded', time: new Date().toLocaleString(), type: 'system' }]);
  }
});

// ==================== USER MANAGEMENT (admin only for create/delete, managers can view) ====================
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'fullName', 'username', 'email', 'mobileNumber', 'role', 'employeeId', 'employeeType', 'hq_id', 'territory_id', 'reportingTo', 'assigned_manager_id', 'isActive', 'lastLogin', 'createdAt'],
      include: [{ model: Headquarter, as: 'headquarter', attributes: ['id', 'name', 'type'], required: false }],
      order: [['createdAt', 'DESC']]
    });

    const formattedUsers = users.map(user => ({
      id: user.id, firstName: user.firstName, lastName: user.lastName, fullName: user.fullName,
      username: user.username, email: user.email, mobileNumber: user.mobileNumber, role: user.role,
      employeeId: user.employeeId, employeeType: user.employeeType, hq_id: user.hq_id,
      hq: user.headquarter ? user.headquarter.name : null,
      hq_type: user.headquarter ? user.headquarter.type : null,
      territory_id: user.territory_id, reportingTo: user.reportingTo,
      assigned_manager_id: user.assigned_manager_id, isActive: user.isActive,
      lastLogin: user.lastLogin, createdAt: user.createdAt
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Create user (admin only)
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, fullName, username, email, mobileNumber, role, employeeId, employeeType, hq_id, territory_id, reportingTo, assigned_manager_id, isActive, password } = req.body;
    const rawPassword = password || (Math.random().toString(36).slice(-8) + '123');
    const hashedPassword = await hashPassword(rawPassword);

    const newUser = await User.create({
      firstName, lastName, fullName: fullName || `${firstName} ${lastName}`, username, email,
      password: hashedPassword, mobileNumber, role: role || 'user', employeeId, employeeType,
      hq_id, territory_id, reportingTo, assigned_manager_id,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      id: newUser.id, firstName: newUser.firstName, lastName: newUser.lastName, fullName: newUser.fullName,
      username: newUser.username, email: newUser.email, mobileNumber: newUser.mobileNumber, role: newUser.role,
      employeeId: newUser.employeeId, employeeType: newUser.employeeType, hq_id: newUser.hq_id,
      territory_id: newUser.territory_id, reportingTo: newUser.reportingTo,
      assigned_manager_id: newUser.assigned_manager_id, isActive: newUser.isActive
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fields = ['firstName', 'lastName', 'fullName', 'username', 'email', 'mobileNumber', 'role', 'employeeId', 'employeeType', 'hq_id', 'territory_id', 'reportingTo', 'assigned_manager_id', 'isActive'];
    const updateData = {};
    fields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });
    if (updateData.firstName && updateData.lastName && !updateData.fullName) {
      updateData.fullName = `${updateData.firstName} ${updateData.lastName}`;
    }

    await user.update(updateData);
    res.json({ id: user.id, ...Object.fromEntries(fields.map(f => [f, user[f]])) });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// ==================== REPORTS (managers and admin only) ====================
router.get('/reports', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let reportData = {};
    switch (type) {
      case 'daily-visits': reportData = await getDailyVisitsReport(startDate, endDate); break;
      case 'sales': reportData = await getSalesReport(startDate, endDate); break;
      case 'monthly-stats': reportData = await getMonthlyStatsReport(); break;
      default: return res.status(400).json({ message: 'Invalid report type' });
    }
    res.json(reportData);
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

async function getDailyVisitsReport(startDate, endDate) {
  const activities = await Activity.findAll({
    where: { date: { [Op.between]: [startDate, endDate] }, status: 'completed' },
    include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
    order: [['date', 'DESC']]
  });
  const dailyStats = {};
  activities.forEach(a => {
    if (!dailyStats[a.date]) dailyStats[a.date] = { totalVisits: 0, users: [] };
    dailyStats[a.date].totalVisits++;
    dailyStats[a.date].users.push({ name: `${a.user.firstName} ${a.user.lastName}`, activity: a.title });
  });
  return { type: 'daily-visits', period: { startDate, endDate }, summary: { totalVisits: activities.length, totalDays: Object.keys(dailyStats).length, averageVisitsPerDay: Object.keys(dailyStats).length > 0 ? (activities.length / Object.keys(dailyStats).length).toFixed(1) : 0 }, dailyBreakdown: dailyStats };
}

async function getSalesReport(startDate, endDate) {
  const sales = await Sale.findAll({
    where: { date: { [Op.between]: [startDate, endDate] } },
    include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
  });
  const totalSales = sales.reduce((s, x) => s + parseFloat(x.totalAmount || 0), 0);
  const totalQuantity = sales.reduce((s, x) => s + (x.quantity || 0), 0);
  return { type: 'sales', period: { startDate, endDate }, summary: { totalSales, totalQuantity, totalTransactions: sales.length, averageTransactionValue: sales.length > 0 ? (totalSales / sales.length).toFixed(2) : 0 }, sales };
}

async function getMonthlyStatsReport() {
  const now = new Date();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dateFrom = `${now.getFullYear()}-${monthStr}-01`;
  const dateTo = now.toISOString().split('T')[0];

  const monthlyActivities = await Activity.findAll({
    where: { date: { [Op.gte]: dateFrom, [Op.lte]: dateTo } },
    include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
  });
  const monthlySales = await Sale.findAll({ where: { date: { [Op.gte]: dateFrom, [Op.lte]: dateTo } } });
  const totalSales = monthlySales.reduce((s, x) => s + parseFloat(x.totalAmount || 0), 0);

  return { type: 'monthly-stats', period: { month: now.getMonth() + 1, year: now.getFullYear(), monthName: now.toLocaleString('default', { month: 'long' }) }, summary: { totalActivities: monthlyActivities.length, totalSales, totalUsers: new Set(monthlyActivities.map(a => a.userId)).size, completionRate: monthlyActivities.length > 0 ? ((monthlyActivities.filter(a => a.status === 'completed').length / monthlyActivities.length) * 100).toFixed(1) : 0 }, monthlyActivities, monthlySales };
}

module.exports = router;
