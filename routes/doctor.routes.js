const express = require('express');
const router = express.Router();
const { Doctor, Business, Sale } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateDoctor } = require('../middleware/validation');
const sequelize = require('../config/database');

// Auto-migrate doctors table before any query
async function ensureDoctorColumns() {
  try {
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS class_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS category_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS territory_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hq_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0`);
  } catch (e) {
    // Ignore errors - columns may already exist
  }
}

// Get all doctors
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureDoctorColumns();
    
    const doctors = await Doctor.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      message: 'Doctors retrieved successfully',
      doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get doctor by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ 
        message: 'Doctor not found' 
      });
    }
    
    res.json({
      message: 'Doctor retrieved successfully',
      doctor
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new doctor
router.post('/', authenticate, validateDoctor, async (req, res) => {
  try {
    const { firstName, lastName, specialty, location, address, phone, email } = req.body;
    
    const doctor = await Doctor.create({
      firstName,
      lastName,
      specialty,
      location,
      address,
      phone,
      email
    });
    
    res.status(201).json({
      message: 'Doctor created successfully',
      doctor
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update doctor
router.put('/:id', authenticate, validateDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ 
        message: 'Doctor not found' 
      });
    }
    
    const { firstName, lastName, specialty, location, address, phone, email, isActive } = req.body;
    
    await doctor.update({
      firstName,
      lastName,
      specialty,
      location,
      address,
      phone,
      email,
      isActive
    });
    
    res.json({
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete doctor
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ 
        message: 'Doctor not found' 
      });
    }

    // Check if doctor is referenced in business entries
    const associatedBusiness = await Business.count({
      where: { doctorId: req.params.id }
    });

    if (associatedBusiness > 0) {
      return res.status(400).json({
        message: `Cannot delete this doctor. It is used in ${associatedBusiness} business entries.`
      });
    }
    
    await doctor.destroy();
    
    res.json({
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;