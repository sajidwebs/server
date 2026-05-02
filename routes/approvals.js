const express = require('express');
const router = express.Router();
const { ApprovalQueue, ApprovalHistory, Doctor, Chemist, Territory, Headquarter, Patch, Stockist, Hospital, SVL, InputAllocation, NoticeUpload, SOPPolicy, RateFixation, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Role hierarchy levels
const ROLE_LEVELS = {
  'ADMIN': 0,
  'NSM': 5,
  'ZSM': 4,
  'RSM': 3,
  'ABM': 2,
  'TBM': 1
};

// Get next approval level based on current level
const getNextApprovalLevel = (currentLevel) => {
  return currentLevel + 1;
};

// Get approval level for a role
const getRoleLevel = (role) => {
  return ROLE_LEVELS[role] || 0;
};

// Submit data for approval
router.post('/submit/:entityType/:entityId', authenticate, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { actionType, data } = req.body;
    
    const userRole = req.user.role;
    const userLevel = getRoleLevel(userRole);
    
    // Determine starting approval level based on user role
    let startingLevel = userLevel;
    if (userRole === 'ADMIN') {
      // Admin directly approves
      startingLevel = 0;
    }
    
    // Create approval queue entry
    const approval = await ApprovalQueue.create({
      entity_type: entityType,
      entity_id: entityId,
      submitted_by: req.user.id,
      submitted_by_role: userRole,
      action_type: actionType || 'create',
      current_level: startingLevel,
      status: userRole === 'ADMIN' ? 'approved' : 'pending',
      data_snapshot: data
    });
    
    // If admin, immediately process the approval
    if (userRole === 'ADMIN') {
      await processEntityApproval(entityType, entityId, 'approved');
    }
    
    res.status(201).json({
      message: 'Submitted for approval',
      approval_id: approval.id,
      status: approval.status
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending approvals for current user
router.get('/pending', authenticate, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userLevel = getRoleLevel(userRole);
    
    // Get all pending approvals that need this user's level
    const approvals = await ApprovalQueue.findAll({
      where: {
        status: 'pending'
      },
      include: [
        { model: User, as: 'submitter', attributes: ['id', 'firstName', 'lastName', 'role'] }
      ],
      order: [['submitted_date', 'DESC']]
    });
    
    // Filter approvals based on user level (user can approve if their level = current_level + 1)
    const actionableApprovals = approvals.filter(approval => {
      return approval.current_level + 1 === userLevel;
    });
    
    res.json(actionableApprovals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pending approvals (for dashboard)
router.get('/all-pending', authenticate, authorize(['ADMIN', 'NSM', 'ZSM', 'RSM', 'ABM']), async (req, res) => {
  try {
    const approvals = await ApprovalQueue.findAll({
      where: {
        status: 'pending'
      },
      include: [
        { model: User, as: 'submitter', attributes: ['id', 'firstName', 'lastName', 'role'] }
      ],
      order: [['submitted_date', 'DESC']]
    });
    
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve an item
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    const approval = await ApprovalQueue.findByPk(id, {
      include: [
        { model: User, as: 'submitter', attributes: ['id', 'firstName', 'lastName', 'role'] }
      ]
    });
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'This item is no longer pending' });
    }
    
    const userRole = req.user.role;
    const userLevel = getRoleLevel(userRole);
    const requiredLevel = approval.current_level + 1;
    
    // Check if user is authorized to approve at this level
    if (userLevel !== requiredLevel && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to approve at this level' });
    }
    
    // Record approval history
    await ApprovalHistory.create({
      approval_queue_id: approval.id,
      approver_id: req.user.id,
      approver_role: userRole,
      action: 'approved',
      comments: comments || '',
      level: userLevel
    });
    
    // Check if this is the final approval level (NSM = 5)
    const nextLevel = getNextApprovalLevel(approval.current_level);
    
    if (nextLevel > 5 || userRole === 'ADMIN') {
      // Final approval reached - update entity status
      approval.status = 'approved';
      await approval.save();
      
      // Process the actual entity
      await processEntityApproval(approval.entity_type, approval.entity_id, 'approved');
      
      res.json({
        message: 'Approved successfully',
        approval_id: approval.id,
        status: 'approved'
      });
    } else {
      // Move to next approval level
      approval.current_level = nextLevel;
      approval.updated_date = new Date();
      await approval.save();
      
      res.json({
        message: 'Approved, moved to next level',
        approval_id: approval.id,
        next_level: nextLevel
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject an item
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    const approval = await ApprovalQueue.findByPk(id);
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'This item is no longer pending' });
    }
    
    const userRole = req.user.role;
    const userLevel = getRoleLevel(userRole);
    const requiredLevel = approval.current_level + 1;
    
    // Check if user is authorized to reject at this level
    if (userLevel !== requiredLevel && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to reject at this level' });
    }
    
    // Record rejection history
    await ApprovalHistory.create({
      approval_queue_id: approval.id,
      approver_id: req.user.id,
      approver_role: userRole,
      action: 'rejected',
      comments: comments || '',
      level: userLevel
    });
    
    // Update approval status
    approval.status = 'rejected';
    approval.rejection_reason = comments || 'Rejected by approver';
    await approval.save();
    
    res.json({
      message: 'Rejected',
      approval_id: approval.id,
      status: 'rejected'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get approval history for an entity
router.get('/history/:entityType/:entityId', authenticate, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const approval = await ApprovalQueue.findOne({
      where: {
        entity_type: entityType,
        entity_id: entityId
      },
      include: [
        { model: User, as: 'submitter', attributes: ['id', 'firstName', 'lastName', 'role'] }
      ]
    });
    
    if (!approval) {
      return res.status(404).json({ error: 'No approval history found' });
    }
    
    const history = await ApprovalHistory.findAll({
      where: {
        approval_queue_id: approval.id
      },
      include: [
        { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName', 'role'] }
      ],
      order: [['action_date', 'ASC']]
    });
    
    res.json({
      approval,
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to process entity after final approval
async function processEntityApproval(entityType, entityId, status) {
  const modelMap = {
    doctor: Doctor,
    chemist: Chemist,
    territory: Territory,
    headquarter: Headquarter,
    patch: Patch,
    stockist: Stockist,
    hospital: Hospital,
    svl: SVL,
    input_allocation: InputAllocation,
    notice: NoticeUpload,
    sop_policy: SOPPolicy,
    rate_fixation: RateFixation
  };

  const model = modelMap[entityType];
  if (model && status === 'approved') {
    const update = { isActive: true };
    if (entityType === 'doctor') update.approval_status = 'approved';
    await model.update(update, { where: { id: entityId } });
    return;
  }

  switch (entityType) {
    case 'doctor':
      if (status === 'approved') {
        await Doctor.update(
          { isActive: true, approval_status: 'approved' },
          { where: { id: entityId } }
        );
      }
      break;
    case 'chemist':
      // Process chemist approval
      break;
    case 'territory':
      // Process territory approval
      break;
    case 'headquarter':
      // Process headquarter approval
      break;
    case 'hospital':
      // Process hospital approval
      break;
    default:
      break;
  }
}

module.exports = router;
