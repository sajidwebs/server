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
  max: Number(process.env.API_RATE_LIMIT_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' }
});

// Apply middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
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
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many unsuccessful login attempts. Please try again in 15 minutes.' }
}));
app.use(helmet());

// Database connection and models
const db = require('./config/database');
require('./models'); // Import all models to register them with Sequelize

// Validate the schema without changing data during normal startup.
const runMigration = require('./config/initializeDatabase');
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
  .catch(async err => {
    console.error('Database startup failed. Check database settings and schema compatibility:', err.message);
    await db.close();
    process.exitCode = 1;
  });

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Pamsforce API Server',
    version: '1.0.0'
  });
});

// Test endpoint for JSON parsing
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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

// System Setup Routes (Rule Engine)
app.use('/api/system-setup', require('./routes/systemSetup.routes'));

// Marketing Campaign, Strategy, ROI, and RCPA Routes
app.use('/api/marketing', require('./routes/marketing.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  require('./utils/apiError').sendApiError(res, err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found' 
  });
});

module.exports = app;
