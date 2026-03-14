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

// New Master Data Models - Doctor
const DoctorClass = require('./DoctorClass');
const DoctorCategory = require('./DoctorCategory');
const DoctorSpecialty = require('./DoctorSpecialty');
const DoctorQualification = require('./DoctorQualification');
const ApprovalQueue = require('./ApprovalQueue');
const ApprovalHistory = require('./ApprovalHistory');

// New Master Data Models - Product
const Division = require('./Division');
const ProductCategory = require('./ProductCategory');
const PackSize = require('./PackSize');
const BrandGroup = require('./BrandGroup');
const Strength = require('./Strength');
const ProductPriceHistory = require('./ProductPriceHistory');

// Define relationships - Existing
User.hasMany(Activity, {
  foreignKey: 'userId',
  as: 'activities'
});

Activity.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Sale, {
  foreignKey: 'userId',
  as: 'sales'
});

Sale.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(DayCall, {
  foreignKey: 'userId',
  as: 'dayCalls'
});

DayCall.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Projection, {
  foreignKey: 'userId',
  as: 'projections'
});

Projection.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Business, {
  foreignKey: 'userId',
  as: 'businessEntries'
});

Business.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Doctor.hasMany(Business, {
  foreignKey: 'doctorId',
  as: 'businessEntries'
});

Business.belongsTo(Doctor, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Chemist.hasMany(Sale, {
  foreignKey: 'chemistId',
  as: 'sales'
});

Sale.belongsTo(Chemist, {
  foreignKey: 'chemistId',
  as: 'chemist'
});

// New Relationships - Doctor Master Data

// DoctorClass associations
DoctorClass.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

DoctorClass.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// DoctorCategory associations
DoctorCategory.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

DoctorCategory.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// DoctorSpecialty associations
DoctorSpecialty.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

DoctorSpecialty.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// DoctorQualification associations
DoctorQualification.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

DoctorQualification.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// Doctor associations with master data
Doctor.belongsTo(DoctorSpecialty, {
  foreignKey: 'specialty_id',
  as: 'specialtyData'
});

Doctor.belongsTo(DoctorCategory, {
  foreignKey: 'category_id',
  as: 'categoryData'
});

Doctor.belongsTo(DoctorQualification, {
  foreignKey: 'qualification_id',
  as: 'qualificationData'
});

// Approval Queue relationships
ApprovalQueue.belongsTo(User, {
  foreignKey: 'submitted_by',
  as: 'submitter'
});

ApprovalHistory.belongsTo(ApprovalQueue, {
  foreignKey: 'approval_queue_id',
  as: 'approval'
});

ApprovalHistory.belongsTo(User, {
  foreignKey: 'approver_id',
  as: 'approver'
});

// ==================== Product Master Relationships ====================

// Division associations
Division.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

Division.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// BrandGroup associations
BrandGroup.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

BrandGroup.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

BrandGroup.belongsTo(Division, {
  foreignKey: 'division_id',
  as: 'division'
});

// ProductCategory associations
ProductCategory.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

ProductCategory.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// PackSize associations
PackSize.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

PackSize.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// Strength associations
Strength.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

Strength.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// Product associations with master data
Product.belongsTo(Division, {
  foreignKey: 'division_id',
  as: 'divisionData'
});

Product.belongsTo(BrandGroup, {
  foreignKey: 'brand_group_id',
  as: 'brandGroupData'
});

Product.belongsTo(ProductCategory, {
  foreignKey: 'category_id',
  as: 'categoryData'
});

Product.belongsTo(PackSize, {
  foreignKey: 'pack_size_id',
  as: 'packSizeData'
});

Product.belongsTo(Strength, {
  foreignKey: 'strength_id',
  as: 'strengthData'
});

Product.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

Product.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// ProductPriceHistory associations
ProductPriceHistory.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

ProductPriceHistory.belongsTo(User, {
  foreignKey: 'changed_by',
  as: 'changedByUser'
});

Product.hasMany(ProductPriceHistory, {
  foreignKey: 'product_id',
  as: 'priceHistory'
});

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
  // Doctor Master Data Models
  DoctorClass,
  DoctorCategory,
  DoctorSpecialty,
  DoctorQualification,
  ApprovalQueue,
  ApprovalHistory,
  // Product Master Data Models
  Division,
  ProductCategory,
  PackSize,
  BrandGroup,
  Strength,
  ProductPriceHistory
};
