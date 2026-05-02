const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SOPPolicy = sequelize.define('SOPPolicy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sop_document: {
    type: DataTypes.STRING, // File path or URL
    allowNull: true
  },
  probation_policy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  regular_policy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  whistle_blower_policy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'sop_policies',
  underscored: true
});

module.exports = SOPPolicy;
