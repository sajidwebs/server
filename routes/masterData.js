const express = require('express');
const router = express.Router();
const { DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification, Doctor, Territory, Headquarter, Chemist, Product, Activity, Hospital, InputType, InputClass, InputMaster, SampleMaster, PackSize } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== DOCTOR CLASS ROUTES ====================

// Get all doctor classes (open to all authenticated users)
router.get('/doctor-classes', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const classes = await DoctorClass.findAll({
      where,
      order: [['class_name', 'ASC']]
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single doctor class
router.get('/doctor-classes/:id', authenticate, async (req, res) => {
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
    const { class_name, short_name, status } = req.body;
    
    const doctorClass = await DoctorClass.create({
      class_name,
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
    
    const { class_name, short_name, status } = req.body;
    await doctorClass.update({
      class_name: class_name || doctorClass.class_name,
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

// Get all doctor categories (open to all authenticated users)
router.get('/doctor-categories', authenticate, async (req, res) => {
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
router.get('/doctor-categories/:id', authenticate, async (req, res) => {
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

// Get all doctor specialties (open to all authenticated users)
router.get('/doctor-specialties', authenticate, async (req, res) => {
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
router.get('/doctor-specialties/:id', authenticate, async (req, res) => {
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

    const associatedDoctors = await Doctor.count({
      where: { specialty_id: req.params.id }
    });

    if (associatedDoctors > 0) {
      return res.status(400).json({
        error: `Cannot delete this specialty. It is used by ${associatedDoctors} doctor(s).`
      });
    }
    
    await specialty.destroy();
    res.json({ message: 'Doctor specialty deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DOCTOR QUALIFICATION ROUTES ====================

// Get all doctor qualifications (open to all authenticated users)
router.get('/doctor-qualifications', authenticate, async (req, res) => {
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
router.get('/doctor-qualifications/:id', authenticate, async (req, res) => {
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

    const associatedDoctors = await Doctor.count({
      where: { qualification_id: req.params.id }
    });

    if (associatedDoctors > 0) {
      return res.status(400).json({
        error: `Cannot delete this qualification. It is used by ${associatedDoctors} doctor(s).`
      });
    }
    
    await qualification.destroy();
    res.json({ message: 'Doctor qualification deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DOCTOR MASTER ROUTES ====================

// Get all doctors with filters (open to all authenticated users)
router.get('/doctors', authenticate, async (req, res) => {
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
router.get('/doctors/:id', authenticate, async (req, res) => {
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

// ==================== INPUT TYPE ROUTES ====================

// Get all input types (open to all authenticated users)
router.get('/input-types', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const types = await InputType.findAll({
      where,
      order: [['type_name', 'ASC']]
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single input type
router.get('/input-types/:id', authenticate, async (req, res) => {
  try {
    const inputType = await InputType.findByPk(req.params.id);
    if (!inputType) {
      return res.status(404).json({ error: 'Input type not found' });
    }
    res.json(inputType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create input type (Admin only)
router.post('/input-types', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { type_name, short_name, description, status } = req.body;
    
    const inputType = await InputType.create({
      type_name,
      short_name,
      description,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(inputType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update input type (Admin only)
router.put('/input-types/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const inputType = await InputType.findByPk(req.params.id);
    if (!inputType) {
      return res.status(404).json({ error: 'Input type not found' });
    }
    
    const { type_name, short_name, description, status } = req.body;
    await inputType.update({
      type_name: type_name || inputType.type_name,
      short_name: short_name || inputType.short_name,
      description: description !== undefined ? description : inputType.description,
      status: status || inputType.status
    });
    
    res.json(inputType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete input type (Admin only)
router.delete('/input-types/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const inputType = await InputType.findByPk(req.params.id);
    if (!inputType) {
      return res.status(404).json({ error: 'Input type not found' });
    }

    const associatedInputs = await InputMaster.count({
      where: { input_type_id: req.params.id }
    });

    if (associatedInputs > 0) {
      return res.status(400).json({
        error: `Cannot delete this input type. It is used by ${associatedInputs} input(s).`
      });
    }
    
    await inputType.destroy();
    res.json({ message: 'Input type deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== INPUT CLASS ROUTES ====================

// Get all input classes (open to all authenticated users)
router.get('/input-classes', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const classes = await InputClass.findAll({
      where,
      order: [['class_name', 'ASC']]
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single input class
router.get('/input-classes/:id', authenticate, async (req, res) => {
  try {
    const inputClass = await InputClass.findByPk(req.params.id);
    if (!inputClass) {
      return res.status(404).json({ error: 'Input class not found' });
    }
    res.json(inputClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create input class (Admin only)
router.post('/input-classes', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { class_name, short_name, description, status } = req.body;
    
    const inputClass = await InputClass.create({
      class_name,
      short_name,
      description,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(inputClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update input class (Admin only)
router.put('/input-classes/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const inputClass = await InputClass.findByPk(req.params.id);
    if (!inputClass) {
      return res.status(404).json({ error: 'Input class not found' });
    }
    
    const { class_name, short_name, description, status } = req.body;
    await inputClass.update({
      class_name: class_name || inputClass.class_name,
      short_name: short_name || inputClass.short_name,
      description: description !== undefined ? description : inputClass.description,
      status: status || inputClass.status
    });
    
    res.json(inputClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete input class (Admin only)
router.delete('/input-classes/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const inputClass = await InputClass.findByPk(req.params.id);
    if (!inputClass) {
      return res.status(404).json({ error: 'Input class not found' });
    }

    const associatedInputs = await InputMaster.count({
      where: { input_class_id: req.params.id }
    });

    if (associatedInputs > 0) {
      return res.status(400).json({
        error: `Cannot delete this input class. It is used by ${associatedInputs} input(s).`
      });
    }
    
    await inputClass.destroy();
    res.json({ message: 'Input class deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== INPUT MASTER ROUTES ====================

// Get all inputs (open to all authenticated users)
router.get('/inputs', authenticate, async (req, res) => {
  try {
    const { status, input_type_id, input_class_id } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (input_type_id) where.input_type_id = input_type_id;
    if (input_class_id) where.input_class_id = input_class_id;
    
    const inputs = await InputMaster.findAll({
      where,
      include: [
        { model: InputType, as: 'inputType', attributes: ['id', 'type_name', 'short_name'] },
        { model: InputClass, as: 'inputClass', attributes: ['id', 'class_name', 'short_name'] }
      ],
      order: [['input_name', 'ASC']]
    });
    res.json(inputs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active inputs only (for mobile app)
router.get('/inputs/active', authenticate, async (req, res) => {
  try {
    const inputs = await InputMaster.findAll({
      where: { status: 'active' },
      include: [
        { model: InputType, as: 'inputType', attributes: ['id', 'type_name', 'short_name'] },
        { model: InputClass, as: 'inputClass', attributes: ['id', 'class_name', 'short_name'] }
      ],
      order: [['input_name', 'ASC']]
    });
    res.json(inputs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single input
router.get('/inputs/:id', authenticate, async (req, res) => {
  try {
    const input = await InputMaster.findByPk(req.params.id, {
      include: [
        { model: InputType, as: 'inputType' },
        { model: InputClass, as: 'inputClass' }
      ]
    });
    if (!input) {
      return res.status(404).json({ error: 'Input not found' });
    }
    res.json(input);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create input (Admin only)
router.post('/inputs', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { input_name, short_name, input_type_id, input_class_id, description, status } = req.body;
    
    const input = await InputMaster.create({
      input_name,
      short_name,
      input_type_id,
      input_class_id,
      description,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(input);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update input (Admin only)
router.put('/inputs/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const input = await InputMaster.findByPk(req.params.id);
    if (!input) {
      return res.status(404).json({ error: 'Input not found' });
    }
    
    const { input_name, short_name, input_type_id, input_class_id, description, status } = req.body;
    await input.update({
      input_name: input_name || input.input_name,
      short_name: short_name || input.short_name,
      input_type_id: input_type_id !== undefined ? input_type_id : input.input_type_id,
      input_class_id: input_class_id !== undefined ? input_class_id : input.input_class_id,
      description: description !== undefined ? description : input.description,
      status: status || input.status
    });
    
    res.json(input);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete input (Admin only)
router.delete('/inputs/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const input = await InputMaster.findByPk(req.params.id);
    if (!input) {
      return res.status(404).json({ error: 'Input not found' });
    }
    
    await input.destroy();
    res.json({ message: 'Input deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SAMPLE MASTER ROUTES ====================

// Get all samples (open to all authenticated users)
router.get('/samples', authenticate, async (req, res) => {
  try {
    const { status, product_id } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (product_id) where.product_id = product_id;
    
    const samples = await SampleMaster.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'short_name'] },
        { model: PackSize, as: 'packSize', attributes: ['id', 'pack_size', 'short_name'] }
      ],
      order: [['sample_name', 'ASC']]
    });
    res.json(samples);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active samples only (for mobile app)
router.get('/samples/active', authenticate, async (req, res) => {
  try {
    const samples = await SampleMaster.findAll({
      where: { status: 'active' },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'short_name'] },
        { model: PackSize, as: 'packSize', attributes: ['id', 'pack_size', 'short_name'] }
      ],
      order: [['sample_name', 'ASC']]
    });
    res.json(samples);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single sample
router.get('/samples/:id', authenticate, async (req, res) => {
  try {
    const sample = await SampleMaster.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { model: PackSize, as: 'packSize' }
      ]
    });
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    res.json(sample);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sample (Admin only)
router.post('/samples', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { product_id, pack_size_id, sample_name, sample_qty, unit, max_per_call, status } = req.body;
    
    const sample = await SampleMaster.create({
      product_id,
      pack_size_id,
      sample_name,
      sample_qty,
      unit: unit || 'Tab',
      max_per_call: max_per_call || 5,
      status: status || 'active',
      created_by: req.user.id
    });
    
    res.status(201).json(sample);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update sample (Admin only)
router.put('/samples/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const sample = await SampleMaster.findByPk(req.params.id);
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    
    const { product_id, pack_size_id, sample_name, sample_qty, unit, max_per_call, status } = req.body;
    await sample.update({
      product_id: product_id !== undefined ? product_id : sample.product_id,
      pack_size_id: pack_size_id !== undefined ? pack_size_id : sample.pack_size_id,
      sample_name: sample_name || sample.sample_name,
      sample_qty: sample_qty !== undefined ? sample_qty : sample.sample_qty,
      unit: unit || sample.unit,
      max_per_call: max_per_call !== undefined ? max_per_call : sample.max_per_call,
      status: status || sample.status
    });
    
    res.json(sample);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete sample (Admin only)
router.delete('/samples/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const sample = await SampleMaster.findByPk(req.params.id);
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    
    await sample.destroy();
    res.json({ message: 'Sample deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
