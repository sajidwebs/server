const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketingCampaign = sequelize.define('MarketingCampaign', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaign_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  campaign_name: { type: DataTypes.STRING, allowNull: false },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },
  campaign_for: {
    type: DataTypes.ENUM('doctor', 'chemist', 'patient', 'hospital_staff', 'stockist', 'clinic'),
    allowNull: false,
    defaultValue: 'doctor'
  },
  speciality_id: { type: DataTypes.INTEGER, allowNull: true },
  product_id: { type: DataTypes.INTEGER, allowNull: true },
  brand_name: { type: DataTypes.STRING, allowNull: true },
  objective: { type: DataTypes.TEXT, allowNull: true },
  target_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  allocated_division_id: { type: DataTypes.INTEGER, allowNull: true },
  allocated_role: { type: DataTypes.STRING, allowNull: true },
  allocated_user_id: { type: DataTypes.INTEGER, allowNull: true },
  input_id: { type: DataTypes.INTEGER, allowNull: true },
  input_name: { type: DataTypes.STRING, allowNull: true },
  qty_per_visit: { type: DataTypes.INTEGER, defaultValue: 0 },
  distribution_type: {
    type: DataTypes.ENUM('once', 'recurring'),
    defaultValue: 'once'
  },
  recurrence_frequency: { type: DataTypes.STRING, allowNull: true },
  recurrence_count: { type: DataTypes.INTEGER, defaultValue: 1 },
  input_unit_value: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total_investment: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  expected_roi: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  prescription_per_month: { type: DataTypes.INTEGER, defaultValue: 0 },
  strip_sale_per_rx: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_sale_per_month: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  new_prescribers_added: { type: DataTypes.INTEGER, defaultValue: 0 },
  sales_growth: { type: DataTypes.DECIMAL(7, 4), defaultValue: 0 },
  hq_below_90: { type: DataTypes.INTEGER, defaultValue: 0 },
  hq_below_70: { type: DataTypes.INTEGER, defaultValue: 0 },
  hq_at_100: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('draft', 'running', 'closed', 'cancelled'),
    defaultValue: 'draft'
  },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  updated_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  timestamps: true,
  tableName: 'marketing_campaigns',
  underscored: true
});

module.exports = MarketingCampaign;
