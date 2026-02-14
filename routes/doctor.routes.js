const express = require('express');
const router = express.Router();
const { Doctor } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateDoctor } = require('../middleware/validation');

// Get all doctors
router.get('/', authenticate, async (req, res) => {
  try {
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