// Seed Script for Doctor Master CRUD Demo
// Run: node seed_doctor_masters.js
// This adds sample data for creating/editing/deleting in admin portal forms

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config({ path: './.envserver' });

const isRenderHost = process.env.DB_HOST && process.env.DB_HOST.includes('render.com');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: isRenderHost ? { ssl: { require: true, rejectUnauthorized: false } } : {}
  }
);

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Seed Doctor Classes
    console.log('🏷️ Seeding doctor classes...');
    await sequelize.query(`
      INSERT INTO doctor_classes (class_name, short_name, status, created_at, updated_at) VALUES
      ('VIP Doctor', 'VIP', 'active', NOW(), NOW()),
      ('Key Doctor', 'KEY', 'active', NOW(), NOW()),
      ('Potential Doctor', 'POT', 'active', NOW(), NOW()),
      ('Non Prescriber', 'NON', 'inactive', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Added 4 doctor classes\n');

    // Seed Doctor Categories  
    console.log('📋 Seeding doctor categories...');
    await sequelize.query(`
      INSERT INTO doctor_categories (category_name, short_name, status, created_at, updated_at) VALUES
      ('Key Opinion Leader', 'KOL', 'active', NOW(), NOW()),
      ('Premium Doctor', 'PREM', 'active', NOW(), NOW()),
      ('Walk-in Doctor', 'WALK', 'active', NOW(), NOW()),
      ('Local Practitioner', 'LOCAL', 'inactive', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Added 4 doctor categories\n');

    // Seed Doctor Specialties
    console.log('🩺 Seeding doctor specialties...');
    await sequelize.query(`
      INSERT INTO doctor_specialties (specialty_name, short_name, status, created_at, updated_at) VALUES
      ('General Surgery', 'GS', 'active', NOW(), NOW()),
      ('Internal Medicine', 'IM', 'active', NOW(), NOW()),
      ('ENT', 'ENT', 'active', NOW(), NOW()),
      ('Ophthalmology', 'OPH', 'active', NOW(), NOW()),
      ('Psychiatry', 'PSY', 'active', NOW(), NOW()),
      ('Pulmonology', 'PUL', 'inactive', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Added 6 doctor specialties\n');

    // Seed Doctor Qualifications
    console.log('🎓 Seeding doctor qualifications...');
    await sequelize.query(`
      INSERT INTO doctor_qualifications (qualification_name, short_name, status, created_at, updated_at) VALUES
      ('BHMS', 'BHMS', 'active', NOW(), NOW()),
      ('BAMS', 'BAMS', 'active', NOW(), NOW()),
      ('BUMS', 'BUMS', 'active', NOW(), NOW()),
      ('BNYS', 'BNYS', 'active', NOW(), NOW()),
      ('Diplomate in Anaesthesiology', 'DA', 'inactive', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Added 5 doctor qualifications\n');

    // Verify final counts
    console.log('📊 Final record counts:\n');
    const tables = [
      'doctor_classes', 
      'doctor_categories', 
      'doctor_specialties', 
      'doctor_qualifications'
    ];
    
    for (const table of tables) {
      const result = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
      const data = await sequelize.query(`SELECT id, ${table === 'doctor_classes' ? 'class_name' : table === 'doctor_categories' ? 'category_name' : table === 'doctor_specialties' ? 'specialty_name' : 'qualification_name'} as name FROM ${table} ORDER BY id LIMIT 5`);
      console.log(`${table}: ${result[0][0].count} records`);
      console.log(`  IDs: ${data[0].map(d => d.id).join(', ')}`);
    }

    console.log('\n✅ Seeding completed! You can now use the admin portal forms.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();