const express = require('express');
const router = express.Router();
const { Business } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all business entries for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, doctorId, month, year } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    // If userId is provided and user is admin, filter by userId
    if (userId && req.user.role === 'admin') {
      whereClause.userId = userId;
    } else {
      // Regular users can only see their own business entries
      whereClause.userId = req.user.id;
    }
    
    // If doctorId is provided, filter by doctorId
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }
    
    // If month is provided, filter by month
    if (month) {
      whereClause.month = month;
    }
    
    // If year is provided, filter by year
    if (year) {
      whereClause.year = year;
    }
    
    const businessEntries = await Business.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });
    
    res.json({
      message: 'Business entries retrieved successfully',
      businessEntries
    });
  } catch (error) {
    console.error('Get business entries error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get business entry by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const businessEntry = await Business.findByPk(req.params.id);
    
    if (!businessEntry) {
      return res.status(404).json({ 
        message: 'Business entry not found' 
      });
    }
    
    // Check if user owns this business entry or is admin
    if (businessEntry.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own business entries.' 
      });
    }
    
    res.json({
      message: 'Business entry retrieved successfully',
      businessEntry
    });
  } catch (error) {
    console.error('Get business entry error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new business entry
router.post('/', authenticate, async (req, res) => {
  try {
    const { doctorId, productId, productName, quantity, amount, month, year, date } = req.body;
    
    // Validate required fields
    if (!doctorId || !productName || !quantity || !amount || !month || !year || !date) {
      return res.status(400).json({ 
        message: 'Doctor ID, product name, quantity, amount, month, year, and date are required' 
      });
    }
    
    const businessEntry = await Business.create({
      userId: req.user.id,
      doctorId,
      productId,
      productName,
      quantity,
      amount,
      month,
      year,
      date
    });
    
    res.status(201).json({
      message: 'Business entry created successfully',
      businessEntry
    });
  } catch (error) {
    console.error('Create business entry error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update business entry
router.put('/:id', authenticate, async (req, res) => {
  try {
    const businessEntry = await Business.findByPk(req.params.id);
    
    if (!businessEntry) {
      return res.status(404).json({ 
        message: 'Business entry not found' 
      });
    }
    
    // Check if user owns this business entry or is admin
    if (businessEntry.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own business entries.' 
      });
    }
    
    const { doctorId, productId, productName, quantity, amount, month, year, date } = req.body;
    
    await businessEntry.update({
      doctorId,
      productId,
      productName,
      quantity,
      amount,
      month,
      year,
      date
    });
    
    res.json({
      message: 'Business entry updated successfully',
      businessEntry
    });
  } catch (error) {
    console.error('Update business entry error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete business entry
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const businessEntry = await Business.findByPk(req.params.id);
    
    if (!businessEntry) {
      return res.status(404).json({ 
        message: 'Business entry not found' 
      });
    }
    
    // Check if user owns this business entry or is admin
    if (businessEntry.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own business entries.' 
      });
    }
    
    await businessEntry.destroy();
    
    res.json({
      message: 'Business entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete business entry error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;