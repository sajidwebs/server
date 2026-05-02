const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PatchHeadquarter = sequelize.define('PatchHeadquarter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patches',
      key: 'id'
    }
  },
  hq_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'headquarters',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  end_date: {
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
  }
}, {
  timestamps: true,
  tableName: 'patch_headquarters',
  indexes: [
    {
      unique: true,
      fields: ['patch_id', 'hq_id']
    }
  ]
});

module.exports = PatchHeadquarter;
