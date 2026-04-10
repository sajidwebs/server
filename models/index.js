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

// Input & Sample Master Models
const InputType = require('./InputType');
const InputClass = require('./InputClass');
const InputMaster = require('./InputMaster');
const SampleMaster = require('./SampleMaster');

// Doctor Call Product Model (links doctor calls to products/samples/inputs)
const DoctorCallProduct = require('./DoctorCallProduct');

// User Master Models (Role-Based Access Control)
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');

// Expense Master Models
const ExpenseType = require('./ExpenseType');
const TravelMode = require('./TravelMode');
const StandardFareChart = require('./StandardFareChart');
const Expense = require('./Expense');
const ExpenseAddition = require('./ExpenseAddition');

// System Setup Models (Rule Engine)
const CallAverageSetup = require('./CallAverageSetup');
const CoverageSetup = require('./CoverageSetup');
const WorkTypeSetup = require('./WorkTypeSetup');
const WorkTypeMaster = require('./WorkTypeMaster');
const LeavePolicyMaster = require('./LeavePolicyMaster');
const UserLeaveBalance = require('./UserLeaveBalance');

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

// Doctor - Activity (doctor calls)
Doctor.hasMany(Activity, {
  foreignKey: 'doctorId',
  as: 'activities'
});

Activity.belongsTo(Doctor, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

// DoctorClass - Activity
DoctorClass.hasMany(Activity, {
  foreignKey: 'doctorClassId',
  as: 'activities'
});

Activity.belongsTo(DoctorClass, {
  foreignKey: 'doctorClassId',
  as: 'doctorClass'
});

// Chemist - Activity (chemist calls)
Chemist.hasMany(Activity, {
  foreignKey: 'chemistId',
  as: 'activities'
});

Activity.belongsTo(Chemist, {
  foreignKey: 'chemistId',
  as: 'chemist'
});

// Activity - DoctorCallProduct (product detailing per call)
Activity.hasMany(DoctorCallProduct, {
  foreignKey: 'activityId',
  as: 'callProducts'
});

DoctorCallProduct.belongsTo(Activity, {
  foreignKey: 'activityId',
  as: 'activity'
});

// Product - DoctorCallProduct
Product.hasMany(DoctorCallProduct, {
  foreignKey: 'productId',
  as: 'callProducts'
});

DoctorCallProduct.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

// SampleMaster - DoctorCallProduct
SampleMaster.hasMany(DoctorCallProduct, {
  foreignKey: 'sampleId',
  as: 'callProducts'
});

DoctorCallProduct.belongsTo(SampleMaster, {
  foreignKey: 'sampleId',
  as: 'sample'
});

// InputMaster - DoctorCallProduct
InputMaster.hasMany(DoctorCallProduct, {
  foreignKey: 'inputId',
  as: 'callProducts'
});

DoctorCallProduct.belongsTo(InputMaster, {
  foreignKey: 'inputId',
  as: 'input'
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

// User - Assigned Manager (User Master requirement)
User.belongsTo(User, {
  foreignKey: 'assigned_manager_id',
  as: 'assignedManager'
});

User.hasMany(User, {
  foreignKey: 'assigned_manager_id',
  as: 'managedUsers'
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

// ==================== INPUT MASTER RELATIONSHIPS ====================

// InputType - InputMaster
InputType.hasMany(InputMaster, {
  foreignKey: 'input_type_id',
  as: 'inputs'
});

InputMaster.belongsTo(InputType, {
  foreignKey: 'input_type_id',
  as: 'inputType'
});

// InputClass - InputMaster
InputClass.hasMany(InputMaster, {
  foreignKey: 'input_class_id',
  as: 'inputs'
});

InputMaster.belongsTo(InputClass, {
  foreignKey: 'input_class_id',
  as: 'inputClass'
});

// ==================== SAMPLE MASTER RELATIONSHIPS ====================

// Product - SampleMaster
Product.hasMany(SampleMaster, {
  foreignKey: 'product_id',
  as: 'samples'
});

SampleMaster.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// PackSize - SampleMaster
PackSize.hasMany(SampleMaster, {
  foreignKey: 'pack_size_id',
  as: 'samples'
});

SampleMaster.belongsTo(PackSize, {
  foreignKey: 'pack_size_id',
  as: 'packSize'
});

// ==================== PRODUCT ASSOCIATIONS ====================
// Product - Division
Division.hasMany(Product, {
  foreignKey: 'division_id',
  as: 'products'
});

Product.belongsTo(Division, {
  foreignKey: 'division_id',
  as: 'divisionData'
});

// Product - BrandGroup
BrandGroup.hasMany(Product, {
  foreignKey: 'brand_group_id',
  as: 'products'
});

Product.belongsTo(BrandGroup, {
  foreignKey: 'brand_group_id',
  as: 'brandGroupData'
});

// BrandGroup - Division
Division.hasMany(BrandGroup, {
  foreignKey: 'division_id',
  as: 'brandGroups'
});

BrandGroup.belongsTo(Division, {
  foreignKey: 'division_id',
  as: 'division'
});

// Product - ProductCategory
ProductCategory.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

Product.belongsTo(ProductCategory, {
  foreignKey: 'category_id',
  as: 'categoryData'
});

// Product - PackSize
PackSize.hasMany(Product, {
  foreignKey: 'pack_size_id',
  as: 'products'
});

Product.belongsTo(PackSize, {
  foreignKey: 'pack_size_id',
  as: 'packSizeData'
});

// Product - Strength
Strength.hasMany(Product, {
  foreignKey: 'strength_id',
  as: 'products'
});

Product.belongsTo(Strength, {
  foreignKey: 'strength_id',
  as: 'strengthData'
});

// ==================== USER MASTER RBAC RELATIONSHIPS ====================

// Role - User
Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users'
});

User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'roleData'
});

// Role - Permission (through RolePermission)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

// ==================== EXPENSE MASTER RELATIONSHIPS ====================

// User - Expense
User.hasMany(Expense, {
  foreignKey: 'user_id',
  as: 'expenses'
});

Expense.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'employee'
});

