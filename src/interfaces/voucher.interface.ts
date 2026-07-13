export interface IVoucherLineItem {
    service_type: 'flight' | 'hotel' | 'visa' | 'other';
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    total_price?: number;
    details?: any;
}

export interface ICreateVoucherDTO {
    voucher_number: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    voucher_title: string;
    valid_until?: string;
    currency: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    final_amount: number;
    initial_amount: number;
    line_items: IVoucherLineItem[];
    status: string;
    validity_days?: number;
    terms_conditions?: string;
    notes?: string;
    services?: any;
    quote_inputs?: any;
    totals?: any;
    itinerary_details?: any;
    itinerary_id?: string;
    lead_id: string;
}

export interface IVoucherResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}