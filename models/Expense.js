const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  month: {
    type: DataTypes.STRING(2),
    allowNull: false,
    comment: 'Month (01-12)'
  },
  year: {
    type: DataTypes.STRING(4),
    allowNull: false,
    comment: 'Year (e.g. 2026)'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  working_status: {
    type: DataTypes.ENUM('Working', 'Leave', 'Holiday', 'Sunday'),
    allowNull: false,
    defaultValue: 'Working'
  },
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'headquarters',
      key: 'id'
    }
  },
  territory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'territories',
      key: 'id'
    }
  },
  doctor_calls: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of doctor calls on this day'
  },
  chemist_calls: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of chemist calls on this day'
  },
  business_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Business amount for the day'
  },
  allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'DA (Daily Allowance) for the day'
  },
  from_place: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Travel from location'
  },
  to_place: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Travel to location'
  },
  travel_mode_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'travel_modes',
      key: 'id'
    }
  },
  travel_entry_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'If bus/train: entry amount shown. Otherwise: distance in KM'
  },
  distance_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Distance in KM for TA calculation'
  },
  ta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Travel Allowance (calculated from distance and fare chart)'
  },
  miscellaneous: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Miscellaneous expenses'
  },
  fare_chart_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'standard_fare_charts',
      key: 'id'
    }
  },
  approval_status: {
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
    defaultValue: 'draft'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'expenses',
  timestamps: true,
  underscored: true
});

module.exports = Expense;
