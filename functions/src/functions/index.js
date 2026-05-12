/**
 * Cloud Functions Exports
 *
 * Central export point for all Cloud Functions
 * Thin HTTP handlers that delegate to service layer
 */

// Activity Functions
const activities = require('./activities');
const location = require('./location');
const trips = require('./trips');
const cirqles = require('./cirqles');
const social = require('./social');
const weather = require('./weather');

// Stock Functions
const stocks = require('./stocks');

module.exports = {
  // Activity Functions
  discoverActivities: activities.discoverActivities,
  submitReview: activities.submitReview,
  voteActivity: activities.voteActivity,
  checkInActivity: activities.checkInActivity,
  getUserHistory: activities.getUserHistory,

  // Location Functions
  geocode: location.geocode,
  getNearbyTowns: location.getNearbyTowns,

  // Trip Functions
  createTrip: trips.createTrip,
  scoreThereThenActivities: trips.scoreThereThenActivities,
  getUserTrips: trips.getUserTrips,

  // Cirqle Functions
  createCirqle: cirqles.createCirqle,
  inviteToCirqle: cirqles.inviteToCirqle,
  addExistingUserToCirqle: cirqles.addExistingUserToCirqle,
  joinCirqle: cirqles.joinCirqle,
  getUserCirqles: cirqles.getUserCirqles,

  // Social Functions
  searchTwitter: social.searchTwitter,
  calculateVibeIndex: social.calculateVibeIndex,
  getVibeIndex: social.getVibeIndex,

  // Weather Functions
  getWeatherForecast: weather.getWeatherForecast,
  getAirQuality: weather.getAirQuality,
  getSolarData: weather.getSolarData,
  getEnvironmentalData: weather.getEnvironmentalData,

  // Stock Functions
  discoverStocks: stocks.discoverStocks,
  analyzeStock: stocks.analyzeStock,
  searchStocks: stocks.searchStocks,
  getMarketOverview: stocks.getMarketOverview,
  getMarketIndices: stocks.getMarketIndices,
  getWatchlist: stocks.getWatchlist,
  addToWatchlist: stocks.addToWatchlist,
  removeFromWatchlist: stocks.removeFromWatchlist,
  getPortfolio: stocks.getPortfolio,
  addToPortfolio: stocks.addToPortfolio,
  sellFromPortfolio: stocks.sellFromPortfolio,
  saveStockPreferences: stocks.saveStockPreferences,
  getStockPreferences: stocks.getStockPreferences,
  finnhubWebhook: stocks.finnhubWebhook,
};
