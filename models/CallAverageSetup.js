const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CallAverageSetup = sequelize.define('CallAverageSetup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  designation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'MR, ABM, RBM, ZBM, etc.'
  },
  min_field_working_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
    comment: 'Minimum field working days per month'
  },
  daily_calls: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 11,
    comment: 'Minimum daily calls required'
  },
  monthly_calls: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Monthly call target (auto-calculated or manual)'
  },
  quarterly_calls: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Quarterly call target'
  },
  yearly_calls: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Yearly call target'
  },
  warning_threshold: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 90.00,
    comment: 'Warning threshold percentage (below this shows warning)'
  },
  alert_threshold: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 70.00,
    comment: 'Alert threshold percentage (below this shows high alert)'
  },
  effective_from: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Effective date from which this setup is valid'
  },
  effective_to: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Effective date until which this setup is valid'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
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
  tableName: 'call_average_setup',
  field: 'call_average_setup',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = CallAverageSetup;