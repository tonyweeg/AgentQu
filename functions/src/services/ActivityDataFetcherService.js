/**
 * Activity Data Fetcher Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Fetch and transform activity data from external APIs
 * - Open/Closed: Extensible by adding new fetch/transform methods
 * - Dependency Inversion: Depends on API client abstractions
 *
 * Handles:
 * - Fetching from Google Places, Custom Search, Ticketmaster
 * - Transforming API responses to normalized activity format
 * - EV charging station discovery
 * - Activity deduplication
 */

const { GooglePlacesClient, GoogleSearchClient, TicketmasterClient } = require('../api');
const { createLogger } = require('../utils/logger');
const { calculateDistance, encodeGeohash } = require('../utils/distance');
const { mapPlaceTypeToCategories } = require('../utils/mappings');

class ActivityDataFetcherService {
  constructor() {
    this.placesClient = new GooglePlacesClient();
    this.searchClient = new GoogleSearchClient();
    this.ticketmasterClient = new TicketmasterClient();
    this.logger = createLogger('DATA_FETCHER');
  }

  /**
   * Fetch places from Google Places API
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusMiles - Radius in miles
   * @param {string|null} textQuery - Optional text search query
   * @returns {Promise<Array>} Array of activities
   */
  async fetchGooglePlaces(lat, lng, radiusMiles, textQuery = null) {
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters

      let places = [];

      if (textQuery) {
        // Text search
        places = await this.placesClient.textSearch(textQuery, lat, lng, radiusMeters);
      } else {
        // Nearby search with multiple types
        const types = [
          'tourist_attraction',
          'museum',
          'park',
          'restaurant',
          'cafe',
          'bar',
          'night_club',
          'shopping_mall',
          'movie_theater',
        ];

        for (const type of types) {
          const results = await this.placesClient.searchNearby(lat, lng, radiusMeters, { type });
          places.push(...results);
        }
      }

      // Transform to our activity format
      return places.map((place) => this.transformGooglePlace(place));
    } catch (error) {
      this.logger.error('Google Places fetch failed', error);
      return [];
    }
  }

  /**
   * Fetch events from Google Custom Search
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string|null} city - City name
   * @returns {Promise<Array>} Array of activities
   */
  async fetchCustomSearchEvents(lat, lng, city = null) {
    try {
      if (!city) {
        // Skip if no city name (Custom Search works better with city names)
        return [];
      }

      const results = await this.searchClient.searchEvents(city);

      // Transform to our activity format
      return results.map((result, index) => this.transformSearchResult(result, lat, lng, index));
    } catch (error) {
      this.logger.error('Custom Search fetch failed', error);
      return [];
    }
  }

  /**
   * Fetch events from Ticketmaster
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Radius in miles
   * @param {number} days - Days ahead to search
   * @returns {Promise<Array>} Array of activities
   */
  async fetchTicketmasterEvents(lat, lng, radius, days = 3) {
    try {
      if (!this.ticketmasterClient.isReady()) {
        this.logger.debug('Ticketmaster not configured, skipping');
        return [];
      }

      const events = await this.ticketmasterClient.getUpcomingEvents({
        lat,
        lng,
        radius,
        days,
      });

      // Transform to our activity format
      return events.map((event) => this.transformTicketmasterEvent(event));
    } catch (error) {
      this.logger.error('Ticketmaster fetch failed', error);
      return [];
    }
  }

  /**
   * Fetch EV charging stations from Google Places API (New)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Radius in miles
   * @returns {Promise<Array>} Array of charging stations
   */
  async fetchEVChargingStations(lat, lng, radius) {
    try {
      const radiusMeters = radius * 1609; // Convert miles to meters

      this.logger.info(`Searching charging stations within ${radius} miles`);

      // Use Places API (New) searchNearby endpoint
      // Note: Using axios directly instead of placesClient.get() because this is a new API endpoint
      const axios = require('axios');
      const apiKey = this.placesClient.getKey();

      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          includedTypes: ['electric_vehicle_charging_station'],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius: radiusMeters,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours,places.id',
          },
        }
      );

      const places = response.data.places || [];
      this.logger.info(`Found ${places.length} charging stations`);

      if (places.length === 0) {
        return [];
      }

      return places.map((place) => {
        const placeLat = place.location.latitude;
        const placeLng = place.location.longitude;
        const distance = calculateDistance(lat, lng, placeLat, placeLng);

        return {
          id: place.id,
          name: place.displayName?.text || place.displayName || 'Charging Station',
          address: place.formattedAddress || '',
          distance: distance,
          location: {
            lat: placeLat,
            lng: placeLng,
          },
          rating: place.rating || null,
          openNow: place.currentOpeningHours?.openNow || false,
        };
      });
    } catch (error) {
      this.logger.error('EV charging fetch failed', error);
      if (error.response) {
        this.logger.error(`API status ${error.response.status}:`, error.response.data);
      }
      return [];
    }
  }

  /**
   * Transform Google Place to Activity format
   * @param {Object} place - Google Place object
   * @returns {Object} Normalized activity
   */
  transformGooglePlace(place) {
    const categories = mapPlaceTypeToCategories(place.types || []);

    return {
      id: place.place_id,
      activityId: `place_${place.place_id}`,
      name: place.name,
      type: 'permanent',
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.vicinity || place.formatted_address,
        geohash: encodeGeohash(place.geometry.location.lat, place.geometry.location.lng),
      },
      categories,
      primaryCategory: categories[0] || 'other',
      placeTypes: place.types || [],
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      openNow: place.opening_hours?.open_now,
      cost: {
        free: false,
        priceLevel: place.price_level,
      },
      images: place.photos
        ? place.photos.slice(0, 3).map((photo) => this.placesClient.getPhotoUrl(photo.photo_reference))
        : [],
    };
  }

  /**
   * Transform Search Result to Activity format
   * @param {Object} result - Google Search result
   * @param {number} lat - User latitude
   * @param {number} lng - User longitude
   * @param {number} index - Result index
   * @returns {Object} Normalized activity
   */
  transformSearchResult(result, lat, lng, index) {
    return {
      activityId: `search_${Buffer.from(result.link).toString('base64').substring(0, 16)}`,
      name: result.title,
      type: 'event',
      location: {
        lat,
        lng,
        geohash: encodeGeohash(lat, lng),
        address: result.displayLink,
      },
      categories: ['events', 'activities'],
      primaryCategory: 'event',
      details: {
        description: result.snippet,
        shortDescription: result.snippet.substring(0, 150),
        imageUrl: result.pagemap?.cse_image?.[0]?.src || null,
        website: result.link,
        priceLevel: result.snippet?.toLowerCase().includes('free') ? 0 : null,
      },
      openNow: true,
      cost: {
        free: result.snippet?.toLowerCase().includes('free') || false,
      },
    };
  }

  /**
   * Transform Ticketmaster event to Activity format
   * @param {Object} tmEvent - Ticketmaster event
   * @returns {Object} Normalized activity
   */
  transformTicketmasterEvent(tmEvent) {
    const categories = ['events', 'entertainment'];

    // Add music category if it's a music event
    if (tmEvent.musicGenres && tmEvent.musicGenres.length > 0) {
      categories.push('music');
    }

    return {
      id: tmEvent.id,
      activityId: tmEvent.activityId,
      name: tmEvent.name,
      type: 'event',
      location: {
        lat: tmEvent.location.lat,
        lng: tmEvent.location.lng,
        address: tmEvent.address,
        city: tmEvent.city,
        geohash: encodeGeohash(tmEvent.location.lat, tmEvent.location.lng),
      },
      categories,
      primaryCategory: 'event',
      rating: null, // Ticketmaster doesn't provide ratings
      reviewCount: 0,
      openNow: true,
      cost: {
        free: tmEvent.priceRange?.min === 0,
        priceLevel: tmEvent.priceRange?.min > 100 ? 4 : tmEvent.priceRange?.min > 50 ? 3 : tmEvent.priceRange?.min > 20 ? 2 : 1,
      },
      images: tmEvent.images || [],
      details: {
        description: tmEvent.description,
        shortDescription: tmEvent.description?.substring(0, 150) || tmEvent.name,
        imageUrl: tmEvent.images?.[0],
        website: tmEvent.website,
        eventDate: tmEvent.eventDate,
        venue: tmEvent.venue,
        venueAddress: tmEvent.venueAddress,
        priceRange: tmEvent.priceRange,
      },
      musicGenres: tmEvent.musicGenres || [],
      source: tmEvent.source,
      sourceId: tmEvent.sourceId,
    };
  }

  /**
   * Deduplicate activities based on name and location
   * @param {Array} activities - Array of activities
   * @returns {Array} Deduplicated activities
   */
  deduplicateActivities(activities) {
    const seen = new Map();
    const deduped = [];

    for (const activity of activities) {
      // Create a key based on name + approximate location
      const name = (activity.name || '').toLowerCase().trim();
      const lat = (activity.location?.lat || activity.lat || 0).toFixed(4);
      const lng = (activity.location?.lng || activity.lng || 0).toFixed(4);
      const key = `${name}|${lat}|${lng}`;

      if (!seen.has(key)) {
        seen.set(key, true);
        deduped.push(activity);
      } else {
        this.logger.debug(`Duplicate found: ${activity.name}`);
      }
    }

    this.logger.info(`Deduplicated ${activities.length} → ${deduped.length} activities`);
    return deduped;
  }
}

module.exports = ActivityDataFetcherService;
