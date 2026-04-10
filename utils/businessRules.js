/**
 * Business Rules Engine for PAMS Application
 * Implements time-based locking and validation logic
 * Also integrates with System Setup for compliance validation
 */

const { Op } = require('sequelize');
const { CallAverageSetup, CoverageSetup, WorkTypeSetup, LeavePolicyMaster, UserLeaveBalance, Activity, Expense } = require('../models');

class BusinessRules {
  /**
   * Check if My Day Plan is accessible (before 8 AM or after 12 AM)
   */
  static canAccessMyDayPlan() {
    const now = new Date();
    const currentHour = now.getHours();

    // Accessible before 8 AM or after 12 AM (midnight)
    return currentHour < 8 || currentHour >= 0;
  }

  /**
   * Check if current time is within allowed My Day Plan access
   */
  static getMyDayPlanStatus() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);

    if (currentTime < 8) {
      return {
        accessible: true,
        timeRemaining: (8 - currentTime) * 60, // minutes until lock
        message: `Accessible for ${(8 - currentTime).toFixed(1)} more hours`
      };
    } else if (currentHour >= 0 && currentHour < 8) {
      return {
        accessible: true,
        timeRemaining: (8 - currentTime) * 60,
        message: `Accessible for ${(8 - currentTime).toFixed(1)} more hours`
      };
    } else {
      return {
        accessible: false,
        unlockTime: '12:00 AM',
        message: 'Locked until 12:00 AM'
      };
    }
  }

  /**
   * Check if Secondary Sale Entry is allowed (1st or 2nd of month)
   */
  static canEnterSecondarySales() {
    const now = new Date();
    const dayOfMonth = now.getDate();

    return dayOfMonth === 1 || dayOfMonth === 2;
  }

  /**
   * Check if Business Entry deadline has passed (after 1st of month at 12 AM)
   */
  static isBusinessEntryLocked() {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const currentHour = now.getHours();

    // Locked after 1st of month at 12:00 AM
    if (dayOfMonth > 1) return true;
    if (dayOfMonth === 1 && currentHour >= 0) return true;

    return false;
  }

  /**
   * Check if Projection Entry deadline has passed
   */
  static isProjectionEntryLocked() {
    return this.isBusinessEntryLocked(); // Same rule as business entry
  }

  /**
   * Validate doctor call requirements (DOB, Mobile required)
   */
  static validateDoctorCall(doctorData) {
    const errors = [];

    if (!doctorData.dob) {
      errors.push('Date of Birth is required');
    }

    if (!doctorData.mobile) {
      errors.push('Mobile Number is required');
    }

    if (!doctorData.registrationNumber) {
      errors.push('Registration Number is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Check if day should be marked as half-working (< 8 hours)
   */
  static shouldMarkHalfDay(totalHours) {
    return totalHours < 8;
  }

  /**
   * Check if minimum chemist calls requirement is met (5 calls)
   */
  static validateChemistCalls(callCount) {
    return {
      isValid: callCount >= 5,
      required: 5,
      current: callCount,
      remaining: Math.max(0, 5 - callCount)
    };
  }

  /**
   * Check if 25% of monthly activities are incomplete
   */
  static checkActivityCompletion(totalActivities, completedActivities) {
    if (totalActivities === 0) return { isValid: true, percentage: 0 };

    const completedPercentage = (completedActivities / totalActivities) * 100;
    const isValid = completedPercentage >= 75; // 75% completed = 25% incomplete

    return {
      isValid,
      completedPercentage,
      incompletePercentage: 100 - completedPercentage,
      threshold: 75
    };
  }

  /**
   * Get current month start and end dates
   */
  static getCurrentMonthBounds() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return { monthStart, monthEnd };
  }

  /**
   * Check if notification should be shown for unfulfilled objectives
   */
  static shouldShowNotification(userObjectives) {
    const unfulfilled = userObjectives.filter(obj => !obj.isCompleted);
    return unfulfilled.length > 0;
  }

  /**
   * Get business rule violations for a user
   */
  static getBusinessRuleViolations(userData) {
    const violations = [];

    // Check chemist calls
    const chemistCallValidation = this.validateChemistCalls(userData.chemistCalls || 0);
    if (!chemistCallValidation.isValid) {
      violations.push({
        type: 'CHEMIST_CALLS',
        message: `Minimum 5 chemist calls required. Current: ${chemistCallValidation.current}`,
        severity: 'HIGH'
      });
    }

    // Check day hours
    if (this.shouldMarkHalfDay(userData.totalHours || 0)) {
      violations.push({
        type: 'WORKING_HOURS',
        message: 'Working hours less than 8 hours. Please provide reason.',
        severity: 'MEDIUM'
      });
    }

    // Check activity completion
    const activityValidation = this.checkActivityCompletion(
      userData.totalActivities || 0,
      userData.completedActivities || 0
    );
    if (!activityValidation.isValid) {
      violations.push({
        type: 'ACTIVITY_COMPLETION',
        message: `Activity completion below 75%. Current: ${activityValidation.completedPercentage.toFixed(1)}%`,
        severity: 'HIGH'
      });
    }

    return violations;
  }

  /**
   * Validate user call average compliance
   * Based on System Setup - Call Average
   */
  static async validateCallAverage(userId, month = null, year = null) {
    try {
      const currentMonth = month || new Date().getMonth() + 1;
      const currentYear = year || new Date().getFullYear();
      
      // Get user designation
      const User = require('../models/User');
      const user = await User.findByPk(userId);
      if (!user) return { isValid: true, percentage: 100 };

      const designation = user.employeeType || user.role;
      
      // Get call average setup for designation
      const setup = await CallAverageSetup.findOne({
        where: {
          designation,
          isActive: true,
          effective_from: { [Op.lte]: new Date() },
          [Op.or]: [
            { effective_to: null },
            { effective_to: { [Op.gte]: new Date() } }
          ]
        }
      });

      if (!setup) return { isValid: true, percentage: 100, message: 'No setup configured' };

      // Get actual calls from activities
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const callCount = await Activity.count({
        where: {
          userId,
          date: { [Op.between]: [startDate, endDate] },
          type: 'doctor_call'
        }
      });

      const requiredCalls = setup.monthly_calls || (setup.daily_calls * setup.min_field_working_days);
      const percentage = (callCount / requiredCalls) * 100;

      return {
        isValid: percentage >= setup.warning_threshold,
        percentage: percentage.toFixed(1),
        required: requiredCalls,
        actual: callCount,
        warningThreshold: setup.warning_threshold,
        alertThreshold: setup.alert_threshold,
        status: percentage >= setup.warning_threshold ? 'OK' : (percentage >= setup.alert_threshold ? 'WARNING' : 'ALERT'),
        flags: percentage < setup.warning_threshold ? 1 : (percentage < setup.alert_threshold ? 1 : 0)
      };
    } catch (error) {
      console.error('validateCallAverage error:', error);
      return { isValid: true, percentage: 100 };
    }
  }

  /**
   * Validate user doctor coverage compliance
   * Based on System Setup - Coverage
   */
  static async validateCoverage(userId, month = null, year = null) {
    try {
      const currentMonth = month || new Date().getMonth() + 1;
      const currentYear = year || new Date().getFullYear();

      const User = require('../models/User');
      const user = await User.findByPk(userId);
      if (!user) return { isValid: true, percentage: 100 };

      const designation = user.employeeType || user.role;

      const setup = await CoverageSetup.findOne({
        where: {
          designation,
          doctor_list_type: 'Core',
          isActive: true
        }
      });

      if (!setup) return { isValid: true, percentage: 100, message: 'No setup configured' };

      // Get total doctors assigned to user and visited doctors
      const Doctor = require('../models/Doctor');
      const { sequelize } = require('../config/database');

      const totalDoctors = await Doctor.count({
        where: { hq_id: user.hq_id }
      });

      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const visitedDoctors = await Activity.count({
        where: {
          userId,
          date: { [Op.between]: [startDate, endDate] },
          type: 'doctor_call'
        },
        distinct: true,
        col: 'doctorId'
      });

      const percentage = totalDoctors > 0 ? (visitedDoctors / totalDoctors) * 100 : 100;

      return {
        isValid: percentage >= setup.monthly_coverage,
        percentage: percentage.toFixed(1),
        visited: visitedDoctors,
        total: totalDoctors,
        target: setup.monthly_coverage,
        status: percentage >= setup.monthly_coverage ? 'OK' : 'LOW'
      };
    } catch (error) {
      console.error('validateCoverage error:', error);
      return { isValid: true, percentage: 100 };
    }
  }

  /**
   * Validate work type compliance (field work days)
   */
  static async validateWorkType(userId, month = null, year = null) {
    try {
      const currentMonth = month || new Date().getMonth() + 1;
      const currentYear = year || new Date().getFullYear();

      const User = require('../models/User');
      const user = await User.findByPk(userId);
      if (!user) return { isValid: true };

      const designation = user.employeeType || user.role;

      const setup = await WorkTypeSetup.findOne({
        where: { designation, isActive: true }
      });

      if (!setup) return { isValid: true, message: 'No setup configured' };

      // Count field work days from expenses (based on working_status)
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const fieldWorkDays = await Expense.count({
        where: {
          user_id: userId,
          date: { [Op.between]: [startDate, endDate] },
          working_status: 'Working'
        }
      });

      const isValid = fieldWorkDays >= setup.field_work_days;

      return {
        isValid,
        fieldWorkDays,
        required: setup.field_work_days,
        mandatory: setup.mandatory_field_days,
        status: isValid ? 'OK' : 'INSUFFICIENT'
      };
    } catch (error) {
      console.error('validateWorkType error:', error);
      return { isValid: true };
    }
  }

  /**
   * Check if expense claim should be blocked based on compliance
   * Per document: "Block expense claim if low coverage below 50%"
   */
  static async canClaimExpense(userId) {
    try {
      const coverageValidation = await this.validateCoverage(userId);
      
      if (coverageValidation.percentage < 50) {
        return {
          canClaim: false,
          reason: `Coverage is ${coverageValidation.percentage}%, below 50% threshold. Cannot claim expenses.`
        };
      }

      const callAvgValidation = await this.validateCallAverage(userId);
      
      // Block if daily call average is below 8 (calculated monthly)
      const dailyAvg = callAvgValidation.actual / 20; // Assuming 20 working days
      if (dailyAvg < 8) {
        return {
          canClaim: false,
          reason: `Daily call average is ${dailyAvg.toFixed(1)}, below 8 threshold. Cannot claim expenses.`
        };
      }

      return { canClaim: true, reason: 'Expense claim allowed' };
    } catch (error) {
      console.error('canClaimExpense error:', error);
      return { canClaim: true, reason: 'Error checking compliance' };
    }
  }

  /**
   * Check if incentive should be blocked
   * Per document: "Block incentive if call avg below 10 < threshold"
   */
  static async canReceiveIncentive(userId) {
    try {
      const callAvgValidation = await this.validateCallAverage(userId);
      
      const dailyAvg = callAvgValidation.actual / 20;
      if (dailyAvg < 10) {
        return {
          canReceive: false,
          reason: `Call average is below 10 threshold. Incentive blocked.`
        };
      }

      return { canReceive: true, reason: 'Incentive eligible' };
    } catch (error) {
      console.error('canReceiveIncentive error:', error);
      return { canReceive: true, reason: 'Error checking eligibility' };
    }
  }
}

module.exports = BusinessRules;