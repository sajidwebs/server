const express = require('express');
const router = express.Router();
const { Doctor, Business, Sale, AuditLog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateDoctor } = require('../middleware/validation');
const sequelize = require('../config/database');

const toPlain = (record) => record ? record.get({ plain: true }) : null;

const logAudit = async (recordId, action, userId, oldValue = null, newValue = null) => {
  try {
    await AuditLog.create({
      table_name: 'doctors',
      record_id: recordId,
      action,
      changed_by: userId,
      old_value: oldValue,
      new_value: newValue
    });
  } catch (error) {
    console.error('Doctor audit logging failed:', error.message);
  }
};

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
    const {
      firstName, lastName, specialty, specialty_id, category_id, qualification_id, class_id,
      territory_id, hq_id, location, address, phone, email, registration_number,
      mobile_number, state, patch_id, full_address, visit_time, visit_day,
      patients_per_week, dob, anniversary, start_date, end_date
    } = req.body;
    
    const doctor = await Doctor.create({
      firstName,
      lastName,
      specialty,
      specialty_id,
      category_id,
      qualification_id,
      class_id,
      territory_id,
      hq_id,
      location,
      address,
      phone,
      email,
      registration_number,
      mobile_number,
      state,
      patch_id,
      full_address,
      visit_time,
      visit_day,
      patients_per_week,
      dob,
      anniversary,
      start_date,
      end_date,
      created_by: req.user.id,
      approval_status: req.user.role === 'ADMIN' ? 'approved' : 'pending',
      current_approval_level: req.user.role === 'ADMIN' ? 0 : 1
    });
    await logAudit(doctor.id, 'CREATE', req.user.id, null, toPlain(doctor));
    
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
    
    const oldValue = toPlain(doctor);
    const {
      firstName, lastName, specialty, specialty_id, category_id, qualification_id, class_id,
      territory_id, hq_id, location, address, phone, email, registration_number,
      mobile_number, state, patch_id, full_address, visit_time, visit_day,
      patients_per_week, dob, anniversary, start_date, end_date, isActive
    } = req.body;
    
    await doctor.update({
      firstName,
      lastName,
      specialty,
      specialty_id,
      category_id,
      qualification_id,
      class_id,
      territory_id,
      hq_id,
      location,
      address,
      phone,
      email,
      registration_number,
      mobile_number,
      state,
      patch_id,
      full_address,
      visit_time,
      visit_day,
      patients_per_week,
      dob,
      anniversary,
      start_date,
      end_date,
      isActive
    });
    await logAudit(doctor.id, 'UPDATE', req.user.id, oldValue, toPlain(doctor));
    
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
    
    const oldValue = toPlain(doctor);
    await doctor.update({ isActive: false, end_date: new Date() });
    await logAudit(doctor.id, 'SOFT_DELETE', req.user.id, oldValue, toPlain(doctor));
    
    res.json({
      message: 'Doctor inactivated successfully'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
