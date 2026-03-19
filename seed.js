// Simplified Seed - Odisha Only
const { User, Doctor, Chemist, Territory, Product, Headquarter, DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification, Division, ProductCategory, PackSize, BrandGroup, Strength } = require('./models');
const { hashPassword } = require('./utils/password');
const sequelize = require('./config/database');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding (Odisha Only - Simplified)...\n');
    
    // Try to clear data - if tables don't exist, it's okay
    console.log('🧹 Clearing existing data...');
    try {
      await sequelize.query('TRUNCATE TABLE doctor_specialties, doctor_categories, doctor_qualifications, doctor_classes CASCADE');
      await sequelize.query('TRUNCATE TABLE territories, headquarters CASCADE');
      await sequelize.query('TRUNCATE TABLE products, brand_groups, pack_sizes, product_categories, divisions, strengths CASCADE');
      await sequelize.query('TRUNCATE TABLE doctors, chemists, users CASCADE');
      console.log('✅ Cleared existing data');
    } catch(e) {
      console.log('⚠️  Could not clear all tables (they may not exist yet)');
    }

    const hashedPassword = await hashPassword('admin123');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@pamsforce.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    console.log('✅ Admin user created!');

    // Create field representatives
    console.log('👥 Creating field representatives...');
    const fieldReps = await User.bulkCreate([
      { firstName: 'Hussain', lastName: 'Syed', email: 'hussain.syed@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.kumar@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@company.com', password: hashedPassword, role: 'user', isActive: true },
      { firstName: 'Sneha', lastName: 'Reddy', email: 'sneha.reddy@company.com', password: hashedPassword, role: 'user', isActive: true }
    ]);
    console.log('✅ Created 5 field representatives');

    // Create Doctor Classes
    console.log('🏷️ Creating doctor classes...');
    const doctorClasses = await DoctorClass.bulkCreate([
      { category_name: 'Class A', short_name: 'A', status: 'active' },
      { category_name: 'Class B', short_name: 'B', status: 'active' },
      { category_name: 'Class C', short_name: 'C', status: 'active' }
    ]);
    console.log('✅ Created doctor classes');

    // Create Doctor Categories
    console.log('📋 Creating doctor categories...');
    const doctorCategories = await DoctorCategory.bulkCreate([
      { category_name: 'Consultant', short_name: 'CONS', status: 'active' },
      { category_name: 'General Practitioner', short_name: 'GP', status: 'active' },
      { category_name: 'Specialist', short_name: 'SPEC', status: 'active' }
    ]);
    console.log('✅ Created doctor categories');

    // Create Doctor Specialties
    console.log('🩺 Creating doctor specialties...');
    const doctorSpecialties = await DoctorSpecialty.bulkCreate([
      { specialty_name: 'General Medicine', short_name: 'GM', status: 'active' },
      { specialty_name: 'Cardiology', short_name: 'CARD', status: 'active' },
      { specialty_name: 'Orthopedics', short_name: 'ORTH', status: 'active' },
      { specialty_name: 'Pediatrics', short_name: 'PED', status: 'active' },
      { specialty_name: 'Gynecology', short_name: 'GYNO', status: 'active' },
      { specialty_name: 'Dermatology', short_name: 'DERM', status: 'active' },
      { specialty_name: 'Neurology', short_name: 'NEURO', status: 'active' },
      { specialty_name: 'Gastroenterology', short_name: 'GI', status: 'active' }
    ]);
    console.log('✅ Created doctor specialties');

    // Create Doctor Qualifications
    console.log('🎓 Creating doctor qualifications...');
    const doctorQualifications = await DoctorQualification.bulkCreate([
      { qualification_name: 'MBBS', short_name: 'MBBS', status: 'active' },
      { qualification_name: 'MD', short_name: 'MD', status: 'active' },
      { qualification_name: 'MS', short_name: 'MS', status: 'active' },
      { qualification_name: 'DM', short_name: 'DM', status: 'active' },
      { qualification_name: 'MCh', short_name: 'MCh', status: 'active' },
      { qualification_name: 'DNB', short_name: 'DNB', status: 'active' },
      { qualification_name: 'Diploma', short_name: 'Dip', status: 'active' }
    ]);
    console.log('✅ Created doctor qualifications');

    // Create Headquarters (Odisha Only)
    console.log('🏢 Creating headquarters (Odisha only)...');
    const headquarters = await Headquarter.bulkCreate([
      { 
        name: 'Bhubaneswar', 
        code: 'BBSR', 
        type: 'Regional Office', 
        state: 'Odisha', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        reason: 'MARKET_EXP', 
        city: 'Bhubaneswar', 
        manager: 'Prafulla Das', 
        phone: '0674-234567', 
        email: 'bbsr@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Cuttack', 
        code: 'CTC', 
        type: 'Branch Office', 
        state: 'Odisha', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        reason: 'COVERAGE', 
        city: 'Cuttack', 
        manager: 'Sagar Das', 
        phone: '0671-234567', 
        email: 'ctc@pamsforce.com', 
        isActive: true
      }
    ]);
    console.log('✅ Created 2 headquarters');

    // Create Territories (Odisha Only)
    console.log('🗺️ Creating territories (Odisha only)...');
    const territories = await Territory.bulkCreate([
      { 
        name: 'Bhubaneswar Central', 
        code: 'BBSR-CEN', 
        hq_id: headquarters[0].id, 
        state: 'Odisha', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        district: 'Khordha', 
        isActive: true
      },
      { 
        name: 'Bhubaneswar East', 
        code: 'BBSR-EST', 
        hq_id: headquarters[0].id, 
        state: 'Odisha', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        district: 'Khordha', 
        isActive: true
      },
      { 
        name: 'Bhubaneswar West', 
        code: 'BBSR-WST', 
        hq_id: headquarters[0].id, 
        state: 'Odisha', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        district: 'Khordha', 
        isActive: true
      },
      { 
        name: 'Cuttack City', 
        code: 'CTC-CIT', 
        hq_id: headquarters[1].id, 
        state: 'Odisha', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        district: 'Cuttack', 
        isActive: true
      },
      { 
        name: 'Cuttack North', 
        code: 'CTC-NOR', 
        hq_id: headquarters[1].id, 
        state: 'Odisha', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        district: 'Cuttack', 
        isActive: true
      }
    ]);
    console.log('✅ Created 5 territories');

    // Create Product Masters
    console.log('🏢 Creating divisions...');
    const divisions = await Division.bulkCreate([
      { division_name: 'Primary Care', short_name: 'DIV-PC', code: 'DIV-PC', status: 'active' },
      { division_name: 'Cardiac Care', short_name: 'DIV-CC', code: 'DIV-CC', status: 'active' },
      { division_name: 'Gastro', short_name: 'DIV-GI', code: 'DIV-GI', status: 'active' },
      { division_name: 'Neuro', short_name: 'DIV-NR', code: 'DIV-NR', status: 'active' },
      { division_name: 'Ortho', short_name: 'DIV-OR', code: 'DIV-OR', status: 'active' }
    ]);
    console.log('✅ Created 5 divisions');

    console.log('📋 Creating product categories...');
    const productCategories = await ProductCategory.bulkCreate([
      { category_name: 'Tablets', short_name: 'Tab', category_type: 'form', status: 'active' },
      { category_name: 'Capsules', short_name: 'Cap', category_type: 'form', status: 'active' },
      { category_name: 'Syrups', short_name: 'Syr', category_type: 'form', status: 'active' },
      { category_name: 'Injections', short_name: 'Inj', category_type: 'form', status: 'active' },
      { category_name: 'Ointments', short_name: 'Oint', category_type: 'form', status: 'active' }
    ]);
    console.log('✅ Created 5 product categories');

    console.log('📦 Creating pack sizes...');
    const packSizes = await PackSize.bulkCreate([
      { pack_size: "10's", short_name: '10s', display_order: 1, status: 'active' },
      { pack_size: "15's", short_name: '15s', display_order: 2, status: 'active' },
      { pack_size: "20's", short_name: '20s', display_order: 3, status: 'active' },
      { pack_size: "30's", short_name: '30s', display_order: 4, status: 'active' },
      { pack_size: "50's", short_name: '50s', display_order: 5, status: 'active' },
      { pack_size: "100's", short_name: '100s', display_order: 6, status: 'active' }
    ]);
    console.log('✅ Created 6 pack sizes');

    console.log('🏷️ Creating brand groups...');
    const brandGroups = await BrandGroup.bulkCreate([
      { brand_group_name: 'Crocin Group', short_name: 'CROCIN', division_id: 1, status: 'active' },
      { brand_group_name: 'Combiflam Group', short_name: 'COMBIFLAM', division_id: 1, status: 'active' },
      { brand_group_name: 'Azithromycin Group', short_name: 'AZITHROMYCIN', division_id: 1, status: 'active' },
      { brand_group_name: 'Metrogyl Group', short_name: 'METROGYL', division_id: 3, status: 'active' },
      { brand_group_name: 'Neurobion Group', short_name: 'NEUROBION', division_id: 4, status: 'active' }
    ]);
    console.log('✅ Created 5 brand groups');

    console.log('💊 Creating strengths...');
    const strengths = await Strength.bulkCreate([
      { strength_value: '10', unit: 'mg', short_name: '10mg', display_order: 1, status: 'active' },
      { strength_value: '20', unit: 'mg', short_name: '20mg', display_order: 2, status: 'active' },
      { strength_value: '40', unit: 'mg', short_name: '40mg', display_order: 3, status: 'active' },
      { strength_value: '50', unit: 'mg', short_name: '50mg', display_order: 4, status: 'active' },
      { strength_value: '100', unit: 'mg', short_name: '100mg', display_order: 5, status: 'active' },
      { strength_value: '200', unit: 'mg', short_name: '200mg', display_order: 6, status: 'active' },
      { strength_value: '500', unit: 'mg', short_name: '500mg', display_order: 7, status: 'active' }
    ]);
    console.log('✅ Created 7 strengths');

    // Create sample doctors for Odisha
    console.log('👨‍⚕️ Creating doctors (Odisha only)...');
    const doctors = await Doctor.bulkCreate([
      { firstName: 'Dr. Subrat', lastName: 'Mohanty', specialty_id: doctorSpecialties[1].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Cardiologist', location: 'Bhubaneswar, Odisha', address: 'Cardiac Care Center, Bhubaneswar', phone: '+91-9876543210', email: 'subrat.mohanty@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Ananya', lastName: 'Das', specialty_id: doctorSpecialties[6].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Neurologist', location: 'Cuttack, Odisha', address: 'Neuro Institute, Cuttack', phone: '+91-9876543211', email: 'ananya.das@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Ramesh', lastName: 'Behera', specialty_id: doctorSpecialties[2].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[2].qualification_id, specialty: 'Orthopedic', location: 'Sambalpur, Odisha', address: 'Bone & Joint Hospital, Sambalpur', phone: '+91-9876543212', email: 'ramesh.behera@email.com', isActive: true, approval_status: 'approved' }
    ]);
    console.log('✅ Created 3 doctors');

    // Create sample chemists for Odisha
    console.log('💊 Creating chemists (Odisha only)...');
    const chemists = await Chemist.bulkCreate([
      { name: 'Kumar Medical Store', location: 'Bhubaneswar, Odisha', address: 'Sachivalaya Marg, Bhubaneswar', phone: '+91-8765432101', email: 'manoj.kumar@email.com', isActive: true, approval_status: 'approved' },
      { name: 'Sharma Pharma', location: 'Cuttack, Odisha', address: 'Badambadi, Cuttack', phone: '+91-8765432102', email: 'deepa.sharma@email.com', isActive: true, approval_status: 'approved' }
    ]);
    console.log('✅ Created 2 chemists');

    console.log('\n✅✅✅ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✅✅✅\n');
    console.log('📊 SUMMARY - ODISHA ONLY:');
    console.log(`  • Users: ${fieldReps.length + 1} (1 admin + 5 field reps)`);
    console.log(`  • Doctors: ${doctors.length}`);
    console.log(`  • Chemists: ${chemists.length}`);
    console.log(`  • Headquarters: ${headquarters.length}`);
    console.log(`  • Territories: ${territories.length}`);
    console.log(`  • Doctor Classes: ${doctorClasses.length}`);
    console.log(`  • Doctor Categories: ${doctorCategories.length}`);
    console.log(`  • Doctor Specialties: ${doctorSpecialties.length}`);
    console.log(`  • Doctor Qualifications: ${doctorQualifications.length}`);
    console.log(`  • Divisions: ${divisions.length}`);
    console.log(`  • Product Categories: ${productCategories.length}`);
    console.log(`  • Pack Sizes: ${packSizes.length}`);
    console.log(`  • Brand Groups: ${brandGroups.length}`);
    console.log(`  • Strengths: ${strengths.length}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase().then(() => {
  console.log('\n🎉 Seeding finished!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

module.exports = seedDatabase;
