const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalHistory = sequelize.define('ApprovalHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  approval_queue_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'approval_queue',
      key: 'id'
    }
  },
  approver_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approver_role: {
    type: DataTypes.ENUM('TBM', 'ABM', 'RSM', 'ZSM', 'NSM', 'ADMIN'),
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('approved', 'rejected'),
    allowNull: false
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Approval level at which action was taken'
  },
  action_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'approval_history',
  timestamps: true,
  underscored: true
});

module.exports = ApprovalHistory;
