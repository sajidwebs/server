// Migration script to add missing columns to doctors table
const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('🔄 Running doctor table migration...');
    
    // Add columns one by one with IF NOT EXISTS equivalent
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS class_id INTEGER`);
    console.log('✅ Added class_id column');
    
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty_id INTEGER`);
    console.log('✅ Added specialty_id column');
    
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS category_id INTEGER`);
    console.log('✅ Added category_id column');
    
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification_id INTEGER`);
    console.log('✅ Added qualification_id column');
    
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS territory_id INTEGER`);
    console.log('✅ Added territory_id column');
    
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hq_id INTEGER`);
    console.log('✅ Added hq_id column');
    
    await sequelize.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0`);
    console.log('✅ Added current_approval_level column');
    
    // Also add missing chemist columns
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS territory_id INTEGER`);
    console.log('✅ Added territory_id column to chemists');
    
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS hq_id INTEGER`);
    console.log('✅ Added hq_id column to chemists');
    
    await sequelize.query(`ALTER TABLE chemists ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0`);
    console.log('✅ Added current_approval_level column to chemists');
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();