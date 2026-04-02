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
  // Full Name - matches User Master requirement
  fullName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Full display name of user'
  },
  // Username for login - matches User Master requirement
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Login ID (unique)'
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
  // Mobile Number - matches User Master requirement
  mobileNumber: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Contact number'
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'manager', 'Field Representative', 'Area Manager', 'Regional Manager', 'Zonal Manager', 'National Manager'),
    defaultValue: 'user'
  },
  // Role reference - links to roles table for RBAC
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'id'
    },
    comment: 'Link to Role Master for RBAC'
  },
  // Employee ID - matches User Master requirement
  employeeId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Employee ID (unique per employee)'
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
  // Assign Manager - matches User Master requirement
  assigned_manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Assigned manager for the user'
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
  },
  loginHistory: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Stores recent login history as JSON array'
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;
