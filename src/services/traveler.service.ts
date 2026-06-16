import { travelerRepository } from '../repositories/traveler.repository';
import {
    ITraveler,
    CreateTravelerPayload,
    UpdateTravelerPayload,
    TravelerFilter,
    Title
} from '../models/traveler.model';
import { supabaseAdmin } from '../config';

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
    },

    /**
  * Bulk create travelers with duplicate checking
  */
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

        // Extract all emails and phones from the incoming data
        const emailsToCheck = travelersData
            .map(t => t.travelerEmail)
            .filter(Boolean);
        const phonesToCheck = travelersData
            .map(t => t.travelerPhone)
            .filter(Boolean);

        console.log(`🔍 Checking ${emailsToCheck.length} emails and ${phonesToCheck.length} phones for duplicates`);

        // CRITICAL: Use the repository's checkBulkExists method
        try {
            // Pass the full travelers array to check both email and phone
            const travelerList = travelersData.map(t => ({
                email: t.travelerEmail,
                phone: t.travelerPhone
            })).filter(t => t.email || t.phone);

            const { emails: existingEmails, phones: existingPhones } =
                await travelerRepository.checkBulkExists(travelerList);

            console.log(`📊 Found ${existingEmails.size} existing emails and ${existingPhones.size} existing phones`);

            // Format phone function
            const formatPhone = (phone: string): string => {
                let cleaned = phone.replace(/[^0-9+]/g, '');
                if (!cleaned.startsWith('+')) {
                    cleaned = cleaned.replace(/^0+/, '');
                    cleaned = `+91${cleaned}`;
                }
                return cleaned;
            };

            // Prepare data for insertion
            const toCreate: any[] = [];

            travelersData.forEach((row, index) => {
                const rowNum = index + 2;

                try {
                    // Validate required fields
                    if (!row.title || !row.travelerName || !row.travelerEmail ||
                        !row.travelerPhone || !row.dateOfBirth ||
                        !row.emergencyContactName || !row.emergencyContactEmail ||
                        !row.emergencyContactPhone) {
                        results.errors.push({
                            row: rowNum,
                            reason: 'Missing required fields'
                        });
                        return;
                    }

                    // Validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(row.travelerEmail)) {
                        results.errors.push({
                            row: rowNum,
                            reason: `Invalid email format: ${row.travelerEmail}`
                        });
                        return;
                    }

                    // Check for duplicates
                    let duplicateReason = '';
                    if (existingEmails.has(row.travelerEmail)) {
                        duplicateReason = `Email "${row.travelerEmail}" already exists in system`;
                    } else if (existingPhones.has(row.travelerPhone)) {
                        duplicateReason = `Phone "${row.travelerPhone}" already exists in system`;
                    }

                    if (duplicateReason) {
                        results.skipped++;
                        results.skippedUsers.push({
                            email: row.travelerEmail,
                            phone: row.travelerPhone,
                            reason: duplicateReason
                        });
                        return;
                    }

                    // Format data for insertion
                    const insertData = {
                        title: row.title,
                        traveler_name: row.travelerName,
                        traveler_email: row.travelerEmail,
                        traveler_phone: formatPhone(row.travelerPhone),
                        date_of_birth: new Date(row.dateOfBirth),
                        passport: row.passportNumber ? {
                            passportNumber: row.passportNumber,
                            nationality: row.nationality || '',
                            issueDate: row.passportIssueDate ? new Date(row.passportIssueDate) : null,
                            expiryDate: row.passportExpiryDate ? new Date(row.passportExpiryDate) : null
                        } : null,
                        gst: row.gstNumber ? {
                            gstNumber: row.gstNumber,
                            registeredName: row.registeredName || '',
                            email: row.gstEmail || '',
                            mobile: row.gstMobile ? formatPhone(row.gstMobile) : '',
                            address: row.gstAddress || ''
                        } : null,
                        emergency_contact: {
                            contactName: row.emergencyContactName,
                            email: row.emergencyContactEmail,
                            phoneNumber: formatPhone(row.emergencyContactPhone)
                        },
                        created_at: new Date(),
                        updated_at: new Date()
                    };

                    toCreate.push(insertData);

                    // Add to existing sets to avoid duplicates within the SAME file
                    existingEmails.add(row.travelerEmail);
                    existingPhones.add(row.travelerPhone);

                } catch (error: any) {
                    results.errors.push({
                        row: rowNum,
                        reason: `Error processing row: ${error.message || 'Unknown error'}`
                    });
                }
            });

            // If there are travelers to create
            if (toCreate.length > 0) {
                console.log(`📝 Attempting to create ${toCreate.length} travelers...`);

                // Try bulk insert first
                try {
                    await travelerRepository.bulkCreateTravelers(toCreate);
                    results.created = toCreate.length;
                    console.log(`✅ Successfully created ${toCreate.length} travelers via bulk insert`);
                } catch (bulkError: any) {
                    console.error('❌ Bulk insert failed, falling back to individual inserts:', bulkError.message);

                    // Fallback: Insert one by one
                    let createdCount = 0;
                    let skippedCount = 0;
                    let errorCount = 0;

                    for (let i = 0; i < toCreate.length; i++) {
                        try {
                            const { data, error } = await supabaseAdmin
                                .from('travelers')
                                .insert(toCreate[i])
                                .select();

                            if (error) {
                                if (error.code === '23505') { 
                                    skippedCount++;
                                    results.skipped++;
                                    const field = error.details?.includes('traveler_email') ? 'Email' : 'Phone';
                                    results.skippedUsers.push({
                                        email: toCreate[i].traveler_email,
                                        phone: toCreate[i].traveler_phone,
                                        reason: `${field} already exists`
                                    });
                                } else {
                                    errorCount++;
                                    results.errors.push({
                                        row: i + 2,
                                        reason: `Insert failed: ${error.message}`
                                    });
                                }
                            } else {
                                createdCount++;
                            }
                        } catch (insertError: any) {
                            errorCount++;
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

        } catch (error: any) {
            results.errors.push({
                row: 0,
                reason: `Bulk upload failed: ${error.message}`
            });
            return results;
        }
    }
};