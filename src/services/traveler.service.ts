import { travelerRepository } from '../repositories/traveler.repository';
import {
    ITraveler,
    CreateTravelerPayload,
    UpdateTravelerPayload,
    TravelerFilter,
    Title
} from '../models/traveler.model';
import { supabaseAdmin } from '../config';

const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const phoneRegex = /^\+[1-9][0-9]{0,2}[0-9]{4,14}$/;
    return phoneRegex.test(phone);
};

const validateAadhaar = (aadhaar: string): string[] => {
    const errors: string[] = [];
    if (!aadhaar) return errors;

    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(aadhaar)) {
        errors.push('Invalid Aadhaar number format. Must be 12 digits');
    }

    return errors;
};

const validatePassportFormat = (passport: string): string[] => {
    const errors: string[] = [];
    if (!passport) return errors;

    const passportRegex = /^[A-Z0-9]{6,9}$/;
    if (!passportRegex.test(passport)) {
        errors.push('Invalid Passport number format. Must be 6-9 alphanumeric characters');
    }

    return errors;
};

const validateTitle = (title: string): boolean => {
    if (!title) return true;
    return Object.values(Title).includes(title as Title);
};

const validateDateOfBirth = (dob: Date): boolean => {
    if (!dob) return true;
    const date = new Date(dob);
    return !isNaN(date.getTime()) && date < new Date();
};

