const User = require('./User');
const Doctor = require('./Doctor');
const Chemist = require('./Chemist');
const Activity = require('./Activity');
const Sale = require('./Sale');
const DayCall = require('./DayCall');
const Projection = require('./Projection');
const Business = require('./Business');
const Notification = require('./Notification');
const Territory = require('./Territory');
const Product = require('./Product');
const Headquarter = require('./Headquarter');

// Master Data Models
const DoctorClass = require('./DoctorClass');
const DoctorCategory = require('./DoctorCategory');
const DoctorSpecialty = require('./DoctorSpecialty');
const DoctorQualification = require('./DoctorQualification');
const Division = require('./Division');
const ProductCategory = require('./ProductCategory');
const PackSize = require('./PackSize');
const BrandGroup = require('./BrandGroup');
const Strength = require('./Strength');
const ProductPriceHistory = require('./ProductPriceHistory');
const ApprovalQueue = require('./ApprovalQueue');
const ApprovalHistory = require('./ApprovalHistory');

// ==================== RELATIONSHIPS ====================

// User - Activity
User.hasMany(Activity, {
  foreignKey: 'userId',
  as: 'activities'
});

Activity.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User - Sale
User.hasMany(Sale, {
  foreignKey: 'userId',
  as: 'sales'
});

Sale.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User - DayCall
User.hasMany(DayCall, {
  foreignKey: 'userId',
  as: 'dayCalls'
});

DayCall.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User - Projection
User.hasMany(Projection, {
  foreignKey: 'userId',
  as: 'projections'
});

Projection.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User - Business
User.hasMany(Business, {
  foreignKey: 'userId',
  as: 'businessEntries'
});

Business.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Doctor - Business
Doctor.hasMany(Business, {
  foreignKey: 'doctorId',
  as: 'businessEntries'
});

Business.belongsTo(Doctor, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

// User - Notification
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Chemist - Sale
Chemist.hasMany(Sale, {
  foreignKey: 'chemistId',
  as: 'sales'
});

Sale.belongsTo(Chemist, {
  foreignKey: 'chemistId',
  as: 'chemist'
});

// ==================== HQ - TERRITORY RELATIONSHIPS ====================

// Headquarter (HQ) - Territory (Patch/Route)
// One HQ can have multiple Territories
Headquarter.hasMany(Territory, {
  foreignKey: 'hq_id',
  as: 'territories'
});

Territory.belongsTo(Headquarter, {
  foreignKey: 'hq_id',
  as: 'headquarter'
});

// ==================== HQ - USER RELATIONSHIPS ====================

// Headquarter - User (Employee)
// One HQ can have multiple Employees
Headquarter.hasMany(User, {
  foreignKey: 'hq_id',
  as: 'employees'
});

User.belongsTo(Headquarter, {
  foreignKey: 'hq_id',
  as: 'headquarter'
});

// User - Reporting Hierarchy
User.belongsTo(User, {
  foreignKey: 'reportingTo',
  as: 'reportingManager'
});

// ==================== HQ - DOCTOR RELATIONSHIPS ====================

// Headquarter - Doctor
// One HQ can have multiple Doctors
Headquarter.hasMany(Doctor, {
  foreignKey: 'hq_id',
  as: 'doctors'
});

Doctor.belongsTo(Headquarter, {
  foreignKey: 'hq_id',
  as: 'headquarter'
});

// ==================== HQ - CHEMIST RELATIONSHIPS ====================

// Headquarter - Chemist
// One HQ can have multiple Chemists
Headquarter.hasMany(Chemist, {
  foreignKey: 'hq_id',
  as: 'chemists'
});

Chemist.belongsTo(Headquarter, {
  foreignKey: 'hq_id',
  as: 'headquarter'
});

// ==================== TERRITORY - DOCTOR RELATIONSHIPS ====================

// Territory - Doctor
// One Territory can have multiple Doctors
Territory.hasMany(Doctor, {
  foreignKey: 'territory_id',
  as: 'doctors'
});

Doctor.belongsTo(Territory, {
  foreignKey: 'territory_id',
  as: 'territory'
});

// Territory - Chemist
Territory.hasMany(Chemist, {
  foreignKey: 'territory_id',
  as: 'chemists'
});

Chemist.belongsTo(Territory, {
  foreignKey: 'territory_id',
  as: 'territory'
});

// Territory - User
Territory.hasMany(User, {
  foreignKey: 'territory_id',
  as: 'users'
});

User.belongsTo(Territory, {
  foreignKey: 'territory_id',
  as: 'territory'
});

// ==================== EXPORT MODELS ====================

module.exports = {
  User,
  Doctor,
  Chemist,
  Activity,
  Sale,
  DayCall,
  Projection,
  Business,
  Notification,
  Territory,
  Product,
  Headquarter,
  // Master Data Models
  DoctorClass,
  DoctorCategory,
  DoctorSpecialty,
  DoctorQualification,
  Division,
  ProductCategory,
  PackSize,
  BrandGroup,
  Strength,
  ProductPriceHistory,
  ApprovalQueue,
  ApprovalHistory
};
