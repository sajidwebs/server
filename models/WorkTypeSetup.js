const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkTypeSetup = sequelize.define('WorkTypeSetup', {
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
  field_work_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 24,
    comment: 'Required field work days per month'
  },
  office_work_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    comment: 'Allowed office work days per month'
  },
  total_working_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total working days (auto-calculated)'
  },
  mandatory_field_days: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether field work is mandatory'
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
  tableName: 'work_type_setup'
});

module.exports = WorkTypeSetup;