const express = require('express');
const router = express.Router();
const { DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification, Doctor, Territory, Headquarter, Chemist, Product, Activity, Hospital, InputType, InputClass, InputMaster, SampleMaster, PackSize, Patch, Stockist, SVL, InputAllocation, NoticeUpload, SOPPolicy, AuditLog, PatchHeadquarter, RateFixation, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Audit logging helper function
const logAudit = async (tableName, recordId, action, changedBy, oldValue = null, newValue = null, fieldName = null) => {
  try {
    await AuditLog.create({
      table_name: tableName,
      record_id: recordId,
      action,
      changed_by: changedBy,
      old_value: oldValue,
      new_value: newValue,
      field_name: fieldName
    });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};

const toPlain = (record) => record ? record.get({ plain: true }) : null;

const softDelete = async (record, tableName, userId, extra = {}) => {
  const oldValue = toPlain(record);
  await record.update({
    isActive: false,
    status: record.status !== undefined ? 'inactive' : record.status,
    end_date: record.end_date !== undefined ? new Date() : record.end_date,
    ...extra
  });
  await logAudit(tableName, record.id, 'SOFT_DELETE', userId, oldValue, toPlain(record));
};

const auditCreate = async (tableName, record, userId) => {
  await logAudit(tableName, record.id, 'CREATE', userId, null, toPlain(record));
};

const auditUpdate = async (tableName, recordId, userId, oldValue, record) => {
  await logAudit(tableName, recordId, 'UPDATE', userId, oldValue, toPlain(record));
};

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
    
    await softDelete(doctorClass, 'doctor_classes', req.user.id);
    res.json({ message: 'Doctor class inactivated successfully' });
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
    
    await softDelete(category, 'doctor_categories', req.user.id);
    res.json({ message: 'Doctor category inactivated successfully' });
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
    
    await softDelete(specialty, 'doctor_specialties', req.user.id);
    res.json({ message: 'Doctor specialty inactivated successfully' });
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
    
    await softDelete(qualification, 'doctor_qualifications', req.user.id);
    res.json({ message: 'Doctor qualification inactivated successfully' });
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
    const {
      firstName, lastName, specialty_id, category_id, qualification_id, class_id,
      territory_id, hq_id, location, address, phone, email, registration_number,
      mobile_number, state, patch_id, full_address, visit_time, visit_day,
      patients_per_week, dob, anniversary, start_date, end_date
    } = req.body;
    
    const doctor = await Doctor.create({
      firstName,
      lastName,
      class_id,
      specialty_id,
      category_id,
      qualification_id,
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
      approval_status: 'approved',
      current_approval_level: 0,
      created_by: req.user.id
    });
    await auditCreate('doctors', doctor, req.user.id);
    
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
    
    const oldValue = toPlain(doctor);
    const {
      firstName, lastName, specialty_id, category_id, qualification_id, class_id,
      territory_id, hq_id, location, address, phone, email, registration_number,
      mobile_number, state, patch_id, full_address, visit_time, visit_day,
      patients_per_week, dob, anniversary, start_date, end_date, isActive
    } = req.body;
    
    await doctor.update({
      firstName: firstName || doctor.firstName,
      lastName: lastName || doctor.lastName,
      class_id: class_id !== undefined ? class_id : doctor.class_id,
      specialty_id: specialty_id !== undefined ? specialty_id : doctor.specialty_id,
      category_id: category_id !== undefined ? category_id : doctor.category_id,
      qualification_id: qualification_id !== undefined ? qualification_id : doctor.qualification_id,
      territory_id: territory_id !== undefined ? territory_id : doctor.territory_id,
      hq_id: hq_id !== undefined ? hq_id : doctor.hq_id,
      location: location !== undefined ? location : doctor.location,
      address: address !== undefined ? address : doctor.address,
      phone: phone !== undefined ? phone : doctor.phone,
      email: email !== undefined ? email : doctor.email,
      registration_number: registration_number !== undefined ? registration_number : doctor.registration_number,
      mobile_number: mobile_number !== undefined ? mobile_number : doctor.mobile_number,
      state: state !== undefined ? state : doctor.state,
      patch_id: patch_id !== undefined ? patch_id : doctor.patch_id,
      full_address: full_address !== undefined ? full_address : doctor.full_address,
      visit_time: visit_time !== undefined ? visit_time : doctor.visit_time,
      visit_day: visit_day !== undefined ? visit_day : doctor.visit_day,
      patients_per_week: patients_per_week !== undefined ? patients_per_week : doctor.patients_per_week,
      dob: dob !== undefined ? dob : doctor.dob,
      anniversary: anniversary !== undefined ? anniversary : doctor.anniversary,
      start_date: start_date !== undefined ? start_date : doctor.start_date,
      end_date: end_date !== undefined ? end_date : doctor.end_date,
      isActive: isActive !== undefined ? isActive : doctor.isActive
    });
    await auditUpdate('doctors', doctor.id, req.user.id, oldValue, doctor);
    
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
    
    await softDelete(doctor, 'doctors', req.user.id);
    res.json({ message: 'Doctor inactivated successfully' });
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
    
    await softDelete(inputType, 'input_types', req.user.id);
    res.json({ message: 'Input type inactivated successfully' });
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
    
    await softDelete(inputClass, 'input_classes', req.user.id);
    res.json({ message: 'Input class inactivated successfully' });
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
    
    await softDelete(input, 'input_masters', req.user.id);
    res.json({ message: 'Input inactivated successfully' });
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
    
    await softDelete(sample, 'sample_masters', req.user.id);
    res.json({ message: 'Sample inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PATCH MASTER ROUTES ====================

// Get all patches (open to all authenticated users)
router.get('/patches', authenticate, async (req, res) => {
  try {
    const { status, hq_id, state } = req.query;
    const where = {};

    if (status) where.isActive = status === 'active';
    if (hq_id) where.hq_id = hq_id;
    if (state) where.state = state;

    const patches = await Patch.findAll({
      where,
      include: [
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name'] },
        { model: Headquarter, as: 'mappedHeadquarters', attributes: ['id', 'name'], through: { attributes: ['isActive'] } }
      ],
      order: [['patch_name', 'ASC']]
    });
    res.json(patches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single patch
router.get('/patches/:id', authenticate, async (req, res) => {
  try {
    const patch = await Patch.findByPk(req.params.id, {
      include: [
        { model: Headquarter, as: 'headquarter' },
        { model: Headquarter, as: 'mappedHeadquarters', through: { attributes: ['isActive', 'start_date', 'end_date'] } }
      ]
    });
    if (!patch) {
      return res.status(404).json({ error: 'Patch not found' });
    }
    res.json(patch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create patch (Admin only)
router.post('/patches', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { patch_name, state, hq_id, pincode } = req.body;

    const patch = await Patch.create({
      patch_name,
      state,
      hq_id,
      pincode,
      created_by: req.user.id
    });
    if (hq_id) {
      await PatchHeadquarter.findOrCreate({
        where: { patch_id: patch.id, hq_id },
        defaults: { created_by: req.user.id, isActive: true }
      });
    }
    await auditCreate('patches', patch, req.user.id);

    res.status(201).json(patch);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update patch (Admin only)
router.put('/patches/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const patch = await Patch.findByPk(req.params.id);
    if (!patch) {
      return res.status(404).json({ error: 'Patch not found' });
    }

    const oldValue = toPlain(patch);
    const { patch_name, state, hq_id, pincode, isActive } = req.body;
    await patch.update({
      patch_name: patch_name || patch.patch_name,
      state: state || patch.state,
      hq_id: hq_id !== undefined ? hq_id : patch.hq_id,
      pincode: pincode || patch.pincode,
      isActive: isActive !== undefined ? isActive : patch.isActive
    });
    if (hq_id !== undefined && hq_id !== null) {
      await PatchHeadquarter.findOrCreate({
        where: { patch_id: patch.id, hq_id },
        defaults: { created_by: req.user.id, isActive: true }
      });
    }
    await auditUpdate('patches', patch.id, req.user.id, oldValue, patch);

    res.json(patch);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete patch (Admin only)
router.delete('/patches/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const patch = await Patch.findByPk(req.params.id);
    if (!patch) {
      return res.status(404).json({ error: 'Patch not found' });
    }

    await softDelete(patch, 'patches', req.user.id);
    await PatchHeadquarter.update(
      { isActive: false, end_date: new Date() },
      { where: { patch_id: patch.id } }
    );
    res.json({ message: 'Patch inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Map a patch to an HQ (Admin only)
router.post('/patches/:id/headquarters', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { hq_id, start_date, end_date } = req.body;
    const patch = await Patch.findByPk(req.params.id);
    if (!patch) {
      return res.status(404).json({ error: 'Patch not found' });
    }

    const [mapping, created] = await PatchHeadquarter.findOrCreate({
      where: { patch_id: patch.id, hq_id },
      defaults: {
        start_date,
        end_date,
        isActive: true,
        created_by: req.user.id
      }
    });

    if (!created) {
      const oldValue = toPlain(mapping);
      await mapping.update({ start_date: start_date || mapping.start_date, end_date, isActive: true });
      await auditUpdate('patch_headquarters', mapping.id, req.user.id, oldValue, mapping);
    } else {
      await auditCreate('patch_headquarters', mapping, req.user.id);
    }

    res.status(created ? 201 : 200).json(mapping);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove a patch-HQ mapping without deleting the patch
router.delete('/patches/:id/headquarters/:hqId', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const mapping = await PatchHeadquarter.findOne({
      where: { patch_id: req.params.id, hq_id: req.params.hqId }
    });
    if (!mapping) {
      return res.status(404).json({ error: 'Patch-HQ mapping not found' });
    }
    await softDelete(mapping, 'patch_headquarters', req.user.id);
    res.json({ message: 'Patch-HQ mapping inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== STOCKIST MASTER ROUTES ====================

// Get all stockists (open to all authenticated users)
router.get('/stockists', authenticate, async (req, res) => {
  try {
    const { status, hq_id, state } = req.query;
    const where = {};

    if (status) where.isActive = status === 'active';
    if (hq_id) where.hq_id = hq_id;
    if (state) where.state = state;

    const stockists = await Stockist.findAll({
      where,
      include: [
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name'] },
        { model: Patch, as: 'patch', attributes: ['id', 'patch_name'] }
      ],
      order: [['stockist_name', 'ASC']]
    });
    res.json(stockists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single stockist
router.get('/stockists/:id', authenticate, async (req, res) => {
  try {
    const stockist = await Stockist.findByPk(req.params.id, {
      include: [
        { model: Headquarter, as: 'headquarter' },
        { model: Patch, as: 'patch' }
      ]
    });
    if (!stockist) {
      return res.status(404).json({ error: 'Stockist not found' });
    }
    res.json(stockist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create stockist (Admin only)
router.post('/stockists', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { stockist_name, mobile, contact_person, hq_id, state, address, patch_id } = req.body;

    const stockist = await Stockist.create({
      stockist_name,
      mobile,
      contact_person,
      hq_id,
      state,
      address,
      patch_id,
      created_by: req.user.id
    });
    await auditCreate('stockists', stockist, req.user.id);

    res.status(201).json(stockist);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update stockist (Admin only)
router.put('/stockists/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const stockist = await Stockist.findByPk(req.params.id);
    if (!stockist) {
      return res.status(404).json({ error: 'Stockist not found' });
    }

    const oldValue = toPlain(stockist);
    const { stockist_name, mobile, contact_person, hq_id, state, address, patch_id, isActive } = req.body;
    await stockist.update({
      stockist_name: stockist_name || stockist.stockist_name,
      mobile: mobile || stockist.mobile,
      contact_person: contact_person || stockist.contact_person,
      hq_id: hq_id !== undefined ? hq_id : stockist.hq_id,
      state: state || stockist.state,
      address: address || stockist.address,
      patch_id: patch_id !== undefined ? patch_id : stockist.patch_id,
      isActive: isActive !== undefined ? isActive : stockist.isActive
    });
    await auditUpdate('stockists', stockist.id, req.user.id, oldValue, stockist);

    res.json(stockist);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete stockist (Admin only)
router.delete('/stockists/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const stockist = await Stockist.findByPk(req.params.id);
    if (!stockist) {
      return res.status(404).json({ error: 'Stockist not found' });
    }

    await softDelete(stockist, 'stockists', req.user.id);
    res.json({ message: 'Stockist inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== HOSPITAL MASTER ROUTES ====================

// Get all hospitals (open to all authenticated users)
router.get('/hospitals', authenticate, async (req, res) => {
  try {
    const { status, hq_id, state } = req.query;
    const where = {};

    if (status) where.isActive = status === 'active';
    if (hq_id) where.hq_id = hq_id;
    if (state) where.state = state;

    const hospitals = await Hospital.findAll({
      where,
      include: [
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name'] },
        { model: Patch, as: 'patch', attributes: ['id', 'patch_name'] }
      ],
      order: [['hospital_name', 'ASC']]
    });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single hospital
router.get('/hospitals/:id', authenticate, async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id, {
      include: [
        { model: Headquarter, as: 'headquarter' },
        { model: Patch, as: 'patch' }
      ]
    });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create hospital (Admin only)
router.post('/hospitals', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { hospital_name, mobile, contact_person, hq_id, state, address, patch_id } = req.body;

    const hospital = await Hospital.create({
      hospital_name,
      mobile,
      contact_person,
      hq_id,
      state,
      address,
      patch_id,
      created_by: req.user.id
    });
    await auditCreate('hospitals', hospital, req.user.id);

    res.status(201).json(hospital);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update hospital (Admin only)
router.put('/hospitals/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const oldValue = toPlain(hospital);
    const { hospital_name, mobile, contact_person, hq_id, state, address, patch_id, isActive } = req.body;
    await hospital.update({
      hospital_name: hospital_name || hospital.hospital_name,
      mobile: mobile || hospital.mobile,
      contact_person: contact_person || hospital.contact_person,
      hq_id: hq_id !== undefined ? hq_id : hospital.hq_id,
      state: state || hospital.state,
      address: address || hospital.address,
      patch_id: patch_id !== undefined ? patch_id : hospital.patch_id,
      isActive: isActive !== undefined ? isActive : hospital.isActive
    });
    await auditUpdate('hospitals', hospital.id, req.user.id, oldValue, hospital);

    res.json(hospital);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete hospital (Admin only)
router.delete('/hospitals/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    await softDelete(hospital, 'hospitals', req.user.id);
    res.json({ message: 'Hospital inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SVL (STANDARD VISITING LIST) ROUTES ====================

// Get all SVL entries (open to all authenticated users)
router.get('/svl', authenticate, async (req, res) => {
  try {
    const { hq_id, doctor_id, year } = req.query;
    const where = {};

    if (hq_id) where.hq_id = hq_id;
    if (doctor_id) where.doctor_id = doctor_id;
    if (year) where.year = year;

    const svlEntries = await SVL.findAll({
      where,
      include: [
        { model: Doctor, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name'] }
      ],
      order: [['year', 'DESC'], ['doctor_id', 'ASC']]
    });
    res.json(svlEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SVL for specific HQ
router.get('/svl/hq/:hq_id', authenticate, async (req, res) => {
  try {
    const { year } = req.query;
    const where = { hq_id: req.params.hq_id };

    if (year) where.year = year;

    const svlEntries = await SVL.findAll({
      where,
      include: [
        { model: Doctor, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'specialty', 'location'] }
      ],
      order: [['priority', 'ASC']]
    });
    res.json(svlEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add doctor to SVL (Admin only)
router.post('/svl', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { doctor_id, hq_id, visit_frequency, priority, year } = req.body;

    const svl = await SVL.create({
      doctor_id,
      hq_id,
      visit_frequency: visit_frequency || 'Weekly',
      priority: priority || 1,
      year: year || new Date().getFullYear(),
      created_by: req.user.id
    });
    await auditCreate('svl', svl, req.user.id);

    res.status(201).json(svl);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove doctor from SVL (Admin only)
router.delete('/svl/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const svl = await SVL.findByPk(req.params.id);
    if (!svl) {
      return res.status(404).json({ error: 'SVL entry not found' });
    }

    await softDelete(svl, 'svl', req.user.id);
    res.json({ message: 'Doctor removed from active SVL successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== INPUT ALLOCATION MASTER ROUTES ====================

// Get all input allocations (open to all authenticated users)
router.get('/input-allocations', authenticate, async (req, res) => {
  try {
    const { user_id, input_id } = req.query;
    const where = {};

    if (user_id) where.user_id = user_id;
    if (input_id) where.input_id = input_id;

    const allocations = await InputAllocation.findAll({
      where,
      include: [
        { model: require('../models').User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        { model: InputMaster, as: 'input', attributes: ['id', 'input_name'] }
      ],
      order: [['start_date', 'DESC']]
    });
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create input allocation (Admin only)
router.post('/input-allocations', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { user_id, input_id, product_input, qty, start_date, end_date, allocation_type } = req.body;

    const allocation = await InputAllocation.create({
      user_id,
      input_id,
      product_input,
      qty,
      start_date,
      end_date,
      allocation_type: allocation_type || 'monthly',
      created_by: req.user.id
    });
    await auditCreate('input_allocations', allocation, req.user.id);

    res.status(201).json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update input allocation (Admin only)
router.put('/input-allocations/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const allocation = await InputAllocation.findByPk(req.params.id);
    if (!allocation) {
      return res.status(404).json({ error: 'Input allocation not found' });
    }

    const oldValue = toPlain(allocation);
    const { user_id, input_id, product_input, qty, start_date, end_date, allocation_type, isActive } = req.body;
    await allocation.update({
      user_id: user_id || allocation.user_id,
      input_id: input_id || allocation.input_id,
      product_input: product_input || allocation.product_input,
      qty: qty !== undefined ? qty : allocation.qty,
      start_date: start_date || allocation.start_date,
      end_date: end_date || allocation.end_date,
      allocation_type: allocation_type || allocation.allocation_type,
      isActive: isActive !== undefined ? isActive : allocation.isActive
    });
    await auditUpdate('input_allocations', allocation.id, req.user.id, oldValue, allocation);

    res.json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete input allocation (Admin only)
router.delete('/input-allocations/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const allocation = await InputAllocation.findByPk(req.params.id);
    if (!allocation) {
      return res.status(404).json({ error: 'Input allocation not found' });
    }

    await softDelete(allocation, 'input_allocations', req.user.id);
    res.json({ message: 'Input allocation inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== NOTICE UPLOAD MASTER ROUTES ====================

// Get all notices (open to all authenticated users)
router.get('/notices', authenticate, async (req, res) => {
  try {
    const { status, audience } = req.query;
    const where = {};

    if (status) where.isActive = status === 'active';
    if (audience) where.audience = audience;

    const notices = await NoticeUpload.findAll({
      where,
      include: [
        { model: require('../models').User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['effective_date', 'DESC']]
    });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notice (Admin only)
router.post('/notices', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { notice_id, title, notice_document, effective_date, audience } = req.body;

    const notice = await NoticeUpload.create({
      notice_id,
      title,
      notice_document,
      effective_date,
      audience: audience || 'all',
      created_by: req.user.id
    });
    await auditCreate('notice_uploads', notice, req.user.id);

    res.status(201).json(notice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update notice (Admin only)
router.put('/notices/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const notice = await NoticeUpload.findByPk(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const oldValue = toPlain(notice);
    const { notice_id, title, notice_document, effective_date, audience, isActive } = req.body;
    await notice.update({
      notice_id: notice_id || notice.notice_id,
      title: title || notice.title,
      notice_document: notice_document || notice.notice_document,
      effective_date: effective_date || notice.effective_date,
      audience: audience || notice.audience,
      isActive: isActive !== undefined ? isActive : notice.isActive
    });
    await auditUpdate('notice_uploads', notice.id, req.user.id, oldValue, notice);

    res.json(notice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete notice (Admin only)
router.delete('/notices/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const notice = await NoticeUpload.findByPk(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    await softDelete(notice, 'notice_uploads', req.user.id);
    res.json({ message: 'Notice inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SOP/POLICY MASTER ROUTES ====================

// Get all SOP/policies (open to all authenticated users)
router.get('/sop-policies', authenticate, async (req, res) => {
  try {
    const { designation, status } = req.query;
    const where = {};

    if (designation) where.designation = designation;
    if (status) where.isActive = status === 'active';

    const policies = await SOPPolicy.findAll({
      where,
      include: [
        { model: require('../models').User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['start_date', 'DESC']]
    });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create SOP/policy (Admin only)
router.post('/sop-policies', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { designation, sop_document, probation_policy, regular_policy, whistle_blower_policy, start_date, end_date } = req.body;

    const policy = await SOPPolicy.create({
      designation,
      sop_document,
      probation_policy,
      regular_policy,
      whistle_blower_policy,
      start_date,
      end_date,
      created_by: req.user.id
    });
    await auditCreate('sop_policies', policy, req.user.id);

    res.status(201).json(policy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update SOP/policy (Admin only)
router.put('/sop-policies/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const policy = await SOPPolicy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: 'SOP/Policy not found' });
    }

    const oldValue = toPlain(policy);
    const { designation, sop_document, probation_policy, regular_policy, whistle_blower_policy, start_date, end_date, isActive } = req.body;
    await policy.update({
      designation: designation || policy.designation,
      sop_document: sop_document || policy.sop_document,
      probation_policy: probation_policy || policy.probation_policy,
      regular_policy: regular_policy || policy.regular_policy,
      whistle_blower_policy: whistle_blower_policy || policy.whistle_blower_policy,
      start_date: start_date || policy.start_date,
      end_date: end_date || policy.end_date,
      isActive: isActive !== undefined ? isActive : policy.isActive
    });
    await auditUpdate('sop_policies', policy.id, req.user.id, oldValue, policy);

    res.json(policy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete SOP/policy (Admin only)
router.delete('/sop-policies/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const policy = await SOPPolicy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: 'SOP/Policy not found' });
    }

    await softDelete(policy, 'sop_policies', req.user.id);
    res.json({ message: 'SOP/Policy inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== RATE FIXATION MASTER ROUTES ====================

// Get all rate fixations
router.get('/rate-fixations', authenticate, async (req, res) => {
  try {
    const { state, product_id, status } = req.query;
    const where = {};

    if (state) where.state = state;
    if (product_id) where.product_id = product_id;
    if (status) where.isActive = status === 'active';

    const rates = await RateFixation.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'code'] },
        { model: SampleMaster, as: 'sample', attributes: ['id', 'sample_name'] },
        { model: InputMaster, as: 'input', attributes: ['id', 'input_name'] }
      ],
      order: [['effective_from', 'DESC'], ['state', 'ASC']]
    });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create rate fixation
router.post('/rate-fixations', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { state, product_id, sample_id, input_id, pts, ptr, mrp, nrv, effective_from, effective_to } = req.body;

    const rate = await RateFixation.create({
      state,
      product_id,
      sample_id,
      input_id,
      pts,
      ptr,
      mrp,
      nrv,
      effective_from,
      effective_to,
      created_by: req.user.id
    });
    await auditCreate('rate_fixations', rate, req.user.id);

    res.status(201).json(rate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update rate fixation
router.put('/rate-fixations/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const rate = await RateFixation.findByPk(req.params.id);
    if (!rate) {
      return res.status(404).json({ error: 'Rate fixation not found' });
    }

    const oldValue = toPlain(rate);
    const { state, product_id, sample_id, input_id, pts, ptr, mrp, nrv, effective_from, effective_to, isActive } = req.body;
    await rate.update({
      state: state || rate.state,
      product_id: product_id !== undefined ? product_id : rate.product_id,
      sample_id: sample_id !== undefined ? sample_id : rate.sample_id,
      input_id: input_id !== undefined ? input_id : rate.input_id,
      pts: pts !== undefined ? pts : rate.pts,
      ptr: ptr !== undefined ? ptr : rate.ptr,
      mrp: mrp !== undefined ? mrp : rate.mrp,
      nrv: nrv !== undefined ? nrv : rate.nrv,
      effective_from: effective_from || rate.effective_from,
      effective_to: effective_to !== undefined ? effective_to : rate.effective_to,
      isActive: isActive !== undefined ? isActive : rate.isActive,
      updated_by: req.user.id
    });
    await auditUpdate('rate_fixations', rate.id, req.user.id, oldValue, rate);

    res.json(rate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Inactivate rate fixation
router.delete('/rate-fixations/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const rate = await RateFixation.findByPk(req.params.id);
    if (!rate) {
      return res.status(404).json({ error: 'Rate fixation not found' });
    }

    await softDelete(rate, 'rate_fixations', req.user.id, { updated_by: req.user.id });
    res.json({ message: 'Rate fixation inactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== AUDIT LOG ROUTES ====================

// Get audit logs (Admin only)
router.get('/audit-logs', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { table_name, record_id, changed_by, limit = 100 } = req.query;
    const where = {};

    if (table_name) where.table_name = table_name;
    if (record_id) where.record_id = record_id;
    if (changed_by) where.changed_by = changed_by;

    const logs = await AuditLog.findAll({
      where,
      include: [
        { model: require('../models').User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['change_date', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MIGRATION ROUTES ====================

// Migrate database schema (Admin only)
router.post('/migrate', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const sequelize = require('../config/database');
    
    // Add columns one by one
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS class_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS category_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS territory_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hq_id INTEGER`);
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0`);
    
    // Add chemist columns
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS territory_id INTEGER`);
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS hq_id INTEGER`);
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0`);
    
    res.json({ message: 'Migration completed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SEED DATA ROUTES ====================

// Seed doctors and chemists (Admin only)
router.post('/seed-data', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification, Doctor, Chemist } = require('../models');
    
    const doctorClasses = await DoctorClass.findAll({ where: { status: 'active' } });
    const doctorCategories = await DoctorCategory.findAll({ where: { status: 'active' } });
    const doctorSpecialties = await DoctorSpecialty.findAll({ where: { status: 'active' } });
    const doctorQualifications = await DoctorQualification.findAll({ where: { status: 'active' } });
    
    // Create sample doctors if none exist
    const existingDoctors = await Doctor.count();
    if (existingDoctors === 0) {
      const sampleDoctors = [
        { firstName: 'Dr. Rajesh', lastName: 'Kumar', specialty_id: doctorSpecialties[0]?.id, category_id: doctorCategories[0]?.id, qualification_id: doctorQualifications[0]?.id, specialty: 'General Medicine', location: 'Mumbai', address: 'Medical Center, Mumbai', phone: '+91-9876543210', email: 'rajesh.kumar@email.com', isActive: true },
        { firstName: 'Dr. Priya', lastName: 'Sharma', specialty_id: doctorSpecialties[1]?.id, category_id: doctorCategories[0]?.id, qualification_id: doctorQualifications[1]?.id, specialty: 'Cardiologist', location: 'Delhi', address: 'Heart Center, Delhi', phone: '+91-9876543211', email: 'priya.sharma@email.com', isActive: true },
        { firstName: 'Dr. Amit', lastName: 'Singh', specialty_id: doctorSpecialties[2]?.id, category_id: doctorCategories[1]?.id, qualification_id: doctorQualifications[0]?.id, specialty: 'Orthopedic', location: 'Bangalore', address: 'Ortho Hospital, Bangalore', phone: '+91-9876543212', email: 'amit.singh@email.com', isActive: true }
      ].filter(d => d.specialty_id !== undefined);
      
      await Doctor.bulkCreate(sampleDoctors);
    }
    
    const existingChemists = await Chemist.count();
    if (existingChemists === 0) {
      const sampleChemists = [
        { name: 'City Medical Store', location: 'Mumbai', address: 'Shop 12, Medical Market, Mumbai', phone: '+91-8765432101', email: 'citymedical@email.com', isActive: true },
        { name: 'Apollo Pharmacy', location: 'Delhi', address: 'Shop 5, Apollo Hospital, Delhi', phone: '+91-8765432102', email: 'apollo@email.com', isActive: true },
        { name: 'MedPlus', location: 'Bangalore', address: 'Shop 8, MedPlus Building, Bangalore', phone: '+91-8765432103', email: 'medplus@email.com', isActive: true }
      ];
      
      await Chemist.bulkCreate(sampleChemists);
    }
    
    const doctors = await Doctor.findAll();
    const chemists = await Chemist.findAll();
    
    res.json({ 
      message: 'Data seeded successfully',
      doctorsCount: doctors.length,
      chemistsCount: chemists.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get data counts
router.get('/data-counts', authenticate, async (req, res) => {
  try {
    const doctorCount = await Doctor.count();
    const chemistCount = await Chemist.count();
    const hqCount = await Headquarter.count();
    const territoryCount = await Territory.count();
    
    res.json({
      doctors: doctorCount,
      chemists: chemistCount,
      headquarters: hqCount,
      territories: territoryCount
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
