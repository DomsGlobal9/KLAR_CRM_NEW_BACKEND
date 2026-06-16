import { travelerRepository } from '../repositories/traveler.repository';
import {
    ITraveler,
    CreateTravelerPayload,
    UpdateTravelerPayload,
    TravelerFilter,
    Title
} from '../models/traveler.model';

// Validation utilities
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+[1-9][0-9]{0,2}[0-9]{4,14}$/;
    return phoneRegex.test(phone);
};

const validateTitle = (title: string): boolean => {
    return Object.values(Title).includes(title as Title);
};

const validatePassport = (passport: any): string[] => {
    const errors: string[] = [];

    if (passport && passport.passportNumber) {
        if (!passport.nationality) errors.push('Nationality is required when passport number is provided');
        if (!passport.issueDate) errors.push('Issue date is required when passport number is provided');
        if (!passport.expiryDate) errors.push('Expiry date is required when passport number is provided');

        if (passport.issueDate && passport.expiryDate) {
            const issueDate = new Date(passport.issueDate);
            const expiryDate = new Date(passport.expiryDate);
            if (expiryDate <= issueDate) {
                errors.push('Passport expiry date must be after issue date');
            }
        }
    }

    return errors;
};

const validateGST = (gst: any): string[] => {
    const errors: string[] = [];

    if (gst && gst.gstNumber) {
        if (!gst.registeredName) errors.push('Registered name is required when GST number is provided');
        if (!gst.email) errors.push('Email is required when GST number is provided');
        if (!gst.mobile) errors.push('Mobile is required when GST number is provided');
        if (!gst.address) errors.push('Address is required when GST number is provided');

        if (gst.email && !validateEmail(gst.email)) {
            errors.push('Invalid GST email format');
        }

        if (gst.mobile && !validatePhone(gst.mobile)) {
            errors.push('Invalid GST mobile number format');
        }
    }

    return errors;
};

