const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const BusinessRules = require('../utils/businessRules');

// Get business rules status for current user
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current data (you would fetch this from database)
    const userData = {
      chemistCalls: 0, // This should come from database
      totalHours: 0,   // This should come from database
      totalActivities: 0, // This should come from database
      completedActivities: 0 // This should come from database
    };

    const violations = BusinessRules.getBusinessRuleViolations(userData);

    const status = {
      myDayPlan: BusinessRules.getMyDayPlanStatus(),
      secondarySales: {
        canEnter: BusinessRules.canEnterSecondarySales(),
        dayOfMonth: new Date().getDate(),
        allowedDays: [1, 2]
      },
      businessEntry: {
        isLocked: BusinessRules.isBusinessEntryLocked(),
        deadline: '1st of month at 12:00 AM'
      },
      projectionEntry: {
        isLocked: BusinessRules.isProjectionEntryLocked(),
        deadline: '1st of month at 12:00 AM'
      },
      chemistCalls: BusinessRules.validateChemistCalls(userData.chemistCalls || 0),
      workingHours: {
        isHalfDay: BusinessRules.shouldMarkHalfDay(userData.totalHours || 0),
        requiredHours: 8,
        currentHours: userData.totalHours || 0
      },
      activityCompletion: BusinessRules.checkActivityCompletion(
        userData.totalActivities || 0,
        userData.completedActivities || 0
      ),
      violations: violations,
      timestamp: new Date().toISOString()
    };

    res.json({
      message: 'Business rules status retrieved successfully',
      status
    });
  } catch (error) {
    console.error('Get business rules status error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Validate doctor call data
router.post('/validate-doctor-call', authenticate, async (req, res) => {
  try {
    const { doctorData } = req.body;

    if (!doctorData) {
      return res.status(400).json({
        message: 'Doctor data is required'
      });
    }

    const validation = BusinessRules.validateDoctorCall(doctorData);

    res.json({
      message: 'Doctor call validation completed',
      validation
    });
  } catch (error) {
    console.error('Validate doctor call error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Check if feature is accessible
router.get('/feature-access/:feature', authenticate, async (req, res) => {
  try {
    const { feature } = req.params;
    let access = { accessible: true, reason: 'Feature is accessible' };

    switch (feature) {
      case 'my-day-plan':
        access = BusinessRules.getMyDayPlanStatus();
        break;
      case 'secondary-sales':
        access = {
          accessible: BusinessRules.canEnterSecondarySales(),
          reason: BusinessRules.canEnterSecondarySales()
            ? 'Within allowed timeframe (1st or 2nd of month)'
            : 'Only allowed on 1st and 2nd of month'
        };
        break;
      case 'business-entry':
        access = {
          accessible: !BusinessRules.isBusinessEntryLocked(),
          reason: BusinessRules.isBusinessEntryLocked()
            ? 'Locked after 1st of month at 12:00 AM'
            : 'Accessible until 1st of month at 12:00 AM'
        };
        break;
      case 'projection-entry':
        access = {
          accessible: !BusinessRules.isProjectionEntryLocked(),
          reason: BusinessRules.isProjectionEntryLocked()
            ? 'Locked after 1st of month at 12:00 AM'
            : 'Accessible until 1st of month at 12:00 AM'
        };
        break;
      default:
        access = { accessible: false, reason: 'Unknown feature' };
    }

    res.json({
      message: 'Feature access status retrieved',
      feature,
      access
    });
  } catch (error) {
    console.error('Get feature access error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Admin override for locked features
router.post('/admin-override', authenticate, async (req, res) => {
  try {
    const { userId, feature, reason, adminId } = req.body;

    // Only admins can perform overrides
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required for overrides'
      });
    }

    // Log the override (you would save this to database)
    const overrideLog = {
      userId,
      feature,
      reason,
      adminId: req.user.id,
      timestamp: new Date(),
      approved: true
    };

    console.log('Admin override performed:', overrideLog);

    res.json({
      message: 'Admin override approved',
      override: overrideLog
    });
  } catch (error) {
    console.error('Admin override error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get compliance status for a user (integrated with System Setup)
router.get('/compliance/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    const callAvgResult = await BusinessRules.validateCallAverage(parseInt(userId), month, year);
    const coverageResult = await BusinessRules.validateCoverage(parseInt(userId), month, year);
    const workTypeResult = await BusinessRules.validateWorkType(parseInt(userId), month, year);
    const expenseResult = await BusinessRules.canClaimExpense(parseInt(userId));
    const incentiveResult = await BusinessRules.canReceiveIncentive(parseInt(userId));

    res.json({
      userId: parseInt(userId),
      callAverage: callAvgResult,
      coverage: coverageResult,
      workType: workTypeResult,
      expenseEligibility: expenseResult,
      incentiveEligibility: incentiveResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get compliance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if user can claim expense
router.get('/expense-eligibility/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await BusinessRules.canClaimExpense(parseInt(userId));
    res.json(result);
  } catch (error) {
    console.error('Check expense eligibility error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if user can receive incentive
router.get('/incentive-eligibility/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await BusinessRules.canReceiveIncentive(parseInt(userId));
    res.json(result);
  } catch (error) {
    console.error('Check incentive eligibility error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;