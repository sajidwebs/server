const express = require('express');
const router = express.Router();
const { Sale } = require('../models');
const { authenticate } = require('../middleware/auth');

// Helper: check if user is manager or admin (can see all data)
const canSeeAllData = (user) => {
  if (!user) return false;
  const role = user.role?.toLowerCase() || '';
  return role === 'admin' || role.includes('manager') || role.includes('nsm') || role.includes('rbm') || role.includes('abm') || role.includes('tbm');
};

// Get all sales
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, date, chemistId } = req.query;
    const whereClause = {};

    // Managers/admins see all data, regular users see only their own
    if (!canSeeAllData(req.user) && !userId) {
      whereClause.userId = req.user.id;
    } else if (userId) {
      whereClause.userId = userId;
    }

    if (date) whereClause.date = date;
    if (chemistId) whereClause.chemistId = chemistId;

    const sales = await Sale.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });

    res.json({ message: 'Sales retrieved successfully', sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

// Get sales report by date range
router.get('/report', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};

    if (!canSeeAllData(req.user)) {
      whereClause.userId = req.user.id;
    }

    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    }

    const sales = await Sale.findAll({ where: whereClause, order: [['date', 'DESC']] });
    const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
    const totalQuantity = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    res.json({
      sales,
      summary: { totalAmount, totalQuantity, transactionCount: sales.length }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: 'Error generating sales report' });
  }
});

// Create new sale
router.post('/', authenticate, async (req, res) => {
  try {
    const saleData = { ...req.body, userId: req.body.userId || req.user.id };
    const newSale = await Sale.create(saleData);
    res.status(201).json({ message: 'Sale created successfully', sale: newSale });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Error creating sale' });
  }
});

// Update sale
router.put('/:id', authenticate, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    await sale.update(req.body);
    res.json({ message: 'Sale updated successfully', sale });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Error updating sale' });
  }
});

// Delete sale
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    await sale.destroy();
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Error deleting sale' });
  }
});

module.exports = router;
