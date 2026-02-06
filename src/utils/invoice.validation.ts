import { ICreateInvoiceDTO } from '../interfaces/invoice.interface';
import { ICreateQuoteDTO } from '../interfaces/quote.interface';
import { camelToSnakeCase } from './camelCase.validator';


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

export function validateInvoiceData(invoiceData: ICreateInvoiceDTO): void {
    const errors: string[] = [];

    if (!invoiceData.client_name?.trim()) {
        errors.push('Client name is required');
    }

    if (!invoiceData.client_email?.trim()) {
        errors.push('Client email is required');
    } else if (!validateEmail(invoiceData.client_email)) {
        errors.push('Invalid email format');
    }

    if (invoiceData.client_phone && !validatePhone(invoiceData.client_phone)) {
        errors.push('Invalid phone number format');
    }

    if (!invoiceData.currency?.trim()) {
        errors.push('Currency is required');
    }

    if (invoiceData.total <= 0) {
        errors.push('Total amount must be greater than 0');
    }

    if (invoiceData.gst_number && !validateGSTNumber(invoiceData.gst_number)) {
        errors.push('Invalid GST number format');
    }

    // Validate due date
    if (invoiceData.due_date) {
        const dueDate = new Date(invoiceData.due_date);
        if (isNaN(dueDate.getTime())) {
            errors.push('Invalid due date format');
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}


export function validateQuoteData(quoteData: ICreateQuoteDTO): void {
    console.log('>>> Enter validateQuoteData');
    console.log('Raw payload:', JSON.stringify(quoteData, null, 2));

    // Check if payload is in camelCase and convert to snake_case if needed
    const hasCamelCase = quoteData.hasOwnProperty('clientName') ||
        quoteData.hasOwnProperty('clientEmail') ||
        quoteData.hasOwnProperty('lineItems');

    let processedData: any = quoteData;

    if (hasCamelCase) {
        console.log('Detected camelCase input, converting to snake_case...');
        processedData = camelToSnakeCase(quoteData);
        console.log('Converted to snake_case:', JSON.stringify(processedData, null, 2));
    }

    const errors: string[] = [];

    // Client name - check both formats
    if (!processedData.client_name?.trim()) {
        console.error('Client name missing');
        errors.push('Client name is required');
    }

    // Client email
    if (!processedData.client_email?.trim()) {
        console.error('Client email missing');
        errors.push('Client email is required');
    } else if (!validateEmail(processedData.client_email)) {
        console.error('Invalid email format:', processedData.client_email);
        errors.push('Invalid email format');
    }

    // Phone - check both formats
    const phone = processedData.client_phone || processedData.clientPhone;
    if (phone) {
        if (!validatePhone(phone)) {
            console.error('Invalid phone number:', phone);
            errors.push('Invalid phone number format');
        }
    }

    // Currency
    if (!processedData.currency?.trim()) {
        console.error('Currency missing');
        errors.push('Currency is required');
    }

    // Final amount - check both formats
    const finalAmount = processedData.final_amount || processedData.finalAmount;
    if (finalAmount <= 0) {
        console.error('Invalid final amount:', finalAmount);
        errors.push('Final amount must be greater than 0');
    }

    // Initial amount - check both formats
    const initialAmount = processedData.initial_amount || processedData.initialAmount;
    if (initialAmount <= 0) {
        console.error('Invalid initial amount:', initialAmount);
        errors.push('Initial amount must be greater than 0');
    }

    // Line items - check both formats
    const lineItems = processedData.line_items || processedData.lineItems;
    if (!lineItems || lineItems.length === 0) {
        console.error('No line items provided');
        errors.push('At least one line item is required');
    }

    // GST - check both formats
    const gstNumber = processedData.gst_number || processedData.gstNumber;
    if (gstNumber) {
        if (!validateGSTNumber(gstNumber)) {
            console.error('Invalid GST number:', gstNumber);
            errors.push('Invalid GST number format');
        }
    }

    // Valid until - check both formats
    const validUntil = processedData.valid_until || processedData.validUntil;
    if (!validUntil) {
        console.error('Valid until date missing');
        errors.push('Valid until date is required');
    } else {
        const validUntilDate = new Date(validUntil);
        if (validUntilDate < new Date()) {
            console.error('Valid until is in the past');
            errors.push('Valid until date must be in the future');
        }
    }

    // Final decision
    if (errors.length > 0) {
        console.error('Validation failed with errors:', errors);
        throw new Error(errors.join(', '));
    }

    console.log('Validation passed successfully');

    // Return the processed data in snake_case for further use
    return processedData;
}


