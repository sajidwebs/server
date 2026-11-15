const { sendApiError } = require('../utils/apiError');
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
    
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
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

      // Generate JWT token
      const token = generateToken({ id: user.id, email: user.email });

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
      sendApiError(res, error);
    }
  });

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const { fn, col, where } = require('sequelize');
    const user = await User.findOne({ where: where(fn('lower', col('email')), email.toLowerCase()) });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated. Please contact admin.' 
      });
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email });

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
    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    sendApiError(res, error);
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
    sendApiError(res, error);
  }
});

module.exports = router;
