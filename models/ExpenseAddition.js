const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExpenseAddition = sequelize.define('ExpenseAddition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  expense_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'expenses',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('addition', 'deduction'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'expense_additions',
  timestamps: true,
  underscored: true
});

module.exports = ExpenseAddition;
