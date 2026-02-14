const express = require('express');
const router = express.Router();
const { Territory } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all territories
router.get('/', authenticate, async (req, res) => {
  try {
    const territories = await Territory.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: 'Territories retrieved successfully',
      territories
    });
  } catch (error) {
    console.error('Get territories error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get territory by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const territory = await Territory.findByPk(req.params.id);

    if (!territory) {
      return res.status(404).json({
        message: 'Territory not found'
      });
    }

    res.json({
      message: 'Territory retrieved successfully',
      territory
    });
  } catch (error) {
    console.error('Get territory error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Create new territory
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, region, state, district, description, isActive } = req.body;

    const territory = await Territory.create({
      name,
      code,
      region,
      state,
      district,
      description,
      isActive
    });

    res.status(201).json({
      message: 'Territory created successfully',
      territory
    });
  } catch (error) {
    console.error('Create territory error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Update territory
router.put('/:id', authenticate, async (req, res) => {
  try {
    const territory = await Territory.findByPk(req.params.id);

    if (!territory) {
      return res.status(404).json({
        message: 'Territory not found'
      });
    }

    const { name, code, region, state, district, description, isActive } = req.body;

    await territory.update({
      name,
      code,
      region,
      state,
      district,
      description,
      isActive
    });

    res.json({
      message: 'Territory updated successfully',
      territory
    });
  } catch (error) {
    console.error('Update territory error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Delete territory
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const territory = await Territory.findByPk(req.params.id);

    if (!territory) {
      return res.status(404).json({
        message: 'Territory not found'
      });
    }

    await territory.destroy();

    res.json({
      message: 'Territory deleted successfully'
    });
  } catch (error) {
    console.error('Delete territory error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;