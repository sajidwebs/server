const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Headquarter = sequelize.define('Headquarter', {
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
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM('Regional Office', 'Branch Office', 'Head Office', 'Zonal Office'),
    allowNull: false,
    defaultValue: 'Branch Office'
  },
  // State or Union Territory - as per requirement
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // Type of state - State or Union Territory
  stateType: {
    type: DataTypes.ENUM('State', 'Union Territory'),
    allowNull: false,
    defaultValue: 'State'
  },
  // Zone - North, South, East, West, etc.
  zone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // Reason - Reason for the HQ creation or classification
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Sales region
  region: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  manager: {
    type: DataTypes.STRING,
    allowNull: true
  },
  territoryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  employeeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
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
  tableName: 'headquarters'
});

module.exports = Headquarter;
