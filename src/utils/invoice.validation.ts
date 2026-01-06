import { CreateInvoiceDTO } from '../interfaces/invoice.interface';
import { CreateQuoteDTO } from '../interfaces/quote.interface';

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
    // Basic phone validation (adjust based on your needs)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
}

export function validateGSTNumber(gstNumber: string): boolean {
    if (!gstNumber) return true;
    const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
    return gstRegex.test(gstNumber.toUpperCase());
}

export function validateInvoiceData(invoiceData: CreateInvoiceDTO): void {
    const errors: string[] = [];

    if (!invoiceData.clientName?.trim()) {
        errors.push('Client name is required');
    }

    if (!invoiceData.clientEmail?.trim()) {
        errors.push('Client email is required');
    } else if (!validateEmail(invoiceData.clientEmail)) {
        errors.push('Invalid email format');
    }

    if (invoiceData.clientPhone && !validatePhone(invoiceData.clientPhone)) {
        errors.push('Invalid phone number format');
    }

    if (!invoiceData.currency?.trim()) {
        errors.push('Currency is required');
    }

    if (invoiceData.total <= 0) {
        errors.push('Total amount must be greater than 0');
    }

    if (invoiceData.lineItems.length === 0) {
        errors.push('At least one line item is required');
    }

    if (invoiceData.gstNumber && !validateGSTNumber(invoiceData.gstNumber)) {
        errors.push('Invalid GST number format');
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}

export function validateQuoteData(quoteData: CreateQuoteDTO): void {
    const errors: string[] = [];

    if (!quoteData.clientName?.trim()) {
        errors.push('Client name is required');
    }

    if (!quoteData.clientEmail?.trim()) {
        errors.push('Client email is required');
    } else if (!validateEmail(quoteData.clientEmail)) {
        errors.push('Invalid email format');
    }

    if (quoteData.clientPhone && !validatePhone(quoteData.clientPhone)) {
        errors.push('Invalid phone number format');
    }

    if (!quoteData.currency?.trim()) {
        errors.push('Currency is required');
    }

    if (quoteData.finalAmount <= 0) {
        errors.push('Final amount must be greater than 0');
    }

    if (quoteData.initialAmount <= 0) {
        errors.push('Initial amount must be greater than 0');
    }

    if (quoteData.lineItems.length === 0) {
        errors.push('At least one line item is required');
    }

    if (quoteData.gstNumber && !validateGSTNumber(quoteData.gstNumber)) {
        errors.push('Invalid GST number format');
    }

    if (!quoteData.validUntil) {
        errors.push('Valid until date is required');
    } else {
        const validUntil = new Date(quoteData.validUntil);
        if (validUntil < new Date()) {
            errors.push('Valid until date must be in the future');
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}