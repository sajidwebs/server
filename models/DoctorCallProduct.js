const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoctorCallProduct = sequelize.define('DoctorCallProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  activityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'activities',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  sampleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sample_master',
      key: 'id'
    }
  },
  sampleQty: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  inputId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'input_master',
      key: 'id'
    }
  },
  rxPerWeek: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'doctor_call_products'
});

module.exports = DoctorCallProduct;
