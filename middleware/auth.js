const jwt = require('../utils/jwt');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verifyToken(token);
    
    // Get user from database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.' 
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Invalid token.' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Access denied. No user found.' 
      });
    }
    
    // Handle both string and array inputs
    let roleList = roles;
    if (roles.length === 1 && typeof roles[0] === 'string') {
      // If single string passed, check if it's comma-separated or single
      if (roles[0].includes(',')) {
        roleList = roles[0].split(',').map(r => r.trim());
      } else {
        roleList = [roles[0]];
      }
    }
    
    // Check role case-insensitively
    const userRole = req.user.role ? req.user.role.toString().toUpperCase() : '';
    const allowedRoles = roleList.map(r => r.toString().toUpperCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};