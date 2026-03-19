// Quick seed - adds data without recreating tables
// Uses correct field names as per model definitions
// Focus: Mostly Odisha, small part of West Bengal
const { User, Doctor, Chemist, Activity, Sale, DayCall, Projection, Business, Notification, Territory, Product, Headquarter, DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification, Division, ProductCategory, PackSize, BrandGroup, Strength } = require('./models');
const { hashPassword } = require('./utils/password');
const sequelize = require('./config/database');

async function seedQuick() {
  try {
    console.log('⚡ Quick seeding (skipping table sync)...');
    console.log('📍 Focus: Mostly Odisha, small part of West Bengal\n');
    
    // Clear existing data using TRUNCATE with CASCADE for faster deletion
    console.log('🧹 Clearing existing data...');
    
    // Use raw SQL for faster truncation with cascade
    await sequelize.query('TRUNCATE TABLE notifications, businesses, projections, day_calls, sales, activities, chemists, doctors, territories, headquarters, products, strengths, brand_groups, pack_sizes, product_categories, divisions, doctor_qualifications, doctor_specialties, doctor_categories, doctor_classes, users CASCADE');
    
    console.log('✅ Cleared existing data');

    const hashedPassword = await hashPassword('admin123');
    
    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@pamsforce.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    console.log('✅ Created admin user (admin@pamsforce.com / admin123)');

    // Create field reps - Odisha/West Bengal based
    await User.bulkCreate([
      { firstName: 'Hussain', lastName: 'Syed', email: 'hussain.syed@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.kumar@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Amit', lastName: 'Sharma', email: 'amit.sharma@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Vikram', lastName: 'Patel', email: 'vikram.patel@company.com', password: hashedPassword, role: 'user', isActive: true }
    ]);
    console.log('✅ Created 5 field representatives');

    // Create Doctor Qualifications
    await DoctorQualification.bulkCreate([
      { qualification_name: 'MBBS', short_name: 'MBBS', status: 'active' },
      { qualification_name: 'MD', short_name: 'MD', status: 'active' },
      { qualification_name: 'MS', short_name: 'MS', status: 'active' },
      { qualification_name: 'DM', short_name: 'DM', status: 'active' },
      { qualification_name: 'MCh', short_name: 'MCh', status: 'active' },
      { qualification_name: 'BDS', short_name: 'BDS', status: 'active' },
      { qualification_name: 'MDS', short_name: 'MDS', status: 'active' }
    ]);
    console.log('✅ Created doctor qualifications');

    // Create Divisions
    const divisions = await Division.bulkCreate([
      { division_name: 'General', code: 'GEN', short_name: 'GEN', description: 'General Products Division', status: 'active' },
      { division_name: 'Task Force', code: 'TF', short_name: 'TF', description: 'Task Force Division', status: 'active' },
      { division_name: 'Ortho', code: 'ORTHO', short_name: 'ORTHO', description: 'Orthopedic Division', status: 'active' },
      { division_name: 'Cardio', code: 'CARDIO', short_name: 'CARDIO', description: 'Cardiovascular Division', status: 'active' },
      { division_name: 'Neuro', code: 'NEURO', short_name: 'NEURO', description: 'Neurology Division', status: 'active' },
      { division_name: 'Critical Care', code: 'CC', short_name: 'CC', description: 'Critical Care Division', status: 'active' }
    ]);
    console.log('✅ Created divisions');

    // Create Product Categories
    const categories = await ProductCategory.bulkCreate([
      { category_name: 'Tablet', short_name: 'TAB', description: 'Tablets', status: 'active' },
      { category_name: 'Capsule', short_name: 'CAP', description: 'Capsules', status: 'active' },
      { category_name: 'Syrup', short_name: 'SYR', description: 'Syrups', status: 'active' },
      { category_name: 'Injection', short_name: 'INJ', description: 'Injections', status: 'active' },
      { category_name: 'Gel', short_name: 'GEL', description: 'Gels', status: 'active' },
      { category_name: 'Ointment', short_name: 'OINT', description: 'Ointments', status: 'active' },
      { category_name: 'Drops', short_name: 'DRP', description: 'Drops', status: 'active' },
      { category_name: 'Powder', short_name: 'PWD', description: 'Powders', status: 'active' }
    ]);
    console.log('✅ Created product categories');

    // Create Pack Sizes
    const packSizes = await PackSize.bulkCreate([
      { pack_size: '10 Tablets', short_name: '10TAB', display_order: 1, status: 'active' },
      { pack_size: '15 Tablets', short_name: '15TAB', display_order: 2, status: 'active' },
      { pack_size: '30 Tablets', short_name: '30TAB', display_order: 3, status: 'active' },
      { pack_size: '100 Tablets', short_name: '100TAB', display_order: 4, status: 'active' },
      { pack_size: '10 Capsules', short_name: '10CAP', display_order: 5, status: 'active' },
      { pack_size: '30 Capsules', short_name: '30CAP', display_order: 6, status: 'active' },
      { pack_size: '100ml', short_name: '100ML', display_order: 7, status: 'active' },
      { pack_size: '60ml', short_name: '60ML', display_order: 8, status: 'active' },
      { pack_size: '30g', short_name: '30G', display_order: 9, status: 'active' },
      { pack_size: '50g', short_name: '50G', display_order: 10, status: 'active' },
      { pack_size: 'Tube', short_name: 'TUBE', display_order: 11, status: 'active' },
      { pack_size: 'Vial', short_name: 'VIAL', display_order: 12, status: 'active' },
      { pack_size: 'Ampoule', short_name: 'AMP', display_order: 13, status: 'active' }
    ]);
    console.log('✅ Created pack sizes');

    // Create Brand Groups
    const brandGroups = await BrandGroup.bulkCreate([
      { brand_group_name: 'Osteoswift', short_name: 'OSTSW', description: 'Osteo products', status: 'active' },
      { brand_group_name: 'Paracetamol', short_name: 'PCM', description: 'Pain relief products', status: 'active' },
      { brand_group_name: 'OrthoCare', short_name: 'ORTHC', description: 'Orthopedic care', status: 'active' },
      { brand_group_name: 'CardioPlus', short_name: 'CARD+', description: 'Cardio products', status: 'active' },
      { brand_group_name: 'Neuropan', short_name: 'NEURP', description: 'Neuro products', status: 'active' },
      { brand_group_name: 'Cipmox', short_name: 'CIP', description: 'Antibiotic products', status: 'active' },
      { brand_group_name: 'Hilth', short_name: 'HLTH', description: 'Health supplements', status: 'active' }
    ]);
    console.log('✅ Created brand groups');

    // Create Strengths
    const strengths = await Strength.bulkCreate([
      { strength_value: '500', unit: 'mg', short_name: '500MG', display_order: 1, status: 'active' },
      { strength_value: '100', unit: 'mg', short_name: '100MG', display_order: 2, status: 'active' },
      { strength_value: '250', unit: 'mg', short_name: '250MG', display_order: 3, status: 'active' },
      { strength_value: '50', unit: 'mg', short_name: '50MG', display_order: 4, status: 'active' },
      { strength_value: '1000', unit: 'mg', short_name: '1000MG', display_order: 5, status: 'active' },
      { strength_value: '10', unit: 'mg', short_name: '10MG', display_order: 6, status: 'active' },
      { strength_value: '20', unit: 'mg', short_name: '20MG', display_order: 7, status: 'active' },
      { strength_value: '30', unit: 'g', short_name: '30G', display_order: 8, status: 'active' },
      { strength_value: '75/10', unit: 'mg', short_name: '75/10', display_order: 9, status: 'active' },
      { strength_value: '2', unit: 'ml', short_name: '2ML', display_order: 10, status: 'active' },
      { strength_value: '5', unit: 'ml', short_name: '5ML', display_order: 11, status: 'active' }
    ]);
    console.log('✅ Created strengths');

    // Create Products
    await Product.bulkCreate([
      {
        unique_id: '00123',
        name: 'Osteoswift',
        short_name: 'Ostf',
        code: 'OST001',
        division_id: divisions[1].id,
        brand_group_id: brandGroups[0].id,
        category_id: categories[0].id,
        pack_size_id: packSizes[1].id,
        strength_id: strengths[4].id,
        ptr: 150.00,
        mrp: 180.00,
        pts: 120.00,
        launch_date: new Date('2024-01-15'),
        status: 'active',
        created_by: adminUser.id
      },
      {
        unique_id: '00145',
        name: 'Osteoswift Gold',
        short_name: 'Ost-GL',
        code: 'OST002',
        division_id: divisions[0].id,
        brand_group_id: brandGroups[0].id,
        category_id: categories[0].id,
        pack_size_id: packSizes[0].id,
        strength_id: strengths[4].id,
        ptr: 200.00,
        mrp: 250.00,
        pts: 160.00,
        launch_date: new Date('2024-03-01'),
        status: 'active',
        created_by: adminUser.id
      },
      {
        unique_id: 'PCM500',
        name: 'Paracetamol 500',
        short_name: 'PCM500',
        code: 'PCM500',
        division_id: divisions[0].id,
        brand_group_id: brandGroups[1].id,
        category_id: categories[0].id,
        pack_size_id: packSizes[0].id,
        strength_id: strengths[0].id,
        ptr: 15.00,
        mrp: 20.00,
        pts: 12.00,
        launch_date: new Date('2023-01-01'),
        status: 'active',
        created_by: adminUser.id
      },
      {
        unique_id: 'OCG',
        name: 'OrthoCare Gel',
        short_name: 'OCG',
        code: 'OCG001',
        division_id: divisions[2].id,
        brand_group_id: brandGroups[2].id,
        category_id: categories[4].id,
        pack_size_id: packSizes[10].id,
        strength_id: strengths[7].id,
        ptr: 45.00,
        mrp: 60.00,
        pts: 35.00,
        launch_date: new Date('2023-06-15'),
        status: 'active',
        created_by: adminUser.id
      },
      {
        unique_id: 'CP',
        name: 'CardioPlus',
        short_name: 'CP',
        code: 'CP001',
        division_id: divisions[3].id,
        brand_group_id: brandGroups[3].id,
        category_id: categories[0].id,
        pack_size_id: packSizes[1].id,
        strength_id: strengths[5].id,
        ptr: 85.00,
        mrp: 110.00,
        pts: 70.00,
        launch_date: new Date('2023-09-01'),
        status: 'active',
        created_by: adminUser.id
      },
      {
        unique_id: 'NP500',
        name: 'Neuropan 500',
        short_name: 'NP500',
        code: 'NP500',
        division_id: divisions[4].id,
        brand_group_id: brandGroups[4].id,
        category_id: categories[0].id,
        pack_size_id: packSizes[2].id,
        strength_id: strengths[0].id,
        ptr: 120.00,
        mrp: 150.00,
        pts: 95.00,
        launch_date: new Date('2024-02-01'),
        status: 'active',
        created_by: adminUser.id
      },
      {
        unique_id: 'CPM250',
        name: 'Cipmox 250',
        short_name: 'CPM250',
        code: 'CPM250',
        division_id: divisions[0].id,
        brand_group_id: brandGroups[5].id,
        category_id: categories[0].id,
        pack_size_id: packSizes[3].id,
        strength_id: strengths[2].id,
        ptr: 180.00,
        mrp: 220.00,
        pts: 150.00,
        launch_date: new Date('2023-05-01'),
        status: 'active',
        created_by: adminUser.id
      },
      {
        unique_id: 'HLT-MV',
        name: 'Hilth Multivitamin',
        short_name: 'HLT-MV',
        code: 'HLTMV',
        division_id: divisions[0].id,
        brand_group_id: brandGroups[6].id,
        category_id: categories[0].id,
        pack_size_id: packSizes[2].id,
        ptr: 90.00,
        mrp: 120.00,
        pts: 75.00,
        launch_date: new Date('2024-01-01'),
        status: 'active',
        created_by: adminUser.id
      }
    ]);
    console.log('✅ Created 8 products');

    // ==================== CREATE HEADQUARTERS - MOSTLY ODISHA, SMALL WEST BENGAL ====================
    console.log('🏢 Creating headquarters (Mostly Odisha, small West Bengal)...');
    const headquarters = await Headquarter.bulkCreate([
      // ODISHA - East Zone (MAJOR FOCUS)
      { name: 'Bhubaneswar', code: 'BBSR', type: 'Regional Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'MARKET_EXP', city: 'Bhubaneswar', manager: 'Prafulla Das', phone: '0674-234567', email: 'bbsr@pamsforce.com', isActive: true },
      { name: 'Cuttack', code: 'CTC', type: 'Branch Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'COVERAGE', city: 'Cuttack', manager: 'Sagar Das', phone: '0671-234567', email: 'ctc@pamsforce.com', isActive: true },
      { name: 'Rourkela', code: 'ROUR', type: 'Branch Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'NEW_MARKET', city: 'Rourkela', manager: 'Ramesh Behera', phone: '0661-234567', email: 'rour@pamsforce.com', isActive: true },
      { name: 'Sambalpur', code: 'SAMB', type: 'Branch Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'NEW_MARKET', city: 'Sambalpur', manager: 'Anil Kumar', phone: '0663-234567', email: 'samb@pamsforce.com', isActive: true },
      { name: 'Berhampur', code: 'BERH', type: 'Branch Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'NEW_MARKET', city: 'Berhampur', manager: 'Pranab Das', phone: '0680-234567', email: 'berh@pamsforce.com', isActive: true },
      { name: 'Puri', code: 'PURI', type: 'Branch Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'COVERAGE', city: 'Puri', manager: 'Bijay Das', phone: '0675-234567', email: 'puri@pamsforce.com', isActive: true },
      { name: 'Balasore', code: 'BALO', type: 'Branch Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'NEW_MARKET', city: 'Balasore', manager: 'Manoj Das', phone: '0678-234567', email: 'balo@pamsforce.com', isActive: true },
      
      // WEST BENGAL - East Zone (SMALL FOCUS - just 1-2 HQs)
      { name: 'Kolkata Central', code: 'KOL-CEN', type: 'Regional Office', state: 'West Bengal', stateType: 'State', zone: 'East', region: 'East Region', reason: 'MARKET_EXP', city: 'Kolkata', manager: 'Subrata Ghosh', phone: '033-23456789', email: 'kolcen@pamsforce.com', isActive: true },
      { name: 'Kolkata North', code: 'KOL-NOR', type: 'Branch Office', state: 'West Bengal', stateType: 'State', zone: 'East', region: 'East Region', reason: 'COVERAGE', city: 'Kolkata', manager: 'Dulal Mondal', phone: '033-23456790', email: 'kolnor@pamsforce.com', isActive: true },
      
      // HEAD OFFICE
      { name: 'Bhubaneswar Head Office', code: 'BBSR-HO', type: 'Head Office', state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', reason: 'HQ', city: 'Bhubaneswar', manager: 'CEO', phone: '0674-2345600', email: 'ho@pamsforce.com', isActive: true }
    ]);
    console.log('✅ Created 10 headquarters');

    // ==================== CREATE TERRITORIES - MOSTLY ODISHA, SMALL WEST BENGAL ====================
    console.log('🗺️ Creating territories (patches/routes)...');
    await Territory.bulkCreate([
      // ODISHA - Bhubaneswar HQ (Most territories)
      { name: 'Bhubaneswar Central', code: 'BBSR-CEN', hq_id: headquarters[0].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Khordha', isActive: true },
      { name: 'Bhubaneswar East', code: 'BBSR-EST', hq_id: headquarters[0].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Khordha', isActive: true },
      { name: 'Bhubaneswar West', code: 'BBSR-WST', hq_id: headquarters[0].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Khordha', isActive: true },
      { name: 'Bhubaneswar South', code: 'BBSR-SOU', hq_id: headquarters[0].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Khordha', isActive: true },
      { name: 'Bhubaneswar North', code: 'BBSR-NOR', hq_id: headquarters[0].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Khordha', isActive: true },
      { name: 'Puri', code: 'PURI', hq_id: headquarters[0].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Puri', isActive: true },
      
      // ODISHA - Cuttack HQ
      { name: 'Cuttack City', code: 'CTC-CIT', hq_id: headquarters[1].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Cuttack', isActive: true },
      { name: 'Cuttack North', code: 'CTC-NOR', hq_id: headquarters[1].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Cuttack', isActive: true },
      { name: 'Cuttack South', code: 'CTC-SOU', hq_id: headquarters[1].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Cuttack', isActive: true },
      { name: 'Kendrapara', code: 'KEND', hq_id: headquarters[1].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Kendrapara', isActive: true },
      { name: 'Jajpur', code: 'JAJP', hq_id: headquarters[1].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Jajpur', isActive: true },
      
      // ODISHA - Rourkela HQ
      { name: 'Rourkela City', code: 'ROUR-CIT', hq_id: headquarters[2].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Sundargarh', isActive: true },
      { name: 'Rourkela West', code: 'ROUR-WST', hq_id: headquarters[2].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Sundargarh', isActive: true },
      { name: 'Jharsuguda', code: 'JHAR', hq_id: headquarters[2].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Jharsuguda', isActive: true },
      { name: 'Sundargarh', code: 'SUND', hq_id: headquarters[2].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Sundargarh', isActive: true },
      
      // ODISHA - Sambalpur HQ
      { name: 'Sambalpur City', code: 'SAMB-CIT', hq_id: headquarters[3].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Sambalpur', isActive: true },
      { name: 'Sambalpur West', code: 'SAMB-WST', hq_id: headquarters[3].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Sambalpur', isActive: true },
      { name: 'Balangir', code: 'BALG', hq_id: headquarters[3].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Balangir', isActive: true },
      { name: 'Sonepur', code: 'SONE', hq_id: headquarters[3].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Sonepur', isActive: true },
      
      // ODISHA - Berhampur HQ
      { name: 'Berhampur City', code: 'BERH-CIT', hq_id: headquarters[4].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Ganjam', isActive: true },
      { name: 'Ganjam', code: 'GANJ', hq_id: headquarters[4].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Ganjam', isActive: true },
      { name: 'Gajapati', code: 'GAJP', hq_id: headquarters[4].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Gajapati', isActive: true },
      
      // ODISHA - Puri HQ
      { name: 'Puri City', code: 'PURI-CIT', hq_id: headquarters[5].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Puri', isActive: true },
      { name: 'Khordha', code: 'KHOR', hq_id: headquarters[5].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Khordha', isActive: true },
      
      // ODISHA - Balasore HQ
      { name: 'Balasore City', code: 'BALO-CIT', hq_id: headquarters[6].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Balasore', isActive: true },
      { name: 'Bhadrak', code: 'BHAD', hq_id: headquarters[6].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Bhadrak', isActive: true },
      { name: 'Mayurbhanj', code: 'MAYU', hq_id: headquarters[6].id, state: 'Odisha', stateType: 'State', zone: 'East', region: 'East Region', district: 'Mayurbhanj', isActive: true },
      
      // WEST BENGAL - Kolkata Central HQ (Small presence)
      { name: 'Kolkata Central Zone A', code: 'KOL-CEN-A', hq_id: headquarters[7].id, state: 'West Bengal', stateType: 'State', zone: 'East', region: 'East Region', district: 'Kolkata', isActive: true },
      { name: 'Kolkata Central Zone B', code: 'KOL-CEN-B', hq_id: headquarters[7].id, state: 'West Bengal', stateType: 'State', zone: 'East', region: 'East Region', district: 'Kolkata', isActive: true },
      
      // WEST BENGAL - Kolkata North HQ (Small presence)
      { name: 'Kolkata North Zone A', code: 'KOL-NOR-A', hq_id: headquarters[8].id, state: 'West Bengal', stateType: 'State', zone: 'East', region: 'East Region', district: 'North 24 Parganas', isActive: true },
      { name: 'Barasat', code: 'BRST', hq_id: headquarters[8].id, state: 'West Bengal', stateType: 'State', zone: 'East', region: 'East Region', district: 'North 24 Parganas', isActive: true }
    ]);
    console.log('✅ Created 33 territories');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Admin login: admin@pamsforce.com / admin123');
    console.log('- Field reps: 5 users');
    console.log('- Products: 8');
    console.log('- Divisions: 6');
    console.log('- Headquarters: 10 (7 Odisha + 2 West Bengal + 1 Head Office)');
    console.log('- Territories: 33 (27 Odisha + 6 West Bengal)');
    console.log('\n📊 Coverage: ~82% Odisha, ~18% West Bengal');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedQuick();