// Headquarter - Expense
Headquarter.hasMany(Expense, {
  foreignKey: 'hq_id',
  as: 'expenses'
});

Expense.belongsTo(Headquarter, {
  foreignKey: 'hq_id',
  as: 'headquarter'
});

// Territory - Expense
Territory.hasMany(Expense, {
  foreignKey: 'territory_id',
  as: 'expenses'
});

Expense.belongsTo(Territory, {
  foreignKey: 'territory_id',
  as: 'territory'
});

// TravelMode - Expense
TravelMode.hasMany(Expense, {
  foreignKey: 'travel_mode_id',
  as: 'expenses'
});

Expense.belongsTo(TravelMode, {
  foreignKey: 'travel_mode_id',
  as: 'travelMode'
});

// StandardFareChart - Expense
StandardFareChart.hasMany(Expense, {
  foreignKey: 'fare_chart_id',
  as: 'expenses'
});

Expense.belongsTo(StandardFareChart, {
  foreignKey: 'fare_chart_id',
  as: 'fareChart'
});

// User - StandardFareChart (employee-specific fare chart)
User.hasMany(StandardFareChart, {
  foreignKey: 'employee_id',
  as: 'fareCharts'
});

StandardFareChart.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Expense - ExpenseAddition
Expense.hasMany(ExpenseAddition, {
  foreignKey: 'expense_id',
  as: 'additions'
});

ExpenseAddition.belongsTo(Expense, {
  foreignKey: 'expense_id',
  as: 'expense'
});

// ==================== SYSTEM SETUP MODELS RELATIONSHIPS ====================

// User - CallAverageSetup
User.hasMany(CallAverageSetup, {
  foreignKey: 'created_by',
  as: 'callAverageSetups'
});

CallAverageSetup.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// User - CoverageSetup
User.hasMany(CoverageSetup, {
  foreignKey: 'created_by',
  as: 'coverageSetups'
});

CoverageSetup.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// User - WorkTypeSetup
User.hasMany(WorkTypeSetup, {
  foreignKey: 'created_by',
  as: 'workTypeSetups'
});

WorkTypeSetup.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// User - LeavePolicyMaster
User.hasMany(LeavePolicyMaster, {
  foreignKey: 'created_by',
  as: 'leavePolicies'
});

LeavePolicyMaster.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// User - UserLeaveBalance
User.hasMany(UserLeaveBalance, {
  foreignKey: 'user_id',
  as: 'leaveBalances'
});

UserLeaveBalance.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
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
  ApprovalHistory,
  // Input & Sample Master Models
  InputType,
  InputClass,
  InputMaster,
  SampleMaster,
  // Doctor Call Product Model
  DoctorCallProduct,
  // User Master RBAC Models
  Role,
  Permission,
  RolePermission,
  // Expense Master Models
  ExpenseType,
  TravelMode,
  StandardFareChart,
  Expense,
  ExpenseAddition,
  // System Setup Models (Rule Engine)
  CallAverageSetup,
  CoverageSetup,
  WorkTypeSetup,
  WorkTypeMaster,
  LeavePolicyMaster,
  UserLeaveBalance
};
