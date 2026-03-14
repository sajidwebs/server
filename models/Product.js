const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Unique identifier as per spec
  unique_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  // Product name (brand name)
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // Short name/abbreviation
  short_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Code for the product
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  // Division reference (as per spec: Division Master)
  division_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'divisions',
      key: 'id'
    }
  },
  // Brand Group reference (as per spec: Brand Group Master)
  brand_group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'brand_groups',
      key: 'id'
    }
  },
  // Category reference (as per spec: Category Master - Tablet, Cap, Gel, Amp, etc.)
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'product_categories',
      key: 'id'
    }
  },
  // Pack Size reference (as per spec: 10tab, 15tab, 100ml, etc.)
  pack_size_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pack_sizes',
      key: 'id'
    }
  },
  // Strength reference (as per spec: 100mg, 50mg, 100ml, 2ml, etc.)
  strength_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'strengths',
      key: 'id'
    }
  },
  // Legacy fields (kept for backward compatibility)
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subcategory: {
    type: DataTypes.STRING
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT
  },
  composition: {
    type: DataTypes.TEXT
  },
  indications: {
    type: DataTypes.TEXT
  },
  dosage: {
    type: DataTypes.STRING
  },
  packSize: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Pricing fields as per spec
  pts: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  ptr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  // Net Realizing Value (NRV) - as per spec
  nrv: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  // Additional legacy fields
  hsnCode: {
    type: DataTypes.STRING
  },
  gstRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  schedule: {
    type: DataTypes.STRING,
    defaultValue: 'H'
  },
  therapeuticClass: {
    type: DataTypes.STRING
  },
  // Launch date as per spec
  launch_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  // Status as per spec (Active/Inactive)
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  // Legacy isActive field (kept for compatibility)
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Track who created/updated
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'products'
});

module.exports = Product;