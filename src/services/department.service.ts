import { departmentRepository } from '../repositories';
import { CreateDepartmentDTO, UpdateDepartmentDTO, EnrichedDepartment } from '../interfaces/department.interface';

export const departmentService = {

    /**
     * Create a new department
     * @param payload 
     * @returns 
     */
    async createDepartment(payload: CreateDepartmentDTO): Promise<EnrichedDepartment> {
        if (!payload.name || payload.name.trim() === '') {
            throw new Error('Department name is required');
        }

        const dept = await departmentRepository.createDepartment(
            payload.name.trim(),
            payload.description?.trim(),
            payload.admin_ids || [],
            payload.team_ids || [],
            payload.service_ids || []
        );

        return await this.getDepartmentById(dept.id);
    },

    /**
     * List departments with enriched admin, team & service details, plus pagination & stats
     * @param params 
     * @returns 
     */
    async listDepartments(params?: { page?: number; limit?: number; search?: string; status?: string }) {
        const { departments: rawDepartments, pagination, stats } = await departmentRepository.listDepartments(params);

        const enrichedDepartments = await Promise.all(
            rawDepartments.map(async (dept) => {
                const admins = await departmentRepository.getAdminsByIds(dept.admin_ids || []);
                const teams = await departmentRepository.getTeamsByIds(dept.team_ids || []);
                const services = await departmentRepository.getServicesByIds(dept.service_ids || []);

                const adminNames = admins.map(a => a.full_name || a.email || a.id).join(', ');
                const teamNames = teams.map(t => t.name).join(', ');
                const serviceNames = services.map(s => s.name).join(', ');

                return {
                    ...dept,
                    admins,
                    teams,
                    services,
                    admin_names: adminNames,
                    team_names: teamNames,
                    service_names: serviceNames,
                    admin_count: admins.length,
                    team_count: teams.length,
                    service_count: services.length
                };
            })
        );

        return {
            departments: enrichedDepartments,
            pagination,
            stats
        };
    },

    /**
     * Get single department by ID with enriched details
     * @param id 
     * @returns 
     */
    async getDepartmentById(id: string): Promise<EnrichedDepartment> {
        const dept = await departmentRepository.getById(id);
        if (!dept) {
            throw new Error(`Department with ID ${id} not found`);
        }

        const admins = await departmentRepository.getAdminsByIds(dept.admin_ids || []);
        const teams = await departmentRepository.getTeamsByIds(dept.team_ids || []);
        const services = await departmentRepository.getServicesByIds(dept.service_ids || []);

        const adminNames = admins.map(a => a.full_name || a.email || a.id).join(', ');
        const teamNames = teams.map(t => t.name).join(', ');
        const serviceNames = services.map(s => s.name).join(', ');

        return {
            ...dept,
            admins,
            teams,
            services,
            admin_names: adminNames,
            team_names: teamNames,
            service_names: serviceNames,
            admin_count: admins.length,
            team_count: teams.length,
            service_count: services.length
        };
    },

    /**
     * Update department details
     * @param id 
     * @param payload 
     * @returns 
     */
    async updateDepartment(id: string, payload: UpdateDepartmentDTO) {
        const existingDept = await departmentRepository.getById(id);
        if (!existingDept) {
            throw new Error(`Department with ID ${id} not found`);
        }

        const updateData: {
            name?: string;
            description?: string;
            admin_ids?: string[];
            team_ids?: string[];
            service_ids?: string[];
            is_active?: boolean;
        } = {};

        if (payload.name !== undefined) {
            updateData.name = payload.name.trim();
        }
        if (payload.description !== undefined) {
            updateData.description = payload.description.trim();
        }
        if (payload.admin_ids !== undefined) {
            updateData.admin_ids = payload.admin_ids;
        }
        if (payload.team_ids !== undefined) {
            updateData.team_ids = payload.team_ids;
        }
        if (payload.service_ids !== undefined) {
            updateData.service_ids = payload.service_ids;
        }
        if (payload.is_active !== undefined) {
            updateData.is_active = payload.is_active;
        }

        await departmentRepository.updateDepartment(id, updateData);
        return await this.getDepartmentById(id);
    },

    /**
     * Delete department
     * @param id 
     * @param requester 
     * @returns 
     */
    async deleteDepartment(id: string, requester?: any) {
        const existingDept = await departmentRepository.getById(id);
        if (!existingDept) {
            throw new Error(`Department with ID ${id} not found`);
        }

        return await departmentRepository.deleteDepartment(id);
    }
};
