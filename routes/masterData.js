const express = require('express');
const router = express.Router();
const { DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification, Doctor, Territory, Headquarter, Chemist, Product, Activity, Hospital } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== DOCTOR CLASS ROUTES ====================

// Get all doctor classes
router.get('/doctor-classes', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const classes = await DoctorClass.findAll({
      where,
      order: [['category_name', 'ASC']]
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single doctor class
router.get('/doctor-classes/:id', async (req, res) => {
  try {
    const doctorClass = await DoctorClass.findByPk(req.params.id);
    if (!doctorClass) {
      return res.status(404).json({ error: 'Doctor class not found' });
    }
    res.json(doctorClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create doctor class (Admin only)
router.post('/doctor-classes', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { category_name, short_name, status } = req.body;
    
    const doctorClass = await DoctorClass.create({
      category_name,
      short_name,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(doctorClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update doctor class (Admin only)
router.put('/doctor-classes/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const doctorClass = await DoctorClass.findByPk(req.params.id);
    if (!doctorClass) {
      return res.status(404).json({ error: 'Doctor class not found' });
    }
    
    const { category_name, short_name, status } = req.body;
    await doctorClass.update({
      category_name: category_name || doctorClass.category_name,
      short_name: short_name || doctorClass.short_name,
      status: status || doctorClass.status,
      updated_by: req.user.id
    });
    
    res.json(doctorClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete doctor class (Admin only)
router.delete('/doctor-classes/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const doctorClass = await DoctorClass.findByPk(req.params.id);
    if (!doctorClass) {
      return res.status(404).json({ error: 'Doctor class not found' });
    }
    
    await doctorClass.destroy();
    res.json({ message: 'Doctor class deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DOCTOR CATEGORY ROUTES ====================

// Get all doctor categories
router.get('/doctor-categories', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const categories = await DoctorCategory.findAll({
      where,
      order: [['category_name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single doctor category
router.get('/doctor-categories/:id', async (req, res) => {
  try {
    const category = await DoctorCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Doctor category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create doctor category (Admin only)
router.post('/doctor-categories', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { category_name, short_name, status } = req.body;
    
    const category = await DoctorCategory.create({
      category_name,
      short_name,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update doctor category (Admin only)
router.put('/doctor-categories/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const category = await DoctorCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Doctor category not found' });
    }
    
    const { category_name, short_name, status } = req.body;
    await category.update({
      category_name: category_name || category.category_name,
      short_name: short_name || category.short_name,
      status: status || category.status,
      updated_by: req.user.id
    });
    
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete doctor category (Admin only)
router.delete('/doctor-categories/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const category = await DoctorCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Doctor category not found' });
    }
    
    // Check if there are any doctors associated with this category
    const associatedDoctors = await Doctor.count({
      where: { category_id: req.params.id }
    });
    
    if (associatedDoctors > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this category. There are ${associatedDoctors} doctor(s) associated with it.` 
      });
    }
    
    await category.destroy();
    res.json({ message: 'Doctor category deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DOCTOR SPECIALTY ROUTES ====================

// Get all doctor specialties
router.get('/doctor-specialties', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const specialties = await DoctorSpecialty.findAll({
      where,
      order: [['specialty_name', 'ASC']]
    });
    res.json(specialties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single doctor specialty
router.get('/doctor-specialties/:id', async (req, res) => {
  try {
    const specialty = await DoctorSpecialty.findByPk(req.params.id);
    if (!specialty) {
      return res.status(404).json({ error: 'Doctor specialty not found' });
    }
    res.json(specialty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create doctor specialty (Admin only)
router.post('/doctor-specialties', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { specialty_name, short_name, status } = req.body;
    
    const specialty = await DoctorSpecialty.create({
      specialty_name,
      short_name,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(specialty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update doctor specialty (Admin only)
router.put('/doctor-specialties/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const specialty = await DoctorSpecialty.findByPk(req.params.id);
    if (!specialty) {
      return res.status(404).json({ error: 'Doctor specialty not found' });
    }
    
    const { specialty_name, short_name, status } = req.body;
    await specialty.update({
      specialty_name: specialty_name || specialty.specialty_name,
      short_name: short_name || specialty.short_name,
      status: status || specialty.status,
      updated_by: req.user.id
    });
    
    res.json(specialty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete doctor specialty (Admin only)
router.delete('/doctor-specialties/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const specialty = await DoctorSpecialty.findByPk(req.params.id);
    if (!specialty) {
      return res.status(404).json({ error: 'Doctor specialty not found' });
    }
    
    await specialty.destroy();
    res.json({ message: 'Doctor specialty deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DOCTOR QUALIFICATION ROUTES ====================

// Get all doctor qualifications
router.get('/doctor-qualifications', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const qualifications = await DoctorQualification.findAll({
      where,
      order: [['qualification_name', 'ASC']]
    });
    res.json(qualifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single doctor qualification
router.get('/doctor-qualifications/:id', async (req, res) => {
  try {
    const qualification = await DoctorQualification.findByPk(req.params.id);
    if (!qualification) {
      return res.status(404).json({ error: 'Doctor qualification not found' });
    }
    res.json(qualification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create doctor qualification (Admin only)
router.post('/doctor-qualifications', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { qualification_name, short_name, status } = req.body;
    
    const qualification = await DoctorQualification.create({
      qualification_name,
      short_name,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(qualification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update doctor qualification (Admin only)
router.put('/doctor-qualifications/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const qualification = await DoctorQualification.findByPk(req.params.id);
    if (!qualification) {
      return res.status(404).json({ error: 'Doctor qualification not found' });
    }
    
    const { qualification_name, short_name, status } = req.body;
    await qualification.update({
      qualification_name: qualification_name || qualification.qualification_name,
      short_name: short_name || qualification.short_name,
      status: status || qualification.status,
      updated_by: req.user.id
    });
    
    res.json(qualification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete doctor qualification (Admin only)
router.delete('/doctor-qualifications/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const qualification = await DoctorQualification.findByPk(req.params.id);
    if (!qualification) {
      return res.status(404).json({ error: 'Doctor qualification not found' });
    }
    
    await qualification.destroy();
    res.json({ message: 'Doctor qualification deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DOCTOR MASTER ROUTES ====================

// Get all doctors with filters
router.get('/doctors', async (req, res) => {
  try {
    const { territory_id, hq_id, category_id, specialty_id, status } = req.query;
    const where = {};
    
    if (territory_id) where.territory_id = territory_id;
    if (hq_id) where.hq_id = hq_id;
    if (category_id) where.category_id = category_id;
    if (specialty_id) where.specialty_id = specialty_id;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    
    const doctors = await Doctor.findAll({
      where,
      include: [
        { model: DoctorSpecialty, as: 'specialtyData', attributes: ['specialty_id', 'specialty_name', 'short_name'] },
        { model: DoctorCategory, as: 'categoryData', attributes: ['category_id', 'category_name', 'short_name'] },
        { model: DoctorQualification, as: 'qualificationData', attributes: ['qualification_id', 'qualification_name', 'short_name'] }
      ],
      order: [['firstName', 'ASC']]
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single doctor
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [
        { model: DoctorSpecialty, as: 'specialtyData' },
        { model: DoctorCategory, as: 'categoryData' },
        { model: DoctorQualification, as: 'qualificationData' }
      ]
    });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create doctor (Admin only - Head Office can add directly)
router.post('/doctors', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { firstName, lastName, specialty_id, category_id, qualification_id, territory_id, hq_id, location, address, phone, email } = req.body;
    
    const doctor = await Doctor.create({
      firstName,
      lastName,
      specialty_id,
      category_id,
      qualification_id,
      territory_id,
      hq_id,
      location,
      address,
      phone,
      email,
      approval_status: 'approved',
      current_approval_level: 0,
      created_by: req.user.id
    });
    
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update doctor (Admin only)
router.put('/doctors/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const { firstName, lastName, specialty_id, category_id, qualification_id, territory_id, hq_id, location, address, phone, email, isActive } = req.body;
    
    await doctor.update({
      firstName: firstName || doctor.firstName,
      lastName: lastName || doctor.lastName,
      specialty_id: specialty_id !== undefined ? specialty_id : doctor.specialty_id,
      category_id: category_id !== undefined ? category_id : doctor.category_id,
      qualification_id: qualification_id !== undefined ? qualification_id : doctor.qualification_id,
      territory_id: territory_id !== undefined ? territory_id : doctor.territory_id,
      hq_id: hq_id !== undefined ? hq_id : doctor.hq_id,
      location: location !== undefined ? location : doctor.location,
      address: address !== undefined ? address : doctor.address,
      phone: phone !== undefined ? phone : doctor.phone,
      email: email !== undefined ? email : doctor.email,
      isActive: isActive !== undefined ? isActive : doctor.isActive
    });
    
    res.json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete doctor (Admin only)
router.delete('/doctors/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    await doctor.destroy();
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
