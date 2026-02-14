const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.3:3000', 'http://192.168.1.3:5000', 'http://127.0.0.1:3001',  'http://192.168.0.3:5173', 'http://192.168.1.3:5173', 'http://192.168.1.3:3001', 'http://localhost:5173', 'http://192.168.1.3:8081'],
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

// Test database connection
db.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Sync database models
db.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully.');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;