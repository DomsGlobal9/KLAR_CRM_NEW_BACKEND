import { formatDeliveryResponse } from './pdfDelivery.helper';
import { Response } from 'express';

export interface UploadSuccessParams {
    success: boolean;
    publicUrl: string;
    leadId: string;
    clientPhone?: string;
    clientEmail?: string;
    deliveryResult?: any;
}

export function sendUploadResponse(res: Response, params: UploadSuccessParams) {
    const { publicUrl, leadId, clientPhone, clientEmail, deliveryResult } = params;

    const response: any = {
        success: true,
        message: "Itinerary uploaded to S3 successfully",
        public_url: publicUrl,
        lead_id: leadId
    };

    response.delivery = formatDeliveryResponse(deliveryResult, clientPhone, clientEmail);

    return res.status(200).json(response);
}

export function sendErrorResponse(res: Response, error: any) {
    return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
        delivery: {
            success: false,
            message: "Failed to process itinerary",
            error: error.message
        }
    });
}

