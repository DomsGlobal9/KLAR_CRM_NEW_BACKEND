export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    role_id?: string;
    team_id?: string;
    full_name?: string;
    phone?: string;
    department?: string;
    notes?: string;
    email_verified?: boolean;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    email: string;
    username?: string;
    role: string;
    status: string;
    full_name?: string;
}


// types/otp.types.ts
export type OTPType = 'registration' | 'login' | 'password_reset';
export type OTPChannel = 'email' | 'sms';

export interface OTPSendRequest {
    identifier: string; 
    type: OTPType;
    channel: OTPChannel; // New: specify delivery method
}

export interface OTPVerifyRequest {
    identifier: string;
    code: string;
    type: OTPType;
    channel?: OTPChannel; 
}