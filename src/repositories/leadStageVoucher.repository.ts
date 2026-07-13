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
  },


  /**
   * Fetch all lead stage vouchers sorted by creation date
   */
  async getAllVouchers(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const toRange = offset + limit - 1;

    // Fetch records with an exact row-counter wrapper flag enabled
    const { data, error, count } = await supabaseAdmin
      .from('lead_stage_vouchers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, toRange);

    if (error) {
      console.error("❌ Supabase fetch records pagination failure:", error);
      throw new Error(`Failed to retrieve vouchers: ${error.message}`);
    }

    return {
      vouchers: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
  },

  

  /**
   * Fetch a single lead stage voucher record by its primary database ID
   */
  async getVoucherById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('lead_stage_vouchers')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Prevents throwing an error if 0 records match

    if (error) {
      console.error(`❌ Supabase getVoucherById error [ID: ${id}]:`, error);
      throw new Error(`Failed to retrieve voucher record: ${error.message}`);
    }

    return data;
  }
};