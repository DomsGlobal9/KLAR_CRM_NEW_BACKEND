import express from 'express';
import { roleController } from '../controllers';

const router = express.Router();

/**
 * All role routes are protected and only accessible by superadmin
 */

/**
 * Create a new role
 */
router.post('/', roleController.createRole);

/**
 * Get all roles
 */
router.get('/', roleController.getAllRoles);

/**
 * Get a role by ID
 */
router.put('/:id', roleController.updateRole);

/*
 * Delete a role by ID
 */
router.delete('/:id', roleController.deleteRole);

export default router;