/**
 * Frontend Logging Utility
 *
 * Browser-compatible structured logging that matches backend logger API
 * SOLID Principles Applied:
 * - Single Responsibility: Logging only
 * - Open/Closed: Can extend with new log levels without modification
 *
 * Usage:
 * ```typescript
 * import { createLogger } from './utils/logger';
 *
 * const logger = createLogger('AUTH');
 * logger.debug('User logged in', { userId: '123' });
 * logger.error('Login failed', new Error('Invalid credentials'));
 * ```
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogData {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  [key: string]: any;
}

/**
 * Determine if we're in development mode
 * Checks for localhost, 127.0.0.1, or .local domains
 */
function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.0.')
  );
}

/**
 * Get current log level from localStorage or default
 * Can be controlled via: localStorage.setItem('LOG_LEVEL', 'DEBUG')
 */
function getCurrentLogLevel(): LogLevel {
  if (typeof window === 'undefined') return LogLevel.INFO;

  const stored = localStorage.getItem('LOG_LEVEL');
  if (stored && LogLevel[stored as keyof typeof LogLevel] !== undefined) {
    return LogLevel[stored as keyof typeof LogLevel];
  }

  // Default: DEBUG in development, INFO in production
  return isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO;
}

/**
 * Base logging function
 * @private
 */
function log(
  level: keyof typeof LogLevel,
  category: string,
  message: string,
  data: LogData = {}
): void {
  const currentLevel = getCurrentLogLevel();

  // Skip logs below current level
  if (LogLevel[level] < currentLevel) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry: LogEntry = {
    timestamp,
    level,
    category,
    message,
    ...data,
  };

  // Emoji prefixes for easy console filtering
  const emoji = {
    DEBUG: '🔍',
    INFO: 'ℹ️',
    WARN: '⚠️',
    ERROR: '❌',
  }[level];

  if (isDevelopment()) {
    // Development: Readable format with emoji
    // Use different console methods for better filtering
    const consoleMethod = {
      DEBUG: console.debug,
      INFO: console.info,
      WARN: console.warn,
      ERROR: console.error,
    }[level];

    if (Object.keys(data).length > 0) {
      consoleMethod(`${emoji} [${category}] ${message}`, data);
    } else {
      consoleMethod(`${emoji} [${category}] ${message}`);
    }
  } else {
    // Production: Structured JSON logging
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Logger class with category
 */
export class Logger {
  constructor(private category: string) {}

  /**
   * Log debug information (development only by default)
   */
  debug(message: string, data?: LogData): void {
    log('DEBUG', this.category, message, data);
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: LogData): void {
    log('INFO', this.category, message, data);
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: LogData): void {
    log('WARN', this.category, message, data);
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | LogData): void {
    let errorData: LogData = {};

    if (error instanceof Error) {
      errorData = {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
      };
    } else if (error) {
      errorData = error;
    }

    log('ERROR', this.category, message, errorData);
  }

  /**
   * Create a child logger with nested category
   * Useful for component-level logging
   *
   * Example:
   * const logger = createLogger('AUTH');
   * const loginLogger = logger.child('LOGIN');
   * loginLogger.info('User logged in'); // Logs as [AUTH:LOGIN]
   */
  child(subcategory: string): Logger {
    return new Logger(`${this.category}:${subcategory}`);
  }
}

/**
 * Create a logger for a specific category
 *
 * @param category - Logger category (e.g., 'AUTH', 'DISCOVERY', 'UI')
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('DISCOVERY');
 * logger.info('Fetching activities', { lat: 40.7128, lng: -74.0060 });
 * logger.error('API request failed', new Error('Network timeout'));
 * ```
 */
export function createLogger(category: string): Logger {
  return new Logger(category);
}

/**
 * Set log level at runtime
 * Useful for debugging in production
 *
 * @example
 * ```typescript
 * // Enable debug logs in production browser console
 * setLogLevel(LogLevel.DEBUG);
 *
 * // Or using string
 * localStorage.setItem('LOG_LEVEL', 'DEBUG');
 * ```
 */
export function setLogLevel(level: LogLevel): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('LOG_LEVEL', LogLevel[level]);
  }
}

/**
 * Get current log level
 */
export function getLogLevel(): LogLevel {
  return getCurrentLogLevel();
}

/**
 * Clear all logs (useful for testing)
 */
export function clearLogs(): void {
  if (typeof console.clear === 'function') {
    console.clear();
  }
}

// Export log level enum for external use
export { LogLevel as Level };
