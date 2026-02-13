export interface InquirySource {
    id: string;
    name: string;
    value: string;
    label: string;
    category: string;
    is_active: boolean;
    display_order: number;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateInquirySourceDTO {
    name: string;
    value: string;
    label: string;
    category?: string;
    display_order?: number;
    created_by?: string;
}

export interface UpdateInquirySourceDTO {
    name?: string;
    value?: string;
    label?: string;
    category?: string;
    display_order?: number;
    is_active?: boolean;
}