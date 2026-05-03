const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stockist = sequelize.define('Stockist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  stockist_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_person: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  patch_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  territory_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Effective Dating
  start_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  tableName: 'stockists',
  underscored: true
});

module.exports = Stockist;
