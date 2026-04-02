const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Create Express app
const app = express();

// Trust proxy for render.com (required for rate limiting to work correctly behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.8:3000', 'http://192.168.1.8:5000', 'http://127.0.0.1:3001',  'http://192.168.0.3:5173', 'http://192.168.1.8:5173', 'http://192.168.1.8:3001', 'http://localhost:5173', 'http://192.168.1.8:8081', 'https://serverapp-a8wy.onrender.com', 'https://pamsforce-admin.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));

// Configure body parsing with different options
app.use(express.json({
  limit: '10mb',
  type: 'application/json',
  verify: undefined
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply other middleware after body parsing
app.use(limiter);
app.use(helmet());

// Database connection and models
const db = require('./config/database');
require('./models'); // Import all models to register them with Sequelize

// Auto-migration: Add new columns if they don't exist
async function runMigration() {
  console.log('🔧 Running auto-migration...');
  const migrations = [
    // New user columns
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "fullName" VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "username" VARCHAR(255) UNIQUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "mobileNumber" VARCHAR(15)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "role_id" INTEGER`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "assigned_manager_id" INTEGER`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginHistory" JSON`,
    // New tables
    `CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, role_name VARCHAR(255) NOT NULL UNIQUE, short_name VARCHAR(20), description TEXT, hierarchy_level INTEGER DEFAULT 0, status VARCHAR(20) DEFAULT 'active', created_by INTEGER, updated_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS permissions (id SERIAL PRIMARY KEY, module VARCHAR(255) NOT NULL, action VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(20) DEFAULT 'active', created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS role_permissions (id SERIAL PRIMARY KEY, role_id INTEGER NOT NULL, permission_id INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS expense_types (id SERIAL PRIMARY KEY, expense_type VARCHAR(255) NOT NULL, short_name VARCHAR(20) NOT NULL UNIQUE, description TEXT, status VARCHAR(20) DEFAULT 'active', created_by INTEGER, updated_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS travel_modes (id SERIAL PRIMARY KEY, travel_type VARCHAR(255) NOT NULL, short_name VARCHAR(20) NOT NULL UNIQUE, description TEXT, requires_distance BOOLEAN DEFAULT true, status VARCHAR(20) DEFAULT 'active', created_by INTEGER, updated_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS standard_fare_charts (id SERIAL PRIMARY KEY, employee_name VARCHAR(255) NOT NULL, employee_id INTEGER, designation VARCHAR(255) NOT NULL, hq_type VARCHAR(20) DEFAULT 'Non-Metro', employee_status VARCHAR(20) DEFAULT 'Confirmed', da DECIMAL(10,2) DEFAULT 0, ex_allowance DECIMAL(10,2) DEFAULT 0, outstation_allowance DECIMAL(10,2) DEFAULT 0, hill_station_allowance DECIMAL(10,2) DEFAULT 0, meeting_allowance DECIMAL(10,2) DEFAULT 0, accommodation DECIMAL(10,2) DEFAULT 0, fare_per_km DECIMAL(10,2) DEFAULT 0, fare_0_to_70km DECIMAL(10,2) DEFAULT 0, fare_70_to_100km DECIMAL(10,2) DEFAULT 0, fare_above_100km DECIMAL(10,2) DEFAULT 0, mobile_allowance DECIMAL(10,2) DEFAULT 0, stationary_allowance DECIMAL(10,2) DEFAULT 0, effective_from DATE, effective_to DATE, is_active BOOLEAN DEFAULT true, created_by INTEGER, updated_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS expenses (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, month VARCHAR(2) NOT NULL, year VARCHAR(4) NOT NULL, date DATE NOT NULL, working_status VARCHAR(20) DEFAULT 'Working', hq_id INTEGER, territory_id INTEGER, doctor_calls INTEGER DEFAULT 0, chemist_calls INTEGER DEFAULT 0, business_amount DECIMAL(12,2) DEFAULT 0, allowance DECIMAL(10,2) DEFAULT 0, from_place VARCHAR(255), to_place VARCHAR(255), travel_mode_id INTEGER, travel_entry_amount DECIMAL(10,2) DEFAULT 0, distance_km DECIMAL(10,2) DEFAULT 0, ta DECIMAL(10,2) DEFAULT 0, miscellaneous DECIMAL(10,2) DEFAULT 0, fare_chart_id INTEGER, approval_status VARCHAR(20) DEFAULT 'draft', approved_by INTEGER, approved_at TIMESTAMP, rejection_reason TEXT, remarks TEXT, created_by INTEGER, updated_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS expense_additions (id SERIAL PRIMARY KEY, expense_id INTEGER NOT NULL, type VARCHAR(20) NOT NULL, amount DECIMAL(10,2) DEFAULT 0, reason TEXT, created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
  ];
  for (const sql of migrations) {
    try {
      await db.query(sql);
    } catch (e) {
      // Ignore "already exists" errors
      if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
        console.log('Migration warning:', e.message.substring(0, 100));
      }
    }
  }
  console.log('✅ Auto-migration completed.');
}

// Test database connection and then sync, then start server
db.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    return runMigration();
  })
  .then(async () => {
    console.log('Database ready.');
    
    // Start server after sync and seed
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access the API at http://localhost:${PORT}`);
    });
    
    // Keep server running
    server.on('error', (err) => {
      console.error('Server error:', err);
    });
    
    // Prevent process from exiting
    process.on('SIGINT', () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Pamsforce API Server',
    version: '1.0.0'
  });
});

// Test endpoint for JSON parsing
app.post('/test-json', (req, res) => {
  console.log('Test endpoint received:', req.body);
  res.json({ message: 'JSON received successfully', data: req.body });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/chemists', require('./routes/chemist.routes'));
app.use('/api/territories', require('./routes/territory.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/headquarters', require('./routes/headquarter.routes'));
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/daycalls', require('./routes/daycall.routes'));
app.use('/api/projections', require('./routes/projection.routes'));
app.use('/api/business', require('./routes/business.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/business-rules', require('./routes/business-rules.routes'));

// Master Data Routes (Doctor Class, Category, Specialty, Qualification)
app.use('/api/master', require('./routes/masterData.js'));

// Approval Workflow Routes
app.use('/api/approvals', require('./routes/approvals.js'));

// User Master RBAC Routes
app.use('/api/roles', require('./routes/role.routes'));

// Expense Master Routes
app.use('/api/expenses', require('./routes/expense.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found' 
  });
});

module.exports = app;