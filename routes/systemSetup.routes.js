const express = require('express');
const router = express.Router();
const { CallAverageSetup, CoverageSetup, WorkTypeSetup, WorkTypeMaster, LeavePolicyMaster, UserLeaveBalance, User } = require('../models');
const { Op } = require('sequelize');

// ==================== CALL AVERAGE SETUP ====================

// Get all call average setups
router.get('/call-average', async (req, res) => {
  try {
    const setups = await CallAverageSetup.findAll({
      where: { is_active: true },
      order: [['designation', 'ASC'], ['effective_from', 'DESC']]
    });
    res.json(setups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create call average setup
router.post('/call-average', async (req, res) => {
  try {
    const { designation, min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, effective_to } = req.body;
    
    let calculatedMonthly = monthly_calls;
    let calculatedQuarterly = quarterly_calls;
    let calculatedYearly = yearly_calls;
    
    // Auto-calculate if not provided
    if (!calculatedMonthly && min_field_working_days) {
      calculatedMonthly = daily_calls * min_field_working_days;
    }
    if (!calculatedQuarterly && calculatedMonthly) {
      calculatedQuarterly = calculatedMonthly * 3;
    }
    if (!calculatedYearly && calculatedMonthly) {
      calculatedYearly = calculatedMonthly * 12;
    }

    const setup = await CallAverageSetup.create({
      designation,
      min_field_working_days: min_field_working_days || 20,
      daily_calls: daily_calls || 11,
      monthly_calls: calculatedMonthly,
      quarterly_calls: calculatedQuarterly,
      yearly_calls: calculatedYearly,
      warning_threshold: warning_threshold || 90.00,
      alert_threshold: alert_threshold || 70.00,
      effective_from,
      effective_to,
      created_by: req.user?.id
    });
    res.status(201).json(setup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update call average setup
router.put('/call-average/:id', async (req, res) => {
  try {
    const setup = await CallAverageSetup.findByPk(req.params.id);
    if (!setup) {
      return res.status(404).json({ message: 'Call average setup not found' });
    }
    
    const { min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, effective_to, isActive } = req.body;
    
    // Recalculate if needed
    let calculatedMonthly = monthly_calls;
    let calculatedQuarterly = quarterly_calls;
    let calculatedYearly = yearly_calls;
    
    if (!calculatedMonthly && min_field_working_days) {
      calculatedMonthly = (daily_calls || setup.daily_calls) * min_field_working_days;
    }
    if (!calculatedQuarterly && calculatedMonthly) {
      calculatedQuarterly = calculatedMonthly * 3;
    }
    if (!calculatedYearly && calculatedMonthly) {
      calculatedYearly = calculatedMonthly * 12;
    }

    await setup.update({
      min_field_working_days: min_field_working_days || setup.min_field_working_days,
      daily_calls: daily_calls || setup.daily_calls,
      monthly_calls: calculatedMonthly,
      quarterly_calls: calculatedQuarterly,
      yearly_calls: calculatedYearly,
      warning_threshold: warning_threshold || setup.warning_threshold,
      alert_threshold: alert_threshold || setup.alert_threshold,
      effective_from: effective_from || setup.effective_from,
      effective_to: effective_to || setup.effective_to,
      isActive: isActive !== undefined ? isActive : setup.isActive
    });
    
    res.json(setup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete call average setup
router.delete('/call-average/:id', async (req, res) => {
  try {
    const setup = await CallAverageSetup.findByPk(req.params.id);
    if (!setup) {
      return res.status(404).json({ message: 'Call average setup not found' });
    }
    await setup.update({ is_active: false });
    res.json({ message: 'Call average setup deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== COVERAGE SETUP ====================

// Get all coverage setups
router.get('/coverage', async (req, res) => {
  try {
    const setups = await CoverageSetup.findAll({
      where: { is_active: true },
      order: [['designation', 'ASC'], ['doctor_list_type', 'ASC'], ['effective_from', 'DESC']]
    });
    res.json(setups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create coverage setup
router.post('/coverage', async (req, res) => {
  try {
    const { designation, doctor_list_type, monthly_coverage, quarterly_coverage, yearly_coverage, effective_from, effective_to } = req.body;
    
    const setup = await CoverageSetup.create({
      designation,
      doctor_list_type: doctor_list_type || 'Core',
      monthly_coverage: monthly_coverage || 90.00,
      quarterly_coverage: quarterly_coverage || 100.00,
      yearly_coverage: yearly_coverage || 100.00,
      effective_from,
      effective_to,
      created_by: req.user?.id
    });
    res.status(201).json(setup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update coverage setup
router.put('/coverage/:id', async (req, res) => {
  try {
    const setup = await CoverageSetup.findByPk(req.params.id);
    if (!setup) {
      return res.status(404).json({ message: 'Coverage setup not found' });
    }
    
    await setup.update(req.body);
    res.json(setup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete coverage setup
router.delete('/coverage/:id', async (req, res) => {
  try {
    const setup = await CoverageSetup.findByPk(req.params.id);
    if (!setup) {
      return res.status(404).json({ message: 'Coverage setup not found' });
    }
    await setup.update({ is_active: false });
    res.json({ message: 'Coverage setup deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== WORK TYPE SETUP ====================

// Get all work type setups
router.get('/work-type', async (req, res) => {
  try {
    const setups = await WorkTypeSetup.findAll({
      where: { is_active: true },
      order: [['designation', 'ASC'], ['effective_from', 'DESC']]
    });
    res.json(setups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get work type master
router.get('/work-type-master', async (req, res) => {
  try {
    const types = await WorkTypeMaster.findAll({
      where: { is_active: true },
      order: [['type_name', 'ASC']]
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create work type master
router.post('/work-type-master', async (req, res) => {
  try {
    const { type_name, short_name, description, requires_gps } = req.body;
    const type = await WorkTypeMaster.create({
      type_name,
      short_name,
      description,
      requires_gps: requires_gps || false
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create work type setup
router.post('/work-type', async (req, res) => {
  try {
    const { designation, field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, effective_to } = req.body;
    
    const totalDays = total_working_days || (field_work_days + office_work_days);
    
    const setup = await WorkTypeSetup.create({
      designation,
      field_work_days: field_work_days || 24,
      office_work_days: office_work_days || 4,
      total_working_days: totalDays,
      mandatory_field_days: mandatory_field_days !== undefined ? mandatory_field_days : true,
      effective_from,
      effective_to,
      created_by: req.user?.id
    });
    res.status(201).json(setup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update work type setup
router.put('/work-type/:id', async (req, res) => {
  try {
    const setup = await WorkTypeSetup.findByPk(req.params.id);
    if (!setup) {
      return res.status(404).json({ message: 'Work type setup not found' });
    }
    
    const { field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, effective_to, isActive } = req.body;
    
    const totalDays = total_working_days || ((field_work_days || setup.field_work_days) + (office_work_days || setup.office_work_days));
    
    await setup.update({
      field_work_days: field_work_days || setup.field_work_days,
      office_work_days: office_work_days || setup.office_work_days,
      total_working_days: totalDays,
      mandatory_field_days: mandatory_field_days !== undefined ? mandatory_field_days : setup.mandatory_field_days,
      effective_from: effective_from || setup.effective_from,
      effective_to: effective_to || setup.effective_to,
      isActive: isActive !== undefined ? isActive : setup.isActive
    });
    
    res.json(setup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete work type setup
router.delete('/work-type/:id', async (req, res) => {
  try {
    const setup = await WorkTypeSetup.findByPk(req.params.id);
    if (!setup) {
      return res.status(404).json({ message: 'Work type setup not found' });
    }
    await setup.update({ is_active: false });
    res.json({ message: 'Work type setup deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== LEAVE POLICY ====================

// Get all leave policies
router.get('/leave-policy', async (req, res) => {
  try {
    const policies = await LeavePolicyMaster.findAll({
      where: { is_active: true },
      order: [['leave_type', 'ASC']]
    });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create leave policy
router.post('/leave-policy', async (req, res) => {
  try {
    const { leave_type, leave_type_name, probation_allowed, regular_allowed, max_days_per_month, max_days_per_year, carry_forward, max_carry_forward_days, approval_required } = req.body;
    
    const policy = await LeavePolicyMaster.create({
      leave_type,
      leave_type_name,
      probation_allowed: probation_allowed !== undefined ? probation_allowed : false,
      regular_allowed: regular_allowed !== undefined ? regular_allowed : true,
      max_days_per_month: max_days_per_month || 2,
      max_days_per_year: max_days_per_year || 12,
      carry_forward: carry_forward !== undefined ? carry_forward : true,
      max_carry_forward_days,
      approval_required: approval_required !== undefined ? approval_required : true,
      created_by: req.user?.id
    });
    res.status(201).json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update leave policy
router.put('/leave-policy/:id', async (req, res) => {
  try {
    const policy = await LeavePolicyMaster.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Leave policy not found' });
    }
    
    await policy.update(req.body);
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete leave policy
router.delete('/leave-policy/:id', async (req, res) => {
  try {
    const policy = await LeavePolicyMaster.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Leave policy not found' });
    }
    await policy.update({ is_active: false });
    res.json({ message: 'Leave policy deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== USER LEAVE BALANCE ====================

// Get user leave balances
router.get('/leave-balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { year } = req.query;
    
    const where = { user_id: userId };
    if (year) {
      where.year = year;
    }
    
    const balances = await UserLeaveBalance.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }]
    });
    res.json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize user leave balance for a year
router.post('/leave-balance/initialize', async (req, res) => {
  try {
    const { user_id, year, leavePolicies } = req.body;
    
    // Get all active leave policies
    const policies = leavePolicies || await LeavePolicyMaster.findAll({ where: { is_active: true } });
    
    const balances = [];
    for (const policy of policies) {
      // Check if balance already exists
      const existing = await UserLeaveBalance.findOne({
        where: { user_id, leave_type: policy.leave_type, year }
      });
      
      if (!existing) {
        const balance = await UserLeaveBalance.create({
          user_id,
          leave_type: policy.leave_type,
          year,
          total_allocated: policy.max_days_per_year,
          used: 0,
          balance: policy.max_days_per_year,
          carry_forwarded: 0
        });
        balances.push(balance);
      }
    }
    
    res.status(201).json(balances);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update leave balance (when leave is taken)
router.put('/leave-balance/:id', async (req, res) => {
  try {
    const balance = await UserLeaveBalance.findByPk(req.params.id);
    if (!balance) {
      return res.status(404).json({ message: 'Leave balance not found' });
    }
    
    const { used, balance: newBalance } = req.body;
    
    await balance.update({
      used: used !== undefined ? used : balance.used,
      balance: newBalance !== undefined ? newBalance : balance.balance
    });
    
    res.json(balance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== COMPLIANCE DASHBOARD ====================

// Get compliance status for a user
router.get('/compliance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    const user = await User.findByPk(userId, {
      include: [
        { model: Headquarter, as: 'headquarter' },
        { model: Territory, as: 'territory' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get designation (use employeeType or role)
    const designation = user.employeeType || user.role;
    
    // Get setups based on designation
    const callAvgSetup = await CallAverageSetup.findOne({
      where: { 
        designation,
        is_active: true,
        effective_from: { [Op.lte]: new Date() },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: new Date() } }
        ]
      }
    });
    
    const coverageSetup = await CoverageSetup.findOne({
      where: {
        designation,
        doctor_list_type: 'Core',
        is_active: true
      }
    });
    
    const workTypeSetup = await WorkTypeSetup.findOne({
      where: {
        designation,
        is_active: true
      }
    });
    
    res.json({
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        designation,
        hq: user.headquarter?.name,
        territory: user.territory?.name
      },
      callAverage: callAvgSetup,
      coverage: coverageSetup,
      workType: workTypeSetup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users compliance status (for managers)
router.get('/compliance', async (req, res) => {
  try {
    const { designation, hq_id } = req.query;
    
    const where = { is_active: true };
    if (designation) {
      where.employeeType = designation;
    }
    if (hq_id) {
      where.hq_id = hq_id;
    }
    
    const users = await User.findAll({
      where,
      include: [
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name'] },
        { model: Territory, as: 'territory', attributes: ['id', 'name'] }
      ]
    });
    
    const complianceData = await Promise.all(users.map(async (user) => {
      const designation = user.employeeType || user.role;
      
      const callAvgSetup = await CallAverageSetup.findOne({
        where: { 
          designation,
          is_active: true
        }
      });
      
      const coverageSetup = await CoverageSetup.findOne({
        where: { designation, doctor_list_type: 'Core', is_active: true }
      });
      
      const workTypeSetup = await WorkTypeSetup.findOne({
        where: { designation, is_active: true }
      });
      
      return {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          designation,
          hq: user.headquarter?.name,
          territory: user.territory?.name
        },
        targets: {
          callAverage: callAvgSetup,
          coverage: coverageSetup,
          workType: workTypeSetup
        }
      };
    }));
    
    res.json(complianceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;