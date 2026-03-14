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
  // Reference to Doctor Specialty Master (Constant Data)
  specialty_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'doctor_specialties',
      key: 'specialty_id'
    }
  },
  // Keep legacy specialty field for backward compatibility
  specialty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Reference to Doctor Category Master (Variable Data)
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'doctor_categories',
      key: 'category_id'
    }
  },
  // Reference to Doctor Qualification Master (Constant Data)
  qualification_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'doctor_qualifications',
      key: 'qualification_id'
    }
  },
  // Territory reference
  territory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'territories',
      key: 'id'
    }
  },
  // Headquarter reference
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'headquarters',
      key: 'id'
    }
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'doctors',
  underscored: true
});

module.exports = Doctor;
