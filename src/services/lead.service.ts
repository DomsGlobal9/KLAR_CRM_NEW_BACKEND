import {
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadFilter,
  LeadWithRequirements
} from '../interfaces/lead.interface';
import { stageRepository } from '../repositories';
import { leadRepository } from '../repositories/lead.repository';
import { ValidationUtils } from '../utils';
import { LeadDataMapper } from '../utils/lead-data-mapper';

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
      console.log(`⚠️ Lead with email ${sanitizedData.email} already exists`);

    }


    const lead = await leadRepository.createLeadWithFullDetails(sanitizedData);

    return lead;
  },

  /**
   * Get lead by ID with requirements
   */
  async getLeadById(id: string): Promise<LeadWithRequirements> {
    const lead = await leadRepository.getLeadWithFullDetails(id);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  },


  /**
   * Get all leads with requirements
   */
  // async getAllLeads(filter: LeadFilter = {}): Promise<LeadWithRequirements[]> {
  //   return await leadRepository.getAllLeadsWithRequirements(filter);
  // },

  async getAllLeads(filter: LeadFilter = {}, currentUser?: { id: string; role: string }): Promise<any[]> {
    return await leadRepository.getLeadsList({
      ...filter,
      currentUser: currentUser
    });
  },

  /**
   * Update lead and requirements
   */
  async updateLead(id: string, payload: any): Promise<boolean> {
    console.log("🔧 Service update received payload:", JSON.stringify(payload, null, 2));


    const existingLead = await leadRepository.getLeadById(id);
    if (!existingLead) {
      throw new Error('Lead not found');
    }


    if (payload.email && payload.email !== existingLead.email) {
      const validation = ValidationUtils.validateEmail(payload.email);
      if (!validation) {
        throw new Error('Invalid email format');
      }


      const existingWithNewEmail = await leadRepository.getLeadByEmail(payload.email);
      if (existingWithNewEmail && existingWithNewEmail.id !== id) {
        throw new Error('Email already in use by another lead');
      }
    }


    if (payload.phone && payload.phone !== existingLead.phone) {
      const validation = ValidationUtils.validatePhone(payload.phone);
      if (!validation) {
        throw new Error('Invalid phone number');
      }
    }

    // Sanitize data
    const sanitizedData = ValidationUtils.sanitizeLeadData(payload);

    // Update lead with full details including service relationships
    return await leadRepository.updateLeadWithFullDetails(id, sanitizedData);
  },

  /**
   * Update only requirements for a lead
   */
  async updateLeadRequirements(leadId: string, payload: Partial<CreateLeadPayload>): Promise<LeadWithRequirements> {

    const existingLead = await leadRepository.getLeadById(leadId);
    if (!existingLead) {
      throw new Error('Lead not found');
    }


    const sanitizedData = ValidationUtils.sanitizeLeadData(payload);


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


    await leadRepository.upsertLeadRequirements(leadId, requirementFields);


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
  async getLeadStats(leadId?: string): Promise<any> {
    try {
      return await leadRepository.getLeadStats(leadId);
    } catch (error) {
      console.error('Error in getLeadStats service:', error);
      throw error;
    }
  },

  /**
   * Capture lead from web form
   */
  async captureWebLead(payload: CreateLeadPayload): Promise<LeadWithRequirements> {

    if (!payload.name || !payload.email || !payload.phone || !payload.type) {
      throw new Error('Name, email, phone, and type are required');
    }


    const validation = ValidationUtils.validateLeadPayload(payload);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }


    const webLeadPayload = {
      ...payload,
      captured_from: 'web_form'
    } as CreateLeadPayload;


    const sanitizedData = ValidationUtils.sanitizeLeadData(webLeadPayload);


    return await leadRepository.createLeadWithRequirements(sanitizedData);
  },

  /**
   * Update lead stage
   */
  async updateLeadStage(
    id: string,
    stageId: string
  ): Promise<boolean> {

    if (!stageId) {
      throw new Error('Valid stage id required');
    }

    const stageName = await stageRepository.getStageNameById(stageId);

    if (!stageName) {
      throw new Error('Stage name not found');
    }


    return await leadRepository.updateLeadStageOnly(id, stageName);
  },

  /**
   * Assign lead to user
   */
  async assignLead(id: string, assignedTo: string): Promise<boolean> {
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
};