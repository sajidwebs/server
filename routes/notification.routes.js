const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all notifications for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, isRead } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    // If userId is provided and user is admin, filter by userId
    if (userId && req.user.role === 'admin') {
      whereClause.userId = userId;
    } else {
      // Regular users can only see their own notifications
      whereClause.userId = req.user.id;
    }
    
    // If isRead is provided, filter by isRead
    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }
    
    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      message: 'Notifications retrieved successfully',
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get notification by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ 
        message: 'Notification not found' 
      });
    }
    
    // Check if user owns this notification or is admin
    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own notifications.' 
      });
    }
    
    res.json({
      message: 'Notification retrieved successfully',
      notification
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new notification (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admins can create notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Only admins can create notifications.' 
      });
    }
    
    const { userId, title, message, type } = req.body;
    
    // Validate required fields
    if (!userId || !title || !message) {
      return res.status(400).json({ 
        message: 'User ID, title, and message are required' 
      });
    }
    
    const notification = await Notification.create({
      userId,
      title,
      message,
      type
    });
    
    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ 
        message: 'Notification not found' 
      });
    }
    
    // Check if user owns this notification or is admin
    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own notifications.' 
      });
    }
    
    await notification.update({
      isRead: true,
      readAt: new Date()
    });
    
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ 
        message: 'Notification not found' 
      });
    }
    
    // Check if user owns this notification or is admin
    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own notifications.' 
      });
    }
    
    await notification.destroy();
    
    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;