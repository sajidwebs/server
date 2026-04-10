// Standalone migration to create system setup tables
const db = require('./config/database');

async function migrate() {
  console.log('🔧 Creating system setup tables...');
  
  const migrations = [
    `CREATE TABLE IF NOT EXISTS call_average_setup (id SERIAL PRIMARY KEY, designation VARCHAR(50) NOT NULL, min_field_working_days INTEGER DEFAULT 20, daily_calls INTEGER DEFAULT 11, monthly_calls INTEGER, quarterly_calls INTEGER, yearly_calls INTEGER, warning_threshold DECIMAL(5,2) DEFAULT 90.00, alert_threshold DECIMAL(5,2) DEFAULT 70.00, effective_from DATE, effective_to DATE, is_active BOOLEAN DEFAULT true, created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS coverage_setup (id SERIAL PRIMARY KEY, designation VARCHAR(50) NOT NULL, doctor_list_type VARCHAR(20) DEFAULT 'Core', monthly_coverage DECIMAL(5,2) DEFAULT 90.00, quarterly_coverage DECIMAL(5,2) DEFAULT 100.00, yearly_coverage DECIMAL(5,2) DEFAULT 100.00, effective_from DATE, effective_to DATE, is_active BOOLEAN DEFAULT true, created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS work_type_setup (id SERIAL PRIMARY KEY, designation VARCHAR(50) NOT NULL, field_work_days INTEGER DEFAULT 24, office_work_days INTEGER DEFAULT 4, total_working_days INTEGER, mandatory_field_days BOOLEAN DEFAULT true, effective_from DATE, effective_to DATE, is_active BOOLEAN DEFAULT true, created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS work_type_master (id SERIAL PRIMARY KEY, type_name VARCHAR(50) NOT NULL, short_name VARCHAR(10), description TEXT, requires_gps BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS leave_policy_master (id SERIAL PRIMARY KEY, leave_type VARCHAR(20) NOT NULL, leave_type_name VARCHAR(50), probation_allowed BOOLEAN DEFAULT false, regular_allowed BOOLEAN DEFAULT true, max_days_per_month INTEGER DEFAULT 2, max_days_per_year INTEGER DEFAULT 12, carry_forward BOOLEAN DEFAULT true, max_carry_forward_days INTEGER, approval_required BOOLEAN DEFAULT true, is_active BOOLEAN DEFAULT true, created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS user_leave_balance (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, leave_type VARCHAR(20) NOT NULL, year INTEGER NOT NULL, total_allocated INTEGER DEFAULT 0, used INTEGER DEFAULT 0, balance INTEGER DEFAULT 0, carry_forwarded INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
  ];

  for (const sql of migrations) {
    try {
      await db.query(sql);
      console.log('✅ Created table');
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.log('⚠️ ', e.message.substring(0, 80));
      } else {
        console.log('✅ Table already exists');
      }
    }
  }
  
  console.log('\n✅ Migration completed!');
  process.exit(0);
}

db.authenticate()
  .then(() => migrate())
  .catch(err => {
    console.error('Database error:', err.message);
    process.exit(1);
  });