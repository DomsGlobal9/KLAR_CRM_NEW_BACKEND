export class StageValidationUtils {
  /**
   * Validate stage payload
   */
  static validateStagePayload(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.name || typeof payload.name !== 'string' || payload.name.trim().length === 0) {
      errors.push('Stage name is required');
    } else if (payload.name.trim().length > 100) {
      errors.push('Stage name must be less than 100 characters');
    }

    if (!payload.color || typeof payload.color !== 'string' || payload.color.trim().length === 0) {
      errors.push('Stage color is required');
    }

    if (payload.position !== undefined && (typeof payload.position !== 'number' || payload.position < 0)) {
      errors.push('Position must be a non-negative number');
    }

    if (payload.is_default !== undefined && typeof payload.is_default !== 'boolean') {
      errors.push('is_default must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate color format (Tailwind gradient format)
   */
  static validateColor(color: string): boolean {
    const patterns = [
      /^from-(?:[a-z]+)-(?:[1-9]00) to-(?:[a-z]+)-(?:[1-9]00)$/,
      /^from-\[#[0-9A-Fa-f]{6}\] to-\[#[0-9A-Fa-f]{6}\]$/,
      /^#[0-9A-Fa-f]{6}$/
    ];

    return patterns.some(pattern => pattern.test(color));
  }

  /**
   * Sanitize stage data
   */
  static sanitizeStageData(payload: any): any {
    const sanitized: any = {};

    if (payload.name !== undefined) {
      sanitized.name = payload.name.trim();
    }

    if (payload.color !== undefined) {
      sanitized.color = payload.color.trim();
    }

    if (payload.position !== undefined) {
      sanitized.position = parseInt(payload.position) || 0;
    }

    if (payload.is_default !== undefined) {
      sanitized.is_default = Boolean(payload.is_default);
    }

    return sanitized;
  }

  /**
   * Validate stage reorder payload
   */
  static validateReorderPayload(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.stages || !Array.isArray(payload.stages)) {
      errors.push('Stages array is required');
      return { valid: false, errors };
    }

    if (payload.stages.length === 0) {
      errors.push('Stages array cannot be empty');
    }

    payload.stages.forEach((stage: any, index: number) => {
      if (!stage.id || typeof stage.id !== 'string') {
        errors.push(`Stage at index ${index}: id is required and must be a string`);
      }

      if (stage.position === undefined || typeof stage.position !== 'number') {
        errors.push(`Stage at index ${index}: position is required and must be a number`);
      } else if (stage.position < 0) {
        errors.push(`Stage at index ${index}: position must be non-negative`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }



}