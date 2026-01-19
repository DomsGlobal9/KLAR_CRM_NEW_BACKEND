import { 
  CreateLeadPayload, 
  UpdateLeadPayload, 
  LeadFilter,
  LeadWithRequirements,
  LeadWithFullRequirements,
  CreateFlightRequirementPayload,
  CreateHotelRequirementPayload,
  CreateJourneyDetailsPayload
} from '../interfaces/lead.interface';
import { leadRepository } from '../repositories/lead.repository';
import { ValidationUtils } from '../utils';

export const leadService = {
  // ============================================
  // EXISTING METHODS (Enhanced with new features)
  // ============================================

  /**
   * Create a new lead with optional requirements (ENHANCED)
   */
  async createLead(payload: CreateLeadPayload): Promise<LeadWithFullRequirements> {
    // Validate basic lead data
    const validation = ValidationUtils.validateLeadPayload(payload);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
        
    const sanitizedData = ValidationUtils.sanitizeLeadData(payload);
    
    // Check for existing lead
    const existingLead = await leadRepository.getLeadByEmail(sanitizedData.email);
    if (existingLead) {
      console.log(`Lead with email ${sanitizedData.email} already exists`);
    }

    // Validate flight requirements if provided
    if (payload.flight_requirements && payload.flight_requirements.length > 0) {
      for (const flight of payload.flight_requirements) {
        this.validateFlightRequirement(flight);
      }
    }

    // Validate hotel requirements if provided
    if (payload.hotel_requirements && payload.hotel_requirements.length > 0) {
      for (const hotel of payload.hotel_requirements) {
        this.validateHotelRequirement(hotel);
      }
    }

    // Validate journey details if provided
    if (payload.journey_details) {
      this.validateJourneyDetails(payload.journey_details);
    }
    
    // Create lead with all requirements
    return await leadRepository.createLeadWithRequirements(sanitizedData);
  },

  /**
   * Get lead by ID with full requirements (NEW)
   */
  async getLeadByIdWithFullDetails(id: string): Promise<LeadWithFullRequirements> {
    const lead = await leadRepository.getLeadByIdWithFullRequirements(id);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  },

  /**
   * Get lead by ID (backward compatible - basic requirements only)
   */
  async getLeadById(id: string): Promise<LeadWithRequirements> {
    const lead = await leadRepository.getLeadById(id);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  },

  /**
   * Get all leads with requirements
   */
  async getAllLeads(filter: LeadFilter = {}): Promise<LeadWithRequirements[]> {
    return await leadRepository.getAllLeadsWithRequirements(filter);
  },

  /**
   * Update lead and requirements
   */
  async updateLead(id: string, payload: UpdateLeadPayload): Promise<LeadWithRequirements> {
    // Get existing lead
    const existingLead = await leadRepository.getLeadById(id);
    if (!existingLead) {
      throw new Error('Lead not found');
    }
    
    // Validate if email is being updated
    if (payload.email && payload.email !== existingLead.email) {
      const validation = ValidationUtils.validateEmail(payload.email);
      if (!validation) {
        throw new Error('Invalid email format');
      }
      
      // Check if new email already exists
      const existingWithNewEmail = await leadRepository.getLeadByEmail(payload.email);
      if (existingWithNewEmail && existingWithNewEmail.id !== id) {
        throw new Error('Email already in use by another lead');
      }
    }
    
    // Validate phone if being updated
    if (payload.phone && payload.phone !== existingLead.phone) {
      const validation = ValidationUtils.validatePhone(payload.phone);
      if (!validation) {
        throw new Error('Invalid phone number');
      }
    }
    
    // Sanitize data
    const sanitizedData = ValidationUtils.sanitizeLeadData(payload);
    
    // Update lead with requirements
    return await leadRepository.updateLeadWithRequirements(id, sanitizedData);
  },

  /**
   * Update only requirements for a lead
   */
  async updateLeadRequirements(leadId: string, payload: Partial<CreateLeadPayload>): Promise<LeadWithRequirements> {
    // Get existing lead
    const existingLead = await leadRepository.getLeadById(leadId);
    if (!existingLead) {
      throw new Error('Lead not found');
    }
    
    // Sanitize data
    const sanitizedData = ValidationUtils.sanitizeLeadData(payload);
    
    // Separate requirement fields
    const requirementFields: any = {};
    const requirementFieldKeys = [
      'from_location', 'destination', 'travel_date', 'return_date',
      'service_type', 'services', 'sub_service', 'needs_visa',
      'budget', 'travelers', 'flight_class', 'customer_category',
      'sub_category', 'company_name', 'company_address', 'company_details',
      'gst_number', 'lead_type', 'notes'
    ];
    
    Object.keys(sanitizedData).forEach(key => {
      if (requirementFieldKeys.includes(key)) {
        requirementFields[key] = sanitizedData[key];
      }
    });
    
    // Update requirements
    await leadRepository.upsertLeadRequirements(leadId, requirementFields);
    
    // Return updated lead
    return await leadRepository.getLeadById(leadId) as LeadWithRequirements;
  },

  /**
   * Delete lead (cascades to requirements)
   */
  async deleteLead(id: string): Promise<boolean> {
    return await leadRepository.deleteLead(id);
  },

  /**
   * Get lead statistics
   */
  async getLeadStats() {
    return await leadRepository.getLeadStats();
  },

  /**
   * Capture lead from web form
   */
  async captureWebLead(payload: CreateLeadPayload): Promise<LeadWithFullRequirements> {
    // Validate required fields
    if (!payload.name || !payload.email || !payload.phone || !payload.type) {
      throw new Error('Name, email, phone, and type are required');
    }
    
    // Validate basic fields
    const validation = ValidationUtils.validateLeadPayload(payload);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Set captured from to web_form
    const webLeadPayload = {
      ...payload,
      captured_from: 'web_form'
    } as CreateLeadPayload;
    
    // Sanitize data
    const sanitizedData = ValidationUtils.sanitizeLeadData(webLeadPayload);
    
    // Create lead
    return await leadRepository.createLeadWithRequirements(sanitizedData);
  },

  /**
   * Update lead stage
   */
  async updateLeadStage(id: string, stage: string): Promise<LeadWithRequirements> {
    // Validate stage
    if (!stage || typeof stage !== 'string') {
      throw new Error('Valid stage is required');
    }
    
    const validStages = ['lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    if (!validStages.includes(stage)) {
      throw new Error(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
    }
    
    const payload: UpdateLeadPayload = { stage };
    return await leadRepository.updateLeadWithRequirements(id, payload);
  },

  /**
   * Assign lead to user
   */
  async assignLead(id: string, assignedTo: string): Promise<LeadWithRequirements> {
    if (!assignedTo || typeof assignedTo !== 'string') {
      throw new Error('Valid user ID is required for assignment');
    }
    
    const payload: UpdateLeadPayload = { assigned_to: assignedTo };
    return await leadRepository.updateLeadWithRequirements(id, payload);
  },

  /**
   * Search leads
   */
  async searchLeads(query: string): Promise<LeadWithRequirements[]> {
    return await leadRepository.getAllLeadsWithRequirements({ search: query });
  },

  // ============================================
  // NEW: FLIGHT REQUIREMENTS METHODS
  // ============================================

  /**
   * Add flight requirement to a lead
   */
  async addFlightRequirement(leadId: string, payload: CreateFlightRequirementPayload) {
    // Check if lead exists
    const lead = await leadRepository.getLeadById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Validate flight requirement
    this.validateFlightRequirement(payload);

    return await leadRepository.addFlightRequirement(leadId, payload);
  },

  /**
   * Update flight requirement
   */
  async updateFlightRequirement(id: string, payload: Partial<CreateFlightRequirementPayload>) {
    // Validate if dates are being updated
    if (payload.departure_date || payload.return_date) {
      if (payload.departure_date && payload.return_date) {
        const departureDate = new Date(payload.departure_date);
        const returnDate = new Date(payload.return_date);
        
        if (returnDate <= departureDate) {
          throw new Error('Return date must be after departure date');
        }
      }
    }

    return await leadRepository.updateFlightRequirement(id, payload);
  },

  /**
   * Delete flight requirement (soft delete)
   */
  async deleteFlightRequirement(id: string) {
    return await leadRepository.deleteFlightRequirement(id);
  },

  /**
   * Get flight requirements by lead ID
   */
  async getFlightRequirementsByLeadId(leadId: string) {
    return await leadRepository.getFlightRequirementsByLeadId(leadId);
  },

  // ============================================
  // NEW: HOTEL REQUIREMENTS METHODS
  // ============================================

  /**
   * Add hotel requirement to a lead
   */
  async addHotelRequirement(leadId: string, payload: CreateHotelRequirementPayload) {
    // Check if lead exists
    const lead = await leadRepository.getLeadById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Validate hotel requirement
    this.validateHotelRequirement(payload);

    return await leadRepository.addHotelRequirement(leadId, payload);
  },

  /**
   * Update hotel requirement
   */
  async updateHotelRequirement(id: string, payload: Partial<CreateHotelRequirementPayload>) {
    // Validate dates if being updated
    if (payload.check_in_date && payload.check_out_date) {
      const checkIn = new Date(payload.check_in_date);
      const checkOut = new Date(payload.check_out_date);
      
      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }
    }

    return await leadRepository.updateHotelRequirement(id, payload);
  },

  /**
   * Delete hotel requirement (soft delete)
   */
  async deleteHotelRequirement(id: string) {
    return await leadRepository.deleteHotelRequirement(id);
  },

  /**
   * Get hotel requirements by lead ID
   */
  async getHotelRequirementsByLeadId(leadId: string) {
    return await leadRepository.getHotelRequirementsByLeadId(leadId);
  },

  // ============================================
  // NEW: JOURNEY DETAILS METHODS
  // ============================================

  /**
   * Upsert journey details for a lead
   */
  async upsertJourneyDetails(leadId: string, payload: CreateJourneyDetailsPayload) {
    // Check if lead exists
    const lead = await leadRepository.getLeadById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Validate journey details
    this.validateJourneyDetails(payload);

    return await leadRepository.upsertJourneyDetails(leadId, payload);
  },

  /**
   * Get journey details by lead ID
   */
  async getJourneyDetailsByLeadId(leadId: string) {
    return await leadRepository.getJourneyDetailsByLeadId(leadId);
  },

  // ============================================
  // NEW: GET LEADS BY ASSIGNED RM
  // ============================================

  /**
   * Get all leads assigned to a specific RM with full details
   */
  async getLeadsByAssignedRM(rmId: string): Promise<LeadWithFullRequirements[]> {
    if (!rmId || typeof rmId !== 'string') {
      throw new Error('Valid RM ID is required');
    }

    return await leadRepository.getLeadsByAssignedRM(rmId);
  },

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  /**
   * Validate flight requirement data
   */
  validateFlightRequirement(payload: CreateFlightRequirementPayload): void {
    if (!payload.departure_city || !payload.arrival_city) {
      throw new Error('Departure and arrival cities are required');
    }

    if (!payload.departure_date) {
      throw new Error('Departure date is required');
    }

    // Check if departure date is in the future
    const departureDate = new Date(payload.departure_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departureDate < today) {
      throw new Error('Departure date must be in the future');
    }

    // If return date is provided, check it's after departure
    if (payload.return_date) {
      const returnDate = new Date(payload.return_date);
      if (returnDate <= departureDate) {
        throw new Error('Return date must be after departure date');
      }
    }

    // Validate number of passengers
    if (payload.number_of_passengers !== undefined && payload.number_of_passengers < 1) {
      throw new Error('Number of passengers must be at least 1');
    }

    // Validate class
    if (payload.class) {
      const validClasses = ['economy', 'premium_economy', 'business', 'first'];
      if (!validClasses.includes(payload.class)) {
        throw new Error(`Invalid flight class. Must be one of: ${validClasses.join(', ')}`);
      }
    }

    // Validate budget
    if (payload.budget_per_person !== undefined && payload.budget_per_person < 0) {
      throw new Error('Budget per person cannot be negative');
    }

    if (payload.total_budget !== undefined && payload.total_budget < 0) {
      throw new Error('Total budget cannot be negative');
    }
  },

  /**
   * Validate hotel requirement data
   */
  validateHotelRequirement(payload: CreateHotelRequirementPayload): void {
    if (!payload.city) {
      throw new Error('City is required');
    }

    if (!payload.check_in_date || !payload.check_out_date) {
      throw new Error('Check-in and check-out dates are required');
    }

    // Check dates
    const checkIn = new Date(payload.check_in_date);
    const checkOut = new Date(payload.check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      throw new Error('Check-in date must be in the future');
    }

    if (checkOut <= checkIn) {
      throw new Error('Check-out date must be after check-in date');
    }

    // Validate number of rooms
    if (payload.number_of_rooms !== undefined && payload.number_of_rooms < 1) {
      throw new Error('Number of rooms must be at least 1');
    }

    // Validate number of guests
    if (payload.number_of_guests !== undefined && payload.number_of_guests < 1) {
      throw new Error('Number of guests must be at least 1');
    }

    // Validate star rating
    if (payload.star_rating !== undefined) {
      if (payload.star_rating < 1 || payload.star_rating > 5) {
        throw new Error('Star rating must be between 1 and 5');
      }
    }

    // Validate room type
    if (payload.room_type) {
      const validRoomTypes = ['standard', 'deluxe', 'suite', 'executive', 'presidential'];
      if (!validRoomTypes.includes(payload.room_type)) {
        throw new Error(`Invalid room type. Must be one of: ${validRoomTypes.join(', ')}`);
      }
    }

    // Validate budget
    if (payload.budget_per_night !== undefined && payload.budget_per_night < 0) {
      throw new Error('Budget per night cannot be negative');
    }

    if (payload.total_budget !== undefined && payload.total_budget < 0) {
      throw new Error('Total budget cannot be negative');
    }
  },

  /**
   * Validate journey details data
   */
  validateJourneyDetails(payload: CreateJourneyDetailsPayload): void {
    if (!payload.start_date) {
      throw new Error('Start date is required');
    }

    // Check if start date is in the future
    const startDate = new Date(payload.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new Error('Start date must be in the future');
    }

    // If end date is provided, check it's after start
    if (payload.end_date) {
      const endDate = new Date(payload.end_date);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Validate total travelers
    if (payload.total_travelers !== undefined && payload.total_travelers < 1) {
      throw new Error('Total travelers must be at least 1');
    }

    // Validate total days
    if (payload.total_days !== undefined && payload.total_days < 1) {
      throw new Error('Total days must be at least 1');
    }

    // Validate journey type
    if (payload.journey_type) {
      const validJourneyTypes = ['one_way', 'round_trip', 'multi_city'];
      if (!validJourneyTypes.includes(payload.journey_type)) {
        throw new Error(`Invalid journey type. Must be one of: ${validJourneyTypes.join(', ')}`);
      }
    }

    // Validate journey status
    if (payload.journey_status) {
      const validStatuses = ['planning', 'quoted', 'booked', 'completed', 'cancelled'];
      if (!validStatuses.includes(payload.journey_status)) {
        throw new Error(`Invalid journey status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate budget
    if (payload.total_budget !== undefined && payload.total_budget < 0) {
      throw new Error('Total budget cannot be negative');
    }
  }
};