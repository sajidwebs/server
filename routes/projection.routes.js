const express = require('express');
const router = express.Router();
const { Projection } = require('../models');
const { authenticate } = require('../middleware/auth');

// Helper: check if user is manager or admin (can see all data)
const canSeeAllData = (user) => {
  if (!user) return false;
  const role = user.role?.toLowerCase() || '';
  return role === 'admin' || role.includes('manager') || role.includes('nsm') || role.includes('rbm') || role.includes('abm') || role.includes('tbm');
};

// Get all projections
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, month, year } = req.query;
    const whereClause = {};

    // Managers/admins see all data, regular users see only their own
    if (!canSeeAllData(req.user) && !userId) {
      whereClause.userId = req.user.id;
    } else if (userId) {
      whereClause.userId = userId;
    }

    if (month) whereClause.month = month;
    if (year) whereClause.year = year;

    const projections = await Projection.findAll({
      where: whereClause,
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json({ message: 'Projections retrieved successfully', projections });
  } catch (error) {
    console.error('Error fetching projections:', error);
    res.status(500).json({ message: 'Error fetching projections' });
  }
});

// Create new projection
router.post('/', authenticate, async (req, res) => {
  try {
    const projectionData = { ...req.body, userId: req.body.userId || req.user.id };
    const newProjection = await Projection.create(projectionData);
    res.status(201).json({ message: 'Projection created successfully', projection: newProjection });
  } catch (error) {
    console.error('Error creating projection:', error);
    res.status(500).json({ message: 'Error creating projection' });
  }
});

// Update projection
router.put('/:id', authenticate, async (req, res) => {
  try {
    const projection = await Projection.findByPk(req.params.id);
    if (!projection) return res.status(404).json({ message: 'Projection not found' });
    await projection.update(req.body);
    res.json({ message: 'Projection updated successfully', projection });
  } catch (error) {
    console.error('Error updating projection:', error);
    res.status(500).json({ message: 'Error updating projection' });
  }
});

// Delete projection
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const projection = await Projection.findByPk(req.params.id);
    if (!projection) return res.status(404).json({ message: 'Projection not found' });
    await projection.destroy();
    res.json({ message: 'Projection deleted successfully' });
  } catch (error) {
    console.error('Error deleting projection:', error);
    res.status(500).json({ message: 'Error deleting projection' });
  }
});

module.exports = router;
