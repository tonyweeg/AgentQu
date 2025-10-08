import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TripPlan, Activity } from '../lib/types';
import ActivityCard from './ActivityCard';

const TripCreation: React.FC = () => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);

  // Trip data after geocoding
  const [tripLocation, setTripLocation] = useState<{ lat: number; lng: number; address: string; city: string; state: string } | null>(null);

  // Activities discovered for trip location
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const handleContinue = async () => {
    if (step === 1 && destination && startDate && endDate) {
      setLoading(true);
      setError(null);

      try {
        // Geocode the destination using existing Firebase function
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const geocode = httpsCallable(functions, 'geocode');

        console.log('🌍 Geocoding trip destination:', destination);
        const result = await geocode({ address: destination });
        const data = result.data as { success: boolean; location?: { lat: number; lng: number }; city?: string; state?: string; country?: string; error?: string };

        if (data.success && data.location) {
          setTripLocation({
            lat: data.location.lat,
            lng: data.location.lng,
            address: destination,
            city: data.city || '',
            state: data.state || '',
          });
          setStep(2);
        } else {
          setError(data.error || `Could not find location: ${destination}`);
        }
      } catch (err: any) {
        console.error('Error geocoding destination:', err);
        setError('Failed to find location. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch activities when we get to step 2
  useEffect(() => {
    if (step === 2 && tripLocation && user && profile) {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const functions = getFunctions();
          const discoverActivities = httpsCallable(functions, 'discoverActivities');

          console.log('🎯 Discovering activities for trip:', tripLocation);
          const result = await discoverActivities({
            location: { lat: tripLocation.lat, lng: tripLocation.lng },
            userId: user.uid,
            filters: { maxDistance: 25 }, // Larger radius for trip planning
            enablePlaces: true,
            enableCustomSearch: true,
          });

          const data = result.data as { success: boolean; activities?: Activity[]; error?: string };
          if (data.success && data.activities) {
            setActivities(data.activities);
          }
        } catch (err) {
          console.error('Error fetching activities:', err);
        } finally {
          setLoadingActivities(false);
        }
      };

      fetchActivities();
    }
  }, [step, tripLocation, user, profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-seafoam to-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold text-navy-text mb-2">
            🌍 There-Then
          </h1>
          <p className="text-gray-600">AI-Powered Trip Planning</p>
        </div>

        {/* Step 1: Where & When */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-ocean-bright">
            <h2 className="text-2xl font-bold text-navy-text mb-6">
              Where & When
            </h2>

            {/* Destination */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🌍 Where do you want to go?
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City, State, or Address"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none text-lg"
              />
            </div>

            {/* Dates */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📅 When?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Collaborators (optional) */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                👥 Who's coming? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <button className="text-ocean-bright font-medium hover:text-ocean-mid transition-colors">
                + Add Collaborators
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!destination || !startDate || !endDate || loading}
              className="w-full bg-ocean-bright hover:bg-ocean-mid disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Finding location...</span>
                </>
              ) : (
                <>Continue →</>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Activity Discovery */}
        {step === 2 && tripLocation && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Location Header */}
            <div className="mb-6">
              <button
                onClick={() => setStep(1)}
                className="text-ocean-bright hover:text-ocean-mid font-medium mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold text-navy-text mb-2">
                {tripLocation.city}{tripLocation.state ? `, ${tripLocation.state}` : ''}
              </h2>
              <p className="text-gray-600">
                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Trip Summary */}
            <div className="bg-seafoam/20 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Destination</p>
                  <p className="font-bold text-navy-text">{destination}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-bold text-navy-text">
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Coordinates</p>
                  <p className="font-mono text-xs text-navy-text">
                    {tripLocation.lat.toFixed(4)}, {tripLocation.lng.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Travelers</p>
                  <p className="font-bold text-navy-text">{collaborators.length + 1}</p>
                </div>
              </div>
            </div>

            {/* Activities Section */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy-text mb-4">
                🎯 Suggested Activities
              </h3>

              {loadingActivities ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-bright border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500">Discovering activities...</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 6).map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                  {activities.length > 6 && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      +{activities.length - 6} more activities available
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <p className="text-gray-500">No activities found for this location</p>
                </div>
              )}
            </div>

            {/* Save Trip Button */}
            <button
              className="w-full bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-4 rounded-lg text-lg transition-colors shadow-md"
            >
              Save Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripCreation;
