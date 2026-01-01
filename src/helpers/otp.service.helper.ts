import { OTP } from '../interfaces/otp.interface';

export const generateOTPEmailTemplate = (
    otp_code: string,
    type: OTP['type'] = 'registration'
): string => {
    const purposeMap = {
        registration: 'complete your registration',
        password_reset: 'reset your password',
        login: 'complete your login',
        email_verification: 'verify your email address'
    };

    const purpose = purposeMap[type] || 'complete your request';

    return `<!DOCTYPE html> ... ${otp_code} ...`;
};

export const getOTPEmailSubject = (type: OTP['type']): string => {
    const subjectMap = {
        registration: 'Your Registration Verification Code',
        password_reset: 'Password Reset Verification Code',
        login: 'Your Login Verification Code',
        email_verification: 'Email Verification Code'
    };

    return subjectMap[type] || 'Your Verification Code';
};
