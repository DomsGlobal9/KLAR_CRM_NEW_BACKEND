import { supabaseAdmin } from '../config';

export const leadStageInvoiceRepository = {
  /**
   * Stores dynamic lead stage fields inside Supabase PostgreSQL schema structures
   */
  async insertInvoiceRecord(payload: any) {
    const { data, error } = await supabaseAdmin
      .from('lead_stage_invoices')
      .insert({
        voucher_id: payload.voucher_id,
        lead_id: payload.lead_id,
        lead_name: payload.lead_name,
        lead_email: payload.lead_email,
        lead_phone: payload.lead_phone,
        invoice_number: payload.invoice_number,
        invoice_date: payload.invoice_date,
        payment_method: payload.payment_method,
        payment_type: payload.payment_type,
        paid_percentage: payload.paid_percentage,
        rest_amount: payload.rest_amount,
        paid_amount: payload.paid_amount,
        total_amount: payload.voucher_total,
        currency: payload.voucher_currency,
        billing_address: payload.billing_address,
        notes: payload.notes,
        terms_conditions: payload.terms_conditions,
        gst_number: payload.gst_number,
        service_configurations: payload.service_configurations, // Stores directly into jsonb array matrix fields
        status: payload.status,
        created_at: payload.created_at
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase lead stage invoice record insertion failure:", error);
      throw new Error(`Failed to commit invoice profile tracking record: ${error.message}`);
    }

    return data;
  }
};