const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Projection = sequelize.define('Projection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  projectedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  actualQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  projectedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  actualAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'projections'
});

module.exports = Projection;