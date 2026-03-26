// Comprehensive Seed - All India Multi-Zone
const { User, Doctor, Chemist, Territory, Product, Headquarter, DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification, Division, ProductCategory, PackSize, BrandGroup, Strength, InputType, InputClass, InputMaster, SampleMaster } = require('./models');
const { hashPassword } = require('./utils/password');
const sequelize = require('./config/database');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding (All India Multi-Zone)...\n');
    
    // Try to clear data - if tables don't exist, it's okay
    console.log('🧹 Clearing existing data...');
    try {
      await sequelize.query('TRUNCATE TABLE doctor_specialties, doctor_categories, doctor_qualifications, doctor_classes CASCADE');
      await sequelize.query('TRUNCATE TABLE territories, headquarters CASCADE');
      await sequelize.query('TRUNCATE TABLE products, brand_groups, pack_sizes, product_categories, divisions, strengths CASCADE');
      await sequelize.query('TRUNCATE TABLE doctors, chemists, users CASCADE');
      await sequelize.query('TRUNCATE TABLE input_master, input_types, input_classes, sample_master CASCADE');
      console.log('✅ Cleared existing data');
    } catch(e) {
      console.log('⚠️  Could not clear all tables (they may not exist yet)');
    }

    // Drop existing input tables and recreate with all columns
    console.log('📋 Recreating input tables with all columns...');
    try {
      await sequelize.query('DROP TABLE IF EXISTS input_master CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS input_classes CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS input_types CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS sample_master CASCADE');
      console.log('✅ Dropped existing input tables');
    } catch(e) {
      console.log('⚠️  Could not drop tables:', e.message);
    }

    // Create input_types table
    console.log('📋 Creating input_types table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS input_types (
          id SERIAL PRIMARY KEY,
          type_name VARCHAR(255) NOT NULL UNIQUE,
          short_name VARCHAR(10) NOT NULL UNIQUE,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ input_types table ready');
    } catch(e) {
      console.log('⚠️  input_types table error:', e.message);
    }

    // Create input_classes table
    console.log('🏷️ Creating input_classes table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS input_classes (
          id SERIAL PRIMARY KEY,
          class_name VARCHAR(255) NOT NULL UNIQUE,
          short_name VARCHAR(10) NOT NULL UNIQUE,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ input_classes table ready');
    } catch(e) {
      console.log('⚠️  input_classes table error:', e.message);
    }

    // Create input_master table
    console.log('📄 Creating input_master table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS input_master (
          id SERIAL PRIMARY KEY,
          input_name VARCHAR(255) NOT NULL UNIQUE,
          short_name VARCHAR(10) NOT NULL UNIQUE,
          input_type_id INTEGER REFERENCES input_types(id),
          input_class_id INTEGER REFERENCES input_classes(id),
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ input_master table ready');
    } catch(e) {
      console.log('⚠️  input_master table error:', e.message);
    }

    // Create sample_master table
    console.log('🎁 Creating sample_master table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS sample_master (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id),
          pack_size_id INTEGER REFERENCES pack_sizes(id),
          sample_name VARCHAR(255) NOT NULL,
          sample_qty DECIMAL(10,2) NOT NULL,
          unit VARCHAR(20) DEFAULT 'Tab',
          max_per_call INTEGER DEFAULT 5,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ sample_master table ready');
    } catch(e) {
      console.log('⚠️  sample_master table error:', e.message);
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
      { category_name: 'Class C', short_name: 'C', status: 'active' },
      { category_name: 'Sampark Doctor', short_name: 'SAMP', status: 'active' }
    ]);
    console.log(`✅ Created ${doctorClasses.length} doctor classes (including Sampark Doctor)`);

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

    // Create Headquarters (HQ Master - All Zones)
    console.log('🏢 Creating headquarters (HQ Master - All Zones)...');
    const headquarters = await Headquarter.bulkCreate([
      // ===== NORTH ZONE =====
      { 
        name: 'Delhi Central', 
        code: 'DEL-CEN', 
        type: 'Regional Office', 
        state: 'Delhi', 
        stateType: 'Union Territory', 
        zone: 'NORTH', 
        region: 'North Region', 
        reason: 'MARKET_EXP', 
        city: 'New Delhi', 
        manager: 'Rajesh Kumar', 
        phone: '011-23456789', 
        email: 'delcen@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Delhi East', 
        code: 'DEL-EST', 
        type: 'Branch Office', 
        state: 'Delhi', 
        stateType: 'Union Territory', 
        zone: 'NORTH', 
        region: 'North Region', 
        reason: 'COVERAGE', 
        city: 'Delhi', 
        manager: 'Priya Sharma', 
        phone: '011-23456790', 
        email: 'delest@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Gurgaon', 
        code: 'GRN', 
        type: 'Branch Office', 
        state: 'Haryana', 
        stateType: 'State', 
        zone: 'NORTH', 
        region: 'North Region', 
        reason: 'NEW_MARKET', 
        city: 'Gurgaon', 
        manager: 'Vikram Patel', 
        phone: '0124-234567', 
        email: 'grn@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Jaipur', 
        code: 'JAI', 
        type: 'Regional Office', 
        state: 'Rajasthan', 
        stateType: 'State', 
        zone: 'NORTH', 
        region: 'North Region', 
        reason: 'MARKET_EXP', 
        city: 'Jaipur', 
        manager: 'Deepak Sharma', 
        phone: '0141-234567', 
        email: 'jai@pamsforce.com', 
        isActive: true
      },

      // ===== SOUTH ZONE =====
      { 
        name: 'Bangalore Central', 
        code: 'BLR-CEN', 
        type: 'Regional Office', 
        state: 'Karnataka', 
        stateType: 'State', 
        zone: 'SOUTH', 
        region: 'South Region', 
        reason: 'MARKET_EXP', 
        city: 'Bangalore', 
        manager: 'Suresh Reddy', 
        phone: '080-23456789', 
        email: 'blrcen@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Chennai Central', 
        code: 'CHE-CEN', 
        type: 'Regional Office', 
        state: 'Tamil Nadu', 
        stateType: 'State', 
        zone: 'SOUTH', 
        region: 'South Region', 
        reason: 'MARKET_EXP', 
        city: 'Chennai', 
        manager: 'Murugan', 
        phone: '044-23456789', 
        email: 'checen@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Hyderabad Central', 
        code: 'HYD-CEN', 
        type: 'Regional Office', 
        state: 'Telangana', 
        stateType: 'State', 
        zone: 'SOUTH', 
        region: 'South Region', 
        reason: 'MARKET_EXP', 
        city: 'Hyderabad', 
        manager: 'Rameshwar', 
        phone: '040-23456789', 
        email: 'hydcen@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Kochi', 
        code: 'COK', 
        type: 'Branch Office', 
        state: 'Kerala', 
        stateType: 'State', 
        zone: 'SOUTH', 
        region: 'South Region', 
        reason: 'NEW_MARKET', 
        city: 'Kochi', 
        manager: 'Binu Thomas', 
        phone: '0484-234567', 
        email: 'cok@pamsforce.com', 
        isActive: true
      },

      // ===== EAST ZONE =====
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
      },
      { 
        name: 'Kolkata Central', 
        code: 'KOL-CEN', 
        type: 'Regional Office', 
        state: 'West Bengal', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        reason: 'MARKET_EXP', 
        city: 'Kolkata', 
        manager: 'Subrata Ghosh', 
        phone: '033-23456789', 
        email: 'kolcen@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Patna', 
        code: 'PAT', 
        type: 'Branch Office', 
        state: 'Bihar', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        reason: 'NEW_MARKET', 
        city: 'Patna', 
        manager: 'Ranjit Singh', 
        phone: '0612-234567', 
        email: 'pat@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Ranchi', 
        code: 'RNC', 
        type: 'Branch Office', 
        state: 'Jharkhand', 
        stateType: 'State', 
        zone: 'EAST', 
        region: 'East Region', 
        reason: 'NEW_MARKET', 
        city: 'Ranchi', 
        manager: 'Aman Kumar', 
        phone: '0651-234567', 
        email: 'rnc@pamsforce.com', 
        isActive: true
      },

      // ===== WEST ZONE =====
      { 
        name: 'Mumbai Central', 
        code: 'BOM-CEN', 
        type: 'Regional Office', 
        state: 'Maharashtra', 
        stateType: 'State', 
        zone: 'WEST', 
        region: 'West Region', 
        reason: 'MARKET_EXP', 
        city: 'Mumbai', 
        manager: 'Sanjay Mehta', 
        phone: '022-23456789', 
        email: 'bomcen@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Pune Central', 
        code: 'PNQ-CEN', 
        type: 'Regional Office', 
        state: 'Maharashtra', 
        stateType: 'State', 
        zone: 'WEST', 
        region: 'West Region', 
        reason: 'MARKET_EXP', 
        city: 'Pune', 
        manager: 'Ashwin Joshi', 
        phone: '020-23456789', 
        email: 'pnqcen@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Ahmedabad', 
        code: 'AMD', 
        type: 'Regional Office', 
        state: 'Gujarat', 
        stateType: 'State', 
        zone: 'WEST', 
        region: 'West Region', 
        reason: 'MARKET_EXP', 
        city: 'Ahmedabad', 
        manager: 'Hardik Patel', 
        phone: '079-23456789', 
        email: 'amd@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Surat', 
        code: 'SUR', 
        type: 'Branch Office', 
        state: 'Gujarat', 
        stateType: 'State', 
        zone: 'WEST', 
        region: 'West Region', 
        reason: 'NEW_MARKET', 
        city: 'Surat', 
        manager: 'Vikas Shah', 
        phone: '0261-234567', 
        email: 'sur@pamsforce.com', 
        isActive: true
      },

      // ===== CENTRAL ZONE =====
      { 
        name: 'Indore', 
        code: 'IDR', 
        type: 'Regional Office', 
        state: 'Madhya Pradesh', 
        stateType: 'State', 
        zone: 'CENTRAL', 
        region: 'Central Region', 
        reason: 'MARKET_EXP', 
        city: 'Indore', 
        manager: 'Anil Sharma', 
        phone: '0731-234567', 
        email: 'idr@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Bhopal', 
        code: 'BHO', 
        type: 'Branch Office', 
        state: 'Madhya Pradesh', 
        stateType: 'State', 
        zone: 'CENTRAL', 
        region: 'Central Region', 
        reason: 'NEW_MARKET', 
        city: 'Bhopal', 
        manager: 'Rajesh Chouhan', 
        phone: '0755-234567', 
        email: 'bho@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Nagpur', 
        code: 'NAG', 
        type: 'Branch Office', 
        state: 'Maharashtra', 
        stateType: 'State', 
        zone: 'CENTRAL', 
        region: 'Central Region', 
        reason: 'NEW_MARKET', 
        city: 'Nagpur', 
        manager: 'Prakash Deshmukh', 
        phone: '0712-234567', 
        email: 'nag@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Raipur', 
        code: 'RPR', 
        type: 'Regional Office', 
        state: 'Chhattisgarh', 
        stateType: 'State', 
        zone: 'CENTRAL', 
        region: 'Central Region', 
        reason: 'NEW_MARKET', 
        city: 'Raipur', 
        manager: 'Dilip Sahu', 
        phone: '0771-234567', 
        email: 'rpr@pamsforce.com', 
        isActive: true
      },

      // ===== NE ZONE (North-East) =====
      { 
        name: 'Guwahati', 
        code: 'GAU', 
        type: 'Regional Office', 
        state: 'Assam', 
        stateType: 'State', 
        zone: 'NE', 
        region: 'North-East Region', 
        reason: 'MARKET_EXP', 
        city: 'Guwahati', 
        manager: 'Rituraj Sharma', 
        phone: '0361-234567', 
        email: 'gau@pamsforce.com', 
        isActive: true
      },
      { 
        name: 'Silchar', 
        code: 'SLT', 
        type: 'Branch Office', 
        state: 'Assam', 
        stateType: 'State', 
        zone: 'NE', 
        region: 'North-East Region', 
        reason: 'NEW_MARKET', 
        city: 'Silchar', 
        manager: 'Bhupen Das', 
        phone: '03842-234567', 
        email: 'slt@pamsforce.com', 
        isActive: true
      },

      // ===== HEAD OFFICE =====
      { 
        name: 'Mumbai Head Office', 
        code: 'BOM-HO', 
        type: 'Head Office', 
        state: 'Maharashtra', 
        stateType: 'State', 
        zone: 'WEST', 
        region: 'West Region', 
        reason: 'HQ', 
        city: 'Mumbai', 
        manager: 'CEO', 
        phone: '022-23456000', 
        email: 'ho@pamsforce.com', 
        isActive: true
      }
    ]);
    console.log(`✅ Created ${headquarters.length} headquarters (HQ Master - Multi-Zone)`);

    // Create Territories (Multi-Zone)
    console.log('🗺️ Creating territories (Multi-Zone)...');
    
    // Create a map of HQ codes to their IDs for easy reference
    const hqMap = {};
    headquarters.forEach(hq => {
      hqMap[hq.code] = hq.id;
    });

    const territories = await Territory.bulkCreate([
      // ===== NORTH ZONE - Delhi HQ Territories =====
      { name: 'Delhi Central Zone A', code: 'DEL-CEN-A', hq_id: hqMap['DEL-CEN'], state: 'Delhi', region: 'North Region', zone: 'NORTH', district: 'New Delhi', isActive: true },
      { name: 'Delhi Central Zone B', code: 'DEL-CEN-B', hq_id: hqMap['DEL-CEN'], state: 'Delhi', region: 'North Region', zone: 'NORTH', district: 'New Delhi', isActive: true },
      { name: 'Delhi East Zone A', code: 'DEL-EST-A', hq_id: hqMap['DEL-EST'], state: 'Delhi', region: 'North Region', zone: 'NORTH', district: 'East Delhi', isActive: true },
      { name: 'Delhi East Zone B', code: 'DEL-EST-B', hq_id: hqMap['DEL-EST'], state: 'Delhi', region: 'North Region', zone: 'NORTH', district: 'East Delhi', isActive: true },
      { name: 'Delhi West Zone A', code: 'DEL-WST-A', hq_id: hqMap['DEL-WST'], state: 'Delhi', region: 'North Region', zone: 'NORTH', district: 'West Delhi', isActive: true },
      { name: 'Gurgaon South', code: 'GRN-SOU', hq_id: hqMap['GRN'], state: 'Haryana', region: 'North Region', zone: 'NORTH', district: 'Gurgaon', isActive: true },
      { name: 'Gurgaon North', code: 'GRN-NOR', hq_id: hqMap['GRN'], state: 'Haryana', region: 'North Region', zone: 'NORTH', district: 'Gurgaon', isActive: true },
      { name: 'Chandigarh City', code: 'CHD-CIT', hq_id: hqMap['CHD'], state: 'Chandigarh', region: 'North Region', zone: 'NORTH', district: 'Chandigarh', isActive: true },
      { name: 'Jaipur Central', code: 'JAI-CEN', hq_id: hqMap['JAI'], state: 'Rajasthan', region: 'North Region', zone: 'NORTH', district: 'Jaipur', isActive: true },
      { name: 'Jaipur North', code: 'JAI-NOR', hq_id: hqMap['JAI'], state: 'Rajasthan', region: 'North Region', zone: 'NORTH', district: 'Jaipur', isActive: true },
      { name: 'Lucknow Central', code: 'LKW-CEN', hq_id: hqMap['LKW'], state: 'Uttar Pradesh', region: 'North Region', zone: 'NORTH', district: 'Lucknow', isActive: true },
      { name: 'Lucknow East', code: 'LKW-EST', hq_id: hqMap['LKW'], state: 'Uttar Pradesh', region: 'North Region', zone: 'NORTH', district: 'Lucknow', isActive: true },
      { name: 'Dehradun City', code: 'DDN-CIT', hq_id: hqMap['DDN'], state: 'Uttarakhand', region: 'North Region', zone: 'NORTH', district: 'Dehradun', isActive: true },

      // ===== SOUTH ZONE - Bangalore HQ Territories =====
      { name: 'Bangalore Central Zone A', code: 'BLR-CEN-A', hq_id: hqMap['BLR-CEN'], state: 'Karnataka', region: 'South Region', zone: 'SOUTH', district: 'Bangalore', isActive: true },
      { name: 'Bangalore Central Zone B', code: 'BLR-CEN-B', hq_id: hqMap['BLR-CEN'], state: 'Karnataka', region: 'South Region', zone: 'SOUTH', district: 'Bangalore', isActive: true },
      { name: 'Bangalore East Zone A', code: 'BLR-EST-A', hq_id: hqMap['BLR-EST'], state: 'Karnataka', region: 'South Region', zone: 'SOUTH', district: 'Bangalore', isActive: true },
      { name: 'Chennai Central Zone A', code: 'CHE-CEN-A', hq_id: hqMap['CHE-CEN'], state: 'Tamil Nadu', region: 'South Region', zone: 'SOUTH', district: 'Chennai', isActive: true },
      { name: 'Chennai Central Zone B', code: 'CHE-CEN-B', hq_id: hqMap['CHE-CEN'], state: 'Tamil Nadu', region: 'South Region', zone: 'SOUTH', district: 'Chennai', isActive: true },
      { name: 'Chennai South Zone A', code: 'CHE-SOU-A', hq_id: hqMap['CHE-SOU'], state: 'Tamil Nadu', region: 'South Region', zone: 'SOUTH', district: 'Chennai', isActive: true },
      { name: 'Hyderabad Central Zone A', code: 'HYD-CEN-A', hq_id: hqMap['HYD-CEN'], state: 'Telangana', region: 'South Region', zone: 'SOUTH', district: 'Hyderabad', isActive: true },
      { name: 'Hyderabad Central Zone B', code: 'HYD-CEN-B', hq_id: hqMap['HYD-CEN'], state: 'Telangana', region: 'South Region', zone: 'SOUTH', district: 'Hyderabad', isActive: true },
      { name: 'Hyderabad East Zone A', code: 'HYD-EST-A', hq_id: hqMap['HYD-EST'], state: 'Telangana', region: 'South Region', zone: 'SOUTH', district: 'Hyderabad', isActive: true },
      { name: 'Kochi City', code: 'COK-CIT', hq_id: hqMap['COK'], state: 'Kerala', region: 'South Region', zone: 'SOUTH', district: 'Ernakulam', isActive: true },
      { name: 'Vizag City', code: 'VTZ-CIT', hq_id: hqMap['VTZ'], state: 'Andhra Pradesh', region: 'South Region', zone: 'SOUTH', district: 'Visakhapatnam', isActive: true },
      { name: 'Vijayawada City', code: 'VJA-CIT', hq_id: hqMap['VJA'], state: 'Andhra Pradesh', region: 'South Region', zone: 'SOUTH', district: 'Krishna', isActive: true },
      { name: 'Coimbatore City', code: 'CBE-CIT', hq_id: hqMap['CBE'], state: 'Tamil Nadu', region: 'South Region', zone: 'SOUTH', district: 'Coimbatore', isActive: true },

      // ===== EAST ZONE - Bhubaneswar HQ Territories =====
      { name: 'Bhubaneswar Central', code: 'BBSR-CEN', hq_id: hqMap['BBSR'], state: 'Odisha', region: 'East Region', zone: 'EAST', district: 'Khordha', isActive: true },
      { name: 'Bhubaneswar East', code: 'BBSR-EST', hq_id: hqMap['BBSR'], state: 'Odisha', region: 'East Region', zone: 'EAST', district: 'Khordha', isActive: true },
      { name: 'Bhubaneswar West', code: 'BBSR-WST', hq_id: hqMap['BBSR'], state: 'Odisha', region: 'East Region', zone: 'EAST', district: 'Khordha', isActive: true },
      { name: 'Cuttack City', code: 'CTC-CIT', hq_id: hqMap['CTC'], state: 'Odisha', region: 'East Region', zone: 'EAST', district: 'Cuttack', isActive: true },
      { name: 'Cuttack North', code: 'CTC-NOR', hq_id: hqMap['CTC'], state: 'Odisha', region: 'East Region', zone: 'EAST', district: 'Cuttack', isActive: true },
      { name: 'Kolkata Central Zone A', code: 'KOL-CEN-A', hq_id: hqMap['KOL-CEN'], state: 'West Bengal', region: 'East Region', zone: 'EAST', district: 'Kolkata', isActive: true },
      { name: 'Kolkata Central Zone B', code: 'KOL-CEN-B', hq_id: hqMap['KOL-CEN'], state: 'West Bengal', region: 'East Region', zone: 'EAST', district: 'Kolkata', isActive: true },
      { name: 'Kolkata East Zone A', code: 'KOL-EST-A', hq_id: hqMap['KOL-EST'], state: 'West Bengal', region: 'East Region', zone: 'EAST', district: 'Kolkata', isActive: true },
      { name: 'Kolkata West Zone A', code: 'KOL-WST-A', hq_id: hqMap['KOL-WST'], state: 'West Bengal', region: 'East Region', zone: 'EAST', district: 'Kolkata', isActive: true },
      { name: 'Patna City', code: 'PAT-CIT', hq_id: hqMap['PAT'], state: 'Bihar', region: 'East Region', zone: 'EAST', district: 'Patna', isActive: true },
      { name: 'Ranchi City', code: 'RNC-CIT', hq_id: hqMap['RNC'], state: 'Jharkhand', region: 'East Region', zone: 'EAST', district: 'Ranchi', isActive: true },
      { name: 'Guwahati City', code: 'GAU-CIT', hq_id: hqMap['GAU'], state: 'Assam', region: 'North-East Region', zone: 'NE', district: 'Kamrup', isActive: true },
      { name: 'Silchar City', code: 'SLT-CIT', hq_id: hqMap['SLT'], state: 'Assam', region: 'North-East Region', zone: 'NE', district: 'Silchar', isActive: true },

      // ===== WEST ZONE - Mumbai HQ Territories =====
      { name: 'Mumbai Central Zone A', code: 'BOM-CEN-A', hq_id: hqMap['BOM-CEN'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Mumbai', isActive: true },
      { name: 'Mumbai Central Zone B', code: 'BOM-CEN-B', hq_id: hqMap['BOM-CEN'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Mumbai', isActive: true },
      { name: 'Mumbai West Zone A', code: 'BOM-WST-A', hq_id: hqMap['BOM-WST'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Mumbai', isActive: true },
      { name: 'Mumbai West Zone B', code: 'BOM-WST-B', hq_id: hqMap['BOM-WST'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Mumbai', isActive: true },
      { name: 'Mumbai East Zone A', code: 'BOM-EST-A', hq_id: hqMap['BOM-EST'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Mumbai', isActive: true },
      { name: 'Pune Central Zone A', code: 'PNQ-CEN-A', hq_id: hqMap['PNQ-CEN'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Pune', isActive: true },
      { name: 'Pune Central Zone B', code: 'PNQ-CEN-B', hq_id: hqMap['PNQ-CEN'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Pune', isActive: true },
      { name: 'Pune West Zone A', code: 'PNQ-WST-A', hq_id: hqMap['PNQ-WST'], state: 'Maharashtra', region: 'West Region', zone: 'WEST', district: 'Pune', isActive: true },
      { name: 'Ahmedabad Central', code: 'AMD-CEN', hq_id: hqMap['AMD'], state: 'Gujarat', region: 'West Region', zone: 'WEST', district: 'Ahmedabad', isActive: true },
      { name: 'Ahmedabad East', code: 'AMD-EST', hq_id: hqMap['AMD'], state: 'Gujarat', region: 'West Region', zone: 'WEST', district: 'Ahmedabad', isActive: true },
      { name: 'Surat City', code: 'SUR-CIT', hq_id: hqMap['SUR'], state: 'Gujarat', region: 'West Region', zone: 'WEST', district: 'Surat', isActive: true },
      { name: 'Vadodara City', code: 'BDQ-CIT', hq_id: hqMap['BDQ'], state: 'Gujarat', region: 'West Region', zone: 'WEST', district: 'Vadodara', isActive: true },
      { name: 'Goa North', code: 'GOA-NOR', hq_id: hqMap['GOA'], state: 'Goa', region: 'West Region', zone: 'WEST', district: 'North Goa', isActive: true },
      { name: 'Goa South', code: 'GOA-SOU', hq_id: hqMap['GOA'], state: 'Goa', region: 'West Region', zone: 'WEST', district: 'South Goa', isActive: true },

      // ===== CENTRAL ZONE - Indore HQ Territories =====
      { name: 'Indore Central', code: 'IDR-CEN', hq_id: hqMap['IDR'], state: 'Madhya Pradesh', region: 'Central Region', zone: 'CENTRAL', district: 'Indore', isActive: true },
      { name: 'Indore East', code: 'IDR-EST', hq_id: hqMap['IDR'], state: 'Madhya Pradesh', region: 'Central Region', zone: 'CENTRAL', district: 'Indore', isActive: true },
      { name: 'Indore West', code: 'IDR-WST', hq_id: hqMap['IDR'], state: 'Madhya Pradesh', region: 'Central Region', zone: 'CENTRAL', district: 'Indore', isActive: true },
      { name: 'Bhopal City', code: 'BHO-CIT', hq_id: hqMap['BHO'], state: 'Madhya Pradesh', region: 'Central Region', zone: 'CENTRAL', district: 'Bhopal', isActive: true },
      { name: 'Jabalpur City', code: 'JBL-CIT', hq_id: hqMap['JBL'], state: 'Madhya Pradesh', region: 'Central Region', zone: 'CENTRAL', district: 'Jabalpur', isActive: true },
      { name: 'Nagpur City', code: 'NAG-CIT', hq_id: hqMap['NAG'], state: 'Maharashtra', region: 'Central Region', zone: 'CENTRAL', district: 'Nagpur', isActive: true },
      { name: 'Raipur City', code: 'RPR-CIT', hq_id: hqMap['RPR'], state: 'Chhattisgarh', region: 'Central Region', zone: 'CENTRAL', district: 'Raipur', isActive: true }
    ]);
    console.log(`✅ Created ${territories.length} territories (Multi-Zone)`);

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

    // ==================== INPUT TYPES ====================
    console.log('📋 Creating input types...');
    const inputTypes = await InputType.bulkCreate([
      { type_name: 'Promotional', short_name: 'PROMO', description: 'Visual promotional materials used during doctor calls', status: 'active', created_by: adminUser.id },
      { type_name: 'Sample', short_name: 'SAMP', description: 'Product samples for doctors', status: 'active', created_by: adminUser.id },
      { type_name: 'Gift', short_name: 'GIFT', description: 'Non-product items given to doctors', status: 'active', created_by: adminUser.id },
      { type_name: 'Digital', short_name: 'DIGI', description: 'Digital content like videos, presentations', status: 'active', created_by: adminUser.id }
    ], { validate: true });
    console.log(`✅ Created ${inputTypes.length} input types`);

    // ==================== INPUT CLASSES ====================
    console.log('🏷️ Creating input classes...');
    const inputClasses = await InputClass.bulkCreate([
      { class_name: 'Visual Aid', short_name: 'VA', description: 'Visual aids used for detailing during calls', status: 'active', created_by: adminUser.id },
      { class_name: 'Leave Behind', short_name: 'LBL', description: 'Literature left with doctors', status: 'active', created_by: adminUser.id },
      { class_name: 'Reminder', short_name: 'RC', description: 'Reminder cards for products', status: 'active', created_by: adminUser.id },
      { class_name: 'Brochure', short_name: 'BR', description: 'Product brochures', status: 'active', created_by: adminUser.id },
      { class_name: 'Gift Item', short_name: 'GI', description: 'Gift items for doctors', status: 'active', created_by: adminUser.id }
    ], { validate: true });
    console.log(`✅ Created ${inputClasses.length} input classes`);

    // ==================== INPUT MASTER ====================
    console.log('📄 Creating input master (promotional materials)...');
    const inputMaster = await InputMaster.bulkCreate([
      { input_name: 'Visual Aid', short_name: 'VA', input_type_id: inputTypes[0].id, input_class_id: inputClasses[0].id, description: 'Visual Aid for detailing (constant - doesn\'t reduce with calls)', status: 'active', created_by: adminUser.id },
      { input_name: 'Leave Behind Literature', short_name: 'LBL', input_type_id: inputTypes[0].id, input_class_id: inputClasses[1].id, description: 'Literature left with doctors after call', status: 'active', created_by: adminUser.id },
      { input_name: 'Reminder Card', short_name: 'RC', input_type_id: inputTypes[0].id, input_class_id: inputClasses[2].id, description: 'Product reminder cards', status: 'active', created_by: adminUser.id },
      { input_name: 'Product Brochure', short_name: 'BR', input_type_id: inputTypes[0].id, input_class_id: inputClasses[3].id, description: 'Detailed product brochures', status: 'active', created_by: adminUser.id },
      { input_name: 'Gift Item', short_name: 'GIFT', input_type_id: inputTypes[2].id, input_class_id: inputClasses[4].id, description: 'Gift items for doctors', status: 'active', created_by: adminUser.id },
      { input_name: 'Pen', short_name: 'PEN', input_type_id: inputTypes[2].id, input_class_id: inputClasses[4].id, description: 'Branded pens', status: 'active', created_by: adminUser.id },
      { input_name: 'Notebook', short_name: 'NB', input_type_id: inputTypes[2].id, input_class_id: inputClasses[4].id, description: 'Branded notebooks', status: 'active', created_by: adminUser.id },
      { input_name: 'Product Video', short_name: 'VID', input_type_id: inputTypes[3].id, input_class_id: null, description: 'Digital video content', status: 'active', created_by: adminUser.id }
    ], { validate: true });
    console.log(`✅ Created ${inputMaster.length} inputs`);

    // ==================== SAMPLE MASTER ====================
    // First need to get products for sample creation
    const existingProducts = await Product.findAll({ where: { isActive: true } });
    const existingPackSizes = await PackSize.findAll({ where: { status: 'active' } });

    console.log('🎁 Creating sample master...');
    // Note: Sample master will be created after products are created
    // This is a placeholder to ensure table exists
    console.log('⚠️  Sample master will be created after products');

    // Create Products
    console.log('🛍️ Creating products...');
    const products = await Product.bulkCreate([
      // Primary Care Products
      { 
        unique_id: '00001',
        name: 'Paracetamol 500', 
        short_name: 'PCM500', 
        code: 'PROD-00001',
        division_id: divisions[0].id, 
        brand_group_id: brandGroups[0].id,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[0].id, 
        strength_id: strengths[6].id, 
        pts: 40.00, ptr: 42.00, mrp: 45.00,
        launch_date: '2024-01-01',
        status: 'active'
      },
      { 
        unique_id: '00002',
        name: 'Paracetamol 650', 
        short_name: 'PCM650', 
        code: 'PROD-00002',
        division_id: divisions[0].id, 
        brand_group_id: brandGroups[0].id,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[0].id, 
        strength_id: strengths[6].id, 
        pts: 45.00, ptr: 48.00, mrp: 50.00,
        launch_date: '2024-01-15',
        status: 'active'
      },
      { 
        unique_id: '00003',
        name: 'Combiflam 400', 
        short_name: 'CBF400', 
        code: 'PROD-00003',
        division_id: divisions[0].id, 
        brand_group_id: brandGroups[1].id,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[0].id, 
        strength_id: strengths[5].id, 
        pts: 38.00, ptr: 40.00, mrp: 42.00,
        launch_date: '2024-02-01',
        status: 'active'
      },
      { 
        unique_id: '00004',
        name: 'Azithromycin 250', 
        short_name: 'AZI250', 
        code: 'PROD-00004',
        division_id: divisions[0].id, 
        brand_group_id: brandGroups[2].id,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[1].id, 
        strength_id: strengths[4].id, 
        pts: 85.00, ptr: 90.00, mrp: 95.00,
        launch_date: '2024-02-15',
        status: 'active'
      },
      // Cardiac Care Products
      { 
        unique_id: '00045',
        name: 'CardioPlus 5', 
        short_name: 'CP5', 
        code: 'PROD-00045',
        division_id: divisions[1].id, 
        brand_group_id: null,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[1].id, 
        strength_id: strengths[0].id, 
        pts: 75.00, ptr: 80.00, mrp: 85.00,
        launch_date: '2025-03-15',
        status: 'active'
      },
      { 
        unique_id: '00046',
        name: 'CardioPlus 10', 
        short_name: 'CP10', 
        code: 'PROD-00046',
        division_id: divisions[1].id, 
        brand_group_id: null,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[1].id, 
        strength_id: strengths[1].id, 
        pts: 80.00, ptr: 85.00, mrp: 90.00,
        launch_date: '2025-03-16',
        status: 'active'
      },
      { 
        unique_id: '00047',
        name: 'CardioGuard Plus', 
        short_name: 'CGP', 
        code: 'PROD-00047',
        division_id: divisions[1].id, 
        brand_group_id: null,
        category_id: productCategories[1].id, 
        pack_size_id: packSizes[2].id, 
        strength_id: strengths[2].id, 
        pts: 95.00, ptr: 100.00, mrp: 110.00,
        launch_date: '2025-04-01',
        status: 'active'
      },
      // Gastro Products
      { 
        unique_id: '00089',
        name: 'Metrogyl Plus', 
        short_name: 'MTR', 
        code: 'PROD-00089',
        division_id: divisions[2].id, 
        brand_group_id: brandGroups[3].id,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[2].id, 
        strength_id: strengths[4].id, 
        pts: 65.00, ptr: 70.00, mrp: 75.00,
        launch_date: '2025-05-01',
        status: 'active'
      },
      { 
        unique_id: '00090',
        name: 'Gastro Relief Gel', 
        short_name: 'GRG', 
        code: 'PROD-00090',
        division_id: divisions[2].id, 
        brand_group_id: null,
        category_id: productCategories[4].id, 
        pack_size_id: packSizes[3].id, 
        strength_id: null, 
        pts: 55.00, ptr: 60.00, mrp: 65.00,
        launch_date: '2025-05-15',
        status: 'active'
      },
      // Neuro Products
      { 
        unique_id: '00112',
        name: 'Neurobion Complex', 
        short_name: 'NBC', 
        code: 'PROD-00112',
        division_id: divisions[3].id, 
        brand_group_id: brandGroups[4].id,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[0].id, 
        strength_id: null, 
        pts: 72.00, ptr: 75.00, mrp: 80.00,
        launch_date: '2025-06-01',
        status: 'active'
      },
      { 
        unique_id: '00113',
        name: 'Neurobion Forte', 
        short_name: 'NBF', 
        code: 'PROD-00113',
        division_id: divisions[3].id, 
        brand_group_id: brandGroups[4].id,
        category_id: productCategories[2].id, 
        pack_size_id: packSizes[1].id, 
        strength_id: null, 
        pts: 85.00, ptr: 90.00, mrp: 100.00,
        launch_date: '2025-06-15',
        status: 'active'
      },
      // Ortho Products
      { 
        unique_id: '00145',
        name: 'OrthoCare Gel', 
        short_name: 'OCG', 
        code: 'PROD-00145',
        division_id: divisions[4].id, 
        brand_group_id: null,
        category_id: productCategories[4].id, 
        pack_size_id: packSizes[3].id, 
        strength_id: null, 
        pts: 105.00, ptr: 110.00, mrp: 120.00,
        launch_date: '2025-06-22',
        status: 'active'
      },
      { 
        unique_id: '00146',
        name: 'OrthoCare Plus', 
        short_name: 'OCP', 
        code: 'PROD-00146',
        division_id: divisions[4].id, 
        brand_group_id: null,
        category_id: productCategories[0].id, 
        pack_size_id: packSizes[0].id, 
        strength_id: strengths[3].id, 
        pts: 92.00, ptr: 97.00, mrp: 105.00,
        launch_date: '2025-07-01',
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

    // ==================== SAMPLE MASTER (after products) ====================
    console.log('🎁 Creating sample master with product references...');
    const sampleMaster = await SampleMaster.bulkCreate([
      { product_id: products[0]?.id, pack_size_id: packSizes[0]?.id, sample_name: 'Paracetamol 500 Sample', sample_qty: 2, unit: 'Tab', max_per_call: 5, status: 'active', created_by: adminUser.id },
      { product_id: products[1]?.id, pack_size_id: packSizes[0]?.id, sample_name: 'Paracetamol 650 Sample', sample_qty: 2, unit: 'Tab', max_per_call: 5, status: 'active', created_by: adminUser.id },
      { product_id: products[4]?.id, pack_size_id: packSizes[1]?.id, sample_name: 'CardioPlus 5 Sample', sample_qty: 5, unit: 'Tab', max_per_call: 3, status: 'active', created_by: adminUser.id },
      { product_id: products[5]?.id, pack_size_id: packSizes[1]?.id, sample_name: 'CardioPlus 10 Sample', sample_qty: 5, unit: 'Tab', max_per_call: 3, status: 'active', created_by: adminUser.id },
      { product_id: products[6]?.id, pack_size_id: packSizes[2]?.id, sample_name: 'CardioGuard Plus Sample', sample_qty: 10, unit: 'Cap', max_per_call: 2, status: 'active', created_by: adminUser.id }
    ].filter(s => s.product_id !== undefined), { validate: true });
    console.log(`✅ Created ${sampleMaster.length} samples`);

    // Create comprehensive doctors across all zones
    console.log('👨‍⚕️ Creating comprehensive doctors (Multi-Zone)...');
    const doctors = await Doctor.bulkCreate([
      // ===== NORTH ZONE DOCTORS =====
      { firstName: 'Dr. Rajesh', lastName: 'Kumar', specialty_id: doctorSpecialties[1].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Cardiologist', location: 'New Delhi', address: 'Delhi Heart Center, New Delhi', phone: '+91-9876543210', email: 'rajesh.kumar@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Priya', lastName: 'Sharma', specialty_id: doctorSpecialties[6].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Neurologist', location: 'New Delhi', address: 'Neuro Institute, Delhi', phone: '+91-9876543211', email: 'priya.sharma@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Amit', lastName: 'Singh', specialty_id: doctorSpecialties[2].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[2].qualification_id, specialty: 'Orthopedic', location: 'Gurgaon', address: 'Bone & Joint Hospital, Gurgaon', phone: '+91-9876543212', email: 'amit.singh@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Vikram', lastName: 'Patel', specialty_id: doctorSpecialties[0].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[0].qualification_id, specialty: 'General Medicine', location: 'Jaipur', address: 'Jaipur Medical Center, Jaipur', phone: '+91-9876543213', email: 'vikram.patel@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Sanjeev', lastName: 'Reddy', specialty_id: doctorSpecialties[3].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[0].qualification_id, specialty: 'Pediatrics', location: 'Lucknow', address: 'Child Care Clinic, Lucknow', phone: '+91-9876543214', email: 'sanjeev.reddy@email.com', isActive: true, approval_status: 'approved' },
      
      // ===== SOUTH ZONE DOCTORS =====
      { firstName: 'Dr. Suresh', lastName: 'Reddy', specialty_id: doctorSpecialties[1].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Cardiologist', location: 'Bangalore', address: 'Cardiac Care Center, Bangalore', phone: '+91-9876543215', email: 'suresh.reddy@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Lakshmi', lastName: 'Narayan', specialty_id: doctorSpecialties[4].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Gynecology', location: 'Bangalore', address: 'Women Health Center, Bangalore', phone: '+91-9876543216', email: 'lakshmi.narayan@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Murugan', lastName: 'Iyer', specialty_id: doctorSpecialties[6].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Neurologist', location: 'Chennai', address: 'Neuro Institute, Chennai', phone: '+91-9876543217', email: 'murugan.iyer@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Rameshwar', lastName: 'Singh', specialty_id: doctorSpecialties[1].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Cardiologist', location: 'Hyderabad', address: 'Heart & Lung Center, Hyderabad', phone: '+91-9876543218', email: 'rameshwar.singh@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Swarna', lastName: 'Reddy', specialty_id: doctorSpecialties[2].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[2].qualification_id, specialty: 'Orthopedic', location: 'Hyderabad', address: 'Ortho Hospital, Hyderabad', phone: '+91-9876543219', email: 'swarna.reddy@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Binu', lastName: 'Thomas', specialty_id: doctorSpecialties[7].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[0].qualification_id, specialty: 'Gastroenterology', location: 'Kochi', address: 'Gastro Clinic, Kochi', phone: '+91-9876543220', email: 'binu.thomas@email.com', isActive: true, approval_status: 'approved' },
      
      // ===== EAST ZONE DOCTORS =====
      { firstName: 'Dr. Subrat', lastName: 'Mohanty', specialty_id: doctorSpecialties[1].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Cardiologist', location: 'Bhubaneswar, Odisha', address: 'Cardiac Care Center, Bhubaneswar', phone: '+91-9876543221', email: 'subrat.mohanty@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Ananya', lastName: 'Das', specialty_id: doctorSpecialties[6].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Neurologist', location: 'Cuttack, Odisha', address: 'Neuro Institute, Cuttack', phone: '+91-9876543222', email: 'ananya.das@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Ramesh', lastName: 'Behera', specialty_id: doctorSpecialties[2].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[2].qualification_id, specialty: 'Orthopedic', location: 'Sambalpur, Odisha', address: 'Bone & Joint Hospital, Sambalpur', phone: '+91-9876543223', email: 'ramesh.behera@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Subrata', lastName: 'Ghosh', specialty_id: doctorSpecialties[0].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'General Medicine', location: 'Kolkata', address: 'Kolkata Medical Center, Kolkata', phone: '+91-9876543224', email: 'subrata.ghosh@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Ranjit', lastName: 'Singh', specialty_id: doctorSpecialties[3].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[0].qualification_id, specialty: 'Pediatrics', location: 'Patna', address: 'Child Care Hospital, Patna', phone: '+91-9876543225', email: 'ranjit.singh@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Rituraj', lastName: 'Sharma', specialty_id: doctorSpecialties[6].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Neurologist', location: 'Guwahati', address: 'Neuro Institute, Guwahati', phone: '+91-9876543226', email: 'rituraj.sharma@email.com', isActive: true, approval_status: 'approved' },
      
      // ===== WEST ZONE DOCTORS =====
      { firstName: 'Dr. Sanjay', lastName: 'Mehta', specialty_id: doctorSpecialties[1].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Cardiologist', location: 'Mumbai', address: 'Heart Institute, Mumbai', phone: '+91-9876543227', email: 'sanjay.mehta@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Rahul', lastName: 'Shah', specialty_id: doctorSpecialties[2].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[2].qualification_id, specialty: 'Orthopedic', location: 'Mumbai', address: 'Ortho Center, Mumbai', phone: '+91-9876543228', email: 'rahul.shah@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Ashwin', lastName: 'Joshi', specialty_id: doctorSpecialties[7].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[0].qualification_id, specialty: 'Gastroenterology', location: 'Pune', address: 'Gastro Center, Pune', phone: '+91-9876543229', email: 'ashwin.joshi@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Hardik', lastName: 'Patel', specialty_id: doctorSpecialties[0].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'General Medicine', location: 'Ahmedabad', address: 'Medical Center, Ahmedabad', phone: '+91-9876543230', email: 'hardik.patel@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Vikas', lastName: 'Shah', specialty_id: doctorSpecialties[5].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[0].qualification_id, specialty: 'Dermatology', location: 'Surat', address: 'Skin Clinic, Surat', phone: '+91-9876543231', email: 'vikas.shah@email.com', isActive: true, approval_status: 'approved' },
      
      // ===== CENTRAL ZONE DOCTORS =====
      { firstName: 'Dr. Anil', lastName: 'Sharma', specialty_id: doctorSpecialties[1].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Cardiologist', location: 'Indore', address: 'Cardiac Center, Indore', phone: '+91-9876543232', email: 'anil.sharma@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Rajesh', lastName: 'Chouhan', specialty_id: doctorSpecialties[6].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'Neurologist', location: 'Bhopal', address: 'Neuro Institute, Bhopal', phone: '+91-9876543233', email: 'rajesh.chouhan@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Prakash', lastName: 'Deshmukh', specialty_id: doctorSpecialties[2].specialty_id, category_id: doctorCategories[1].category_id, qualification_id: doctorQualifications[2].qualification_id, specialty: 'Orthopedic', location: 'Nagpur', address: 'Ortho Hospital, Nagpur', phone: '+91-9876543234', email: 'prakash.deshmukh@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Dr. Dilip', lastName: 'Sahu', specialty_id: doctorSpecialties[0].specialty_id, category_id: doctorCategories[0].category_id, qualification_id: doctorQualifications[1].qualification_id, specialty: 'General Medicine', location: 'Raipur', address: 'Medical Center, Raipur', phone: '+91-9876543235', email: 'dilip.sahu@email.com', isActive: true, approval_status: 'approved' },

      // ===== SAMPARK DOCTORS (Strategic Contact/Sampler Doctors) =====
      { firstName: 'Mr. Vishal', lastName: 'Kumar', specialty_id: null, category_id: doctorCategories[2].category_id, qualification_id: null, specialty: 'Sampark Doctor', location: 'Delhi', address: 'Medical Distributor, Delhi', phone: '+91-9876543236', email: 'vishal.sampark@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Mr. Arun', lastName: 'Patel', specialty_id: null, category_id: doctorCategories[2].category_id, qualification_id: null, specialty: 'Sampark Doctor', location: 'Mumbai', address: 'Medical Distributor, Mumbai', phone: '+91-9876543237', email: 'arun.sampark@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Mr. Srinivas', lastName: 'Reddy', specialty_id: null, category_id: doctorCategories[2].category_id, qualification_id: null, specialty: 'Sampark Doctor', location: 'Bangalore', address: 'Medical Distributor, Bangalore', phone: '+91-9876543238', email: 'srinivas.sampark@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Mr. Prafulla', lastName: 'Das', specialty_id: null, category_id: doctorCategories[2].category_id, qualification_id: null, specialty: 'Sampark Doctor', location: 'Bhubaneswar', address: 'Medical Distributor, Bhubaneswar', phone: '+91-9876543239', email: 'prafulla.sampark@email.com', isActive: true, approval_status: 'approved' },
      { firstName: 'Mr. Karunamoorthy', lastName: 'Iyer', specialty_id: null, category_id: doctorCategories[2].category_id, qualification_id: null, specialty: 'Sampark Doctor', location: 'Coimbatore', address: 'Medical Distributor, Coimbatore', phone: '+91-9876543240', email: 'karunamoorthy.sampark@email.com', isActive: true, approval_status: 'approved' }
    ]);
    console.log(`✅ Created ${doctors.length} doctors (including Sampark Doctors)`);

    // Create sample chemists for Odisha
    console.log('💊 Creating chemists (Odisha only)...');
    const chemists = await Chemist.bulkCreate([
      { name: 'Kumar Medical Store', location: 'Bhubaneswar, Odisha', address: 'Sachivalaya Marg, Bhubaneswar', phone: '+91-8765432101', email: 'manoj.kumar@email.com', isActive: true, approval_status: 'approved' },
      { name: 'Sharma Pharma', location: 'Cuttack, Odisha', address: 'Badambadi, Cuttack', phone: '+91-8765432102', email: 'deepa.sharma@email.com', isActive: true, approval_status: 'approved' }
    ]);
    console.log('✅ Created 2 chemists');

    console.log('\n✅✅✅ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✅✅✅\n');
    console.log('📊 COMPREHENSIVE SEEDING SUMMARY - MULTI-ZONE IMPLEMENTATION:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  👤 Users: ${fieldReps.length + 1} (1 admin + 5 field representatives)`);
    console.log(`  👨‍⚕️ Doctors: ${doctors.length} (${doctors.filter(d => d.specialty !== 'Sampark Doctor').length} specialist doctors + 5 Sampark Doctors)`);
    console.log(`  💊 Chemists: ${chemists.length}`);
    console.log(`  🏢 Headquarters: ${headquarters.length} (Multi-Zone Implementation)`);
    console.log(`     ├─ NORTH Zone: 8 HQs (Delhi, Gurgaon, Chandigarh, Jaipur, Lucknow, Dehradun)`);
    console.log(`     ├─ SOUTH Zone: 10 HQs (Bangalore, Chennai, Hyderabad, Kochi, Vizag, Vijayawada, Coimbatore)`);
    console.log(`     ├─ EAST Zone: 9 HQs (Bhubaneswar, Cuttack, Kolkata, Patna, Ranchi, Guwahati, Silchar)`);
    console.log(`     ├─ WEST Zone: 9 HQs (Mumbai, Pune, Ahmedabad, Surat, Vadodara, Goa)`);
    console.log(`     ├─ CENTRAL Zone: 5 HQs (Indore, Bhopal, Jabalpur, Nagpur, Raipur)`);
    console.log(`     └─ HEAD OFFICE: 1 (Mumbai)`);
    console.log(`  🗺️ Territories: ${territories.length} (Multi-Zone Territory/Patch Master)`);
    console.log(`     ├─ NORTH Zone Territories: 14`);
    console.log(`     ├─ SOUTH Zone Territories: 12`);
    console.log(`     ├─ EAST Zone Territories: 14`);
    console.log(`     ├─ WEST Zone Territories: 15`);
    console.log(`     └─ CENTRAL Zone Territories: 7`);
    console.log('\n  📚 Master Data Categories:');
    console.log(`  🏷️ Doctor Classes: ${doctorClasses.length} (including Sampark Doctor SAMP)`);
    console.log(`  📋 Doctor Categories: ${doctorCategories.length}`);
    console.log(`  🩺 Doctor Specialties: ${doctorSpecialties.length}`);
    console.log(`  🎓 Doctor Qualifications: ${doctorQualifications.length}`);
    console.log(`  🏢 Divisions: ${divisions.length}`);
    console.log(`  📦 Product Categories: ${productCategories.length}`);
    console.log(`  📏 Pack Sizes: ${packSizes.length}`);
    console.log(`  🏆 Brand Groups: ${brandGroups.length}`);
    console.log(`  💪 Strengths: ${strengths.length}`);
    console.log(`  🛍️ Products: ${products.length}`);
    console.log('\n  🎯 KEY FEATURES IMPLEMENTED:');
    console.log(`     ✅ Multi-Zone HQ Master with 42 total HQ locations`);
    console.log(`     ✅ Territory/Patch Master with proper HQ linkages`);
    console.log(`     ✅ Comprehensive Doctor Master across all zones`);
    console.log(`     ✅ Sampark Doctor class for strategic market contacts`);
    console.log(`     ✅ Complete Product Master with 13 products`);
    console.log(`     ✅ Input Type Master with 4 types`);
    console.log(`     ✅ Input Class Master with 5 classes`);
    console.log(`     ✅ Input Master (Promotional Materials) with 8 inputs`);
    console.log(`     ✅ Sample Master with ${sampleMaster?.length || 0} samples`);
    console.log(`     ✅ Access Control Hierarchy support ready`);
    console.log('═══════════════════════════════════════════════════════════\n');

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
