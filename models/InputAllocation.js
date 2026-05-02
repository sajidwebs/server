const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InputAllocation = sequelize.define('InputAllocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  input_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'input_master',
      key: 'id'
    }
  },
  product_input: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  allocation_type: {
    type: DataTypes.ENUM('monthly', 'quarterly'),
    defaultValue: 'monthly'
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
  tableName: 'input_allocations'
});

module.exports = InputAllocation;