const validatePassport = (passport: any): string[] => {
    const errors: string[] = [];
    if (!passport) return errors;

    if (passport.passportNumber) {
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
    if (!gst) return errors;

    if (gst.gstNumber) {
        // if (!gst.registeredName) errors.push('Registered name is required when GST number is provided');
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

const validateEmergencyContact = (emergencyContact: any): string[] => {
    const errors: string[] = [];
    if (!emergencyContact) return errors;

    if (emergencyContact.contactName || emergencyContact.email || emergencyContact.phoneNumber) {
        if (!emergencyContact.contactName) errors.push('Emergency contact name is required');
        if (!emergencyContact.email) errors.push('Emergency contact email is required');
        if (!emergencyContact.phoneNumber) errors.push('Emergency contact phone is required');

        if (emergencyContact.email && !validateEmail(emergencyContact.email)) {
            errors.push('Invalid emergency contact email format');
        }

        if (emergencyContact.phoneNumber && !validatePhone(emergencyContact.phoneNumber)) {
            errors.push('Invalid emergency contact phone number format');
        }
    }

    return errors;
};

export const travelerService = {

    async createTraveler(payload: CreateTravelerPayload): Promise<ITraveler> {
        const errors: string[] = [];

        if (payload.title && !validateTitle(payload.title)) {
            errors.push(`Invalid title. Must be one of: ${Object.values(Title).join(', ')}`);
        }

        if (payload.travelerEmail && !validateEmail(payload.travelerEmail)) {
            errors.push('Invalid email format');
        }

        if (payload.travelerPhone && !validatePhone(payload.travelerPhone)) {
            errors.push('Invalid phone number format. Phone number must start with country code (e.g., +1234567890)');
        }

        if (payload.dateOfBirth && !validateDateOfBirth(payload.dateOfBirth)) {
            errors.push('Invalid date of birth. Must be a valid past date');
        }

        const passportErrors = validatePassport(payload.passport);
        if (passportErrors.length > 0) {
            errors.push(`Passport validation failed: ${passportErrors.join(', ')}`);
        }

        const gstErrors = validateGST(payload.gst);
        if (gstErrors.length > 0) {
            errors.push(`GST validation failed: ${gstErrors.join(', ')}`);
        }

        const ecErrors = validateEmergencyContact(payload.emergencyContact);
        if (ecErrors.length > 0) {
            errors.push(`Emergency contact validation failed: ${ecErrors.join(', ')}`);
        }

        // Validate Passport number
        let passportNumber = payload.passportNumber;
        if (payload.passport?.passportNumber && !passportNumber) {
            passportNumber = payload.passport.passportNumber;
        }

        // Validate at least one identity document (Aadhaar OR Passport) is provided
        const hasAadhaar = Boolean(payload.aadhaarNumber && payload.aadhaarNumber.trim());
        const hasPassport = Boolean(passportNumber && passportNumber.trim());

        if (!hasAadhaar && !hasPassport) {
            errors.push('At least one identity document (Aadhaar Number or Passport Number) is required');
        }

        if (payload.aadhaarNumber) {
            const aadhaarErrors = validateAadhaar(payload.aadhaarNumber);
            if (aadhaarErrors.length > 0) {
                errors.push(`Aadhaar validation failed: ${aadhaarErrors.join(', ')}`);
            }

            const isUnique = await travelerRepository.checkAadhaarUniqueness(payload.aadhaarNumber);
            if (!isUnique) {
                errors.push('Aadhaar number already exists');
            }
        }

        if (passportNumber) {
            const passportErrors = validatePassportFormat(passportNumber);
            if (passportErrors.length > 0) {
                errors.push(`Passport validation failed: ${passportErrors.join(', ')}`);
            }

            const isUnique = await travelerRepository.checkPassportUniqueness(passportNumber);
            if (!isUnique) {
                errors.push('Passport number already exists');
            }
        }


        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        // Check for existing group
        let groupId = payload.group_id;

        if (!groupId) {
            // Try to find existing group by email or phone
            const existingGroupId = await travelerRepository.findGroupByEmailOrPhone(
                payload.travelerEmail,
                payload.travelerPhone
            );

            if (existingGroupId) {
                groupId = existingGroupId;
            } else {
                // Create new group only if another traveler shares same email/phone
                const createdGroupId = await travelerRepository.findOrCreateGroup(
                    payload.travelerEmail,
                    payload.travelerPhone
                );
                if (createdGroupId) {
                    groupId = createdGroupId;
                }
            }
        }

        if (payload.passport?.passportNumber && !payload.passportNumber) {
            payload.passportNumber = payload.passport.passportNumber;
        }
        if (payload.passport?.aadhaarNumber && !payload.aadhaarNumber) {
            payload.aadhaarNumber = payload.passport.aadhaarNumber;
        }

        // Add group_id to payload
        const payloadWithGroup = {
            ...payload,
            group_id: groupId,
        };

        // Check if traveler with same email or phone already exists
        if (payload.travelerEmail) {
            if (!validateEmail(payload.travelerEmail)) {
                throw new Error('Invalid email format');
            }
        }

        if (payload.travelerPhone) {
            if (!validatePhone(payload.travelerPhone)) {
                throw new Error('Invalid phone number format. Phone number must start with country code (e.g., +1234567890)');
            }
        }

        const traveler = await travelerRepository.createTraveler(payloadWithGroup);
        return traveler;
    },

    async getTravelerById(id: string): Promise<ITraveler> {
        const traveler = await travelerRepository.getTravelerById(id);

        if (!traveler) {
            throw new Error('Traveler not found');
        }

        return traveler;
    },

    async getAllTravelers(filter: TravelerFilter = {}): Promise<{ travelers: ITraveler[]; total: number; page: number; limit: number; totalPages: number }> {
        return await travelerRepository.getAllTravelers(filter);
    },

    async updateTraveler(id: string, payload: UpdateTravelerPayload): Promise<boolean> {
        const existingTraveler = await travelerRepository.getTravelerById(id);
        if (!existingTraveler) {
            throw new Error('Traveler not found');
        }

        // REMOVED: Email and Phone uniqueness checks - now allows duplicates
        // No need to check group merging during update

        if (payload.passport) {
            const passportErrors = validatePassport(payload.passport);
            if (passportErrors.length > 0) {
                throw new Error(`Passport validation failed: ${passportErrors.join(', ')}`);
            }
        }

        if (payload.gst) {
            const gstErrors = validateGST(payload.gst);
            if (gstErrors.length > 0) {
                throw new Error(`GST validation failed: ${gstErrors.join(', ')}`);
            }
        }

        if (payload.emergencyContact) {
            const ecErrors = validateEmergencyContact(payload.emergencyContact);
            if (ecErrors.length > 0) {
                throw new Error(`Emergency contact validation failed: ${ecErrors.join(', ')}`);
            }
        }

        if (payload.aadhaarNumber) {
            const aadhaarErrors = validateAadhaar(payload.aadhaarNumber);
            if (aadhaarErrors.length > 0) {
                throw new Error(`Aadhaar validation failed: ${aadhaarErrors.join(', ')}`);
            }

            const isUnique = await travelerRepository.checkAadhaarUniqueness(payload.aadhaarNumber, id);
            if (!isUnique) {
                throw new Error('Aadhaar number already exists');
            }
        }

        // Validate Passport number for update
        let passportNumber = payload.passportNumber;
        if (payload.passport?.passportNumber && !passportNumber) {
            passportNumber = payload.passport.passportNumber;
        }

        if (passportNumber) {
            const passportErrors = validatePassportFormat(passportNumber);
            if (passportErrors.length > 0) {
                throw new Error(`Passport validation failed: ${passportErrors.join(', ')}`);
            }

            const isUnique = await travelerRepository.checkPassportUniqueness(passportNumber, id);
            if (!isUnique) {
                throw new Error('Passport number already exists');
            }
        }

        return await travelerRepository.updateTraveler(id, payload);
    },

    async deleteTraveler(id: string): Promise<boolean> {
        const existingTraveler = await travelerRepository.getTravelerById(id);
        if (!existingTraveler) {
            throw new Error('Traveler not found');
        }

        return await travelerRepository.deleteTraveler(id);
    },

    async searchTravelers(query: string): Promise<ITraveler[]> {
        if (!query || query.trim().length === 0) {
            throw new Error('Search query is required');
        }

        return await travelerRepository.searchTravelers(query);
    },

    async filterAndSortTravelers(filters: any, sort: any, pagination: any): Promise<{ travelers: ITraveler[]; total: number; page: number; totalPages: number }> {
        const travelers = await travelerRepository.filterAndSortTravelers(filters, sort, pagination);
        return travelers;
    },

    async mergeGroups(sourceGroupId: string, targetGroupId: string): Promise<void> {
        // Update all travelers from source group to target group
        const { error } = await supabaseAdmin
            .from('travelers')
            .update({ group_id: targetGroupId })
            .eq('group_id', sourceGroupId);

        if (error) {
            throw new Error(`Failed to merge groups: ${error.message}`);
        }


    },

    async bulkCreateTravelers(travelersData: any[]): Promise<{
        created: number;
        skipped: number;
        errors: Array<{ row: number; reason: string }>;
        skippedUsers: Array<{ email: string; phone: string; reason: string }>;
    }> {
        const results = {
            created: 0,
            skipped: 0,
            errors: [] as Array<{ row: number; reason: string }>,
            skippedUsers: [] as Array<{ email: string; phone: string; reason: string }>
        };

        const formatPhone = (phone: any): string => {
            if (!phone) return '';
            const phoneStr = String(phone);
            let cleaned = phoneStr.replace(/[^0-9+]/g, '');
            if (!cleaned.startsWith('+')) {
                cleaned = cleaned.replace(/^0+/, '');
                cleaned = `+91${cleaned}`;
            }
            return cleaned;
        };

        const toCreate: any[] = [];

        for (let i = 0; i < travelersData.length; i++) {
            const row = travelersData[i];
            const rowNum = i + 2;

            try {
                const insertData: any = {
                    created_at: new Date(),
                    updated_at: new Date()
                };

                if (row.title) insertData.title = row.title;
                if (row.travelerName) insertData.traveler_name = row.travelerName;
                if (row.travelerEmail) insertData.traveler_email = row.travelerEmail;
                if (row.travelerPhone) insertData.traveler_phone = formatPhone(row.travelerPhone);
                if (row.dateOfBirth) insertData.date_of_birth = new Date(row.dateOfBirth);

                if (row.passportNumber) {
                    insertData.passport = {
                        passportNumber: row.passportNumber,
                        nationality: row.nationality || '',
                        issueDate: row.passportIssueDate ? new Date(row.passportIssueDate) : null,
                        expiryDate: row.passportExpiryDate ? new Date(row.passportExpiryDate) : null
                    };
                }

                if (row.gstNumber) {
                    insertData.gst = {
                        gstNumber: row.gstNumber,
                        // registeredName: row.registeredName || '',
                        email: row.gstEmail || '',
                        mobile: row.gstMobile ? formatPhone(row.gstMobile) : '',
                        address: row.gstAddress || ''
                    };
                }

                if (row.emergencyContactName || row.emergencyContactEmail || row.emergencyContactPhone) {
                    insertData.emergency_contact = {
                        contactName: row.emergencyContactName || '',
                        email: row.emergencyContactEmail || '',
                        phoneNumber: row.emergencyContactPhone ? formatPhone(row.emergencyContactPhone) : ''
                    };
                }

                if (row.aadhaarNumber) {
                    const aadhaarErrors = validateAadhaar(row.aadhaarNumber);
                    if (aadhaarErrors.length > 0) {
                        results.errors.push({
                            row: rowNum,
                            reason: `Aadhaar validation failed: ${aadhaarErrors.join(', ')}`
                        });
                        continue;
                    }
                    insertData.aadhaar_number = row.aadhaarNumber;
                }

                // Add Passport number if present
                if (row.passportNumber) {
                    const passportErrors = validatePassportFormat(row.passportNumber);
                    if (passportErrors.length > 0) {
                        results.errors.push({
                            row: rowNum,
                            reason: `Passport validation failed: ${passportErrors.join(', ')}`
                        });
                        continue;
                    }
                    insertData.passport_number = row.passportNumber;
                }


                // ✅ FIXED: Simplified grouping logic
                const existingGroupId = await travelerRepository.findGroupByEmailOrPhone(
                    insertData.traveler_email,
                    insertData.traveler_phone
                );

                if (existingGroupId) {
                    insertData.group_id = existingGroupId;
                } else {
                    const newGroupId = `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    insertData.group_id = newGroupId;
                }

                toCreate.push(insertData);

            } catch (error: any) {
                results.errors.push({
                    row: rowNum,
                    reason: `Error processing row: ${error.message || 'Unknown error'}`
                });
            }
        }

        if (toCreate.length > 0) {


            try {
                await travelerRepository.bulkCreateTravelers(toCreate);
                results.created = toCreate.length;

            } catch (bulkError: any) {


                let createdCount = 0;

                for (let i = 0; i < toCreate.length; i++) {
                    try {
                        const { data, error } = await supabaseAdmin
                            .from('travelers')
                            .insert(toCreate[i])
                            .select();

                        if (error) {
                            results.errors.push({
                                row: i + 2,
                                reason: `Insert failed: ${error.message}`
                            });
                        } else {
                            createdCount++;
                        }
                    } catch (insertError: any) {
                        results.errors.push({
                            row: i + 2,
                            reason: `Insert failed: ${insertError.message}`
                        });
                    }
                }

                results.created = createdCount;
            }
        }

        return results;
    },

    async getTravelersByGroup(groupId: string): Promise<ITraveler[]> {
        return await travelerRepository.getTravelersByGroup(groupId);
    }
};

