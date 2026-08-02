import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { departmentService } from '../services/department.service';
import { createAuditLog } from '../helpers';

export const departmentController = {

    /**
     * Create a new department
     */
    async create(req: AuthRequest, res: Response) {
        try {
            const department = await departmentService.createDepartment(req.body);

            try {
                await createAuditLog({
                    user_id: req.user?.id,
                    action: 'DEPARTMENT_CREATED',
                    entity_type: 'department',
                    entity_id: department.id
                });
            } catch (auditErr) {
                console.warn('Failed to write audit log:', auditErr);
            }

            return res.status(201).json({
                success: true,
                message: 'Department created successfully',
                data: department
            });
        } catch (err: any) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Failed to create department'
            });
        }
    },

    /**
     * List all departments with enriched details
     */
    async list(req: AuthRequest, res: Response) {
        try {
            const departments = await departmentService.listDepartments();

            return res.status(200).json({
                success: true,
                data: departments
            });
        } catch (err: any) {
            return res.status(500).json({
                success: false,
                message: err.message || 'Failed to fetch departments'
            });
        }
    },

    /**
     * Get single department by ID
     */
    async getById(req: AuthRequest, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const department = await departmentService.getDepartmentById(id);

            return res.status(200).json({
                success: true,
                data: department
            });
        } catch (err: any) {
            return res.status(404).json({
                success: false,
                message: err.message || 'Department not found'
            });
        }
    },

    /**
     * Update department details
     */
    async update(req: AuthRequest, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const updatedDepartment = await departmentService.updateDepartment(id, req.body);

            try {
                await createAuditLog({
                    user_id: req.user?.id,
                    action: 'DEPARTMENT_UPDATED',
                    entity_type: 'department',
                    entity_id: id
                });
            } catch (auditErr) {
                console.warn('Failed to write audit log:', auditErr);
            }

            return res.status(200).json({
                success: true,
                message: 'Department updated successfully',
                data: updatedDepartment
            });
        } catch (err: any) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Failed to update department'
            });
        }
    },

    /**
     * Delete department
     */
    async delete(req: AuthRequest, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            await departmentService.deleteDepartment(id, req.user);

            try {
                await createAuditLog({
                    user_id: req.user?.id,
                    action: 'DEPARTMENT_DELETED',
                    entity_type: 'department',
                    entity_id: id
                });
            } catch (auditErr) {
                console.warn('Failed to write audit log:', auditErr);
            }

            return res.status(200).json({
                success: true,
                message: 'Department deleted successfully'
            });
        } catch (err: any) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Failed to delete department'
            });
        }
    }
};
