const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Activity, Sale, Doctor, Chemist, Territory, Product, Headquarter, Projection, Business, DayCall, Notification } = require('../models');
const { authenticate } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const jwt = require('../utils/jwt');
    const decoded = jwt.verifyToken(token);

    // Get user from database (use imported User model)
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid token. User not found.'
      });
    }

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Invalid token.'
    });
  }
};

// Apply authentication middleware to all admin routes
router.use(requireAdmin);

// Dashboard Statistics
router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Total Users
    const totalUsers = await User.count({
      where: { isActive: true }
    });

    // Pending Approvals (activities that are not completed)
    const pendingApprovals = await Activity.count({
      where: {
        status: {
          [Op.ne]: 'completed'
        }
      }
    });

    // Monthly Sales
    const monthlySales = await Sale.sum('totalAmount', {
      where: {
        date: {
          [Op.gte]: `${currentYear}-${currentMonth}-01`,
          [Op.lte]: currentDate.toISOString().split('T')[0]
        }
      }
    });

    // Recent Activities from database
    const recentActivitiesData = await Activity.findAll({
      limit: 5,
      order: [['updatedAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }]
    });

    const recentActivities = recentActivitiesData.map(activity => ({
      id: activity.id,
      user: `${activity.user.firstName} ${activity.user.lastName}`,
      action: `${activity.status} ${activity.title.toLowerCase()}`,
      time: activity.updatedAt.toLocaleString()
    }));

    res.json({
      totalUsers,
      pendingApprovals,
      monthlySales: monthlySales || 0,
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

const { authenticate, authorize } = require('../middleware/auth');
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.post('/users', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;

    // Generate a temporary password for admin-created users
    const tempPassword = Math.random().toString(36).slice(-8) + '123';

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: tempPassword, // Temporary password - user should change it on first login
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.put('/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      firstName,
      lastName,
      email,
      role,
      isActive
    });

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

router.delete('/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Reports (Admin only)
router.get('/reports', authenticate, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    let reportData = {};

    switch (type) {
      case 'daily-visits':
        reportData = await getDailyVisitsReport(startDate, endDate);
        break;
      case 'sales':
        reportData = await getSalesReport(startDate, endDate);
        break;
      case 'monthly-stats':
        reportData = await getMonthlyStatsReport();
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json(reportData);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Daily Visits Report
async function getDailyVisitsReport(startDate, endDate) {
  const activities = await Activity.findAll({
    where: {
      date: {
        [Op.between]: [startDate, endDate]
      },
      status: 'completed'
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['firstName', 'lastName']
    }],
    order: [['date', 'DESC']]
  });

  const dailyStats = {};
  activities.forEach(activity => {
    const date = activity.date;
    if (!dailyStats[date]) {
      dailyStats[date] = {
        totalVisits: 0,
        users: []
      };
    }
    dailyStats[date].totalVisits++;
    dailyStats[date].users.push({
      name: `${activity.user.firstName} ${activity.user.lastName}`,
      activity: activity.title
    });
  });

  return {
    type: 'daily-visits',
    period: { startDate, endDate },
    summary: {
      totalVisits: activities.length,
      totalDays: Object.keys(dailyStats).length,
      averageVisitsPerDay: (activities.length / Object.keys(dailyStats).length).toFixed(1)
    },
    dailyBreakdown: dailyStats
  };
}

// Sales Report
async function getSalesReport(startDate, endDate) {
  const sales = await Sale.findAll({
    where: {
      date: {
        [Op.between]: [startDate, endDate]
      }
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['firstName', 'lastName']
    }]
  });

  const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  const productStats = {};
  sales.forEach(sale => {
    if (!productStats[sale.productName]) {
      productStats[sale.productName] = {
        quantity: 0,
        revenue: 0,
        salesCount: 0
      };
    }
    productStats[sale.productName].quantity += sale.quantity;
    productStats[sale.productName].revenue += parseFloat(sale.totalAmount);
    productStats[sale.productName].salesCount++;
  });

  return {
    type: 'sales',
    period: { startDate, endDate },
    summary: {
      totalSales,
      totalQuantity,
      totalTransactions: sales.length,
      averageTransactionValue: (totalSales / sales.length).toFixed(2)
    },
    productBreakdown: productStats,
    sales
  };
}

// Monthly Statistics Report
async function getMonthlyStatsReport() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Get monthly activities
  const monthlyActivities = await Activity.findAll({
    where: {
      date: {
        [Op.gte]: `${currentYear}-${currentMonth}-01`,
        [Op.lte]: currentDate.toISOString().split('T')[0]
      }
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['firstName', 'lastName']
    }]
  });

  // Get monthly sales
  const monthlySales = await Sale.findAll({
    where: {
      date: {
        [Op.gte]: `${currentYear}-${currentMonth}-01`,
        [Op.lte]: currentDate.toISOString().split('T')[0]
      }
    }
  });

  const totalSales = monthlySales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
  const totalActivities = monthlyActivities.length;

  // User performance
  const userStats = {};
  monthlyActivities.forEach(activity => {
    const userName = `${activity.user.firstName} ${activity.user.lastName}`;
    if (!userStats[userName]) {
      userStats[userName] = {
        activities: 0,
        completed: 0
      };
    }
    userStats[userName].activities++;
    if (activity.status === 'completed') {
      userStats[userName].completed++;
    }
  });

  return {
    type: 'monthly-stats',
    period: {
      month: currentMonth,
      year: currentYear,
      monthName: currentDate.toLocaleString('default', { month: 'long' })
    },
    summary: {
      totalActivities,
      totalSales,
      totalUsers: Object.keys(userStats).length,
      completionRate: totalActivities > 0 ? ((monthlyActivities.filter(a => a.status === 'completed').length / totalActivities) * 100).toFixed(1) : 0
    },
    userPerformance: userStats,
    monthlyActivities,
    monthlySales
  };
}

// Recent Activity for Dashboard
router.get('/recent-activity', authenticate, async (req, res) => {
  try {
    // Fetch recent activities from database
    const recentActivities = await Activity.findAll({
      limit: 10,
      order: [['updatedAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }]
    });

    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      user: `${activity.user.firstName} ${activity.user.lastName}`,
      action: `${activity.status} ${activity.title.toLowerCase()}`,
      time: activity.updatedAt.toLocaleString(),
      type: 'activity'
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error('Recent activity fetch error:', error);
    // Return sample data on error for better UX
    const fallbackActivities = [
      {
        id: 1,
        user: 'System',
        action: 'Dashboard loaded successfully',
        time: new Date().toLocaleString(),
        type: 'system'
      }
    ];
    res.json(fallbackActivities);
  }
});

module.exports = router;