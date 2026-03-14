const express = require('express');
const router = express.Router();
const { 
  Product, 
  Division, 
  ProductCategory, 
  PackSize, 
  BrandGroup, 
  Strength,
  ProductPriceHistory,
  Activity,
  Sale
} = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Helper function to check if user can manage products
const canManageProducts = (user) => {
  return user && (user.role === 'ADMIN' || user.role === 'MARKETING');
};

const canEditProducts = (user) => {
  return user && (user.role === 'ADMIN' || user.role === 'MARKETING');
};

const canDeleteProducts = (user) => {
  return user && user.role === 'ADMIN';
};

// ==================== DIVISION MASTER ROUTES ====================

// Get all divisions (View - All roles)
router.get('/divisions', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const divisions = await Division.findAll({
      where,
      order: [['division_name', 'ASC']]
    });
    res.json(divisions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single division
router.get('/divisions/:id', async (req, res) => {
  try {
    const division = await Division.findByPk(req.params.id);
    if (!division) {
      return res.status(404).json({ error: 'Division not found' });
    }
    res.json(division);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create division (Admin only)
router.post('/divisions', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { division_name, short_name, description, code } = req.body;
    
    const division = await Division.create({
      division_name,
      short_name,
      description,
      code,
      created_by: req.user.id
    });
    
    res.status(201).json(division);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update division (Admin only)
router.put('/divisions/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const division = await Division.findByPk(req.params.id);
    if (!division) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    const { division_name, short_name, description, code, status } = req.body;
    await division.update({
      division_name: division_name || division.division_name,
      short_name: short_name || division.short_name,
      description: description || division.description,
      code: code || division.code,
      status: status || division.status,
      updated_by: req.user.id
    });
    
    res.json(division);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete division (Admin only)
router.delete('/divisions/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const division = await Division.findByPk(req.params.id);
    if (!division) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    // Check if there are any products associated with this division
    const associatedProducts = await Product.count({
      where: { division_id: req.params.id }
    });
    
    if (associatedProducts > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this division. There are ${associatedProducts} product(s) associated with it.` 
      });
    }
    
    await division.destroy();
    res.json({ message: 'Division deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PRODUCT CATEGORY MASTER ROUTES ====================

// Get all categories (View - All roles)
router.get('/categories', async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.category_type = type;
    
    const categories = await ProductCategory.findAll({
      where,
      order: [['category_name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await ProductCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (Admin/Marketing only)
router.post('/categories', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const { category_name, short_name, description, category_type } = req.body;
    
    const category = await ProductCategory.create({
      category_name,
      short_name,
      description,
      category_type: category_type || 'form',
      created_by: req.user.id
    });
    
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update category (Admin/Marketing only)
router.put('/categories/:id', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const category = await ProductCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const { category_name, short_name, description, category_type, status } = req.body;
    await category.update({
      category_name: category_name || category.category_name,
      short_name: short_name || category.short_name,
      description: description || category.description,
      category_type: category_type || category.category_type,
      status: status || category.status,
      updated_by: req.user.id
    });
    
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category (Admin only)
router.delete('/categories/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const category = await ProductCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if there are any products associated with this category
    const associatedProducts = await Product.count({
      where: { category_id: req.params.id }
    });
    
    if (associatedProducts > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this category. There are ${associatedProducts} product(s) associated with it.` 
      });
    }
    
    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PACK SIZE MASTER ROUTES ====================

// Get all pack sizes (View - All roles)
router.get('/pack-sizes', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const packSizes = await PackSize.findAll({
      where,
      order: [['display_order', 'ASC'], ['pack_size', 'ASC']]
    });
    res.json(packSizes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single pack size
router.get('/pack-sizes/:id', async (req, res) => {
  try {
    const packSize = await PackSize.findByPk(req.params.id);
    if (!packSize) {
      return res.status(404).json({ error: 'Pack size not found' });
    }
    res.json(packSize);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create pack size (Admin/Marketing only)
router.post('/pack-sizes', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const { pack_size, short_name, display_order } = req.body;
    
    const packSize = await PackSize.create({
      pack_size,
      short_name,
      display_order: display_order || 0,
      created_by: req.user.id
    });
    
    res.status(201).json(packSize);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update pack size (Admin/Marketing only)
router.put('/pack-sizes/:id', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const packSize = await PackSize.findByPk(req.params.id);
    if (!packSize) {
      return res.status(404).json({ error: 'Pack size not found' });
    }
    
    const { pack_size, short_name, display_order, status } = req.body;
    await packSize.update({
      pack_size: pack_size || packSize.pack_size,
      short_name: short_name || packSize.short_name,
      display_order: display_order || packSize.display_order,
      status: status || packSize.status,
      updated_by: req.user.id
    });
    
    res.json(packSize);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete pack size (Admin only)
router.delete('/pack-sizes/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const packSize = await PackSize.findByPk(req.params.id);
    if (!packSize) {
      return res.status(404).json({ error: 'Pack size not found' });
    }
    
    // Check if there are any products associated with this pack size
    const associatedProducts = await Product.count({
      where: { pack_size_id: req.params.id }
    });
    
    if (associatedProducts > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this pack size. There are ${associatedProducts} product(s) associated with it.` 
      });
    }
    
    await packSize.destroy();
    res.json({ message: 'Pack size deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== BRAND GROUP MASTER ROUTES ====================

// Get all brand groups (View - All roles)
router.get('/brand-groups', async (req, res) => {
  try {
    const { status, division_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (division_id) where.division_id = division_id;
    
    const brandGroups = await BrandGroup.findAll({
      where,
      include: [
        { model: Division, as: 'division', attributes: ['id', 'division_name', 'short_name'] }
      ],
      order: [['brand_group_name', 'ASC']]
    });
    res.json(brandGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single brand group
router.get('/brand-groups/:id', async (req, res) => {
  try {
    const brandGroup = await BrandGroup.findByPk(req.params.id, {
      include: [
        { model: Division, as: 'division' }
      ]
    });
    if (!brandGroup) {
      return res.status(404).json({ error: 'Brand group not found' });
    }
    res.json(brandGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create brand group (Admin/Marketing only)
router.post('/brand-groups', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const { brand_group_name, short_name, description, division_id } = req.body;
    
    const brandGroup = await BrandGroup.create({
      brand_group_name,
      short_name,
      description,
      division_id,
      created_by: req.user.id
    });
    
    res.status(201).json(brandGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update brand group (Admin/Marketing only)
router.put('/brand-groups/:id', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const brandGroup = await BrandGroup.findByPk(req.params.id);
    if (!brandGroup) {
      return res.status(404).json({ error: 'Brand group not found' });
    }
    
    const { brand_group_name, short_name, description, division_id, status } = req.body;
    await brandGroup.update({
      brand_group_name: brand_group_name || brandGroup.brand_group_name,
      short_name: short_name || brandGroup.short_name,
      description: description || brandGroup.description,
      division_id: division_id !== undefined ? division_id : brandGroup.division_id,
      status: status || brandGroup.status,
      updated_by: req.user.id
    });
    
    res.json(brandGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete brand group (Admin only)
router.delete('/brand-groups/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const brandGroup = await BrandGroup.findByPk(req.params.id);
    if (!brandGroup) {
      return res.status(404).json({ error: 'Brand group not found' });
    }
    
    // Check if there are any products associated with this brand group
    const associatedProducts = await Product.count({
      where: { brand_group_id: req.params.id }
    });
    
    if (associatedProducts > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this brand group. There are ${associatedProducts} product(s) associated with it.` 
      });
    }
    
    await brandGroup.destroy();
    res.json({ message: 'Brand group deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== STRENGTH MASTER ROUTES ====================

// Get all strengths (View - All roles)
router.get('/strengths', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const strengths = await Strength.findAll({
      where,
      order: [['display_order', 'ASC'], ['strength_value', 'ASC']]
    });
    res.json(strengths);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single strength
router.get('/strengths/:id', async (req, res) => {
  try {
    const strength = await Strength.findByPk(req.params.id);
    if (!strength) {
      return res.status(404).json({ error: 'Strength not found' });
    }
    res.json(strength);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create strength (Admin/Marketing only)
router.post('/strengths', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const { strength_value, unit, short_name, display_order } = req.body;
    
    const strength = await Strength.create({
      strength_value,
      unit: unit || 'mg',
      short_name,
      display_order: display_order || 0,
      created_by: req.user.id
    });
    
    res.status(201).json(strength);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update strength (Admin/Marketing only)
router.put('/strengths/:id', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const strength = await Strength.findByPk(req.params.id);
    if (!strength) {
      return res.status(404).json({ error: 'Strength not found' });
    }
    
    const { strength_value, unit, short_name, display_order, status } = req.body;
    await strength.update({
      strength_value: strength_value || strength.strength_value,
      unit: unit || strength.unit,
      short_name: short_name || strength.short_name,
      display_order: display_order || strength.display_order,
      status: status || strength.status,
      updated_by: req.user.id
    });
    
    res.json(strength);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete strength (Admin only)
router.delete('/strengths/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const strength = await Strength.findByPk(req.params.id);
    if (!strength) {
      return res.status(404).json({ error: 'Strength not found' });
    }
    
    // Check if there are any products associated with this strength
    const associatedProducts = await Product.count({
      where: { strength_id: req.params.id }
    });
    
    if (associatedProducts > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this strength. There are ${associatedProducts} product(s) associated with it.` 
      });
    }
    
    await strength.destroy();
    res.json({ message: 'Strength deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PRODUCT MASTER ROUTES ====================

// Get all products (View - All roles)
// Rule 2: Inactive products should not appear in call reporting dropdown
router.get('/', async (req, res) => {
  try {
    const { status, division_id, category_id, brand_group_id } = req.query;
    const where = {};
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }
    // If no status filter, default to active for mobile app queries
    if (division_id) where.division_id = division_id;
    if (category_id) where.category_id = category_id;
    if (brand_group_id) where.brand_group_id = brand_group_id;
    
    const products = await Product.findAll({
      where,
      include: [
        { model: Division, as: 'divisionData', attributes: ['id', 'division_name', 'short_name'] },
        { model: BrandGroup, as: 'brandGroupData', attributes: ['id', 'brand_group_name', 'short_name'] },
        { model: ProductCategory, as: 'categoryData', attributes: ['id', 'category_name', 'short_name'] },
        { model: PackSize, as: 'packSizeData', attributes: ['id', 'pack_size', 'short_name'] },
        { model: Strength, as: 'strengthData', attributes: ['id', 'strength_value', 'unit', 'short_name'] }
      ],
      order: [['name', 'ASC']]
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

// Get active products only (for dropdowns in call entry - Rule 2)
router.get('/active', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { status: 'active' },
      include: [
        { model: Division, as: 'divisionData', attributes: ['id', 'division_name', 'short_name'] },
        { model: BrandGroup, as: 'brandGroupData', attributes: ['id', 'brand_group_name', 'short_name'] },
        { model: ProductCategory, as: 'categoryData', attributes: ['id', 'category_name', 'short_name'] },
        { model: PackSize, as: 'packSizeData', attributes: ['id', 'pack_size', 'short_name'] },
        { model: Strength, as: 'strengthData', attributes: ['id', 'strength_value', 'unit', 'short_name'] }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      message: 'Active products retrieved successfully',
      products
    });
  } catch (error) {
    console.error('Get active products error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Division, as: 'divisionData' },
        { model: BrandGroup, as: 'brandGroupData' },
        { model: ProductCategory, as: 'categoryData' },
        { model: PackSize, as: 'packSizeData' },
        { model: Strength, as: 'strengthData' },
        { model: ProductPriceHistory, as: 'priceHistory', order: [['effective_from', 'DESC']], limit: 10 }
      ]
    });

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

// Create new product (Admin/Marketing only - Rule 1: Product ID and Name must be unique)
router.post('/', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const {
      unique_id, name, short_name, code,
      division_id, brand_group_id, category_id, pack_size_id, strength_id,
      ptr, mrp, pts, nrv, launch_date, status,
      // Legacy fields
      description, composition, indications, dosage, hsnCode, gstRate, schedule, therapeuticClass
    } = req.body;

    // Rule 1: Check for duplicate name
    const existingProduct = await Product.findOne({
      where: { name: name }
    });
    if (existingProduct) {
      return res.status(400).json({
        message: 'Product with this name already exists'
      });
    }

    // Check for duplicate unique_id if provided
    if (unique_id) {
      const existingUniqueId = await Product.findOne({
        where: { unique_id: unique_id }
      });
      if (existingUniqueId) {
        return res.status(400).json({
          message: 'Product with this unique ID already exists'
        });
      }
    }

    const product = await Product.create({
      unique_id,
      name,
      short_name,
      code,
      division_id,
      brand_group_id,
      category_id,
      pack_size_id,
      strength_id,
      ptr,
      mrp,
      pts,
      nrv,
      launch_date,
      status: status || 'active',
      // Legacy fields
      description,
      composition,
      indications,
      dosage,
      hsnCode,
      gstRate: gstRate || 18,
      schedule: schedule || 'H',
      therapeuticClass,
      created_by: req.user.id
    });

    // Create initial price history record (Rule 5: Price changes must be tracked with history)
    if (ptr || mrp || pts || nrv) {
      await ProductPriceHistory.create({
        product_id: product.id,
        ptr,
        mrp,
        pts,
        nrv,
        change_reason: 'Initial creation',
        changed_by: req.user.id,
        effective_from: new Date()
      });
    }

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

// Update product (Admin/Marketing only)
router.put('/:id', authenticate, authorize(['ADMIN', 'MARKETING']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const {
      unique_id, name, short_name, code,
      division_id, brand_group_id, category_id, pack_size_id, strength_id,
      ptr, mrp, pts, nrv, launch_date, status,
      // Legacy fields
      description, composition, indications, dosage, hsnCode, gstRate, schedule, therapeuticClass
    } = req.body;

    // Rule 1: Check for duplicate name (excluding current product)
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({
        where: { name: name }
      });
      if (existingProduct) {
        return res.status(400).json({
          message: 'Product with this name already exists'
        });
      }
    }

    // Check for duplicate unique_id (excluding current product)
    if (unique_id && unique_id !== product.unique_id) {
      const existingUniqueId = await Product.findOne({
        where: { unique_id: unique_id }
      });
      if (existingUniqueId) {
        return res.status(400).json({
          message: 'Product with this unique ID already exists'
        });
      }
    }

    // Rule 5: Track price changes
    const priceChanged = (
      (ptr !== undefined && ptr != product.ptr) ||
      (mrp !== undefined && mrp != product.mrp) ||
      (pts !== undefined && pts != product.pts) ||
      (nrv !== undefined && nrv != product.nrv)
    );

    await product.update({
      unique_id: unique_id !== undefined ? unique_id : product.unique_id,
      name: name || product.name,
      short_name: short_name !== undefined ? short_name : product.short_name,
      code: code !== undefined ? code : product.code,
      division_id: division_id !== undefined ? division_id : product.division_id,
      brand_group_id: brand_group_id !== undefined ? brand_group_id : product.brand_group_id,
      category_id: category_id !== undefined ? category_id : product.category_id,
      pack_size_id: pack_size_id !== undefined ? pack_size_id : product.pack_size_id,
      strength_id: strength_id !== undefined ? strength_id : product.strength_id,
      ptr: ptr !== undefined ? ptr : product.ptr,
      mrp: mrp !== undefined ? mrp : product.mrp,
      pts: pts !== undefined ? pts : product.pts,
      nrv: nrv !== undefined ? nrv : product.nrv,
      launch_date: launch_date !== undefined ? launch_date : product.launch_date,
      status: status || product.status,
      // Legacy fields
      description: description !== undefined ? description : product.description,
      composition: composition !== undefined ? composition : product.composition,
      indications: indications !== undefined ? indications : product.indications,
      dosage: dosage !== undefined ? dosage : product.dosage,
      hsnCode: hsnCode !== undefined ? hsnCode : product.hsnCode,
      gstRate: gstRate !== undefined ? gstRate : product.gstRate,
      schedule: schedule !== undefined ? schedule : product.schedule,
      therapeuticClass: therapeuticClass !== undefined ? therapeuticClass : product.therapeuticClass,
      updated_by: req.user.id
    });

    // Create price history record if prices changed
    if (priceChanged) {
      await ProductPriceHistory.create({
        product_id: product.id,
        ptr: ptr !== undefined ? ptr : product.ptr,
        mrp: mrp !== undefined ? mrp : product.mrp,
        pts: pts !== undefined ? pts : product.pts,
        nrv: nrv !== undefined ? nrv : product.nrv,
        change_reason: 'Price update',
        changed_by: req.user.id,
        effective_from: new Date()
      });
    }

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

// Delete product (Admin only - Rule 3: Products cannot be deleted if used in sales or doctor calls)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Rule 3: Check if product is used in sales or doctor calls
    const associatedActivities = await Activity.count({
      where: { product_id: req.params.id }
    });
    
    const associatedSales = await Sale.count({
      where: { product_id: req.params.id }
    });

    if (associatedActivities > 0 || associatedSales > 0) {
      return res.status(400).json({
        message: `Cannot delete this product. It is used in ${associatedActivities} activities and ${associatedSales} sales records.`
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

// Get product price history (Rule 5: Price changes must be tracked with history)
router.get('/:id/price-history', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const priceHistory = await ProductPriceHistory.findAll({
      where: { product_id: req.params.id },
      include: [
        { model: require('./User'), as: 'changedByUser', attributes: ['id', 'name', 'role'] }
      ],
      order: [['effective_from', 'DESC']]
    });

    res.json({
      message: 'Price history retrieved successfully',
      priceHistory
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;