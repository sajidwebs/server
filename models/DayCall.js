const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DayCall = sequelize.define('DayCall', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME
  },
  endTime: {
    type: DataTypes.TIME
  },
  location: {
    type: DataTypes.STRING
  },
  purpose: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'planned'
  },
  remarks: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'day_calls'
});

module.exports = DayCall;