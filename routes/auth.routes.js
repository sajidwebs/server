const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

  // Register a new user
  router.post('/register', validateUserRegistration, async (req, res) => {
    console.log('Received signup request at backend:', new Date().toISOString());
    console.log('Request body:', req.body);
    console.log('Request IP:', req.ip);
    
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword
      });

      console.log('User created successfully:', user.id);

      // Generate JWT token
      const token = generateToken({ id: user.id, email: user.email });

      console.log('Token generated for user:', email);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  });

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);
    console.log('Request body:', req.body);

    // Find user by email
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ User not found in database:', email);
      console.log('Available users in database:');
      const allUsers = await User.findAll({ attributes: ['email', 'firstName'] });
      console.log(allUsers.map(u => `${u.firstName}: ${u.email}`));
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', user.email, 'Active:', user.isActive);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated. Please contact admin.' 
      });
    }

    // Compare passwords
    console.log('Comparing passwords...');
    console.log('Input password:', password);
    console.log('Stored hash:', user.password);
    const isPasswordValid = await comparePassword(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Password comparison failed!');
      console.log('Expected hash for "9999999999":', '$2a$10$XKAw.u8oDi7eEYfML5tfzeh6lFfFpMNiWj5CSuz/dwAS54s.sVgtK');

      // Test the provided hash
      const { comparePassword } = require('../utils/password');
      const testResult = await comparePassword('9999999999', '$2a$10$XKAw.u8oDi7eEYfML5tfzeh6lFfFpMNiWj5CSuz/dwAS54s.sVgtK');
      console.log('Test password "9999999999" against provided hash:', testResult);
    }

    if (!isPasswordValid) {
      console.log('Password validation failed for user:', email);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email });
    console.log('Token generated successfully for user:', email);

    const responseData = {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    };

    console.log('Sending login response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;