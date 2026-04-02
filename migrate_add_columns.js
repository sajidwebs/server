// Migration: Add new User Master and Expense Master columns to existing tables
// Run this ONCE on the deployed database: node migrate_add_columns.js
const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('🔧 Starting migration: Add User Master & Expense Master columns...\n');

    // ==================== 1. ALTER users table ====================
    console.log('📋 Altering users table...');
    
    const userColumns = [
      { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "fullName" VARCHAR(255)`, name: 'fullName' },
      { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "username" VARCHAR(255) UNIQUE`, name: 'username' },
      { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "mobileNumber" VARCHAR(15)`, name: 'mobileNumber' },
      { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "role_id" INTEGER`, name: 'role_id' },
      { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR(255)`, name: 'employeeId' },
      { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "assigned_manager_id" INTEGER`, name: 'assigned_manager_id' },
      { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginHistory" JSON`, name: 'loginHistory' }
    ];

    for (const col of userColumns) {
      try {
        await sequelize.query(col.sql);
        console.log(`  ✅ users.${col.name}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`  ⏭️  users.${col.name} (already exists)`);
        } else {
          console.log(`  ⚠️  users.${col.name}: ${e.message}`);
        }
      }
    }

    // Add foreign key constraints (after columns exist)
    try {
      await sequelize.query(`ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_role FOREIGN KEY ("role_id") REFERENCES roles(id)`);
      console.log('  ✅ fk_users_role');
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('does not exist')) {
        // roles table may not exist yet or constraint already exists
      } else {
        console.log(`  ⚠️  fk_users_role: ${e.message}`);
      }
    }

    try {
      await sequelize.query(`ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_assigned_manager FOREIGN KEY ("assigned_manager_id") REFERENCES users(id)`);
      console.log('  ✅ fk_users_assigned_manager');
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.log(`  ⚠️  fk_users_assigned_manager: ${e.message}`);
      }
    }

    // ==================== 2. CREATE roles table ====================
    console.log('\n📋 Creating roles table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          role_name VARCHAR(255) NOT NULL UNIQUE,
          short_name VARCHAR(20),
          description TEXT,
          hierarchy_level INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          updated_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ roles table');
    } catch (e) {
      console.log(`  ⚠️  roles: ${e.message}`);
    }

    // ==================== 3. CREATE permissions table ====================
    console.log('\n📋 Creating permissions table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id SERIAL PRIMARY KEY,
          module VARCHAR(255) NOT NULL,
          action VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ permissions table');
    } catch (e) {
      console.log(`  ⚠️  permissions: ${e.message}`);
    }

    // ==================== 4. CREATE role_permissions table ====================
    console.log('\n📋 Creating role_permissions table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id SERIAL PRIMARY KEY,
          role_id INTEGER NOT NULL REFERENCES roles(id),
          permission_id INTEGER NOT NULL REFERENCES permissions(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ role_permissions table');
    } catch (e) {
      console.log(`  ⚠️  role_permissions: ${e.message}`);
    }

    // ==================== 5. CREATE expense_types table ====================
    console.log('\n📋 Creating expense_types table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS expense_types (
          id SERIAL PRIMARY KEY,
          expense_type VARCHAR(255) NOT NULL,
          short_name VARCHAR(20) NOT NULL UNIQUE,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          updated_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ expense_types table');
    } catch (e) {
      console.log(`  ⚠️  expense_types: ${e.message}`);
    }

    // ==================== 6. CREATE travel_modes table ====================
    console.log('\n📋 Creating travel_modes table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS travel_modes (
          id SERIAL PRIMARY KEY,
          travel_type VARCHAR(255) NOT NULL,
          short_name VARCHAR(20) NOT NULL UNIQUE,
          description TEXT,
          requires_distance BOOLEAN DEFAULT true,
          status VARCHAR(20) DEFAULT 'active',
          created_by INTEGER REFERENCES users(id),
          updated_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ travel_modes table');
    } catch (e) {
      console.log(`  ⚠️  travel_modes: ${e.message}`);
    }

    // ==================== 7. CREATE standard_fare_charts table ====================
    console.log('\n📋 Creating standard_fare_charts table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS standard_fare_charts (
          id SERIAL PRIMARY KEY,
          employee_name VARCHAR(255) NOT NULL,
          employee_id INTEGER REFERENCES users(id),
          designation VARCHAR(255) NOT NULL,
          hq_type VARCHAR(20) DEFAULT 'Non-Metro',
          employee_status VARCHAR(20) DEFAULT 'Confirmed',
          da DECIMAL(10,2) DEFAULT 0,
          ex_allowance DECIMAL(10,2) DEFAULT 0,
          outstation_allowance DECIMAL(10,2) DEFAULT 0,
          hill_station_allowance DECIMAL(10,2) DEFAULT 0,
          meeting_allowance DECIMAL(10,2) DEFAULT 0,
          accommodation DECIMAL(10,2) DEFAULT 0,
          fare_per_km DECIMAL(10,2) DEFAULT 0,
          fare_0_to_70km DECIMAL(10,2) DEFAULT 0,
          fare_70_to_100km DECIMAL(10,2) DEFAULT 0,
          fare_above_100km DECIMAL(10,2) DEFAULT 0,
          mobile_allowance DECIMAL(10,2) DEFAULT 0,
          stationary_allowance DECIMAL(10,2) DEFAULT 0,
          effective_from DATE NOT NULL,
          effective_to DATE,
          is_active BOOLEAN DEFAULT true,
          created_by INTEGER REFERENCES users(id),
          updated_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ standard_fare_charts table');
    } catch (e) {
      console.log(`  ⚠️  standard_fare_charts: ${e.message}`);
    }

    // ==================== 8. CREATE expenses table ====================
    console.log('\n📋 Creating expenses table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          month VARCHAR(2) NOT NULL,
          year VARCHAR(4) NOT NULL,
          date DATE NOT NULL,
          working_status VARCHAR(20) DEFAULT 'Working',
          hq_id INTEGER REFERENCES headquarters(id),
          territory_id INTEGER REFERENCES territories(id),
          doctor_calls INTEGER DEFAULT 0,
          chemist_calls INTEGER DEFAULT 0,
          business_amount DECIMAL(12,2) DEFAULT 0,
          allowance DECIMAL(10,2) DEFAULT 0,
          from_place VARCHAR(255),
          to_place VARCHAR(255),
          travel_mode_id INTEGER REFERENCES travel_modes(id),
          travel_entry_amount DECIMAL(10,2) DEFAULT 0,
          distance_km DECIMAL(10,2) DEFAULT 0,
          ta DECIMAL(10,2) DEFAULT 0,
          miscellaneous DECIMAL(10,2) DEFAULT 0,
          fare_chart_id INTEGER REFERENCES standard_fare_charts(id),
          approval_status VARCHAR(20) DEFAULT 'draft',
          approved_by INTEGER REFERENCES users(id),
          approved_at TIMESTAMP,
          rejection_reason TEXT,
          remarks TEXT,
          created_by INTEGER REFERENCES users(id),
          updated_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ expenses table');
    } catch (e) {
      console.log(`  ⚠️  expenses: ${e.message}`);
    }

    // ==================== 9. CREATE expense_additions table ====================
    console.log('\n📋 Creating expense_additions table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS expense_additions (
          id SERIAL PRIMARY KEY,
          expense_id INTEGER NOT NULL REFERENCES expenses(id),
          type VARCHAR(20) NOT NULL,
          amount DECIMAL(10,2) DEFAULT 0,
          reason TEXT,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ expense_additions table');
    } catch (e) {
      console.log(`  ⚠️  expense_additions: ${e.message}`);
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  db = require('./config/database');
  db.authenticate()
    .then(() => {
      console.log('Database connected.');
      return migrate();
    })
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrate;
