/**
 * Frontend Input Validation Utilities
 *
 * Provides validation functions for user inputs before API calls.
 * Matches backend validation for consistency.
 *
 * @module validation
 */

import { createLogger } from './logger';

const logger = createLogger('VALIDATION');

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Coordinate validation constraints
 */
const COORDINATE_CONSTRAINTS = {
  lat: { min: -90, max: 90 },
  lng: { min: -180, max: 180 },
};

/**
 * Radius validation constraints (miles)
 */
const RADIUS_CONSTRAINTS = {
  min: 0.5,
  max: 50,
};

/**
 * Affinity validation constraints
 */
const AFFINITY_CONSTRAINTS = {
  min: 0,
  max: 100,
};

/**
 * Validate latitude coordinate
 *
 * @param lat - Latitude value to validate
 * @returns Validation result
 *
 * @example
 * const result = validateLatitude(40.7128);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export function validateLatitude(lat: number): ValidationResult {
  const errors: string[] = [];

  if (typeof lat !== 'number' || isNaN(lat)) {
    errors.push('Latitude must be a valid number');
  } else if (lat < COORDINATE_CONSTRAINTS.lat.min || lat > COORDINATE_CONSTRAINTS.lat.max) {
    errors.push(`Latitude must be between ${COORDINATE_CONSTRAINTS.lat.min} and ${COORDINATE_CONSTRAINTS.lat.max}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate longitude coordinate
 *
 * @param lng - Longitude value to validate
 * @returns Validation result
 */
export function validateLongitude(lng: number): ValidationResult {
  const errors: string[] = [];

  if (typeof lng !== 'number' || isNaN(lng)) {
    errors.push('Longitude must be a valid number');
  } else if (lng < COORDINATE_CONSTRAINTS.lng.min || lng > COORDINATE_CONSTRAINTS.lng.max) {
    errors.push(`Longitude must be between ${COORDINATE_CONSTRAINTS.lng.min} and ${COORDINATE_CONSTRAINTS.lng.max}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate coordinates (lat, lng pair)
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Validation result
 *
 * @example
 * const result = validateCoordinates(40.7128, -74.0060);
 * if (result.valid) {
 *   // Proceed with API call
 * }
 */
export function validateCoordinates(lat: number, lng: number): ValidationResult {
  const latResult = validateLatitude(lat);
  const lngResult = validateLongitude(lng);

  return {
    valid: latResult.valid && lngResult.valid,
    errors: [...latResult.errors, ...lngResult.errors],
  };
}

/**
 * Validate search radius in miles
 *
 * @param radius - Radius in miles
 * @returns Validation result
 *
 * @example
 * const result = validateRadius(10);
 * if (!result.valid) {
 *   alert(result.errors.join(', '));
 * }
 */
export function validateRadius(radius: number): ValidationResult {
  const errors: string[] = [];

  if (typeof radius !== 'number' || isNaN(radius)) {
    errors.push('Radius must be a valid number');
  } else if (radius < RADIUS_CONSTRAINTS.min) {
    errors.push(`Radius must be at least ${RADIUS_CONSTRAINTS.min} miles`);
  } else if (radius > RADIUS_CONSTRAINTS.max) {
    errors.push(`Radius cannot exceed ${RADIUS_CONSTRAINTS.max} miles`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate affinity score (0-100 scale)
 *
 * @param score - Affinity score
 * @param categoryName - Category name for error messages
 * @returns Validation result
 */
export function validateAffinityScore(score: number, categoryName?: string): ValidationResult {
  const errors: string[] = [];
  const name = categoryName || 'Affinity score';

  if (typeof score !== 'number' || isNaN(score)) {
    errors.push(`${name} must be a valid number`);
  } else if (score < AFFINITY_CONSTRAINTS.min || score > AFFINITY_CONSTRAINTS.max) {
    errors.push(`${name} must be between ${AFFINITY_CONSTRAINTS.min} and ${AFFINITY_CONSTRAINTS.max}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all affinity scores in an object
 *
 * @param affinities - Object with category names as keys and scores as values
 * @returns Validation result
 *
 * @example
 * const affinities = { nightlife: 80, outdoor: 60, museums: 40 };
 * const result = validateAffinities(affinities);
 */
export function validateAffinities(affinities: Record<string, number>): ValidationResult {
  const errors: string[] = [];

  Object.entries(affinities).forEach(([category, score]) => {
    const result = validateAffinityScore(score, category);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validate email address format
 *
 * @param email - Email address
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate required string field
 *
 * @param value - String value
 * @param fieldName - Field name for error messages
 * @param minLength - Minimum length (optional)
 * @param maxLength - Maximum length (optional)
 * @returns Validation result
 *
 * @example
 * const result = validateRequiredString(tripName, 'Trip name', 3, 50);
 */
export function validateRequiredString(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationResult {
  const errors: string[] = [];

  if (!value || typeof value !== 'string') {
    errors.push(`${fieldName} is required`);
  } else {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      errors.push(`${fieldName} cannot be empty`);
    } else {
      if (minLength && trimmed.length < minLength) {
        errors.push(`${fieldName} must be at least ${minLength} characters`);
      }
      if (maxLength && trimmed.length > maxLength) {
        errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate date range
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Validation result
 */
export function validateDateRange(startDate: Date, endDate: Date): ValidationResult {
  const errors: string[] = [];

  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    errors.push('Start date is invalid');
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    errors.push('End date is invalid');
  }

  if (errors.length === 0 && endDate < startDate) {
    errors.push('End date must be after start date');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate positive number
 *
 * @param value - Number to validate
 * @param fieldName - Field name for error messages
 * @returns Validation result
 */
export function validatePositiveNumber(value: number, fieldName: string): ValidationResult {
  const errors: string[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
  } else if (value <= 0) {
    errors.push(`${fieldName} must be positive`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Log validation errors
 * Useful for debugging validation issues
 *
 * @param componentName - Name of component performing validation
 * @param result - Validation result
 */
export function logValidationErrors(componentName: string, result: ValidationResult): void {
  if (!result.valid) {
    logger.warn(`Validation failed in ${componentName}`, {
      errors: result.errors,
    });
  }
}

/**
 * Create a validation error message string
 *
 * @param errors - Array of error messages
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];

  return `• ${errors.join('\n• ')}`;
}
