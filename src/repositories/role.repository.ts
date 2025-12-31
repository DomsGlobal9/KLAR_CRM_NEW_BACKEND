import { supabaseAdmin } from '../config';
import { Role } from '../interfaces/role.interface';

export const roleRepository = {

    async getAll(): Promise<Role[]> {
        const { data, error } = await supabaseAdmin
            .from('roles')
            .select('*')
            .order('name');

        if (error) throw error;
        return data ?? [];
    },

    async getByName(name: string): Promise<Role | null> {
        const { data, error } = await supabaseAdmin
            .from('roles')
            .select('*')
            .eq('name', name)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data ?? null;
    },

    async create(payload: Partial<Role>): Promise<Role> {
        const { data, error } = await supabaseAdmin
            .from('roles')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Role>): Promise<Role> {
        const { data, error } = await supabaseAdmin
            .from('roles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { data: role } = await supabaseAdmin
            .from('roles')
            .select('assigned_people, is_system')
            .eq('id', id)
            .single();

        if (!role) throw new Error('Role not found');
        if (role.is_system) throw new Error('Cannot delete system roles');
        if (role.assigned_people > 0)
            throw new Error('Cannot delete role with assigned users');

        const { error } = await supabaseAdmin
            .from('roles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getRoleByIdOrName(identifier: { id?: string; name?: string }) {

        let query = supabaseAdmin.from('roles').select('*');

        if (identifier.id) query = query.eq('id', identifier.id);
        if (identifier.name) query = query.eq('name', identifier.name);

        const { data, error } = await query.single();

        if (error) throw new Error('Invalid role');
        return data;
    },

    async incrementAssignedCount(roleId: string) {
        const { error } = await supabaseAdmin
            .from('roles')
            .update({ assigned_people: supabaseAdmin.rpc('increment') })
            .eq('id', roleId);

        if (error) throw error;
    },

    async decrementAssignedCount(roleId: string) {
        const { error } = await supabaseAdmin
            .from('roles')
            .update({ assigned_people: supabaseAdmin.rpc('decrement') })
            .eq('id', roleId);

        if (error) throw error;
    },
};
