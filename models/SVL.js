const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SVL = sequelize.define('SVL', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'headquarters',
      key: 'id'
    }
  },
  visit_frequency: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Weekly'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: () => new Date().getFullYear()
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
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'svl',
  indexes: [
    {
      unique: true,
      fields: ['doctor_id', 'hq_id', 'year']
    }
  ]
});

module.exports = SVL;