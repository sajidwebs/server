const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoctorSpecialty = sequelize.define('DoctorSpecialty', {
  specialty_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  specialty_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  short_name: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'doctor_specialties',
  timestamps: true,
  underscored: true
});

module.exports = DoctorSpecialty;
