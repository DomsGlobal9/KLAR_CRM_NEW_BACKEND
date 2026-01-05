export class ValidationUtils {
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone: string): boolean {
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10;
    }

    static validateLeadType(type: string): boolean {
        const validTypes = ['event', 'travel', 'visa', 'other'];
        return validTypes.includes(type);
    }

    static validateGSTNumber(gstNumber?: string): boolean {
        if (!gstNumber) return true;

        // GST format: 2 digits (state) + 10 alphanumeric characters
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstRegex.test(gstNumber.toUpperCase());
    }

    static sanitizeLeadData(data: any): any {
        const sanitized: any = {};

        // Required fields
        if (data.name) sanitized.name = data.name.toString().trim();
        if (data.email) sanitized.email = data.email.toString().trim().toLowerCase();
        if (data.phone) sanitized.phone = data.phone.toString().trim();
        if (data.type) sanitized.type = data.type.toString().trim().toLowerCase();

        // Optional fields - only include if they exist
        const optionalFields = [
            'source', 'source_medium', 'service_type', 'from_location', 'destination',
            'services', 'sub_service', 'customer_category', 'sub_category', 'gst_number',
            'notes', 'assigned_to', 'lead_type', 'flight_class', 'company_name',
            'company_address', 'company_details', 'captured_from',
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
        ];

        optionalFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== null) {
                sanitized[field] = data[field].toString().trim();
            }
        });

        // Boolean fields
        if (data.needs_visa !== undefined) {
            sanitized.needs_visa = Boolean(data.needs_visa);
        }

        // Numeric fields
        if (data.budget !== undefined) {
            const budget = parseFloat(data.budget);
            sanitized.budget = isNaN(budget) ? 0 : Math.max(0, budget);
        }

        if (data.travelers !== undefined) {
            const travelers = parseInt(data.travelers);
            sanitized.travelers = isNaN(travelers) ? 1 : Math.max(1, travelers);
        }

        // Date fields
        if (data.travel_date) {
            sanitized.travel_date = new Date(data.travel_date).toISOString().split('T')[0];
        }

        if (data.return_date) {
            sanitized.return_date = new Date(data.return_date).toISOString().split('T')[0];
        }

        return sanitized;
    }

    static validateLeadPayload(payload: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields validation
        if (!payload.name || typeof payload.name !== 'string' || payload.name.trim().length === 0) {
            errors.push('Name is required and must be a valid string');
        }

        if (!payload.email || !this.validateEmail(payload.email)) {
            errors.push('Valid email is required');
        }

        if (!payload.phone || !this.validatePhone(payload.phone)) {
            errors.push('Valid phone number is required (minimum 10 digits)');
        }

        if (!payload.type || !this.validateLeadType(payload.type)) {
            errors.push('Type must be one of: event, travel, visa, other');
        }

        // GST number validation if provided
        if (payload.gst_number && !this.validateGSTNumber(payload.gst_number)) {
            errors.push('Invalid GST number format');
        }

        return {
            valid: errors.length === 0, 
            errors
        };
    }
}