const express = require('express');
const router = express.Router();
const { Chemist, Sale, AuditLog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateChemist } = require('../middleware/validation');
const sequelize = require('../config/database');

const toPlain = (record) => record ? record.get({ plain: true }) : null;

const logAudit = async (recordId, action, userId, oldValue = null, newValue = null) => {
  try {
    await AuditLog.create({
      table_name: 'chemists',
      record_id: recordId,
      action,
      changed_by: userId,
      old_value: oldValue,
      new_value: newValue
    });
  } catch (error) {
    console.error('Chemist audit logging failed:', error.message);
  }
};

// Auto-migrate chemists table before any query
async function ensureChemistColumns() {
  try {
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS territory_id INTEGER`);
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS hq_id INTEGER`);
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0`);
  } catch (e) {
    // Ignore errors - columns may already exist
  }
}

// Get all chemists
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureChemistColumns();
    
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
    const {
      name, location, address, phone, email, contact_person, owner_name,
      dl_number, state, patch_id, visit_time, hq_id, territory_id,
      start_date, end_date
    } = req.body;
    
    const chemist = await Chemist.create({
      name,
      location,
      address,
      phone,
      email,
      contact_person,
      owner_name,
      dl_number,
      state,
      patch_id,
      visit_time: visit_time || 'Any time',
      hq_id,
      territory_id,
      start_date,
      end_date,
      createdBy: req.user.id
    });
    await logAudit(chemist.id, 'CREATE', req.user.id, null, toPlain(chemist));
    
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
    
    const oldValue = toPlain(chemist);
    const {
      name, location, address, phone, email, contact_person, owner_name,
      dl_number, state, patch_id, visit_time, hq_id, territory_id,
      start_date, end_date, isActive
    } = req.body;
    
    await chemist.update({
      name,
      location,
      address,
      phone,
      email,
      contact_person,
      owner_name,
      dl_number,
      state,
      patch_id,
      visit_time,
      hq_id,
      territory_id,
      start_date,
      end_date,
      isActive
    });
    await logAudit(chemist.id, 'UPDATE', req.user.id, oldValue, toPlain(chemist));
    
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

    // Check if chemist is referenced in sales
    const associatedSales = await Sale.count({
      where: { chemistId: req.params.id }
    });

    if (associatedSales > 0) {
      return res.status(400).json({
        message: `Cannot delete this chemist. It is used in ${associatedSales} sales records.`
      });
    }
    
    const oldValue = toPlain(chemist);
    await chemist.update({ isActive: false, end_date: new Date() });
    await logAudit(chemist.id, 'SOFT_DELETE', req.user.id, oldValue, toPlain(chemist));
    
    res.json({
      message: 'Chemist inactivated successfully'
    });
  } catch (error) {
    console.error('Delete chemist error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
