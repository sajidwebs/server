const { DataTypes: D } = require("sequelize");
const db = require("../config/database");
const userRef = () => ({
  type: D.INTEGER,
  references: { model: "users", key: "id" },
  allowNull: false,
});
const options = (tableName) => ({
  tableName,
  timestamps: true,
  underscored: true,
});
const HREmployee = db.define(
  "HREmployee",
  {
    id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { ...userRef(), unique: true },
    profile: { type: D.JSONB, allowNull: false, defaultValue: {} },
    private_data: { type: D.TEXT },
    version: { type: D.INTEGER, allowNull: false, defaultValue: 1 },
  },
  options("hr_employees"),
);
const HRRecord = db.define(
  "HRRecord",
  {
    id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
    resource: { type: D.STRING(60), allowNull: false },
    employee_id: { ...userRef(), allowNull: true },
    data: { type: D.JSONB, allowNull: false, defaultValue: {} },
    status: { type: D.STRING(25), allowNull: false, defaultValue: "draft" },
    created_by: userRef(),
    version: { type: D.INTEGER, allowNull: false, defaultValue: 1 },
    history: { type: D.JSONB, allowNull: false, defaultValue: [] },
    archived: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    ...options("hr_records"),
    indexes: [{ fields: ["resource", "employee_id"] }],
  },
);
const HRMembership = db.define(
  "HRMembership",
  {
    id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { ...userRef(), unique: true },
    role: { type: D.STRING(40), allowNull: false },
    updated_by: userRef(),
  },
  options("hr_memberships"),
);
module.exports = { HREmployee, HRRecord, HRMembership };
