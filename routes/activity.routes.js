const express = require('express');
const router = express.Router();
const { Activity } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateActivity } = require('../middleware/validation');

// Get all activities for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, date } = req.query;

    // Build where clause
    const whereClause = {};

    // If user is admin and no specific userId is provided, get all activities
    // Otherwise, filter by userId (admin can specify userId to filter, regular users only see their own)
    if (req.user.role === 'admin' && !userId) {
      // Admin gets all activities when no userId is specified
    } else {
      // Regular users can only see their own activities, or admin can filter by specific userId
      whereClause.userId = userId || req.user.id;
    }

    // If date is provided, filter by date
    if (date) {
      whereClause.date = date;
    }

    const activities = await Activity.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });

    res.json({
      message: 'Activities retrieved successfully',
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get activity by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ 
        message: 'Activity not found' 
      });
    }
    
    // Check if user owns this activity or is admin
    if (activity.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own activities.' 
      });
    }
    
    res.json({
      message: 'Activity retrieved successfully',
      activity
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new activity
router.post('/', authenticate, validateActivity, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, status, location } = req.body;
    
    const activity = await Activity.create({
      userId: req.user.id,
      title,
      description,
      date,
      startTime,
      endTime,
      status,
      location
    });
    
    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update activity
router.put('/:id', authenticate, validateActivity, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ 
        message: 'Activity not found' 
      });
    }
    
    // Check if user owns this activity or is admin
    if (activity.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own activities.' 
      });
    }
    
    const { title, description, date, startTime, endTime, status, location } = req.body;
    
    await activity.update({
      title,
      description,
      date,
      startTime,
      endTime,
      status,
      location
    });
    
    res.json({
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete activity
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ 
        message: 'Activity not found' 
      });
    }
    
    // Check if user owns this activity or is admin
    if (activity.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own activities.' 
      });
    }
    
    await activity.destroy();
    
    res.json({
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;