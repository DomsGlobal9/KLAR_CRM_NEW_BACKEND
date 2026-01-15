import { Request, Response } from 'express';
import { roleService } from '../services/role.service';

export const roleController = {
    async getAllRoles(req: Request, res: Response) {
        try {
            const roles = await roleService.getAllRoles();
            res.json({ message: 'Roles fetched successfully', roles });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getRoleIdNames(req: Request, res: Response) {
        try {
            const roles = await roleService.getAllRoleIdNames();
            res.json({
                success: true,
                message: 'Role id & names fetched successfully',
                roles
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async createRole(req: Request, res: Response) {
        try {
            const { name, description, permissions } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Role name is required' });
            }
            const role = await roleService.createRole(
                name,
                description ?? null,
                permissions ?? {}
            );
            // Audit log removed (no user context available)
            res.status(201).json({ message: 'Role created successfully', role });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateRole(req: Request, res: Response) {
        try {
            const role = await roleService.updateRole(req.params.id as string, req.body);
            // Audit log removed
            res.json({ message: 'Role updated successfully', role });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteRole(req: Request, res: Response) {
        try {
            await roleService.deleteRole(req.params.id as string);
            // Audit log removed
            res.json({ message: 'Role deleted successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};