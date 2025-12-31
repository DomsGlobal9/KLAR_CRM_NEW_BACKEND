import { roleRepository } from '../repositories/role.repository';

export const roleService = {

    async getAllRoles() {
        return roleRepository.getAll();
    },

    async createRole(
        name: string,
        description: string | null,
        permissions: any,
        userId: string
    ) {
        const existing = await roleRepository.getByName(name);
        if (existing) {
            throw new Error('Role with this name already exists');
        }

        return roleRepository.create({
            name,
            description,
            permissions,
            created_by: userId,
            is_system: false
        });
    },

    async updateRole(
        id: string,
        updates: { name?: string; description?: string; permissions?: any }
    ) {
        if (updates.name) {
            const existing = await roleRepository.getByName(updates.name);
            if (existing && existing.id !== id) {
                throw new Error('Another role with this name already exists');
            }
        }

        return roleRepository.update(id, updates);
    },

    async deleteRole(id: string) {
        return roleRepository.delete(id);
    }
};
