const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RateFixation = sequelize.define('RateFixation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  sample_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sample_master',
      key: 'id'
    }
  },
  input_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'input_master',
      key: 'id'
    }
  },
  pts: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  ptr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  nrv: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  effective_from: {
    type: DataTypes.DATE,
    allowNull: false
  },
  effective_to: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'rate_fixations'
});

module.exports = RateFixation;
