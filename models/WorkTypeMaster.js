const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkTypeMaster = sequelize.define('WorkTypeMaster', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Field Work or Office Work'
  },
  short_name: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'FW or OW'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requires_gps: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether GPS validation is required'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'work_type_master'
});

module.exports = WorkTypeMaster;