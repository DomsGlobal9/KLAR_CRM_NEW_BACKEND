import { Response } from 'express';
import { roleService } from '../services/role.service';
import { createAuditLog } from '../helpers';
import { AuthRequest } from '../middleware/auth.middleware';

export const roleController = {

    async getAllRoles(req: AuthRequest, res: Response) {
        try {
            const roles = await roleService.getAllRoles();
            res.json({ message: 'Roles fetched successfully', roles });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async createRole(req: AuthRequest, res: Response) {
        try {
            const { name, description, permissions } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Role name is required' });
            }

            const role = await roleService.createRole(
                name,
                description ?? null,
                permissions ?? {},
                req.user!.id
            );

            await createAuditLog({
                user_id: req.user!.id,
                action: 'ROLE_CREATED',
                entity_type: 'role',
                entity_id: role.id,
                new_values: role
            });

            res.status(201).json({ message: 'Role created successfully', role });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateRole(req: AuthRequest, res: Response) {
        try {
            const role = await roleService.updateRole(req.params.id, req.body);

            await createAuditLog({
                user_id: req.user!.id,
                action: 'ROLE_UPDATED',
                entity_type: 'role',
                entity_id: role.id,
                new_values: req.body
            });

            res.json({ message: 'Role updated successfully', role });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteRole(req: AuthRequest, res: Response) {
        try {
            await roleService.deleteRole(req.params.id);

            await createAuditLog({
                user_id: req.user!.id,
                action: 'ROLE_DELETED',
                entity_type: 'role',
                entity_id: req.params.id
            });

            res.json({ message: 'Role deleted successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};
