const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NoticeUpload = sequelize.define('NoticeUpload', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notice_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notice_document: {
    type: DataTypes.STRING, // File path or URL
    allowNull: false
  },
  effective_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  audience: {
    type: DataTypes.ENUM('all', 'mr', 'abm', 'admin', 'field_force'),
    defaultValue: 'all'
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
  tableName: 'notice_uploads',
  underscored: true
});

module.exports = NoticeUpload;
