import bcrypt from 'bcrypt';
import { AuthRepository, roleRepository } from '../repositories';
import { RegisterPayload } from '../interfaces';
import { generateAccessToken } from '../utils/jwt.utils';

export const AuthService = {

    /**
     * Register a new user
     */
    async register(payload: RegisterPayload) {
        const { email, password, username, full_name, phone } = payload;

        if (!email || !password || !username) {
            throw new Error('Email, password, and username are required');
        }

        const existingRes = await AuthRepository.getUserByEmail(email);
        if (existingRes.user) {
            const error: any = new Error('Email already registered');
            error.statusCode = 409;
            throw error;
        }

        const role = await roleRepository.getRoleByIdOrName({ name: 'SUPERADMIN' });

        const password_hash = await bcrypt.hash(password, 10);

        const result = await AuthRepository.createUser({
            email,
            password_hash,
            username,
            full_name: full_name ?? undefined,
            phone: phone ?? undefined,
            role_id: role?.id,
            is_active: true,
        });

        if (role?.id) {
            await roleRepository.incrementAssignedCount(role.id);
        }

        const createdUser = result.data.user;
        if (!createdUser) {
            throw new Error('User registration failed');
        }
        const accessToken = generateAccessToken({
            id: createdUser.id,
            email: createdUser.email || email,
            role: 'SUPERADMIN',
        });

        return {
            data: {
                user: createdUser,
                token: accessToken,
                session: {
                    access_token: accessToken,
                    expires_at: Math.floor(Date.now() / 1000) + 86400,
                }
            }
        };
    },

    /**
     * Login user with email and password
     */
    async login(email: string, password: string) {
        if (!email || !password) {
            return { data: null, error: new Error('Email and password required') };
        }

        const res = await AuthRepository.getUserByEmail(email);
        if (res.error || !res.user || !res.rawUser) {
            return { data: null, error: new Error('Invalid email or password') };
        }

        if (res.rawUser.isActive === false) {
            return { data: null, error: new Error('Account is not active') };
        }

        const isPasswordValid = await bcrypt.compare(password, res.rawUser.passwordHash);
        if (!isPasswordValid) {
            return { data: null, error: new Error('Invalid email or password') };
        }

        await AuthRepository.updateLastLogin(res.rawUser.id);

        let roleName = res.user.user_metadata?.role_name || 'SUPERADMIN';
        if (res.rawUser.roleId) {
            const roleObj = await roleRepository.getRoleByIdOrName({ id: res.rawUser.roleId });
            if (roleObj?.name) roleName = roleObj.name;
        }

        const accessToken = generateAccessToken({
            id: res.rawUser.id,
            email: res.rawUser.email,
            role: roleName,
        });

        const expiresAt = Math.floor(Date.now() / 1000) + 86400;

        return {
            data: {
                user: res.user,
                session: {
                    access_token: accessToken,
                    refresh_token: accessToken,
                    expires_at: expiresAt,
                }
            },
            error: null,
        };
    },

    /**
     * Refresh token
     */
    async refresh(refresh_token: string) {
        if (!refresh_token) {
            return { data: null, error: new Error('Refresh token required') };
        }
        return {
            data: {
                session: {
                    access_token: refresh_token,
                    refresh_token: refresh_token,
                    expires_at: Math.floor(Date.now() / 1000) + 86400,
                }
            },
            error: null,
        };
    },

    async logout(userId: string) {
        if (!userId) {
            throw new Error('User not authenticated');
        }
        return true;
    },
};
