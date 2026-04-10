// System Setup Seed Data - Using raw SQL to avoid model initialization issues
const db = require('./config/database');

async function seedSystemSetup() {
  console.log('🌱 Starting System Setup seeding...\n');

  try {
    // First ensure tables exist
    console.log('📋 Ensuring tables exist...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS call_average_setup (
        id SERIAL PRIMARY KEY,
        designation VARCHAR(50) NOT NULL,
        min_field_working_days INTEGER DEFAULT 20,
        daily_calls INTEGER DEFAULT 11,
        monthly_calls INTEGER,
        quarterly_calls INTEGER,
        yearly_calls INTEGER,
        warning_threshold DECIMAL(5,2) DEFAULT 90.00,
        alert_threshold DECIMAL(5,2) DEFAULT 70.00,
        effective_from DATE,
        effective_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS coverage_setup (
        id SERIAL PRIMARY KEY,
        designation VARCHAR(50) NOT NULL,
        doctor_list_type VARCHAR(20) DEFAULT 'Core',
        monthly_coverage DECIMAL(5,2) DEFAULT 90.00,
        quarterly_coverage DECIMAL(5,2) DEFAULT 100.00,
        yearly_coverage DECIMAL(5,2) DEFAULT 100.00,
        effective_from DATE,
        effective_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS work_type_setup (
        id SERIAL PRIMARY KEY,
        designation VARCHAR(50) NOT NULL,
        field_work_days INTEGER DEFAULT 24,
        office_work_days INTEGER DEFAULT 4,
        total_working_days INTEGER,
        mandatory_field_days BOOLEAN DEFAULT true,
        effective_from DATE,
        effective_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS work_type_master (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL,
        short_name VARCHAR(10),
        description TEXT,
        requires_gps BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_policy_master (
        id SERIAL PRIMARY KEY,
        leave_type VARCHAR(20) NOT NULL,
        leave_type_name VARCHAR(50),
        probation_allowed BOOLEAN DEFAULT false,
        regular_allowed BOOLEAN DEFAULT true,
        max_days_per_month INTEGER DEFAULT 2,
        max_days_per_year INTEGER DEFAULT 12,
        carry_forward BOOLEAN DEFAULT true,
        max_carry_forward_days INTEGER,
        approval_required BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_leave_balance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        leave_type VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        total_allocated INTEGER DEFAULT 0,
        used INTEGER DEFAULT 0,
        balance INTEGER DEFAULT 0,
        carry_forwarded INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables ready\n');

    // Check existing data
    const existingCallAvg = await db.query('SELECT COUNT(*) FROM call_average_setup', { type: db.QueryTypes.SELECT });
    
    if (existingCallAvg[0].count > 0) {
      console.log('✅ System setup data already exists');
      process.exit(0);
      return;
    }

    // ==================== CALL AVERAGE SETUP ====================
    console.log('📊 Inserting call average setups...');
    await db.query(`INSERT INTO call_average_setup (designation, min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, is_active) 
      VALUES ('MR', 20, 11, 220, 660, 2640, 90.00, 70.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO call_average_setup (designation, min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, is_active) 
      VALUES ('TBM', 18, 10, 180, 540, 2160, 90.00, 70.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO call_average_setup (designation, min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, is_active) 
      VALUES ('ABM', 20, 8, 160, 480, 1920, 90.00, 70.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO call_average_setup (designation, min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, is_active) 
      VALUES ('RBM', 18, 6, 108, 324, 1296, 90.00, 70.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO call_average_setup (designation, min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, is_active) 
      VALUES ('ZBM', 15, 5, 75, 225, 900, 90.00, 70.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO call_average_setup (designation, min_field_working_days, daily_calls, monthly_calls, quarterly_calls, yearly_calls, warning_threshold, alert_threshold, effective_from, is_active) 
      VALUES ('NSM', 15, 4, 60, 180, 720, 90.00, 70.00, '2026-01-01', true)`);
    console.log('✅ Created 6 call average setups');

    // ==================== COVERAGE SETUP ====================
    console.log('🎯 Inserting coverage setups...');
    await db.query(`INSERT INTO coverage_setup (designation, doctor_list_type, monthly_coverage, quarterly_coverage, yearly_coverage, effective_from, is_active) VALUES ('MR', 'Core', 90.00, 100.00, 100.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO coverage_setup (designation, doctor_list_type, monthly_coverage, quarterly_coverage, yearly_coverage, effective_from, is_active) VALUES ('TBM', 'Core', 90.00, 100.00, 100.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO coverage_setup (designation, doctor_list_type, monthly_coverage, quarterly_coverage, yearly_coverage, effective_from, is_active) VALUES ('ABM', 'Core', 85.00, 95.00, 100.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO coverage_setup (designation, doctor_list_type, monthly_coverage, quarterly_coverage, yearly_coverage, effective_from, is_active) VALUES ('RBM', 'Core', 85.00, 95.00, 100.00, '2026-01-01', true)`);
    await db.query(`INSERT INTO coverage_setup (designation, doctor_list_type, monthly_coverage, quarterly_coverage, yearly_coverage, effective_from, is_active) VALUES ('MR', 'Secondary', 70.00, 80.00, 90.00, '2026-01-01', true)`);
    console.log('✅ Created 5 coverage setups');

    // ==================== WORK TYPE SETUP ====================
    console.log('🏢 Inserting work type setups...');
    await db.query(`INSERT INTO work_type_setup (designation, field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, is_active) VALUES ('MR', 24, 4, 28, true, '2026-01-01', true)`);
    await db.query(`INSERT INTO work_type_setup (designation, field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, is_active) VALUES ('TBM', 20, 6, 26, true, '2026-01-01', true)`);
    await db.query(`INSERT INTO work_type_setup (designation, field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, is_active) VALUES ('ABM', 18, 8, 26, true, '2026-01-01', true)`);
    await db.query(`INSERT INTO work_type_setup (designation, field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, is_active) VALUES ('RBM', 15, 10, 25, true, '2026-01-01', true)`);
    await db.query(`INSERT INTO work_type_setup (designation, field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, is_active) VALUES ('ZBM', 12, 12, 24, false, '2026-01-01', true)`);
    await db.query(`INSERT INTO work_type_setup (designation, field_work_days, office_work_days, total_working_days, mandatory_field_days, effective_from, is_active) VALUES ('NSM', 10, 14, 24, false, '2026-01-01', true)`);
    console.log('✅ Created 6 work type setups');

    // ==================== WORK TYPE MASTER ====================
    console.log('📋 Inserting work type master...');
    await db.query(`INSERT INTO work_type_master (type_name, short_name, description, requires_gps, is_active) VALUES ('Field Work', 'FW', 'Field work includes doctor visits, chemist visits, territory coverage', true, true)`);
    await db.query(`INSERT INTO work_type_master (type_name, short_name, description, requires_gps, is_active) VALUES ('Office Work', 'OW', 'Office work includes meetings, reporting, admin tasks', false, true)`);
    console.log('✅ Created work type master entries');

    // ==================== LEAVE POLICY ====================
    console.log('🏖️ Inserting leave policies...');
    await db.query(`INSERT INTO leave_policy_master (leave_type, leave_type_name, probation_allowed, regular_allowed, max_days_per_month, max_days_per_year, carry_forward, approval_required, is_active) VALUES ('CL', 'Casual Leave', false, true, 2, 12, false, true, true)`);
    await db.query(`INSERT INTO leave_policy_master (leave_type, leave_type_name, probation_allowed, regular_allowed, max_days_per_month, max_days_per_year, carry_forward, approval_required, is_active) VALUES ('SL', 'Sick Leave', true, true, 2, 10, true, true, true)`);
    await db.query(`INSERT INTO leave_policy_master (leave_type, leave_type_name, probation_allowed, regular_allowed, max_days_per_month, max_days_per_year, carry_forward, approval_required, is_active) VALUES ('EL', 'Earned Leave', false, true, 1, 15, true, true, true)`);
    await db.query(`INSERT INTO leave_policy_master (leave_type, leave_type_name, probation_allowed, regular_allowed, max_days_per_month, max_days_per_year, carry_forward, approval_required, is_active) VALUES ('ML', 'Maternity Leave', false, true, 0, 90, false, true, true)`);
    await db.query(`INSERT INTO leave_policy_master (leave_type, leave_type_name, probation_allowed, regular_allowed, max_days_per_month, max_days_per_year, carry_forward, approval_required, is_active) VALUES ('PL', 'Paternity Leave', false, true, 0, 7, false, true, true)`);
    console.log('✅ Created 5 leave policies');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 SYSTEM SETUP SEEDING COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

db.authenticate()
  .then(() => seedSystemSetup())
  .catch(err => {
    console.error('Database error:', err.message);
    process.exit(1);
  });