import { supabaseAdmin } from '../config';
import { CreateLeadStageVoucherPayload } from '../interfaces/leadStageVoucher.interface';

export const leadStageVoucherRepository = {
  /**
   * Save dynamic lead stage voucher configurations to Supabase PostgreSQL
   */
  async createVoucherRecord(payload: CreateLeadStageVoucherPayload) {
    const { data, error } = await supabaseAdmin
      .from('lead_stage_vouchers')
      .insert({
        lead_id: payload.leadId,
        lead_name: payload.leadName,
        lead_email: payload.leadEmail,
        lead_phone: payload.leadPhone,
        service_configurations: payload.serviceConfigurations, // Saves directly as jsonb array layout
        created_at: payload.createdAt || new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase lead voucher insertion error:", error);
      throw new Error(`Failed to save lead voucher: ${error.message}`);
    }

    return data;
  }
};