const express = require('express');
const router = express.Router();
const { Projection } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all projections for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, month, year } = req.query;

    // Build where clause
    const whereClause = {};

    // If user is admin and no specific userId is provided, get all projections
    // Otherwise, filter by userId (admin can specify userId to filter, regular users only see their own)
    if (req.user.role === 'admin' && !userId) {
      // Admin gets all projections when no userId is specified
    } else {
      // Regular users can only see their own projections, or admin can filter by specific userId
      whereClause.userId = userId || req.user.id;
    }

    // If month is provided, filter by month
    if (month) {
      whereClause.month = month;
    }

    // If year is provided, filter by year
    if (year) {
      whereClause.year = year;
    }

    const projections = await Projection.findAll({
      where: whereClause,
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json({
      message: 'Projections retrieved successfully',
      projections
    });
  } catch (error) {
    console.error('Get projections error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get projection by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const projection = await Projection.findByPk(req.params.id);
    
    if (!projection) {
      return res.status(404).json({ 
        message: 'Projection not found' 
      });
    }
    
    // Check if user owns this projection or is admin
    if (projection.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own projections.' 
      });
    }
    
    res.json({
      message: 'Projection retrieved successfully',
      projection
    });
  } catch (error) {
    console.error('Get projection error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new projection
router.post('/', authenticate, async (req, res) => {
  try {
    const { month, year, productId, productName, projectedQuantity, projectedAmount } = req.body;
    
    // Validate required fields
    if (!month || !year || !productName || !projectedQuantity || !projectedAmount) {
      return res.status(400).json({ 
        message: 'Month, year, product name, projected quantity, and projected amount are required' 
      });
    }
    
    const projection = await Projection.create({
      userId: req.user.id,
      month,
      year,
      productId,
      productName,
      projectedQuantity,
      projectedAmount
    });
    
    res.status(201).json({
      message: 'Projection created successfully',
      projection
    });
  } catch (error) {
    console.error('Create projection error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update projection
router.put('/:id', authenticate, async (req, res) => {
  try {
    const projection = await Projection.findByPk(req.params.id);
    
    if (!projection) {
      return res.status(404).json({ 
        message: 'Projection not found' 
      });
    }
    
    // Check if user owns this projection or is admin
    if (projection.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own projections.' 
      });
    }
    
    const { month, year, productId, productName, projectedQuantity, projectedAmount, actualQuantity, actualAmount } = req.body;
    
    await projection.update({
      month,
      year,
      productId,
      productName,
      projectedQuantity,
      projectedAmount,
      actualQuantity,
      actualAmount
    });
    
    res.json({
      message: 'Projection updated successfully',
      projection
    });
  } catch (error) {
    console.error('Update projection error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete projection
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const projection = await Projection.findByPk(req.params.id);
    
    if (!projection) {
      return res.status(404).json({ 
        message: 'Projection not found' 
      });
    }
    
    // Check if user owns this projection or is admin
    if (projection.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own projections.' 
      });
    }
    
    await projection.destroy();
    
    res.json({
      message: 'Projection deleted successfully'
    });
  } catch (error) {
    console.error('Delete projection error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;