import { CreateTeamMemberPayload, UpdateTeamMemberPayload } from '../interfaces';
import {
    teamMemberRepository,
    roleRepository,
    teamRepository
} from '../repositories';

export const teamMemberService = {

    /**
     * Add a new team member
     */
    async addTeamMember(payload: CreateTeamMemberPayload) {
        // Get role by ID
        const role = await roleRepository.getById(payload.role_id);
        if (!role) throw new Error('Role not found');

        // Check if role is superadmin
        if (role.name === 'superadmin') {
            throw new Error('Cannot create superadmin');
        }

        // Validate team exists if team_id is provided
        if (payload.team_id) {
            const team = await teamRepository.getById(payload.team_id);
            if (!team) throw new Error('Team not found');
        }

        // Check for existing email
        const existingByEmail = await teamMemberRepository.getUserByEmail(payload.email);
        if (existingByEmail) {
            throw new Error('Email already exists');
        }

        // Check for existing username
        const existingByUsername = await teamMemberRepository.getUserByUsername(payload.username);
        if (existingByUsername) {
            throw new Error('Username already exists');
        }

        const { data, error } = await teamMemberRepository.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true,
            user_metadata: {
                username: payload.username,
                role_name: role.name,
                role_id: payload.role_id,
                team_id: payload.team_id ?? null,
                email_verified: true
            }
        });

        if (error || !data.user) {
            throw new Error('User creation failed: ' + (error?.message || 'Unknown error'));
        }

        // Update role assigned count
        await roleRepository.incrementAssignedCount(payload.role_id);

        // Update team members count if assigned to a team
        if (payload.team_id) {
            await teamRepository.incrementMembersCount(payload.team_id);
        }

        return {
            ...data.user,
            role,
            team: payload.team_id ? await teamRepository.getById(payload.team_id) : null
        };
    },

    /**
     * Get all team members with role and team details
     */
    async getAllTeamMembers() {
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        const users = data.users.filter(
            u => u.user_metadata?.role_name && u.user_metadata.role_name !== 'superadmin'
        );

        // Fetch all roles and teams for efficiency
        const roles = await roleRepository.getAll();
        const teams = await teamRepository.getAll();

        return users.map(user => {
            const role = roles.find(r => r.id === user.user_metadata?.role_id);
            const team = teams.find(t => t.id === user.user_metadata?.team_id);

            return {
                id: user.id,
                email: user.email,
                username: user.user_metadata?.username,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                role: role ? { id: role.id, name: role.name } : null,
                team: team ? { id: team.id, name: team.name } : null,
                user_metadata: user.user_metadata
            };
        });
    },

    /**
     * Get members by team ID
     */
    async getMembersByTeam(teamId: string) {
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        const users = data.users.filter(u => u.user_metadata?.team_id === teamId);
        const roles = await roleRepository.getAll();

        return users.map(user => {
            const role = roles.find(r => r.id === user.user_metadata?.role_id);

            return {
                id: user.id,
                email: user.email,
                username: user.user_metadata?.username,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                role: role ? { id: role.id, name: role.name } : null,
                user_metadata: user.user_metadata
            };
        });
    },

    /**
     * Get unassigned members
     */
    async getUnassignedMembers() {
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        const users = data.users.filter(
            u => !u.user_metadata?.team_id &&
                u.user_metadata?.role_name !== 'superadmin'
        );

        const roles = await roleRepository.getAll();

        return users.map(user => {
            const role = roles.find(r => r.id === user.user_metadata?.role_id);

            return {
                id: user.id,
                email: user.email,
                username: user.user_metadata?.username,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                role: role ? { id: role.id, name: role.name } : null,
                user_metadata: user.user_metadata
            };
        });
    },

    /**
     * Update team member details
     */
    async updateTeamMember(userId: string, payload: UpdateTeamMemberPayload) {
        const { data: usersData, error: listError } = await teamMemberRepository.listUsers();
        if (listError) throw listError;

        const user = usersData.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        if (user.user_metadata?.role_name === 'superadmin') {
            throw new Error('Cannot modify superadmin');
        }

        // Get the current metadata, handling the nested structure
        let currentMetadata = user.user_metadata;

        // If metadata is nested (like in your example), extract the inner metadata
        if (currentMetadata?.user_metadata) {
            currentMetadata = currentMetadata.user_metadata;
        }

        const oldRoleId = currentMetadata?.role_id;
        const oldTeamId = currentMetadata?.team_id;
        const updateMetadata: any = {};

        // Handle role update
        if (payload.role_id && payload.role_id !== oldRoleId) {
            const newRole = await roleRepository.getById(payload.role_id);
            if (!newRole) throw new Error('Role not found');

            if (newRole.name === 'superadmin') {
                throw new Error('Cannot assign superadmin role');
            }

            updateMetadata.role_id = payload.role_id;
            updateMetadata.role_name = newRole.name;

            // Update role assigned counts
            if (oldRoleId) {
                await roleRepository.decrementAssignedCount(oldRoleId);
            }
            await roleRepository.incrementAssignedCount(payload.role_id);
        }

        // Handle team update
        if (payload.team_id !== undefined && payload.team_id !== oldTeamId) {
            if (payload.team_id) {
                // Validate new team exists
                const newTeam = await teamRepository.getById(payload.team_id);
                if (!newTeam) throw new Error('Team not found');
            }

            updateMetadata.team_id = payload.team_id;

            // Update team members counts
            if (oldTeamId) {
                await teamRepository.decrementMembersCount(oldTeamId);
            }
            if (payload.team_id) {
                await teamRepository.incrementMembersCount(payload.team_id);
            }
        }

        // Prepare metadata for update - merge with existing metadata
        const newMetadata = {
            ...currentMetadata,
            ...updateMetadata
        };

        // Update user metadata
        const { data, error } = await teamMemberRepository.updateUser(userId, {
            user_metadata: newMetadata
        });

        if (error) throw error;

        // Return enriched data - also handle nested structure in response
        const updatedUser = data.user;
        let userMetadata = updatedUser.user_metadata;

        // If metadata is nested, use the inner one
        if (userMetadata?.user_metadata) {
            userMetadata = userMetadata.user_metadata;
        }

        const roleId = userMetadata?.role_id;
        const teamId = userMetadata?.team_id;

        const role = roleId ? await roleRepository.getById(roleId) : null;
        const team = teamId ? await teamRepository.getById(teamId) : null;

        return {
            ...updatedUser,
            user_metadata: userMetadata,  // Return cleaned metadata
            role: role ? { id: role.id, name: role.name } : null,
            team: team ? { id: team.id, name: team.name } : null
        };
    },

    /**
     * Remove a team member
     */
    async removeTeamMember(userId: string) {
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        const user = data.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        if (user.user_metadata?.role_name === 'superadmin') {
            throw new Error('Cannot delete superadmin');
        }

        const roleId = user.user_metadata?.role_id;
        const teamId = user.user_metadata?.team_id;

        // Decrement counts before deleting user
        if (roleId) {
            await roleRepository.decrementAssignedCount(roleId);
        }

        if (teamId) {
            await teamRepository.decrementMembersCount(teamId);
        }

        // Delete the user
        const { error: deleteError } = await teamMemberRepository.deleteUser(userId);
        if (deleteError) throw deleteError;
    },

    /**
     * Get team member by ID
     */
    async getTeamMemberById(userId: string) {
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        const user = data.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        const role = user.user_metadata?.role_id
            ? await roleRepository.getById(user.user_metadata.role_id)
            : null;

        const team = user.user_metadata?.team_id
            ? await teamRepository.getById(user.user_metadata.team_id)
            : null;

        return {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            role: role ? { id: role.id, name: role.name } : null,
            team: team ? { id: team.id, name: team.name } : null,
            user_metadata: user.user_metadata
        };
    }
};