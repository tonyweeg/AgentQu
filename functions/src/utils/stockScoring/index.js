/**
 * Stock Scoring Module Exports
 *
 * Strategy Pattern implementation for stock analysis
 * Provides 11 scoring strategies and a composite scorer
 */

const StockScoringStrategy = require('./StockScoringStrategy');
const StockCompositeScorer = require('./StockCompositeScorer');
const strategies = require('./strategies');

module.exports = {
  // Base class
  StockScoringStrategy,

  // Composite scorer
  StockCompositeScorer,

  // Individual strategies
  ...strategies,

  // Convenience function to create default scorer
  createDefaultScorer: () => StockCompositeScorer.createDefault(),

  // Convenience function to create focused scorer
  createFocusedScorer: (focus) => StockCompositeScorer.createFocused(focus),
};
