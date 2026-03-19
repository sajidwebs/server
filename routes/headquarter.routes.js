const express = require('express');
const router = express.Router();
const { Headquarter, Territory, User, Doctor, Chemist } = require('../models');
const { authenticate } = require('../middleware/auth');
const sequelize = require('../config/database');

// Get all headquarters
router.get('/', authenticate, async (req, res) => {
  try {
    const headquarters = await Headquarter.findAll({
      include: [
        { model: Territory, as: 'territories', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'employees', attributes: ['id', 'firstName', 'lastName', 'role'] }
      ],
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

// Get headquarter by ID with all related data
router.get('/:id', authenticate, async (req, res) => {
  try {
    const headquarter = await Headquarter.findByPk(req.params.id, {
      include: [
        { model: Territory, as: 'territories' },
        { model: User, as: 'employees' },
        { model: Doctor, as: 'doctors' },
        { model: Chemist, as: 'chemists' }
      ]
    });

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
      name, code, type, address, city, state, stateType, pincode,
      phone, email, manager, region, zone, reason, territoryCount, employeeCount, isActive
    } = req.body;

    const headquarter = await Headquarter.create({
      name,
      code,
      type,
      address,
      city,
      state,
      stateType,
      pincode,
      phone,
      email,
      manager,
      region,
      zone,
      reason,
      territoryCount,
      employeeCount,
      isActive,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Headquarter created successfully',
      headquarter
    });
  } catch (error) {
    console.error('Create headquarter error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Headquarter code already exists'
      });
    }
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
      name, code, type, address, city, state, stateType, pincode,
      phone, email, manager, region, zone, reason, territoryCount, employeeCount, isActive
    } = req.body;

    await headquarter.update({
      name,
      code,
      type,
      address,
      city,
      state,
      stateType,
      pincode,
      phone,
      email,
      manager,
      region,
      zone,
      reason,
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
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Headquarter code already exists'
      });
    }
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

    // Check if there are any related records
    const territoryCount = await Territory.count({ where: { hq_id: req.params.id } });
    const userCount = await User.count({ where: { hq_id: req.params.id } });
    const doctorCount = await Doctor.count({ where: { hq_id: req.params.id } });
    const chemistCount = await Chemist.count({ where: { hq_id: req.params.id } });

    if (territoryCount > 0 || userCount > 0 || doctorCount > 0 || chemistCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete headquarter. It has associated territories, users, doctors, or chemists.',
        details: {
          territories: territoryCount,
          users: userCount,
          doctors: doctorCount,
          chemists: chemistCount
        }
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

// Get headquarters with counts (for dropdowns)
router.get('/list/with-counts', authenticate, async (req, res) => {
  try {
    const headquarters = await Headquarter.findAll({
      attributes: [
        'id', 'name', 'code', 'state', 'zone', 'region', 'isActive',
        [
          sequelize.fn('COUNT', sequelize.col('territories.id')),
          'territoryCount'
        ],
        [
          sequelize.fn('COUNT', sequelize.col('employees.id')),
          'employeeCount'
        ]
      ],
      include: [
        { model: Territory, as: 'territories', attributes: [] },
        { model: User, as: 'employees', attributes: [] }
      ],
      group: ['Headquarter.id'],
      order: [['name', 'ASC']]
    });

    res.json({
      message: 'Headquarters retrieved successfully',
      headquarters
    });
  } catch (error) {
    console.error('Get headquarters with counts error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;
