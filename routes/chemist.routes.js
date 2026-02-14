const express = require('express');
const router = express.Router();
const { Chemist } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateChemist } = require('../middleware/validation');

// Get all chemists
router.get('/', authenticate, async (req, res) => {
  try {
    const chemists = await Chemist.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      message: 'Chemists retrieved successfully',
      chemists
    });
  } catch (error) {
    console.error('Get chemists error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get chemist by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chemist = await Chemist.findByPk(req.params.id);
    
    if (!chemist) {
      return res.status(404).json({ 
        message: 'Chemist not found' 
      });
    }
    
    res.json({
      message: 'Chemist retrieved successfully',
      chemist
    });
  } catch (error) {
    console.error('Get chemist error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new chemist
router.post('/', authenticate, validateChemist, async (req, res) => {
  try {
    const { name, location, address, phone, email } = req.body;
    
    const chemist = await Chemist.create({
      name,
      location,
      address,
      phone,
      email
    });
    
    res.status(201).json({
      message: 'Chemist created successfully',
      chemist
    });
  } catch (error) {
    console.error('Create chemist error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update chemist
router.put('/:id', authenticate, validateChemist, async (req, res) => {
  try {
    const chemist = await Chemist.findByPk(req.params.id);
    
    if (!chemist) {
      return res.status(404).json({ 
        message: 'Chemist not found' 
      });
    }
    
    const { name, location, address, phone, email, isActive } = req.body;
    
    await chemist.update({
      name,
      location,
      address,
      phone,
      email,
      isActive
    });
    
    res.json({
      message: 'Chemist updated successfully',
      chemist
    });
  } catch (error) {
    console.error('Update chemist error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Delete chemist
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const chemist = await Chemist.findByPk(req.params.id);
    
    if (!chemist) {
      return res.status(404).json({ 
        message: 'Chemist not found' 
      });
    }
    
    await chemist.destroy();
    
    res.json({
      message: 'Chemist deleted successfully'
    });
  } catch (error) {
    console.error('Delete chemist error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;