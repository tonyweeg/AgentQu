/**
 * Ticketmaster View Component
 *
 * Dedicated view for browsing upcoming Ticketmaster events
 * - Fetches events happening in next 7-30 days
 * - Larger radius for wider discovery
 * - Grid layout with event cards
 * - Filters by event type, genre, date range
 */

import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Activity } from '../lib/types';
import ActivityCard from './ActivityCard';

interface TicketmasterViewProps {
  location: { lat: number; lng: number };
  userId: string | null;
  onBack: () => void;
}

const TicketmasterView: React.FC<TicketmasterViewProps> = ({ location, userId, onBack }) => {
  const [events, setEvents] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7); // Default to 7 days
  const [radius, setRadius] = useState(50); // Larger radius for events
  const [suggestedCities, setSuggestedCities] = useState<Array<{ name: string; lat: number; lng: number; distance: number }>>([]);

  useEffect(() => {
    fetchTicketmasterEvents();
  }, [location, days, radius]);

  const fetchTicketmasterEvents = async () => {
    setLoading(true);
    setError(null);
    setSuggestedCities([]);

    try {
      const functions = getFunctions();
      const discoverActivities = httpsCallable(functions, 'discoverActivities');

      // Auto-expand search radius if no events found (max 100 miles due to backend limit)
      let currentRadius = radius;
      let foundEvents: Activity[] = [];
      const maxRadius = 100; // Backend limit
      const radiusStep = 50; // Increase by 50 miles each time

      while (foundEvents.length === 0 && currentRadius <= maxRadius) {
        console.log('🎟️ TICKETMASTER_VIEW: Fetching events', {
          lat: location.lat,
          lng: location.lng,
          radius: currentRadius,
          days,
        });

        const result = await discoverActivities({
          lat: location.lat,
          lng: location.lng,
          radius: currentRadius,
          userId,
          enablePlaces: false, // Only Ticketmaster events
          enableCustomSearch: false,
          enableTicketmaster: true,
          filters: {
            maxDistance: currentRadius,
            type: 'event',
          },
        });

        const data = result.data as { success: boolean; activities?: Activity[]; error?: string };

        if (data.success && data.activities) {
          // Since we only enable Ticketmaster in the request, all activities should be events
          foundEvents = data.activities.filter((activity) => activity.type === 'event');

          if (foundEvents.length > 0) {
            console.log(`🎟️ Found ${foundEvents.length} Ticketmaster events at ${currentRadius} miles`);
            setEvents(foundEvents);
            // Update radius to show where we actually found events
            if (currentRadius !== radius) {
              setRadius(currentRadius);
            }
            break;
          } else {
            console.log(`🎟️ No events at ${currentRadius} miles, expanding search...`);
            currentRadius += radiusStep;
          }
        } else {
          setError(data.error || 'Failed to fetch events');
          break;
        }
      }

      // If still no events found, suggest nearby major cities
      if (foundEvents.length === 0) {
        console.log(`🎟️ No events found within ${maxRadius} miles, fetching nearby cities...`);
        await fetchNearbyCities();
      }
    } catch (err) {
      console.error('Error fetching Ticketmaster events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyCities = async () => {
    try {
      // Major US cities with coordinates
      const majorCities = [
        { name: 'Baltimore, MD', lat: 39.2904, lng: -76.6122 },
        { name: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
        { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
        { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
        { name: 'Richmond, VA', lat: 37.5407, lng: -77.4360 },
        { name: 'Norfolk, VA', lat: 36.8508, lng: -76.2859 },
        { name: 'Wilmington, DE', lat: 39.7391, lng: -75.5398 },
        { name: 'Atlantic City, NJ', lat: 39.3643, lng: -74.4229 },
        { name: 'Dover, DE', lat: 39.1582, lng: -75.5244 },
        { name: 'Annapolis, MD', lat: 38.9784, lng: -76.4922 },
        { name: 'Frederick, MD', lat: 39.4143, lng: -77.4105 },
        { name: 'Harrisburg, PA', lat: 40.2732, lng: -76.8867 },
        { name: 'Lancaster, PA', lat: 40.0379, lng: -76.3055 },
        { name: 'Reading, PA', lat: 40.3356, lng: -75.9269 },
        { name: 'Trenton, NJ', lat: 40.2206, lng: -74.7597 },
        { name: 'Salisbury, MD', lat: 38.3607, lng: -75.5994 },
      ];

      // Calculate distance to each city
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const citiesWithDistance = majorCities
        .map((city) => ({
          ...city,
          distance: calculateDistance(location.lat, location.lng, city.lat, city.lng),
        }))
        .filter((city) => city.distance > 10 && city.distance <= 200) // 10-200 miles
        .sort((a, b) => a.distance - b.distance); // Sort by closest first

      setSuggestedCities(citiesWithDistance);
      console.log(`🎟️ Suggested ${citiesWithDistance.length} nearby cities`, citiesWithDistance);
    } catch (err) {
      console.error('Error fetching nearby cities:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-ocean-light via-purple-50 to-blue-50">
      {/* Glassmorphic Header */}
      <div className="relative">
        {/* Background gradient blur */}
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-bright/20 via-purple-500/20 to-blue-500/20 backdrop-blur-xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-white/30 hover:bg-white/40 backdrop-blur-md rounded-xl transition-all border border-white/20 shadow-lg"
              >
                <span className="text-lg">←</span>
                <span className="font-medium">Back</span>
              </button>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/30 shadow-xl">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <span>🎟️</span>
                  <span>Ticketmaster Events</span>
                </h1>
                <p className="text-gray-700 text-sm mt-1">
                  {events.length} events within {radius} miles
                </p>
              </div>
            </div>

            {/* Glassmorphic Filters */}
            <div className="flex items-center gap-3">
              {/* Days Range */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-700 font-medium">Time Range</label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="px-4 py-2 bg-white/40 backdrop-blur-md border border-white/30 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-bright/50 shadow-lg"
                >
                  <option value="3" className="text-gray-900">Next 3 days</option>
                  <option value="7" className="text-gray-900">Next week</option>
                  <option value="14" className="text-gray-900">Next 2 weeks</option>
                  <option value="30" className="text-gray-900">Next month</option>
                </select>
              </div>

              {/* Radius */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-700 font-medium">Radius</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="px-4 py-2 bg-white/40 backdrop-blur-md border border-white/30 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-bright/50 shadow-lg"
                >
                  <option value="10" className="text-gray-900">10 miles</option>
                  <option value="25" className="text-gray-900">25 miles</option>
                  <option value="50" className="text-gray-900">50 miles</option>
                  <option value="100" className="text-gray-900">100 miles</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-bright"></div>
              <p className="mt-4 text-gray-700 font-medium">Loading events...</p>
            </div>
          )}

          {error && (
            <div className="bg-white/30 backdrop-blur-md border border-red-300/50 rounded-2xl p-8 text-center shadow-xl">
              <span className="text-4xl mb-3 block">⚠️</span>
              <p className="text-red-900 font-semibold text-lg mb-4">{error}</p>
              <button
                onClick={fetchTicketmasterEvents}
                className="px-6 py-3 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm text-white rounded-xl font-medium transition-all border border-red-400/30 shadow-lg"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl p-12 border border-white/30">
              <div className="text-center mb-8">
                <span className="text-6xl mb-4 block">🎟️</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Events Found Nearby</h2>
                <p className="text-gray-700 mb-6 font-medium">
                  No events in the next {days} days within {radius} miles
                </p>
              </div>

              {suggestedCities.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Try searching in a nearby city:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestedCities.slice(0, 6).map((city) => (
                      <button
                        key={city.name}
                        onClick={() => {
                          // Update location to the selected city and re-search
                          window.location.href = `/?view=ticketmaster&lat=${city.lat}&lng=${city.lng}`;
                        }}
                        className="flex flex-col items-center gap-2 p-6 bg-white/50 hover:bg-white/70 backdrop-blur-md rounded-xl border border-white/40 hover:border-ocean-bright/50 transition-all shadow-lg"
                      >
                        <span className="text-2xl">🏙️</span>
                        <span className="font-semibold text-gray-900">{city.name}</span>
                        <span className="text-sm text-gray-600">{Math.round(city.distance)} miles away</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setDays(30)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/80 hover:to-blue-600/80 backdrop-blur-sm text-white rounded-xl font-medium transition-all border border-white/30 shadow-lg"
                >
                  Search Next 30 Days
                </button>
              </div>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event, index) => (
                <ActivityCard
                  key={event.id}
                  activity={event}
                  index={index}
                  allActivities={events}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketmasterView;
