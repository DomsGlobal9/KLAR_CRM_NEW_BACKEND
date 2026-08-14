import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.config';

export interface JwtPayload {
    sub: string;
    email: string;
    role?: string;
    [key: string]: any;
}

/**
 * Generate JWT Access Token for user
 */
export function generateAccessToken(user: { id: string; email: string; role?: string; [key: string]: any }): string {
    const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role ?? user.role_name ?? undefined,
    };

    const secret = envConfig.JWT_SECRET || process.env.JWT_SECRET || 'klar_crm_default_jwt_secret_key_2026';
    const expiresIn = (envConfig.JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '24h') as any;

    return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify JWT Access Token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
    try {
        const secret = envConfig.JWT_SECRET || process.env.JWT_SECRET || 'klar_crm_default_jwt_secret_key_2026';
        const decoded = jwt.verify(token, secret) as JwtPayload;
        return decoded;
    } catch {
        return null;
    }
}
