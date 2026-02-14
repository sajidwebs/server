const express = require('express');
const router = express.Router();
const { User, Activity, Sale, Projection, DayCall } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Get user dashboard data (for field representatives)
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get user's activities
    const totalActivities = await Activity.count({ where: { userId } });
    const completedActivities = await Activity.count({ where: { userId, status: 'completed' } });
    
    // Get user's sales
    const monthlySales = await Sale.sum('totalAmount', {
      where: {
        userId,
        date: {
          [require('sequelize').Op.gte]: `${currentYear}-${currentMonth}-01`
        }
      }
    }) || 0;

    // Get user's projections
    const projections = await Projection.findAll({
      where: { userId, month: currentMonth, year: currentYear }
    });
    const projectedAmount = projections.reduce((sum, p) => sum + parseFloat(p.projectedAmount || 0), 0);

    // Get today's day calls
    const today = currentDate.toISOString().split('T')[0];
    const todayCalls = await DayCall.count({ where: { userId, date: today } });

    // Get doctor's visited count this month
    const doctorVisits = await Activity.count({
      where: {
        userId,
        title: { [require('sequelize').Op.like]: '%Doctor%' },
        date: {
          [require('sequelize').Op.gte]: `${currentYear}-${currentMonth}-01`
        }
      }
    });

    // Get chemist visits this month
    const chemistVisits = await Activity.count({
      where: {
        userId,
        title: { [require('sequelize').Op.like]: '%Chemist%' },
        date: {
          [require('sequelize').Op.gte]: `${currentYear}-${currentMonth}-01`
        }
      }
    });

    res.json({
      message: 'Dashboard data retrieved successfully',
      data: {
        targetYTD: 10,
        saleYTD: monthlySales / 1000,
        deficit: 10 - (monthlySales / 1000),
        currentMonthSale: monthlySales / 100000,
        currentMonthTarget: 5,
        prescriberStats: { JAN: 5, FEB: 6, MAR: 8, APR: 7, MAY: 10 },
        newConversions: 2,
        coverage: { '4V': 15, '3V': 12, '2V': 10, 'CALL ADHERANCE': 'ASPER DATA...' },
        drCallAvg: doctorVisits > 0 ? Math.round(doctorVisits / 22) : 0,
        chemCallAvg: chemistVisits > 0 ? Math.round(chemistVisits / 22) : 0,
        feedbackRating: 5,
        totalActivities,
        completedActivities,
        completionRate: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
        todayCalls,
        projectedAmount,
        actualAmount: monthlySales
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // Exclude password from response
    });
    res.json({
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;
    
    // Check if user is trying to update their own profile or is admin
    if (req.user.id != id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own profile.' 
      });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    // Update user
    await user.update({
      firstName,
      lastName,
      email,
      role,
      isActive
    });
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    await user.destroy();
    
    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;