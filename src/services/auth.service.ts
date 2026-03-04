import { AuthRepository, roleRepository, teamRepository } from '../repositories';
import { getAllowedRoles } from '../utils';
import { RegisterPayload } from '../interfaces';

export const AuthService = {

    /**
     * Register a new user
     * @param payload 
     * @param requester 
     * @returns 
     */
    async register(payload: RegisterPayload) {
        const { email, password, username, full_name, phone } = payload;
        console.log(payload);

        if (!email || !password || !username) {
            throw new Error('Email, password, and username are required');
        }

        const { data: existingUsers } = await AuthRepository.listUsers();
        if (existingUsers.users.length > 5) {
            throw new Error('Registration is closed. Superadmin already exists.');
        }

        const role = await roleRepository.getRoleByIdOrName({ name: 'superadmin' });
        if (!role) {
            throw new Error('Superadmin role not found in database');
        }

        if (role.name !== 'superadmin') {
            throw new Error('Only superadmin can be registered');
        }

        if (existingUsers.users.some((u: any) => u.email === email)) {
            throw new Error('Email already registered');
        }

        const result = await AuthRepository.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username,
                role_id: role.id,
                role_name: 'superadmin',
                team_id: null,
                full_name: full_name ?? null,
                phone: phone ?? null,
                status: 'active',
                created_by: null,
                assigned_under: null,
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
