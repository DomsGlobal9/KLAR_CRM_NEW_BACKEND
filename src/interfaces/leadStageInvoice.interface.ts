export interface CreateLeadStageInvoicePayload {
  voucher_id: string;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  invoice_date: string;
  payment_method: string;
  payment_type: 'percentage' | 'number';
  paid_percentage: number;
  rest_amount: number;
  paid_amount: number;
  voucher_total: number;
  voucher_currency: string;
  billing_address: string;
  notes?: string;
  terms_conditions: string;
  gst_number?: string;
  service_configurations: any[];
}