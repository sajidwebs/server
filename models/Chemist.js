const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chemist = sequelize.define('Chemist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  // Reference to Headquarter (HQ)
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'headquarters',
      key: 'id'
    }
  },
  // Reference to Territory (Patch/Route)
  territory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'territories',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'chemists'
});

module.exports = Chemist;
