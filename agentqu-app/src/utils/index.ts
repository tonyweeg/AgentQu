/**
 * Utility Module Exports
 *
 * Central export point for all utility functions
 */

export { createLogger, Logger, LogLevel, setLogLevel, getLogLevel, clearLogs } from './logger';

export {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateRadius,
  validateAffinityScore,
  validateAffinities,
  validateEmail,
  validateRequiredString,
  validateDateRange,
  validatePositiveNumber,
  logValidationErrors,
  formatValidationErrors,
} from './validation';

export type { ValidationResult } from './validation';
