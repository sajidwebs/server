const express = require('express');
const router = express.Router();
const { Headquarter } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all headquarters
router.get('/', authenticate, async (req, res) => {
  try {
    const headquarters = await Headquarter.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: 'Headquarters retrieved successfully',
      headquarters
    });
  } catch (error) {
    console.error('Get headquarters error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get headquarter by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const headquarter = await Headquarter.findByPk(req.params.id);

    if (!headquarter) {
      return res.status(404).json({
        message: 'Headquarter not found'
      });
    }

    res.json({
      message: 'Headquarter retrieved successfully',
      headquarter
    });
  } catch (error) {
    console.error('Get headquarter error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Create new headquarter
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name, code, type, address, city, state, pincode,
      phone, email, manager, region, zone, territoryCount, employeeCount, isActive
    } = req.body;

    const headquarter = await Headquarter.create({
      name,
      code,
      type,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      manager,
      region,
      zone,
      territoryCount,
      employeeCount,
      isActive
    });

    res.status(201).json({
      message: 'Headquarter created successfully',
      headquarter
    });
  } catch (error) {
    console.error('Create headquarter error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Update headquarter
router.put('/:id', authenticate, async (req, res) => {
  try {
    const headquarter = await Headquarter.findByPk(req.params.id);

    if (!headquarter) {
      return res.status(404).json({
        message: 'Headquarter not found'
      });
    }

    const {
      name, code, type, address, city, state, pincode,
      phone, email, manager, region, zone, territoryCount, employeeCount, isActive
    } = req.body;

    await headquarter.update({
      name,
      code,
      type,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      manager,
      region,
      zone,
      territoryCount,
      employeeCount,
      isActive
    });

    res.json({
      message: 'Headquarter updated successfully',
      headquarter
    });
  } catch (error) {
    console.error('Update headquarter error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Delete headquarter
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const headquarter = await Headquarter.findByPk(req.params.id);

    if (!headquarter) {
      return res.status(404).json({
        message: 'Headquarter not found'
      });
    }

    await headquarter.destroy();

    res.json({
      message: 'Headquarter deleted successfully'
    });
  } catch (error) {
    console.error('Delete headquarter error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;