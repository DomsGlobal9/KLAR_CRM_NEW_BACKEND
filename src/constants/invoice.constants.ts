export const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095 },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 0.044 },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.016 },
];

export const TAX_RATES = [
    { id: 'gst_5', name: 'GST 5%', rate: 5 },
    { id: 'gst_12', name: 'GST 12%', rate: 12 },
    { id: 'gst_18', name: 'GST 18%', rate: 18 },
    { id: 'gst_28', name: 'GST 28%', rate: 28 },
    { id: 'vat_20', name: 'VAT 20%', rate: 20 },
    { id: 'sales_tax', name: 'Sales Tax 8%', rate: 8 },
    { id: 'none', name: 'No Tax', rate: 0 },
];

export const QUOTE_TEMPLATES = [
    { id: 'domestic_package', name: 'Domestic Travel Package', type: 'travel' },
    { id: 'international_package', name: 'International Travel Package', type: 'travel' },
    { id: 'corporate_event', name: 'Corporate Event Travel', type: 'travel' },
    { id: 'postal_domestic', name: 'Domestic Postal Service', type: 'postal' },
    { id: 'postal_international', name: 'International Courier', type: 'postal' },
    { id: 'freight_shipping', name: 'Freight & Shipping', type: 'postal' },
];