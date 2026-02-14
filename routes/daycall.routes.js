const express = require('express');
const router = express.Router();
const { DayCall } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all day calls for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, date } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    // If userId is provided and user is admin, filter by userId
    if (userId && req.user.role === 'admin') {
      whereClause.userId = userId;
    } else {
      // Regular users can only see their own day calls
      whereClause.userId = req.user.id;
    }
    
    // If date is provided, filter by date
    if (date) {
      whereClause.date = date;
    }
    
    const dayCalls = await DayCall.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });
    
    res.json({
      message: 'Day calls retrieved successfully',
      dayCalls
    });
  } catch (error) {
    console.error('Get day calls error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get day call by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dayCall = await DayCall.findByPk(req.params.id);
    
    if (!dayCall) {
      return res.status(404).json({ 
        message: 'Day call not found' 
      });
    }
    
    // Check if user owns this day call or is admin
    if (dayCall.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own day calls.' 
      });
    }
    
    res.json({
      message: 'Day call retrieved successfully',
      dayCall
    });
  } catch (error) {
    console.error('Get day call error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new day call
router.post('/', authenticate, async (req, res) => {
  try {
    const { date, startTime, endTime, location, purpose, status, remarks } = req.body;
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        message: 'Date is required' 
      });
    }
    
    const dayCall = await DayCall.create({
      userId: req.user.id,
      date,
      startTime,
      endTime,
      location,
      purpose,
      status,
      remarks
    });
    
    res.status(201).json({
      message: 'Day call created successfully',
      dayCall
    });
  } catch (error) {
    console.error('Create day call error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update day call
router.put('/:id', authenticate, async (req, res) => {
  try {
    const dayCall = await DayCall.findByPk(req.params.id);
    
    if (!dayCall) {
      return res.status(404).json({ 
        message: 'Day call not found' 
      });
    }
    
    // Check if user owns this day call or is admin
    if (dayCall.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own day calls.' 
      });
    }
    
    const { date, startTime, endTime, location, purpose, status, remarks } = req.body;
    
    await dayCall.update({
      date,
      startTime,
      endTime,
      location,
      purpose,
      status,
      remarks
    });
    
    res.json({
      message: 'Day call updated successfully',
      dayCall
    });
  } catch (error) {
    console.error('Update day call error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete day call
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const dayCall = await DayCall.findByPk(req.params.id);
    
    if (!dayCall) {
      return res.status(404).json({ 
        message: 'Day call not found' 
      });
    }
    
    // Check if user owns this day call or is admin
    if (dayCall.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own day calls.' 
      });
    }
    
    await dayCall.destroy();
    
    res.json({
      message: 'Day call deleted successfully'
    });
  } catch (error) {
    console.error('Delete day call error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;