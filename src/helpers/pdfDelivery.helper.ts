import { pdfDeliveryService } from '../services/pdfDelivery.service';
import { Response } from 'express';

export interface DeliveryOptions {
    leadId: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    pdfUrl: string;
    pdfFileName: string;
}

export interface SendViaOptions {
    whatsapp?: boolean;
    email?: boolean;
}

/**
 * Process PDF delivery with given options
 */
export async function processPDFDelivery(
    options: DeliveryOptions,
    sendVia?: SendViaOptions
) {
    const { clientPhone, clientEmail } = options;


    if (!clientPhone && !clientEmail) {
        return {
            attempted: false,
            message: "No contact information available",
            whatsapp: { sent: false, error: "No phone number provided" },
            email: { sent: false, error: "No email address provided" }
        };
    }

    console.log('📬 Attempting PDF delivery for lead:', options.leadId);
    console.log('📱 Phone available:', !!clientPhone);
    console.log('📧 Email available:', !!clientEmail);
    console.log('📨 Send via options:', sendVia || 'both (default)');


    let channels = { whatsapp: true, email: true };

    if (sendVia && typeof sendVia === 'object') {
        channels = {
            whatsapp: sendVia.whatsapp === true,
            email: sendVia.email === true
        };


        if (!channels.whatsapp && !channels.email) {
            channels.whatsapp = true;
            channels.email = true;
        }
    }

    let deliveryResult;
    if (channels.whatsapp && channels.email) {
        deliveryResult = await pdfDeliveryService.deliverPDF(options);
    } else {
        deliveryResult = await pdfDeliveryService.deliverPDFViaChannels(options, channels);
    }

    console.log('📊 Delivery result:', deliveryResult);
    return deliveryResult;
}

/**
 * Format delivery response
 */
export function formatDeliveryResponse(
    deliveryResult: any,
    clientPhone?: string,
    clientEmail?: string
) {
    if (deliveryResult) {
        return {
            success: deliveryResult.success,
            message: deliveryResult.message,
            whatsapp: deliveryResult.whatsapp ? {
                sent: deliveryResult.whatsapp.sent,
                timestamp: deliveryResult.whatsapp.timestamp,
                ...(deliveryResult.whatsapp.error && { error: deliveryResult.whatsapp.error })
            } : {
                sent: false,
                error: !clientPhone ? "No phone number provided" : "WhatsApp delivery not attempted"
            },
            email: deliveryResult.email ? {
                sent: deliveryResult.email.sent,
                timestamp: deliveryResult.email.timestamp,
                ...(deliveryResult.email.error && { error: deliveryResult.email.error }),
                ...(deliveryResult.email.messageId && { messageId: deliveryResult.email.messageId })
            } : {
                sent: false,
                error: !clientEmail ? "No email address provided" : "Email delivery not attempted"
            }
        };
    }

    return {
        success: false,
        message: "No contact information available for delivery",
        whatsapp: {
            sent: false,
            error: !clientPhone ? "No phone number provided" : "WhatsApp delivery not attempted"
        },
        email: {
            sent: false,
            error: !clientEmail ? "No email address provided" : "Email delivery not attempted"
        }
    };
}

/**
 * Validate sendVia options
 */
export function validateSendViaOptions(sendVia: any): SendViaOptions {
    if (!sendVia || typeof sendVia !== 'object') {
        return { whatsapp: true, email: true };
    }

    return {
        whatsapp: sendVia.whatsapp === true,
        email: sendVia.email === true
    };
}