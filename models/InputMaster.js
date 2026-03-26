const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InputMaster = sequelize.define('InputMaster', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  input_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  short_name: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  input_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'input_types',
      key: 'id'
    }
  },
  input_class_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'input_classes',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'input_master',
  timestamps: true,
  underscored: true
});

module.exports = InputMaster;