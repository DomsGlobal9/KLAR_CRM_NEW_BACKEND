import { 
  CreateLeadPayload, 
  UpdateLeadPayload, 
  LeadFilter,
  LeadWithRequirements 
} from '../interfaces/lead.interface';
import { leadRepository } from '../repositories/lead.repository';
import { ValidationUtils } from '../utils';

export const leadService = {
  /**
   * Create a new lead with optional requirements
   */
  async createLead(payload: CreateLeadPayload): Promise<LeadWithRequirements> {
    const validation = ValidationUtils.validateLeadPayload(payload);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
        
    const sanitizedData = ValidationUtils.sanitizeLeadData(payload);
    
    const existingLead = await leadRepository.getLeadByEmail(sanitizedData.email);
    if (existingLead) {
      console.log(`Lead with email ${sanitizedData.email} already exists`);
    }
    
    // Create lead with requirements
    return await leadRepository.createLeadWithRequirements(sanitizedData);
  },

  /**
   * Get lead by ID with requirements
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
  async captureWebLead(payload: CreateLeadPayload): Promise<LeadWithRequirements> {
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
  }
};