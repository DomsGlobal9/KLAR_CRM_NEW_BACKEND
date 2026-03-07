import { CreateTeamMemberPayload, UpdateTeamMemberPayload } from '../interfaces';
import { otpService } from '../services';
import {
    teamMemberRepository,
    roleRepository,
    teamRepository
} from '../repositories';
import { supabaseAdmin } from '../config';

/**
 * Temporary storage for pending member creation (in-memory or Redis in production)
 */
const pendingMemberCreations = new Map<string, {
    role_id: string;
    team_id: string | null;
    requested_by: string;
    expires_at: number;
}>();

export const teamMemberService = {

    /**
    * Validate that a team doesn't already have a Team Lead
    */
    async validateTeamLeadLimit(teamId: string, excludeUserId?: string) {
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        console.log(`Validating TL limit for team: ${teamId}`);
        console.log(`Total users: ${data.users.length}`);

        const existingTL = data.users.find(u => {
            if (excludeUserId && u.id === excludeUserId) return false;

            // Handle nested metadata properly
            const metadata = u.user_metadata?.user_metadata || u.user_metadata;

            // Check if this user has the TL role and belongs to the team
            const hasTLRole = metadata?.role_name === 'tl';
            const belongsToTeam = metadata?.team_id === teamId;

            if (hasTLRole && belongsToTeam) {
                console.log(`Found existing TL: ${u.email} for team: ${teamId}`);
                return true;
            }
            return false;
        });

        if (existingTL) {
            throw new Error(`Team has already Team Lead.`);
        }
        console.log(`No existing TL found for team: ${teamId}`);
    },

    /**
     * Add a new team member
     */
    async addTeamMember(payload: CreateTeamMemberPayload) {

        const role = await roleRepository.getById(payload.role_id);
        if (!role) throw new Error('Role not found');


        if (role.name === 'superadmin') {
            throw new Error('Cannot create superadmin');
        }

        if (role.name === 'tl' && payload.team_id) {
            await this.validateTeamLeadLimit(payload.team_id);
        }


        if (payload.team_id) {
            const team = await teamRepository.getById(payload.team_id);
            if (!team) throw new Error('Team not found');
        }


        const existingByEmail = await teamMemberRepository.getUserByEmail(payload.email);
        if (existingByEmail) {
            throw new Error('Email already exists');
        }


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


        await roleRepository.incrementAssignedCount(payload.role_id);


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
    async getAllTeamMembers(currentUser?: any) {
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        let filteredUsers = data.users.filter(
            u => u.user_metadata?.role_name && u.user_metadata.role_name !== 'superadmin'
        );

        if (currentUser) {
            const userRole = currentUser.role;

            if (userRole === 'tl') {
                const { data: userData } = await supabaseAdmin
                    .from('users')
                    .select('team_id')
                    .eq('id', currentUser.id)
                    .single();

                if (userData?.team_id) {
                    filteredUsers = filteredUsers.filter(u =>
                        u.user_metadata?.team_id === userData.team_id &&
                        u.user_metadata?.role_name === 'rm'
                    );
                } else {
                    filteredUsers = [];
                }
            } else if (userRole === 'rm') {
                filteredUsers = filteredUsers.filter(u => u.id === currentUser.id);
            }
        }

        const roles = await roleRepository.getAll();
        const teams = await teamRepository.getAll();

        return filteredUsers.map(user => ({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            role: roles.find(r => r.id === user.user_metadata?.role_id) || null,
            team: teams.find(t => t.id === user.user_metadata?.team_id) || null,
            user_metadata: user.user_metadata
        }));
    },

    applyRoleFilters(users: any[], currentUser?: any) {
        if (!currentUser || !currentUser.role) return users;

        switch (currentUser.role) {
            case 'admin':
                return users.filter(u =>
                    u.user_metadata?.role_name === 'rm' ||
                    u.user_metadata?.role_name === 'tl'
                );

            case 'rm':
                return users.filter(u => u.user_metadata?.assigned_rm === currentUser.id);

            case 'superadmin':
                return users;

            default:
                return users.filter(u => u.user_metadata?.role_name === currentUser.role);
        }
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


        let currentMetadata = user.user_metadata;


        if (currentMetadata?.user_metadata) {
            currentMetadata = currentMetadata.user_metadata;
        }

        const oldRoleId = currentMetadata?.role_id;
        const oldRoleName = currentMetadata?.role_name;
        const oldTeamId = currentMetadata?.team_id;
        const updateMetadata: any = {};


        if (payload.role_id && payload.role_id !== oldRoleId) {
            const newRole = await roleRepository.getById(payload.role_id);
            if (!newRole) throw new Error('Role not found');

            if (newRole.name === 'superadmin') {
                throw new Error('Cannot assign superadmin role');
            }

            if (newRole.name === 'tl') {
                const targetTeamId = payload.team_id !== undefined ? payload.team_id : oldTeamId;
                if (targetTeamId) {
                    await this.validateTeamLeadLimit(targetTeamId, userId);
                }
            }

            updateMetadata.role_id = payload.role_id;
            updateMetadata.role_name = newRole.name;


            if (oldRoleId) {
                await roleRepository.decrementAssignedCount(oldRoleId);
            }
            await roleRepository.incrementAssignedCount(payload.role_id);
        }


        if (payload.team_id !== undefined && payload.team_id !== oldTeamId) {
            let userRoleName = oldRoleName;
            if (payload.role_id && payload.role_id !== oldRoleId) {
                const newRole = await roleRepository.getById(payload.role_id);
                userRoleName = newRole?.name;
            }

            // If user is or becoming TL, check limit on new team
            if (userRoleName === 'tl' && payload.team_id) {
                await this.validateTeamLeadLimit(payload.team_id, userId);
            }
            if (payload.team_id) {

                const newTeam = await teamRepository.getById(payload.team_id);
                if (!newTeam) throw new Error('Team not found');
            }

            updateMetadata.team_id = payload.team_id;


            if (oldTeamId) {
                await teamRepository.decrementMembersCount(oldTeamId);
            }
            if (payload.team_id) {
                await teamRepository.incrementMembersCount(payload.team_id);
            }
        }


        const newMetadata = {
            ...currentMetadata,
            ...updateMetadata
        };


        const { data, error } = await teamMemberRepository.updateUser(userId, {
            user_metadata: newMetadata
        });

        if (error) throw error;


        const updatedUser = data.user;
        let userMetadata = updatedUser.user_metadata;


        if (userMetadata?.user_metadata) {
            userMetadata = userMetadata.user_metadata;
        }

        const roleId = userMetadata?.role_id;
        const teamId = userMetadata?.team_id;

        const role = roleId ? await roleRepository.getById(roleId) : null;
        const team = teamId ? await teamRepository.getById(teamId) : null;

        return {
            ...updatedUser,
            user_metadata: userMetadata,
            role: role ? { id: role.id, name: role.name } : null,
            team: team ? { id: team.id, name: team.name } : null
        };
    },

    /**
     * Update team member status (activate/deactivate)
     */
    async updateTeamMemberStatus(userId: string, isActive: boolean) {
        // Get the user first
        const { data, error } = await teamMemberRepository.listUsers();
        if (error) throw error;

        const user = data.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        if (user.user_metadata?.role_name === 'superadmin') {
            throw new Error('Cannot modify superadmin status');
        }

        // Get current metadata
        let currentMetadata = user.user_metadata;

        // Handle nested user_metadata if it exists
        if (currentMetadata?.user_metadata) {
            currentMetadata = currentMetadata.user_metadata;
        }

        // Update the status in metadata
        const newMetadata = {
            ...currentMetadata,
            is_active: isActive,
            status: isActive ? 'active' : 'inactive',
            updated_at: new Date().toISOString()
        };

        // Update the user in Supabase
        const { data: updateData, error: updateError } = await teamMemberRepository.updateUser(userId, {
            user_metadata: newMetadata
        });

        if (updateError) throw updateError;

        const updatedUser = updateData.user;
        let userMetadata = updatedUser.user_metadata;

        // Handle nested metadata
        if (userMetadata?.user_metadata) {
            userMetadata = userMetadata.user_metadata;
        }

        const roleId = userMetadata?.role_id;
        const teamId = userMetadata?.team_id;

        const role = roleId ? await roleRepository.getById(roleId) : null;
        const team = teamId ? await teamRepository.getById(teamId) : null;

        return {
            id: updatedUser.id,
            email: updatedUser.email,
            username: userMetadata?.username,
            created_at: updatedUser.created_at,
            last_sign_in_at: updatedUser.last_sign_in_at,
            role: role ? { id: role.id, name: role.name } : null,
            team: team ? { id: team.id, name: team.name } : null,
            user_metadata: userMetadata,
            is_active: isActive,
            status: isActive ? 'active' : 'inactive'
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


        if (roleId) {
            await roleRepository.decrementAssignedCount(roleId);
        }

        if (teamId) {
            await teamRepository.decrementMembersCount(teamId);
        }


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
    },

    /**
     * Step 1: Validate and send OTP for team member creation
     */
    async sendAddMemberOTP(payload: {
        email: string;
        role_id: string;
        team_id?: string | null;
        requested_by: string;
    }) {
        const { email, role_id, team_id, requested_by } = payload;

        const role = await roleRepository.getById(role_id);
        if (!role) throw new Error('Role not found');
        if (role.name === 'superadmin') throw new Error('Cannot assign superadmin role');

        console.log(`Sending OTP for: ${email}, role: ${role.name}, team: ${team_id}`);

        if (role.name === 'tl' && team_id) {
            console.log(`Validating TL limit for team: ${team_id}`);
            await this.validateTeamLeadLimit(team_id);
        }

        if (team_id) {
            const team = await teamRepository.getById(team_id);
            if (!team) throw new Error('Team not found');
        }

        const { data } = await teamMemberRepository.listUsers();
        const existing = data.users.find((u: any) => u.email.toLowerCase() === email);

        if (existing) throw new Error('Email already registered');

        const result = await otpService.sendOTP(email, 'registration');

        pendingMemberCreations.set(email, {
            role_id,
            team_id: team_id || null,
            requested_by,
            expires_at: Date.now() + 10 * 60 * 1000
        });

        setTimeout(() => pendingMemberCreations.delete(email), 10 * 60 * 1000);

        return result;
    },

    /**
     * Step 2: Verify OTP and complete member creation
     */
    async verifyOTPAndCreateMember(payload: {
        email: string;
        password: string;
        otp_code: string;
        username: string;
        full_name?: string;
        phone?: string | null;
        created_by: string;
    }) {
        console.log("The verify otp payload we get", payload);
        const { email, password, otp_code, username, full_name, phone } = payload;

        const isValid = await otpService.verifyOTP(email, otp_code, 'registration');
        if (!isValid) throw new Error('Invalid or expired OTP');

        const pending = pendingMemberCreations.get(email);
        if (!pending || Date.now() > pending.expires_at) {
            throw new Error('OTP session expired. Please request a new one.');
        }

        pendingMemberCreations.delete(email);

        const { role_id, team_id, requested_by } = pending;

        const role = await roleRepository.getById(role_id);
        if (!role) throw new Error('Role no longer valid');

        if (role.name === 'tl' && team_id) {
            console.log(`Double-checking TL limit for team: ${team_id} before creation`);
            await this.validateTeamLeadLimit(team_id);
        }

        pendingMemberCreations.delete(email);

        const { data, error } = await teamMemberRepository.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username,
                role_id,
                role_name: role.name,
                team_id: team_id,
                full_name: full_name || null,
                phone: phone || null,
                email_verified: true,
                created_by: requested_by,
                status: 'active',
            }
        });

        if (error || !data.user) {
            throw new Error('Failed to create user: ' + (error?.message || 'Unknown error'));
        }

        const user = data.user;

        await roleRepository.incrementAssignedCount(role_id);
        if (team_id) {
            await teamRepository.incrementMembersCount(team_id);
        }

        return user;
    }
};