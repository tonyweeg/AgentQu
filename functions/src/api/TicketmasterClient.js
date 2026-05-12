/**
 * Ticketmaster Discovery API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Ticketmaster API communication only
 * - Open/Closed: Extensible without modification
 * - Dependency Inversion: Depends on BaseApiClient
 *
 * Features:
 * - Event discovery by location
 * - Genre filtering
 * - Affiliate link generation
 * - Date range filtering
 */

const BaseApiClient = require('./BaseApiClient');
const { getApiKey, isConfigured } = require('../config/api-keys');
const { RATE_LIMITS } = require('../config/constants');

class TicketmasterClient extends BaseApiClient {
  constructor() {
    super({
      name: 'TICKETMASTER',
      baseURL: 'https://app.ticketmaster.com/discovery/v2',
      timeout: 15000,
      maxRetries: 3,
      cacheTTL: 300, // 5 minutes
    });

    this.isConfigured = isConfigured('TICKETMASTER_API_KEY');

    if (this.isConfigured) {
      this.apiKey = getApiKey('TICKETMASTER_API_KEY');
      this.affiliateId = process.env.TICKETMASTER_AFFILIATE_ID || null;
      this.market = process.env.TICKETMASTER_MARKET || 'United States';
    }
  }

  /**
   * Check if client is ready to use
   * @returns {boolean}
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Search for events near a location
   * @param {Object} params - Search parameters
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {number} params.radius - Search radius in miles
   * @param {string} params.startDateTime - Start date (ISO format)
   * @param {string} params.endDateTime - End date (ISO format)
   * @param {string} params.keyword - Optional keyword search (e.g., "comedy", "concert")
   * @returns {Promise<Array>} Array of events
   */
  async searchEvents({ lat, lng, radius = 10, startDateTime, endDateTime, keyword = null }) {
    if (!this.isReady()) {
      this.logger.warn('Not configured');
      return [];
    }

    try {
      const searchType = keyword ? `keyword "${keyword}"` : 'all events';
      this.logger.info(`Searching ${searchType} within ${radius} miles of ${lat},${lng}`);

      const params = {
        apikey: this.apiKey,
        latlong: `${lat},${lng}`,
        radius: radius,
        unit: 'miles',
        size: RATE_LIMITS.TICKETMASTER_MAX_RESULTS || 50,
        sort: 'date,asc',
        startDateTime: startDateTime,
        endDateTime: endDateTime,
      };

      // Add keyword search if provided
      if (keyword) {
        params.keyword = keyword;
      }

      const response = await this.get('/events.json', params);

      const events = response._embedded?.events || [];
      this.logger.info(`Found ${events.length} events`);

      const transformedEvents = events.map(event => this.transformEvent(event));
      const dedupedEvents = this.deduplicateByPerformer(transformedEvents);
      this.logger.info(`Deduplicated ${events.length} → ${dedupedEvents.length} events`);

      return dedupedEvents;
    } catch (error) {
      this.logger.error('Error fetching events', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          params: error.config?.params,
        },
      });
      return [];
    }
  }

  /**
   * Transform Ticketmaster event to our format
   * @param {Object} event - Ticketmaster event object
   * @returns {Object} Transformed event
   */
  transformEvent(event) {
    const venue = event._embedded?.venues?.[0];
    const image = event.images?.find(img => img.width >= 640)?.url ||
                  event.images?.[0]?.url;

    const musicGenres = event.classifications?.map(c => c.genre?.name).filter(Boolean) || [];

    return {
      id: event.id,
      activityId: `ticketmaster_${event.id}`,
      name: event.name,
      type: 'event',
      images: image ? [image] : [],
      website: this.addAffiliateTracking(event.url),
      description: event.info || event.pleaseNote || `${event.name} at ${venue?.name || 'venue'}`,
      address: venue?.address?.line1 || 'Location TBA',
      city: venue?.city?.name || '',
      location: {
        lat: parseFloat(venue?.location?.latitude) || 0,
        lng: parseFloat(venue?.location?.longitude) || 0,
      },
      eventDate: event.dates?.start?.dateTime || event.dates?.start?.localDate,
      venue: venue?.name || 'Venue TBA',
      venueAddress: venue?.address?.line1 || '',
      musicGenres: musicGenres,
      priceRange: event.priceRanges?.[0] ? {
        min: event.priceRanges[0].min,
        max: event.priceRanges[0].max,
        currency: event.priceRanges[0].currency || 'USD',
      } : null,
      source: 'ticketmaster',
      sourceId: event.id,
      rawEvent: event, // Keep raw data for debugging
    };
  }

  /**
   * Deduplicate events by performer/team name
   * For each unique event name, keep only the closest (soonest) event
   * @param {Array} events - Array of transformed events
   * @returns {Array} Deduplicated events
   */
  deduplicateByPerformer(events) {
    const eventsByName = new Map();

    for (const event of events) {
      const name = event.name.toLowerCase().trim();

      if (!eventsByName.has(name)) {
        // First occurrence of this event name
        eventsByName.set(name, event);
      } else {
        // Compare dates - keep the soonest one
        const existing = eventsByName.get(name);
        const existingDate = new Date(existing.eventDate || existing.details?.eventDate);
        const currentDate = new Date(event.eventDate || event.details?.eventDate);

        if (currentDate < existingDate) {
          // This event is sooner, replace existing
          eventsByName.set(name, event);
        }
      }
    }

    return Array.from(eventsByName.values());
  }

  /**
   * Add affiliate tracking to event URL
   * @param {string} url - Original event URL
   * @returns {string} URL with affiliate tracking
   */
  addAffiliateTracking(url) {
    if (!url) {
      return url;
    }

    // Check if URL already has affiliate tracking (Ticketmaster API returns pre-tracked URLs)
    if (url.includes('ticketmaster.evyy.net') || url.includes(this.affiliateId)) {
      this.logger.debug('URL already has affiliate tracking, returning as-is');
      return url; // Already tracked, don't double-wrap
    }

    // If no affiliate ID configured, return original URL
    if (!this.affiliateId) {
      return url;
    }

    // Ticketmaster affiliate link format
    // https://ticketmaster.evyy.net/c/AFFILIATE_ID?u=ENCODED_URL
    return `https://ticketmaster.evyy.net/c/${this.affiliateId}?u=${encodeURIComponent(url)}`;
  }

  /**
   * Get events happening in the next N days
   * @param {Object} params - Search parameters
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {number} params.radius - Search radius in miles
   * @param {number} params.days - Number of days to look ahead (default: 3)
   * @param {string|null} params.keyword - Optional keyword search
   * @returns {Promise<Array>} Array of events
   */
  async getUpcomingEvents({ lat, lng, radius = 10, days = 3, keyword = null }) {
    const now = new Date();
    const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + days);
    const endDateTime = endDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

    this.logger.info(`Searching events from ${now.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);

    return this.searchEvents({
      lat,
      lng,
      radius,
      startDateTime,
      endDateTime,
      keyword,
    });
  }
}

module.exports = TicketmasterClient;
