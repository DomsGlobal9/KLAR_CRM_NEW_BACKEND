import { ICreateQuoteDTO, IUpdateQuoteDTO } from '../interfaces';

export const quoteValidator = {
  /**
   * Validate create quote data
   */
  validateCreateQuote(data: any): { isValid: boolean; errors: string[]; payload?: ICreateQuoteDTO } {
    const errors: string[] = [];

    // Required fields
    if (!data.client_name || typeof data.client_name !== 'string' || data.client_name.trim().length === 0) {
      errors.push('Client name is required and must be a non-empty string');
    }

    if (!data.client_email || typeof data.client_email !== 'string' || !this.isValidEmail(data.client_email)) {
      errors.push('Valid client email is required');
    }

    if (!data.client_phone || typeof data.client_phone !== 'string' || data.client_phone.trim().length < 10) {
      errors.push('Valid client phone number is required (minimum 10 digits)');
    }

    if (data.valid_until && !this.isValidDate(data.valid_until)) {
      errors.push('Valid until date must be a valid date');
    }

    if (data.line_items && !Array.isArray(data.line_items)) {
      errors.push('Line items must be an array');
    }

    // Validate financial fields
    if (data.subtotal !== undefined && (typeof data.subtotal !== 'number' || data.subtotal < 0)) {
      errors.push('Subtotal must be a non-negative number');
    }

    if (data.tax_amount !== undefined && (typeof data.tax_amount !== 'number' || data.tax_amount < 0)) {
      errors.push('Tax amount must be a non-negative number');
    }

    if (data.total !== undefined && (typeof data.total !== 'number' || data.total < 0)) {
      errors.push('Total must be a non-negative number');
    }

    if (data.final_amount !== undefined && (typeof data.final_amount !== 'number' || data.final_amount < 0)) {
      errors.push('Final amount must be a non-negative number');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      payload: data as ICreateQuoteDTO
    };
  },

  /**
   * Validate update quote data
   */
  validateUpdateQuote(data: any): { isValid: boolean; errors: string[]; payload?: IUpdateQuoteDTO } {
    const errors: string[] = [];

    // Optional fields validation
    if (data.client_name !== undefined && (typeof data.client_name !== 'string' || data.client_name.trim().length === 0)) {
      errors.push('Client name must be a non-empty string');
    }

    if (data.client_email !== undefined && !this.isValidEmail(data.client_email)) {
      errors.push('Valid client email is required');
    }

    if (data.client_phone !== undefined && (typeof data.client_phone !== 'string' || data.client_phone.trim().length < 10)) {
      errors.push('Valid client phone number is required (minimum 10 digits)');
    }

    if (data.valid_until !== undefined && !this.isValidDate(data.valid_until)) {
      errors.push('Valid until date must be a valid date');
    }

    if (data.status !== undefined && !this.isValidStatus(data.status)) {
      errors.push('Invalid status value');
    }

    // Validate financial fields
    if (data.subtotal !== undefined && (typeof data.subtotal !== 'number' || data.subtotal < 0)) {
      errors.push('Subtotal must be a non-negative number');
    }

    if (data.tax_amount !== undefined && (typeof data.tax_amount !== 'number' || data.tax_amount < 0)) {
      errors.push('Tax amount must be a non-negative number');
    }

    if (data.total !== undefined && (typeof data.total !== 'number' || data.total < 0)) {
      errors.push('Total must be a non-negative number');
    }

    if (data.final_amount !== undefined && (typeof data.final_amount !== 'number' || data.final_amount < 0)) {
      errors.push('Final amount must be a non-negative number');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      payload: data as IUpdateQuoteDTO
    };
  },

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate date format
   */
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  /**
   * Validate status value
   */
  isValidStatus(status: string): boolean {
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled'];
    return validStatuses.includes(status);
  }
};