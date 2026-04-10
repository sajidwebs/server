const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserLeaveBalance = sequelize.define('UserLeaveBalance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User whose leave balance is being tracked'
  },
  leave_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'CL, SL, EL'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Year for which leave balance is calculated'
  },
  total_allocated: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total leave days allocated for the year'
  },
  used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Leave days used'
  },
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Remaining leave days'
  },
  carry_forwarded: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Days carried forward from previous year'
  }
}, {
  timestamps: true,
  tableName: 'user_leave_balance'
});

module.exports = UserLeaveBalance;