export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export const handleError = (error: any): { statusCode: number; message: string } => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message
    };
  }

  // Supabase errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          statusCode: 409,
          message: 'Resource already exists'
        };
      case '23503': // Foreign key violation
        return {
          statusCode: 400,
          message: 'Cannot delete referenced resource'
        };
      default:
        return {
          statusCode: 400,
          message: error.message || 'Database error'
        };
    }
  }

  // Default error
  return {
    statusCode: 500,
    message: 'Internal server error'
  };
};