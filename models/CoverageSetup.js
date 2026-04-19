const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CoverageSetup = sequelize.define('CoverageSetup', {
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
  doctor_list_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Core',
    comment: 'Core or Secondary doctor list'
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
  doctor_warning: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 90.00,
    comment: 'Doctor coverage warning threshold percentage (upper performance level)'
  },
  chemist_warning: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 100.00,
    comment: 'Chemist coverage warning threshold percentage (upper performance level)'
  },
  doctor_alert: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 70.00,
    comment: 'Doctor coverage alert threshold percentage (critical performance level)'
  },
  chemist_alert: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 90.00,
    comment: 'Chemist coverage alert threshold percentage (critical performance level)'
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