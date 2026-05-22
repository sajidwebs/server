const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketingRCPAEntry = sequelize.define('MarketingRCPAEntry', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rcpa_id: { type: DataTypes.INTEGER, allowNull: false },
  doctor_id: { type: DataTypes.INTEGER, allowNull: true },
  doctor_name: { type: DataTypes.STRING, allowNull: false },
  doctor_address: { type: DataTypes.TEXT, allowNull: true },
  speciality: { type: DataTypes.STRING, allowNull: true },
  chemist_id: { type: DataTypes.INTEGER, allowNull: true },
  chemist_name: { type: DataTypes.STRING, allowNull: true },
  chemist_address: { type: DataTypes.TEXT, allowNull: true },
  contact_number: { type: DataTypes.STRING, allowNull: true },
  brand_name: { type: DataTypes.STRING, allowNull: false },
  own_rx_per_week: { type: DataTypes.INTEGER, defaultValue: 0 },
  competitors: { type: DataTypes.JSONB, defaultValue: [] },
  total_business_strips: { type: DataTypes.INTEGER, defaultValue: 0 },
  submitted_by: { type: DataTypes.INTEGER, allowNull: true },
  submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: true,
  tableName: 'marketing_rcpa_entries',
  underscored: true
});

module.exports = MarketingRCPAEntry;
