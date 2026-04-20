const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CoverageSetup = sequelize.define('CoverageSetup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entity_type: {
    type: DataTypes.ENUM('Doctor', 'Chemist'),
    allowNull: false,
    defaultValue: 'Doctor',
    comment: 'Doctor or Chemist - separate setup for each'
  },
  designation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'MR, ABM, RBM, ZBM, etc.'
  },
  doctor_list_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'Core',
    comment: 'Core or Secondary doctor list (for Doctor type only)'
  },
  monthly_coverage: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 90.00,
    comment: 'Monthly coverage percentage target'
  },
  quarterly_coverage: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 100.00,
    comment: 'Quarterly coverage percentage target'
  },
  yearly_coverage: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 100.00,
    comment: 'Yearly coverage percentage target'
  },
  warning_level: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 90.00,
    comment: 'Warning threshold - performance below this shows warning'
  },
  alert_level: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 70.00,
    comment: 'Alert threshold - performance below this shows critical alert'
  },
  warning_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'warning',
    comment: 'UI color for warning: warning (yellow), danger (red), info (blue)'
  },
  alert_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'danger',
    comment: 'UI color for alert: danger (red), warning (yellow), dark (black)'
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
  tableName: 'coverage_setup',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = CoverageSetup;