export const travelerService = {

    /**
     * Create a new traveler
     */
    async createTraveler(payload: CreateTravelerPayload): Promise<ITraveler> {
        const errors: string[] = [];

        // Validate required fields
        if (!payload.title) errors.push('Title is required');
        if (!payload.travelerName) errors.push('Traveler name is required');
        if (!payload.travelerPhone) errors.push('Traveler phone is required');
        if (!payload.travelerEmail) errors.push('Traveler email is required');
        if (!payload.dateOfBirth) errors.push('Date of birth is required');
        if (!payload.emergencyContact) errors.push('Emergency contact is required');

        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        // Validate title
        if (!validateTitle(payload.title)) {
            throw new Error(`Invalid title. Must be one of: ${Object.values(Title).join(', ')}`);
        }

        // Validate email
        if (!validateEmail(payload.travelerEmail)) {
            throw new Error('Invalid email format');
        }

        // Validate phone
        if (!validatePhone(payload.travelerPhone)) {
            throw new Error('Invalid phone number format. Phone number must start with country code (e.g., +1234567890)');
        }

        // Validate date of birth
        const dob = new Date(payload.dateOfBirth);
        if (isNaN(dob.getTime()) || dob >= new Date()) {
            throw new Error('Invalid date of birth. Must be a valid past date');
        }

        // Validate emergency contact
        const ec = payload.emergencyContact;
        if (!ec.contactName || !ec.email || !ec.phoneNumber) {
            throw new Error('Emergency contact must include contactName, email, and phoneNumber');
        }

        if (!validateEmail(ec.email)) {
            throw new Error('Invalid emergency contact email format');
        }

        if (!validatePhone(ec.phoneNumber)) {
            throw new Error('Invalid emergency contact phone number format');
        }

        // Validate passport
        const passportErrors = validatePassport(payload.passport);
        if (passportErrors.length > 0) {
            throw new Error(`Passport validation failed: ${passportErrors.join(', ')}`);
        }

        // Validate GST
        const gstErrors = validateGST(payload.gst);
        if (gstErrors.length > 0) {
            throw new Error(`GST validation failed: ${gstErrors.join(', ')}`);
        }

        // Check if traveler already exists
        const existingTraveler = await travelerRepository.getTravelerByEmail(payload.travelerEmail);
        if (existingTraveler) {
            throw new Error('Traveler with this email already exists');
        }

        // Check if traveler already exists by phone
        const existingTravelerByPhone = await travelerRepository.getTravelerByPhone(payload.travelerPhone);
        if (existingTravelerByPhone) {
            throw new Error('Traveler with this phone number already exists');
        }

        // Create traveler
        const traveler = await travelerRepository.createTraveler({
            ...payload,
            dateOfBirth: dob
        });

        return traveler;
    },

    /**
     * Get traveler by ID
     */
    async getTravelerById(id: string): Promise<ITraveler> {
        const traveler = await travelerRepository.getTravelerById(id);

        if (!traveler) {
            throw new Error('Traveler not found');
        }

        return traveler;
    },

    /**
     * Get all travelers with filtering
     */
    async getAllTravelers(filter: TravelerFilter = {}): Promise<ITraveler[]> {
        return await travelerRepository.getAllTravelers(filter);
    },

    /**
 * Update traveler
 */
    async updateTraveler(id: string, payload: UpdateTravelerPayload): Promise<boolean> {
        // Check if traveler exists
        const existingTraveler = await travelerRepository.getTravelerById(id);
        if (!existingTraveler) {
            throw new Error('Traveler not found');
        }

        // Validate email if being updated
        if (payload.travelerEmail) {
            if (!validateEmail(payload.travelerEmail)) {
                throw new Error('Invalid email format');
            }

            const travelerWithEmail = await travelerRepository.getTravelerByEmail(payload.travelerEmail);
            if (travelerWithEmail && travelerWithEmail.id !== id) {
                throw new Error('Email already in use by another traveler');
            }
        }

        // Validate phone if being updated
        if (payload.travelerPhone) {
            if (!validatePhone(payload.travelerPhone)) {
                throw new Error('Invalid phone number format. Phone number must start with country code (e.g., +1234567890)');
            }

            // Check if phone number is already used by another traveler
            const travelerWithPhone = await travelerRepository.getTravelerByPhone(payload.travelerPhone);
            if (travelerWithPhone && travelerWithPhone.id !== id) {
                throw new Error('Phone number already in use by another traveler');
            }
        }

        // Validate passport if being updated
        if (payload.passport) {
            const passportErrors = validatePassport(payload.passport);
            if (passportErrors.length > 0) {
                throw new Error(`Passport validation failed: ${passportErrors.join(', ')}`);
            }
        }

        // Validate GST if being updated
        if (payload.gst) {
            const gstErrors = validateGST(payload.gst);
            if (gstErrors.length > 0) {
                throw new Error(`GST validation failed: ${gstErrors.join(', ')}`);
            }
        }

        // Update traveler
        return await travelerRepository.updateTraveler(id, payload);
    },

    /**
     * Delete traveler
     */
    async deleteTraveler(id: string): Promise<boolean> {
        const existingTraveler = await travelerRepository.getTravelerById(id);
        if (!existingTraveler) {
            throw new Error('Traveler not found');
        }

        return await travelerRepository.deleteTraveler(id);
    },

    /**
     * Search travelers
     */
    async searchTravelers(query: string): Promise<ITraveler[]> {
        if (!query || query.trim().length === 0) {
            throw new Error('Search query is required');
        }

        return await travelerRepository.searchTravelers(query);
    },

    /**
 * Advanced filter and sort travelers
 */
    async filterAndSortTravelers(filters: any, sort: any, pagination: any): Promise<{ travelers: ITraveler[]; total: number; page: number; totalPages: number }> {
        const travelers = await travelerRepository.filterAndSortTravelers(filters, sort, pagination);
        return travelers;
    }
};