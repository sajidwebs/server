const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all products
router.get('/', authenticate, async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: 'Products retrieved successfully',
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get product by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: 'Product retrieved successfully',
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Create new product
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name, code, category, subcategory, brand, manufacturer,
      description, composition, indications, dosage, packSize,
      mrp, ptr, pts, hsnCode, gstRate, schedule, therapeuticClass, isActive
    } = req.body;

    const product = await Product.create({
      name,
      code,
      category,
      subcategory,
      brand,
      manufacturer,
      description,
      composition,
      indications,
      dosage,
      packSize,
      mrp,
      ptr,
      pts,
      hsnCode,
      gstRate,
      schedule,
      therapeuticClass,
      isActive
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Update product
router.put('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const {
      name, code, category, subcategory, brand, manufacturer,
      description, composition, indications, dosage, packSize,
      mrp, ptr, pts, hsnCode, gstRate, schedule, therapeuticClass, isActive
    } = req.body;

    await product.update({
      name,
      code,
      category,
      subcategory,
      brand,
      manufacturer,
      description,
      composition,
      indications,
      dosage,
      packSize,
      mrp,
      ptr,
      pts,
      hsnCode,
      gstRate,
      schedule,
      therapeuticClass,
      isActive
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    await product.destroy();

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;