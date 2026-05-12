/**
 * API Client Layer Exports
 *
 * Central export point for all API clients
 */

const BaseApiClient = require('./BaseApiClient');
const GooglePlacesClient = require('./GooglePlacesClient');
const GoogleSearchClient = require('./GoogleSearchClient');
const TwitterClient = require('./TwitterClient');
const WeatherClient = require('./WeatherClient');
const TicketmasterClient = require('./TicketmasterClient');

module.exports = {
  BaseApiClient,
  GooglePlacesClient,
  GoogleSearchClient,
  TwitterClient,
  WeatherClient,
  TicketmasterClient,
};
