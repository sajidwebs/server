const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { ExpenseType, TravelMode, StandardFareChart, Expense, ExpenseAddition, User, Headquarter, Territory } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== EXPENSE TYPE ROUTES ====================

// Get all expense types
router.get('/expense-types', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const types = await ExpenseType.findAll({
      where,
      order: [['expense_type', 'ASC']]
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single expense type
router.get('/expense-types/:id', authenticate, async (req, res) => {
  try {
    const type = await ExpenseType.findByPk(req.params.id);
    if (!type) return res.status(404).json({ error: 'Expense type not found' });
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense type (Admin only)
router.post('/expense-types', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { expense_type, short_name, description, status } = req.body;
    const type = await ExpenseType.create({
      expense_type,
      short_name,
      description,
      status: status || 'active',
      created_by: req.user.id
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update expense type (Admin only)
router.put('/expense-types/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const type = await ExpenseType.findByPk(req.params.id);
    if (!type) return res.status(404).json({ error: 'Expense type not found' });

    const { expense_type, short_name, description, status } = req.body;
    await type.update({
      expense_type: expense_type || type.expense_type,
      short_name: short_name || type.short_name,
      description: description !== undefined ? description : type.description,
      status: status || type.status,
      updated_by: req.user.id
    });
    res.json(type);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete expense type (Admin only)
router.delete('/expense-types/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const type = await ExpenseType.findByPk(req.params.id);
    if (!type) return res.status(404).json({ error: 'Expense type not found' });
    await type.destroy();
    res.json({ message: 'Expense type deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== TRAVEL MODE ROUTES ====================

// Get all travel modes
router.get('/travel-modes', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const modes = await TravelMode.findAll({
      where,
      order: [['travel_type', 'ASC']]
    });
    res.json(modes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single travel mode
router.get('/travel-modes/:id', authenticate, async (req, res) => {
  try {
    const mode = await TravelMode.findByPk(req.params.id);
    if (!mode) return res.status(404).json({ error: 'Travel mode not found' });
    res.json(mode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create travel mode (Admin only)
router.post('/travel-modes', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { travel_type, short_name, description, requires_distance, status } = req.body;
    const mode = await TravelMode.create({
      travel_type,
      short_name,
      description,
      requires_distance: requires_distance !== undefined ? requires_distance : true,
      status: status || 'active',
      created_by: req.user.id
    });
    res.status(201).json(mode);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update travel mode (Admin only)
router.put('/travel-modes/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const mode = await TravelMode.findByPk(req.params.id);
    if (!mode) return res.status(404).json({ error: 'Travel mode not found' });

    const { travel_type, short_name, description, requires_distance, status } = req.body;
    await mode.update({
      travel_type: travel_type || mode.travel_type,
      short_name: short_name || mode.short_name,
      description: description !== undefined ? description : mode.description,
      requires_distance: requires_distance !== undefined ? requires_distance : mode.requires_distance,
      status: status || mode.status,
      updated_by: req.user.id
    });
    res.json(mode);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete travel mode (Admin only)
router.delete('/travel-modes/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const mode = await TravelMode.findByPk(req.params.id);
    if (!mode) return res.status(404).json({ error: 'Travel mode not found' });
    await mode.destroy();
    res.json({ message: 'Travel mode deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== STANDARD FARE CHART ROUTES ====================

// Get all fare charts
router.get('/fare-charts', authenticate, async (req, res) => {
  try {
    const { employee_id, designation, hq_type, is_active } = req.query;
    const where = {};
    if (employee_id) where.employee_id = employee_id;
    if (designation) where.designation = designation;
    if (hq_type) where.hq_type = hq_type;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const charts = await StandardFareChart.findAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'], required: false }
      ],
      order: [['effective_from', 'DESC']]
    });
    res.json(charts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single fare chart
router.get('/fare-charts/:id', authenticate, async (req, res) => {
  try {
    const chart = await StandardFareChart.findByPk(req.params.id, {
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'], required: false }
      ]
    });
    if (!chart) return res.status(404).json({ error: 'Fare chart not found' });
    res.json(chart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create fare chart (Admin only)
router.post('/fare-charts', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const chart = await StandardFareChart.create({
      ...req.body,
      created_by: req.user.id
    });
    res.status(201).json(chart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update fare chart (Admin only)
router.put('/fare-charts/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const chart = await StandardFareChart.findByPk(req.params.id);
    if (!chart) return res.status(404).json({ error: 'Fare chart not found' });

    await chart.update({
      ...req.body,
      updated_by: req.user.id
    });
    res.json(chart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete fare chart (Admin only)
router.delete('/fare-charts/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const chart = await StandardFareChart.findByPk(req.params.id);
    if (!chart) return res.status(404).json({ error: 'Fare chart not found' });
    await chart.destroy();
    res.json({ message: 'Fare chart deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== EXPENSE ROUTES ====================

// Get expenses (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { user_id, month, year, approval_status } = req.query;
    const where = {};

    if (user_id) where.user_id = user_id;
    if (month) where.month = month;
    if (year) where.year = year;
    if (approval_status) where.approval_status = approval_status;

    const expenses = await Expense.findAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId', 'employeeType'], required: false },
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name', 'type'], required: false },
        { model: Territory, as: 'territory', attributes: ['id', 'name'], required: false },
        { model: TravelMode, as: 'travelMode', attributes: ['id', 'travel_type', 'short_name'], required: false },
        { model: StandardFareChart, as: 'fareChart', attributes: ['id', 'designation', 'hq_type'], required: false },
        { model: ExpenseAddition, as: 'additions', required: false }
      ],
      order: [['date', 'DESC']]
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense report for a user for a specific month
router.get('/report', authenticate, async (req, res) => {
  try {
    const { user_id, month, year } = req.query;
    if (!user_id || !month || !year) {
      return res.status(400).json({ error: 'user_id, month, and year are required' });
    }

    const user = await User.findByPk(user_id, {
      attributes: ['id', 'firstName', 'lastName', 'employeeId', 'employeeType'],
      include: [
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name', 'type'], required: false }
      ]
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const expenses = await Expense.findAll({
      where: { user_id, month, year },
      include: [
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name', 'type'], required: false },
        { model: Territory, as: 'territory', attributes: ['id', 'name'], required: false },
        { model: TravelMode, as: 'travelMode', attributes: ['id', 'travel_type', 'short_name'], required: false },
        { model: ExpenseAddition, as: 'additions', required: false }
      ],
      order: [['date', 'ASC']]
    });

    // Get active fare chart for this employee
    const fareChart = await StandardFareChart.findOne({
      where: {
        [Op.or]: [
          { employee_id: user_id },
          { employee_name: { [Op.iLike]: `%${user.firstName}%` } }
        ],
        is_active: true
      },
      order: [['effective_from', 'DESC']]
    });

    // Calculate totals
    let totalDA = 0;
    let totalTA = 0;
    let totalAdditions = 0;
    let totalDeductions = 0;
    let totalMisc = 0;
    let totalBusiness = 0;
    let totalDoctorCalls = 0;
    let totalChemistCalls = 0;

    expenses.forEach(e => {
      totalDA += parseFloat(e.allowance || 0);
      totalTA += parseFloat(e.ta || 0);
      totalMisc += parseFloat(e.miscellaneous || 0);
      totalBusiness += parseFloat(e.business_amount || 0);
      totalDoctorCalls += parseInt(e.doctor_calls || 0);
      totalChemistCalls += parseInt(e.chemist_calls || 0);

      if (e.additions) {
        e.additions.forEach(a => {
          if (a.type === 'addition') totalAdditions += parseFloat(a.amount || 0);
          else totalDeductions += parseFloat(a.amount || 0);
        });
      }
    });

    // Fixed expenses from fare chart
    const fixedDA = fareChart ? parseFloat(fareChart.da || 0) * expenses.length : 0;
    const fixedMobile = fareChart ? parseFloat(fareChart.mobile_allowance || 0) : 0;
    const fixedStationary = fareChart ? parseFloat(fareChart.stationary_allowance || 0) : 0;

    res.json({
      employee: user,
      month,
      year,
      fareChart,
      entries: expenses,
      summary: {
        totalDA,
        totalTA,
        totalMisc,
        totalBusiness,
        totalDoctorCalls,
        totalChemistCalls,
        totalAdditions,
        totalDeductions,
        fixedDA,
        fixedMobile,
        fixedStationary,
        grandTotal: totalDA + totalTA + totalMisc + totalAdditions - totalDeductions + fixedMobile + fixedStationary
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single expense
router.get('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'], required: false },
        { model: Headquarter, as: 'headquarter', attributes: ['id', 'name', 'type'], required: false },
        { model: Territory, as: 'territory', attributes: ['id', 'name'], required: false },
        { model: TravelMode, as: 'travelMode', attributes: ['id', 'travel_type', 'short_name'], required: false },
        { model: ExpenseAddition, as: 'additions', required: false }
      ]
    });
    if (!expense) return res.status(404).json({ error: 'Expense entry not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense entry
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      user_id, month, year, date, working_status, hq_id, territory_id,
      doctor_calls, chemist_calls, business_amount, allowance,
      from_place, to_place, travel_mode_id, travel_entry_amount,
      distance_km, ta, miscellaneous, fare_chart_id, remarks
    } = req.body;

    const expense = await Expense.create({
      user_id: user_id || req.user.id,
      month,
      year,
      date,
      working_status: working_status || 'Working',
      hq_id,
      territory_id,
      doctor_calls: doctor_calls || 0,
      chemist_calls: chemist_calls || 0,
      business_amount: business_amount || 0,
      allowance: allowance || 0,
      from_place,
      to_place,
      travel_mode_id,
      travel_entry_amount: travel_entry_amount || 0,
      distance_km: distance_km || 0,
      ta: ta || 0,
      miscellaneous: miscellaneous || 0,
      fare_chart_id,
      remarks,
      approval_status: 'draft',
      created_by: req.user.id
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update expense entry
router.put('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense entry not found' });

    await expense.update({
      ...req.body,
      updated_by: req.user.id
    });

    res.json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete expense entry
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense entry not found' });
    await expense.destroy();
    res.json({ message: 'Expense entry deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit expense (change status to submitted)
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense entry not found' });

    await expense.update({
      approval_status: 'submitted',
      updated_by: req.user.id
    });

    res.json({ message: 'Expense submitted successfully', expense });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve expense (Manager/Admin only)
router.post('/:id/approve', authenticate, authorize(['ADMIN', 'manager']), async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense entry not found' });

    await expense.update({
      approval_status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date(),
      updated_by: req.user.id
    });

    res.json({ message: 'Expense approved successfully', expense });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject expense (Manager/Admin only)
router.post('/:id/reject', authenticate, authorize(['ADMIN', 'manager']), async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense entry not found' });

    const { rejection_reason } = req.body;

    await expense.update({
      approval_status: 'rejected',
      rejection_reason,
      approved_by: req.user.id,
      approved_at: new Date(),
      updated_by: req.user.id
    });

    res.json({ message: 'Expense rejected', expense });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== EXPENSE ADDITION/DEDUCTION ROUTES ====================

// Add addition/deduction to an expense
router.post('/:id/additions', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense entry not found' });

    const { type, amount, reason } = req.body;
    const addition = await ExpenseAddition.create({
      expense_id: expense.id,
      type,
      amount: amount || 0,
      reason,
      created_by: req.user.id
    });

    res.status(201).json(addition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get additions for an expense
router.get('/:id/additions', authenticate, async (req, res) => {
  try {
    const additions = await ExpenseAddition.findAll({
      where: { expense_id: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(additions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an addition/deduction
router.delete('/additions/:id', authenticate, async (req, res) => {
  try {
    const addition = await ExpenseAddition.findByPk(req.params.id);
    if (!addition) return res.status(404).json({ error: 'Addition/Deduction not found' });
    await addition.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
