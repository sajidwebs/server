const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StandardFareChart = sequelize.define('StandardFareChart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  hq_type: {
    type: DataTypes.ENUM('Metro', 'Non-Metro', 'Hill Station', 'Semi Metro'),
    allowNull: false,
    defaultValue: 'Non-Metro'
  },
  employee_status: {
    type: DataTypes.ENUM('Confirmed', 'Probation', 'Notice'),
    allowNull: false,
    defaultValue: 'Confirmed'
  },
  da: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Daily Allowance'
  },
  ex_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Ex-Allowance'
  },
  outstation_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Out-station Allowance'
  },
  hill_station_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Hill Station Allowance'
  },
  meeting_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Meeting Allowance'
  },
  accommodation: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Accommodation allowance'
  },
  fare_per_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Base fare per KM'
  },
  fare_0_to_70km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Fare rate for distance 0-70 km'
  },
  fare_70_to_100km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Fare rate for distance 70-100 km'
  },
  fare_above_100km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Fare rate for distance above 100 km'
  },
  mobile_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Mobile Allowance'
  },
  stationary_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Stationary Allowance'
  },
  effective_from: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  effective_to: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'If null, fare is currently active'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'standard_fare_charts',
  timestamps: true,
  underscored: true
});

module.exports = StandardFareChart;
