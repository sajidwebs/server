// Migration Script: Rename doctor master primary keys to 'id'
// Run with: node migrate_doctor_master_ids.js

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
    dialectOptions: isRenderHost ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check current table structure
    console.log('\n📊 Checking current table structure...\n');
    
    // 1. Migration for doctor_classes
    console.log('🔄 Migrating doctor_classes table...');
    try {
      // Check if id column exists
      const classTableInfo = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'doctor_classes' AND column_name = 'id'
      `);
      
      if (classTableInfo[0].length === 0) {
        // Add id column
        await sequelize.query(`
          ALTER TABLE doctor_classes ADD COLUMN id SERIAL PRIMARY KEY
        `);
        console.log('✅ doctor_classes: Added id column');
      } else {
        console.log('⚠️  doctor_classes: id column already exists');
      }
    } catch (e) {
      console.log('❌ doctor_classes migration error:', e.message);
    }

    // 2. Migration for doctor_categories
    console.log('\n🔄 Migrating doctor_categories table...');
    try {
      const catTableInfo = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'doctor_categories' AND column_name = 'id'
      `);
      
      if (catTableInfo[0].length === 0) {
        // Check for category_id
        const hasCategoryId = await sequelize.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'doctor_categories' AND column_name = 'category_id'
        `);
        
        if (hasCategoryId[0].length > 0) {
          // Rename category_id to id
          await sequelize.query(`
            ALTER TABLE doctor_categories RENAME COLUMN category_id TO id
          `);
          // Make it primary key
          await sequelize.query(`
            ALTER TABLE doctor_categories ALTER COLUMN id DROP DEFAULT;
            ALTER TABLE doctor_categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
          `);
          console.log('✅ doctor_categories: Renamed category_id to id');
        } else {
          // Just add id
          await sequelize.query(`
            ALTER TABLE doctor_categories ADD COLUMN id SERIAL PRIMARY KEY
          `);
          console.log('✅ doctor_categories: Added id column');
        }
      } else {
        console.log('⚠️  doctor_categories: id column already exists');
      }
    } catch (e) {
      console.log('❌ doctor_categories migration error:', e.message);
    }

    // 3. Migration for doctor_specialties
    console.log('\n🔄 Migrating doctor_specialties table...');
    try {
      const specTableInfo = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'doctor_specialties' AND column_name = 'id'
      `);
      
      if (specTableInfo[0].length === 0) {
        const hasSpecialtyId = await sequelize.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'doctor_specialties' AND column_name = 'specialty_id'
        `);
        
        if (hasSpecialtyId[0].length > 0) {
          await sequelize.query(`
            ALTER TABLE doctor_specialties RENAME COLUMN specialty_id TO id
          `);
          await sequelize.query(`
            ALTER TABLE doctor_specialties ALTER COLUMN id DROP DEFAULT;
            ALTER TABLE doctor_specialties ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
          `);
          console.log('✅ doctor_specialties: Renamed specialty_id to id');
        } else {
          await sequelize.query(`
            ALTER TABLE doctor_specialties ADD COLUMN id SERIAL PRIMARY KEY
          `);
          console.log('✅ doctor_specialties: Added id column');
        }
      } else {
        console.log('⚠️  doctor_specialties: id column already exists');
      }
    } catch (e) {
      console.log('❌ doctor_specialties migration error:', e.message);
    }

    // 4. Migration for doctor_qualifications
    console.log('\n🔄 Migrating doctor_qualifications table...');
    try {
      const qualTableInfo = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'doctor_qualifications' AND column_name = 'id'
      `);
      
      if (qualTableInfo[0].length === 0) {
        const hasQualId = await sequelize.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'doctor_qualifications' AND column_name = 'qualification_id'
        `);
        
        if (hasQualId[0].length > 0) {
          await sequelize.query(`
            ALTER TABLE doctor_qualifications RENAME COLUMN qualification_id TO id
          `);
          await sequelize.query(`
            ALTER TABLE doctor_qualifications ALTER COLUMN id DROP DEFAULT;
            ALTER TABLE doctor_qualifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
          `);
          console.log('✅ doctor_qualifications: Renamed qualification_id to id');
        } else {
          await sequelize.query(`
            ALTER TABLE doctor_qualifications ADD COLUMN id SERIAL PRIMARY KEY
          `);
          console.log('✅ doctor_qualifications: Added id column');
        }
      } else {
        console.log('⚠️  doctor_qualifications: id column already exists');
      }
    } catch (e) {
      console.log('❌ doctor_qualifications migration error:', e.message);
    }

    // Verify the changes
    console.log('\n📋 Verifying final table structures...\n');
    
    const tables = ['doctor_classes', 'doctor_categories', 'doctor_specialties', 'doctor_qualifications'];
    for (const table of tables) {
      const result = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name IN ('id', 'class_name', 'category_name', 'specialty_name', 'qualification_name')
        ORDER BY column_name
      `);
      console.log(`${table}:`, result[0].map(c => `${c.column_name}(${c.data_type})`).join(', '));
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();