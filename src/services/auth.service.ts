import { AuthRepository, roleRepository } from '../repositories';
import { getAllowedRoles } from '../utils';
import { RegisterPayload } from '../interfaces';

export const AuthService = {

    /**
     * Register a new user
     * @param payload 
     * @param requester 
     * @returns 
     */
    async register(payload: RegisterPayload, requester?: any) {
        if (!payload.role_id) {
            throw new Error('Role is required');
        }

        const role = await roleRepository.getRoleByIdOrName({
            id: payload.role_id
        });

        const { data } = await AuthRepository.listUsers();

        if (data.users.some(u => u.email === payload.email)) {
            throw new Error('Email already registered');
        }

        if (
            payload.username &&
            data.users.some(u => u.user_metadata?.username === payload.username)
        ) {
            throw new Error('Username already taken');
        }

        if (
            role.name === 'superadmin' &&
            data.users.some(u => u.user_metadata?.role_id === role.id)
        ) {
            throw new Error('Superadmin already exists');
        }

        const result = await AuthRepository.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true,
            user_metadata: {
                username: payload.username,
                role_id: role.id,
                role_name: role.name,
                full_name: payload.full_name ?? null,
                phone: payload.phone ?? null,
                department: payload.department ?? null,
                notes: payload.notes ?? null,
                status: 'active',
                created_by: requester?.id ?? null,
                assigned_under: role.name === 'rm' ? requester?.id : null,
                assigned_leads_count: 0,
                last_login_at: null
            }
        });

        await roleRepository.incrementAssignedCount(role.id);

        return result;
    },


    /**
     * Login user
     * @param email 
     * @param password 
     * @returns 
     */
    async login(email: string, password: string) {
        return AuthRepository.signIn(email, password);
    },

    /**
     * Refresh token
     * @param refresh_token 
     * @returns 
     */
    async refresh(refresh_token: string) {
        return AuthRepository.refresh(refresh_token);
    },

    async logout(userId: string) {
        if (!userId) {
            throw new Error('User not authenticated');
        }
        await AuthRepository.revokeSessions(userId);

        return true;
    },
};
