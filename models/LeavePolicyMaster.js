const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeavePolicyMaster = sequelize.define('LeavePolicyMaster', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  leave_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'CL (Casual Leave), SL (Sick Leave), EL (Earned Leave)'
  },
  leave_type_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Full name of leave type'
  },
  probation_allowed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether leave is allowed during probation'
  },
  regular_allowed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether leave is allowed after confirmation'
  },
  max_days_per_month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    comment: 'Maximum leave days allowed per month'
  },
  max_days_per_year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12,
    comment: 'Maximum leave days allowed per year'
  },
  carry_forward: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether unused leave can be carried forward'
  },
  max_carry_forward_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum days that can be carried forward'
  },
  approval_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether approval is required for this leave type'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'leave_policy_master'
});

module.exports = LeavePolicyMaster;