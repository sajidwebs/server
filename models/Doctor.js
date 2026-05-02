const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
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
  // Reference to Doctor Class Master
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Reference to Doctor Specialty Master
  specialty_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Keep legacy specialty field for backward compatibility
  specialty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Reference to Doctor Category Master
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Reference to Doctor Qualification Master
  qualification_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Territory reference
  territory_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Headquarter reference
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
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
  registration_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobile_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  patch_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  full_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visit_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  visit_day: {
    type: DataTypes.STRING,
    allowNull: true
  },
  patients_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: true
  },
  anniversary: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Effective Dating
  start_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Approval Workflow Fields
  approval_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: 'Only used when doctor is added through approval workflow'
  },
  current_approval_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0=Direct (Head Office), 1=TBM, 2=ABM, 3=RSM, 4=ZSM, 5=NSM'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'doctors',
  underscored: true
});

module.exports = Doctor;
