/**
 * Error Handling Utilities
 *
 * Standardized error classes and error handling for AgentQu
 * Provides consistent error responses across all services
 */

/**
 * Base Application Error
 * All custom errors should extend this class
 */
class AppError extends Error {
  /**
   * @param {string} code - Error code for programmatic handling
   * @param {string} message - Human-readable error message
   * @param {Object} details - Additional error context
   * @param {number} statusCode - HTTP status code (optional)
   */
  constructor(code, message, details = {}, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Validation Error (400)
 * Used when user input is invalid
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super('VALIDATION_ERROR', message, details, 400);
  }
}

/**
 * Authentication Error (401)
 * Used when authentication is required but missing/invalid
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details = {}) {
    super('AUTHENTICATION_ERROR', message, details, 401);
  }
}

/**
 * Authorization Error (403)
 * Used when user is authenticated but lacks permissions
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details = {}) {
    super('AUTHORIZATION_ERROR', message, details, 403);
  }
}

/**
 * Not Found Error (404)
 * Used when requested resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(resource, identifier, details = {}) {
    super(
      'NOT_FOUND',
      `${resource} not found: ${identifier}`,
      { resource, identifier, ...details },
      404
    );
  }
}

/**
 * Conflict Error (409)
 * Used when operation conflicts with existing state
 */
class ConflictError extends AppError {
  constructor(message, details = {}) {
    super('CONFLICT', message, details, 409);
  }
}

/**
 * Rate Limit Error (429)
 * Used when API rate limits are exceeded
 */
class RateLimitError extends AppError {
  constructor(service, retryAfter = null, details = {}) {
    const message = retryAfter
      ? `Rate limit exceeded for ${service}. Retry after ${retryAfter}s`
      : `Rate limit exceeded for ${service}`;

    super('RATE_LIMIT_EXCEEDED', message, { service, retryAfter, ...details }, 429);
  }
}

/**
 * External API Error (502)
 * Used when external API calls fail
 */
class ExternalApiError extends AppError {
  constructor(service, originalError, details = {}) {
    super(
      'EXTERNAL_API_ERROR',
      `External API error: ${service}`,
      {
        service,
        originalMessage: originalError?.message,
        originalCode: originalError?.code,
        ...details,
      },
      502
    );
  }
}

/**
 * Service Unavailable Error (503)
 * Used when a service is temporarily unavailable
 */
class ServiceUnavailableError extends AppError {
  constructor(service, retryAfter = null, details = {}) {
    super(
      'SERVICE_UNAVAILABLE',
      `Service temporarily unavailable: ${service}`,
      { service, retryAfter, ...details },
      503
    );
  }
}

/**
 * Internal Server Error (500)
 * Generic server error for unexpected conditions
 */
class InternalError extends AppError {
  constructor(message, details = {}) {
    super('INTERNAL_ERROR', message, details, 500);
  }
}

/**
 * Database Error
 * Used when database operations fail
 */
class DatabaseError extends AppError {
  constructor(operation, originalError, details = {}) {
    super(
      'DATABASE_ERROR',
      `Database ${operation} failed`,
      {
        operation,
        originalMessage: originalError?.message,
        ...details,
      },
      500
    );
  }
}

/**
 * Error Code Constants
 */
const ERROR_CODES = {
  // Validation (400)
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_RADIUS: 'INVALID_RADIUS',
  INVALID_USER_ID: 'INVALID_USER_ID',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Authentication/Authorization (401, 403)
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not Found (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACTIVITY_NOT_FOUND: 'ACTIVITY_NOT_FOUND',
  TRIP_NOT_FOUND: 'TRIP_NOT_FOUND',
  CIRQLE_NOT_FOUND: 'CIRQLE_NOT_FOUND',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // External APIs (502)
  GOOGLE_PLACES_ERROR: 'GOOGLE_PLACES_ERROR',
  TWITTER_API_ERROR: 'TWITTER_API_ERROR',
  TICKETMASTER_ERROR: 'TICKETMASTER_ERROR',
  WEATHER_API_ERROR: 'WEATHER_API_ERROR',

  // Service/Database (500, 503)
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Format error for logging
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error object
 */
function formatErrorForLogging(error) {
  if (error instanceof AppError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
      stack: error.stack,
    };
  }

  // Standard Error
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

/**
 * Format error for API response
 * @param {Error} error - Error to format
 * @returns {Object} API response object
 */
function formatErrorForResponse(error) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
      },
    };
  }

  // Generic error - don't expose internals
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // If already an AppError, rethrow
      if (error instanceof AppError) {
        throw error;
      }

      // Convert to InternalError
      throw new InternalError(error.message, { originalError: error.message });
    }
  };
}

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
  if (error instanceof AppError) {
    // Retry on service unavailable, rate limits, and some external API errors
    return (
      error instanceof ServiceUnavailableError ||
      error instanceof RateLimitError ||
      (error instanceof ExternalApiError && error.statusCode >= 500)
    );
  }

  // Network errors are generally retryable
  return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND';
}

module.exports = {
  // Error Classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalApiError,
  ServiceUnavailableError,
  InternalError,
  DatabaseError,

  // Constants
  ERROR_CODES,

  // Utilities
  formatErrorForLogging,
  formatErrorForResponse,
  asyncErrorHandler,
  isRetryableError,
};
