export interface OTP {
    id?: string;
    email: string;
    otp_code: string;
    type: 'registration' | 'password_reset' | 'login' | 'email_verification';
    expires_at: Date;
    verified: boolean;
    attempts: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateOTPPayload {
    email: string;
    type: OTP['type'];
}

export interface VerifyOTPPayload {
    email: string;
    otp_code: string;
    type: OTP['type'];
}

export interface UserRegistrationPayload {
    username: string;
    email: string;
    password: string;
    role_id: string;
    team_id?: string | null;
    otp_code: string; 
}