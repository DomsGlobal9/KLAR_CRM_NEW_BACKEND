import { CURRENCIES, TAX_RATES, QUOTE_TEMPLATES } from '../constants/invoice.constants';

export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
    const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0
    }).format(amount);
}

export function getCurrencySymbol(currencyCode: string): string {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    const from = CURRENCIES.find(c => c.code === fromCurrency);
    const to = CURRENCIES.find(c => c.code === toCurrency);
    if (from && to) {
        return (amount / from.rate) * to.rate;
    }
    return amount;
}

export function getTaxRateById(taxId: string): number {
    const tax = TAX_RATES.find(t => t.id === taxId);
    return tax?.rate || 0;
}

export function getQuoteTemplateById(templateId: string) {
    return QUOTE_TEMPLATES.find(t => t.id === templateId);
}

export function generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
}

export function generateQuoteNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `QT-${timestamp}-${random}`;
}

export function calculateLineItemTotal(item: any): number {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = (subtotal * item.taxRate) / 100;
    return subtotal + taxAmount;
}