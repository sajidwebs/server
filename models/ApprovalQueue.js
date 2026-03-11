const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalQueue = sequelize.define('ApprovalQueue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entity_type: {
    type: DataTypes.ENUM('doctor', 'chemist', 'territory', 'headquarter', 'hospital'),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  submitted_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  submitted_by_role: {
    type: DataTypes.ENUM('TBM', 'ABM', 'RSM', 'ZSM', 'NSM', 'ADMIN'),
    allowNull: false
  },
  action_type: {
    type: DataTypes.ENUM('create', 'update', 'delete'),
    allowNull: false
  },
  current_level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '1=TBM, 2=ABM, 3=RSM/RBM, 4=ZSM/ZBM, 5=NSM'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  data_snapshot: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Snapshot of data being submitted for approval'
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submitted_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'approval_queue',
  timestamps: true,
  underscored: true
});

module.exports = ApprovalQueue;
