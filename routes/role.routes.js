const express = require('express');
const router = express.Router();
const { Role, Permission, RolePermission, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== ROLE ROUTES ====================

// Get all roles
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const roles = await Role.findAll({
      where,
      order: [['hierarchy_level', 'DESC']]
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single role with permissions
router.get('/:id', authenticate, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        { model: Permission, as: 'permissions', through: { attributes: [] } }
      ]
    });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create role (Admin only)
router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { role_name, short_name, description, hierarchy_level, status } = req.body;
    const role = await Role.create({
      role_name,
      short_name,
      description,
      hierarchy_level: hierarchy_level || 0,
      status: status || 'active',
      created_by: req.user.id
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update role (Admin only)
router.put('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const { role_name, short_name, description, hierarchy_level, status } = req.body;
    await role.update({
      role_name: role_name || role.role_name,
      short_name: short_name !== undefined ? short_name : role.short_name,
      description: description !== undefined ? description : role.description,
      hierarchy_level: hierarchy_level !== undefined ? hierarchy_level : role.hierarchy_level,
      status: status || role.status,
      updated_by: req.user.id
    });
    res.json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete role (Admin only)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const associatedUsers = await User.count({ where: { role_id: req.params.id } });
    if (associatedUsers > 0) {
      return res.status(400).json({ error: `Cannot delete role. ${associatedUsers} user(s) are assigned to it.` });
    }

    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PERMISSION ROUTES ====================

// Get all permissions
router.get('/permissions/all', authenticate, async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['action', 'ASC']]
    });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create permission (Admin only)
router.post('/permissions', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { module, action, description, status } = req.body;
    const permission = await Permission.create({
      module,
      action,
      description,
      status: status || 'active',
      created_by: req.user.id
    });
    res.status(201).json(permission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ROLE-PERMISSION ASSIGNMENT ====================

// Assign permissions to a role
router.post('/:id/permissions', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const { permission_ids } = req.body;
    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({ error: 'permission_ids must be an array' });
    }

    // Remove existing permissions for this role
    await RolePermission.destroy({ where: { role_id: role.id } });

    // Assign new permissions
    const assignments = permission_ids.map(pid => ({
      role_id: role.id,
      permission_id: pid
    }));
    await RolePermission.bulkCreate(assignments);

    res.json({ message: 'Permissions assigned successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get permissions for a role
router.get('/:id/permissions', authenticate, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        { model: Permission, as: 'permissions', through: { attributes: [] } }
      ]
    });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role.permissions || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
