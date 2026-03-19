const express = require('express');
const router = express.Router();
const { Territory, Headquarter, User, Doctor, Chemist } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all territories with HQ information
router.get('/', authenticate, async (req, res) => {
  try {
    const territories = await Territory.findAll({
      include: [
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name', 'code', 'zone', 'region'] }
      ],
      order: [['name', 'ASC']]
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

// Get territories by HQ
router.get('/by-hq/:hqId', authenticate, async (req, res) => {
  try {
    const territories = await Territory.findAll({
      where: { hq_id: req.params.hqId },
      order: [['name', 'ASC']]
    });

    res.json({
      message: 'Territories retrieved successfully',
      territories
    });
  } catch (error) {
    console.error('Get territories by HQ error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get territory by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const territory = await Territory.findByPk(req.params.id, {
      include: [
        { model: Headquarter, as: 'headquarter' }
      ]
    });

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
    const { 
      name, code, hq_id, region, state, stateType, zone, district, description, isActive 
    } = req.body;

    const territory = await Territory.create({
      name,
      code,
      hq_id,
      region,
      state,
      stateType,
      zone,
      district,
      description,
      isActive,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Territory created successfully',
      territory
    });
  } catch (error) {
    console.error('Create territory error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Territory code already exists'
      });
    }
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

    const { 
      name, code, hq_id, region, state, stateType, zone, district, description, isActive 
    } = req.body;

    await territory.update({
      name,
      code,
      hq_id,
      region,
      state,
      stateType,
      zone,
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
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Territory code already exists'
      });
    }
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

    // Check if there are any related records
    const userCount = await User.count({ where: { territory_id: req.params.id } });
    const doctorCount = await Doctor.count({ where: { territory_id: req.params.id } });
    const chemistCount = await Chemist.count({ where: { territory_id: req.params.id } });

    if (userCount > 0 || doctorCount > 0 || chemistCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete territory. It has associated users, doctors, or chemists.',
        details: {
          users: userCount,
          doctors: doctorCount,
          chemists: chemistCount
        }
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
