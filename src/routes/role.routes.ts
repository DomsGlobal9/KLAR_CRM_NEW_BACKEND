import express from 'express';
import { roleController } from '../controllers';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * All role routes are protected and only accessible by superadmin
 */

/**
 * Create a new role
 */
router.post('/', authenticate, requireRole('superadmin'), roleController.createRole);

/**
 * Get all roles
 */
router.get('/', authenticate, requireRole('superadmin'), roleController.getAllRoles);

/**
 * Get a role by ID
 */
router.put('/:id', authenticate, requireRole('superadmin'), roleController.updateRole);

/**
 * Delete a role by ID
 */
router.delete('/:id', authenticate, requireRole('superadmin'), roleController.deleteRole);

export default router;