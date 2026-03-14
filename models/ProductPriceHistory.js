const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductPriceHistory = sequelize.define('ProductPriceHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  ptr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  pts: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  nrv: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  change_reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  effective_from: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'product_price_history'
});

module.exports = ProductPriceHistory;