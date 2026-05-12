/**
 * Logging Utility Module
 *
 * Replaces all console.log statements with structured logging
 * SOLID Principles Applied:
 * - Single Responsibility: Logging only
 * - Open/Closed: Can extend with new log levels without modification
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Set log level based on environment
const currentLevel =
  process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * Base logging function
 * @private
 */
function log(level, category, message, data = {}) {
  if (LOG_LEVELS[level] < currentLevel) {
    return; // Skip logs below current level
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    category,
    message,
    ...data,
  };

  // In production, use structured logging
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    // In development, use readable format
    const emoji = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
    }[level];

    console.log(`${emoji} [${category}] ${message}`, data);
  }
}

/**
 * Logger class with category
 */
class Logger {
  constructor(category) {
    this.category = category;
  }

  debug(message, data) {
    log('DEBUG', this.category, message, data);
  }

  info(message, data) {
    log('INFO', this.category, message, data);
  }

  warn(message, data) {
    log('WARN', this.category, message, data);
  }

  error(message, error) {
    const errorData = error
      ? {
          message: error.message,
          stack: error.stack,
          code: error.code,
        }
      : {};
    log('ERROR', this.category, message, errorData);
  }
}

/**
 * Create a logger for a specific category
 * @param {string} category - Logger category (e.g., 'PLACES_API', 'TWITTER')
 * @returns {Logger}
 */
function createLogger(category) {
  return new Logger(category);
}

module.exports = {
  createLogger,
  Logger,
};
