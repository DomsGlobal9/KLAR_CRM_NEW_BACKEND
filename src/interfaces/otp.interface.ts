// otp.interface.ts
export interface OTP {
    id?: string;
    email?: string;        // Made optional (backward compatibility)
    identifier: string;     // New field for email or phone
    channel: 'email' | 'sms'; // New field to specify delivery method
    otp_code: string;
    type: 'registration' | 'password_reset' | 'login' | 'email_verification';
    expires_at: Date;
    verified: boolean;
    attempts: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateOTPPayload {
    identifier: string;     // Changed from email to identifier
    type: OTP['type'];
    channel: 'email' | 'sms'; // Added channel
    email?: string;         // Optional for backward compatibility
}

export interface VerifyOTPPayload {
    identifier: string;     // Changed from email to identifier
    otp_code: string;
    type: OTP['type'];
    channel?: 'email' | 'sms'; // Optional channel
}

export interface UserRegistrationPayload {
    username: string;
    email: string;
    password: string;
    role_id: string;
    team_id?: string | null;
    otp_code: string; 
}