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
                // Create new group
                groupId = await travelerRepository.findOrCreateGroup(
                    payload.travelerEmail,
                    payload.travelerPhone
                );
            }
        }

        // Add group_id to payload
        const payloadWithGroup = {
            ...payload,
            group_id: groupId,
        };

        // Check if traveler with same email or phone already exists
        if (payload.travelerEmail) {
            const existingTraveler = await travelerRepository.getTravelerByEmail(payload.travelerEmail);
            if (existingTraveler) {
                // If exists but different group, merge groups
                if (existingTraveler.group_id !== groupId) {
                    await this.mergeGroups(existingTraveler.group_id, groupId);
                    groupId = existingTraveler.group_id;
                }
                throw new Error('Traveler with this email already exists in the group');
            }
        }

        if (payload.travelerPhone) {
            const existingTravelerByPhone = await travelerRepository.getTravelerByPhone(payload.travelerPhone);
            if (existingTravelerByPhone) {
                if (existingTravelerByPhone.group_id !== groupId) {
                    await this.mergeGroups(existingTravelerByPhone.group_id, groupId);
                    groupId = existingTravelerByPhone.group_id;
                }
                throw new Error('Traveler with this phone number already exists in the group');
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

    async getAllTravelers(filter: TravelerFilter = {}): Promise<ITraveler[]> {
        return await travelerRepository.getAllTravelers(filter);
    },

    async updateTraveler(id: string, payload: UpdateTravelerPayload): Promise<boolean> {
        const existingTraveler = await travelerRepository.getTravelerById(id);
        if (!existingTraveler) {
            throw new Error('Traveler not found');
        }

        if (payload.travelerEmail) {
            if (!validateEmail(payload.travelerEmail)) {
                throw new Error('Invalid email format');
            }

            const travelerWithEmail = await travelerRepository.getTravelerByEmail(payload.travelerEmail);
            if (travelerWithEmail && travelerWithEmail.id !== id) {
                throw new Error('Email already in use by another traveler');
            }
        }

        if (payload.travelerPhone) {
            if (!validatePhone(payload.travelerPhone)) {
                throw new Error('Invalid phone number format. Phone number must start with country code (e.g., +1234567890)');
            }

            const travelerWithPhone = await travelerRepository.getTravelerByPhone(payload.travelerPhone);
            if (travelerWithPhone && travelerWithPhone.id !== id) {
                throw new Error('Phone number already in use by another traveler');
            }
        }

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
                        registeredName: row.registeredName || '',
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
            console.log(`📝 Attempting to create ${toCreate.length} travelers...`);

            try {
                await travelerRepository.bulkCreateTravelers(toCreate);
                results.created = toCreate.length;
                console.log(`✅ Successfully created ${toCreate.length} travelers via bulk insert`);
            } catch (bulkError: any) {
                console.error('❌ Bulk insert failed, falling back to individual inserts:', bulkError.message);

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

