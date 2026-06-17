// import { supabaseAdmin } from '../config';

// export const leadStageInvoiceRepository = {
//   /**
//    * Stores dynamic lead stage fields inside Supabase PostgreSQL schema structures
//    */
//   async insertInvoiceRecord(payload: any) {
//     const { data, error } = await supabaseAdmin
//       .from('lead_stage_invoices')
//       .insert({
//         voucher_id: payload.voucher_id,
//         lead_id: payload.lead_id,
//         lead_name: payload.lead_name,
//         lead_email: payload.lead_email,
//         lead_phone: payload.lead_phone,
//         invoice_number: payload.invoice_number,
//         invoice_date: payload.invoice_date,
//         payment_method: payload.payment_method,
//         payment_type: payload.payment_type,
//         paid_percentage: payload.paid_percentage,
//         rest_amount: payload.rest_amount,
//         paid_amount: payload.paid_amount,
//         total_amount: payload.voucher_total,
//         currency: payload.voucher_currency,
//         billing_address: payload.billing_address,
//         notes: payload.notes,
//         terms_conditions: payload.terms_conditions,
//         gst_number: payload.gst_number,
//         service_configurations: payload.service_configurations, // Stores directly into jsonb array matrix fields
//         status: payload.status,
//         created_at: payload.created_at
//       })
//       .select()
//       .single();

//     if (error) {
//       console.error("❌ Supabase lead stage invoice record insertion failure:", error);
//       throw new Error(`Failed to commit invoice profile tracking record: ${error.message}`);
//     }

//     return data;
//   }
// };































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
        service_configurations: payload.service_configurations,
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
  },


  /**
   * Queries lead stage invoice collections with exact sizing lookups
   */
  async getInvoicesPaginated(page: number, limit: number, sortOrder: 'asc' | 'desc') {
    const fromOffset = (page - 1) * limit;
    const toOffset = page * limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('lead_stage_invoices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: sortOrder === 'asc' })
      .range(fromOffset, toOffset);

    if (error) {
      console.error("❌ Supabase lead stage invoice catalog fetch error:", error);
      throw new Error(`Failed to query transactions database: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0
    };
  },


  /**
   * Pulls an invoice entry matching the unique UUID primary key from the PostgreSQL table
   */
  async getInvoiceById(invoiceId: string) {
    const { data, error } = await supabaseAdmin
      .from('lead_stage_invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase fetch target selection error mapping:", error);
      throw new Error(`Failed to fetch database tracking invoice entry: ${error.message}`);
    }
    return data;
  },

  /**
   * Permanently deletes a matching row record from the relational datastore
   */
  async deleteInvoiceRecord(invoiceId: string) {
    const { error } = await supabaseAdmin
      .from('lead_stage_invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error("❌ Supabase permanent row deletion failure target reference context:", error);
      throw new Error(`Failed to safely purge target record tracking mapping row: ${error.message}`);
    }
    return true;
  }
};