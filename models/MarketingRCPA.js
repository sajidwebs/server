const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketingRCPA = sequelize.define('MarketingRCPA', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rcpa_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  rcpa_name: { type: DataTypes.STRING, allowNull: false },
  rcpa_type: {
    type: DataTypes.ENUM('speciality_wise', 'product_wise', 'doctor_wise'),
    defaultValue: 'doctor_wise'
  },
  speciality_id: { type: DataTypes.INTEGER, allowNull: true },
  product_id: { type: DataTypes.INTEGER, allowNull: true },
  allocation_scope: {
    type: DataTypes.ENUM('all', 'specific'),
    defaultValue: 'all'
  },
  allocated_division_id: { type: DataTypes.INTEGER, allowNull: true },
  allocated_role: { type: DataTypes.STRING, allowNull: true },
  allocated_user_id: { type: DataTypes.INTEGER, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'allocated', 'running', 'closed'),
    defaultValue: 'draft'
  },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  updated_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  timestamps: true,
  tableName: 'marketing_rcpas',
  underscored: true
});

module.exports = MarketingRCPA;
