const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Territory = sequelize.define('Territory', {
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
  // Reference to Headquarter (HQ)
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'headquarters',
      key: 'id'
    }
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // State type - State or Union Territory
  stateType: {
    type: DataTypes.ENUM('State', 'Union Territory'),
    allowNull: true,
    defaultValue: 'State'
  },
  // Zone - North, South, East, West
  zone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
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
  tableName: 'territories'
});

module.exports = Territory;
