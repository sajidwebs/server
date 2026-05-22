const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketingBrandStrategy = sequelize.define('MarketingBrandStrategy', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  financial_year: { type: DataTypes.STRING, allowNull: false },
  brand_name: { type: DataTypes.STRING, allowNull: false },
  activity_name: { type: DataTypes.STRING, allowNull: false },
  division_id: { type: DataTypes.INTEGER, allowNull: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  end_date: { type: DataTypes.DATEONLY, allowNull: true },
  objective_in_strips: { type: DataTypes.INTEGER, defaultValue: 0 },
  doctors_targeted: { type: DataTypes.INTEGER, defaultValue: 0 },
  visits: { type: DataTypes.JSONB, defaultValue: [] },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'completed', 'inactive'),
    defaultValue: 'draft'
  },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  updated_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  timestamps: true,
  tableName: 'marketing_brand_strategies',
  underscored: true
});

module.exports = MarketingBrandStrategy;
