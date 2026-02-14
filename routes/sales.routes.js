const express = require('express');
const router = express.Router();
const { Sale } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all sales for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, date, chemistId } = req.query;

    // Build where clause
    const whereClause = {};

    // If user is admin and no specific userId is provided, get all sales
    // Otherwise, filter by userId (admin can specify userId to filter, regular users only see their own)
    if (req.user.role === 'admin' && !userId) {
      // Admin gets all sales when no userId is specified
    } else {
      // Regular users can only see their own sales, or admin can filter by specific userId
      whereClause.userId = userId || req.user.id;
    }

    // If date is provided, filter by date
    if (date) {
      whereClause.date = date;
    }

    // If chemistId is provided, filter by chemistId
    if (chemistId) {
      whereClause.chemistId = chemistId;
    }

    const sales = await Sale.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });

    res.json({
      message: 'Sales retrieved successfully',
      sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get sale by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ 
        message: 'Sale not found' 
      });
    }
    
    // Check if user owns this sale or is admin
    if (sale.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own sales.' 
      });
    }
    
    res.json({
      message: 'Sale retrieved successfully',
      sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new sale
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, productName, quantity, price, totalAmount, chemistId, date } = req.body;
    
    // Validate required fields
    if (!productName || !quantity || !price || !totalAmount || !date) {
      return res.status(400).json({ 
        message: 'Product name, quantity, price, total amount, and date are required' 
      });
    }
    
    const sale = await Sale.create({
      userId: req.user.id,
      productId,
      productName,
      quantity,
      price,
      totalAmount,
      chemistId,
      date
    });
    
    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update sale
router.put('/:id', authenticate, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ 
        message: 'Sale not found' 
      });
    }
    
    // Check if user owns this sale or is admin
    if (sale.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own sales.' 
      });
    }
    
    const { productId, productName, quantity, price, totalAmount, chemistId, date } = req.body;
    
    await sale.update({
      productId,
      productName,
      quantity,
      price,
      totalAmount,
      chemistId,
      date
    });
    
    res.json({
      message: 'Sale updated successfully',
      sale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete sale
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ 
        message: 'Sale not found' 
      });
    }
    
    // Check if user owns this sale or is admin
    if (sale.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own sales.' 
      });
    }
    
    await sale.destroy();
    
    res.json({
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;