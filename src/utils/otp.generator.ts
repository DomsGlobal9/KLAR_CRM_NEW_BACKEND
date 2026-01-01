export class OTPGenerator {
    /**
     * Generate a 6-digit alphanumeric OTP
     */
    static generate(length: number = 6): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let otp = '';

        for (let i = 0; i < length; i++) {
            otp += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return otp;
    }

    /**
     * Calculate expiration time (default 10 minutes)
     */
    static getExpirationTime(minutes: number = 10): Date {
        const date = new Date();
        date.setMinutes(date.getMinutes() + minutes);
        return date;
    }

    /**
     * Validate if OTP has expired
     */
    static isExpired(expiresAt: Date): boolean {
        return new Date() > new Date(expiresAt);
    }
}