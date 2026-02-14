/**
 * Business Rules Engine for PAMS Application
 * Implements time-based locking and validation logic
 */

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
}

module.exports = BusinessRules;