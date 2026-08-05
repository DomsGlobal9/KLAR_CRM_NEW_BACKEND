import { supabaseAdmin } from '../config';

export type RoleScreenPermissions = Record<string, Record<string, boolean>>;

export const screenPermissionsRepository = {
  async getAllPermissions(): Promise<RoleScreenPermissions> {
    try {
      const { data, error } = await supabaseAdmin
        .from('role_screen_permissions')
        .select('*');

      if (error) {
        console.warn('Failed to fetch role_screen_permissions table, fallback to empty object:', error.message);
        return {};
      }

      const permissions: RoleScreenPermissions = {};
      if (Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.role && row.permissions) {
            permissions[row.role] = row.permissions;
          }
        });
      }

      return permissions;
    } catch (err: any) {
      console.error('Error in getAllPermissions repository:', err.message);
      return {};
    }
  },

  async savePermissions(permissionsMap: RoleScreenPermissions): Promise<RoleScreenPermissions> {
    try {
      const records = Object.entries(permissionsMap).map(([role, perms]) => ({
        role,
        permissions: perms,
        updated_at: new Date().toISOString(),
      }));

      if (records.length === 0) {
        return {};
      }

      const { error } = await supabaseAdmin
        .from('role_screen_permissions')
        .upsert(records, { onConflict: 'role' });

      if (error) {
        console.error('Failed to upsert role_screen_permissions:', error.message);
        throw error;
      }

      return permissionsMap;
    } catch (err: any) {
      console.error('Error in savePermissions repository:', err.message);
      throw err;
    }
  },
};
