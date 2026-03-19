const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'manager', 'Field Representative', 'Area Manager', 'Regional Manager', 'Zonal Manager', 'National Manager'),
    defaultValue: 'user'
  },
  // Reference to Headquarter (HQ) - where the employee is allocated
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'headquarters',
      key: 'id'
    }
  },
  // Reference to Territory (Patch/Route) - primary territory for the employee
  territory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'territories',
      key: 'id'
    }
  },
  // Reporting hierarchy
  reportingTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Employee type: MR (Medical Representative), TBM, ABM, RBM, ZBM, NSM
  employeeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;
