import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TripPlan } from '../lib/types';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const MyTrips: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadTrips = async () => {
      try {
        const db = getFirestore();
        const tripsRef = collection(db, 'trips');
        const q = query(
          tripsRef,
          where('createdBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const tripsList: TripPlan[] = [];

        querySnapshot.forEach((doc) => {
          tripsList.push(doc.data() as TripPlan);
        });

        setTrips(tripsList);
      } catch (err) {
        console.error('Error loading trips:', err);
        setError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [user]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTripDuration = (trip: TripPlan) => {
    const days = Math.ceil(
      (trip.dates.endDate - trip.dates.startDate) / (1000 * 60 * 60 * 24)
    );
    return days === 1 ? '1 day' : `${days} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-bright border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-text mb-2">
          🌍 My Trips
        </h1>
        <p className="text-gray-600">
          Your saved trip plans and itineraries
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Create New Trip Button */}
      <div className="mb-6">
        <button
          onClick={() => (window.location.href = '/?view=trip-creation')}
          className="bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md flex items-center gap-2"
        >
          <span>+</span>
          <span>Create New Trip</span>
        </button>
      </div>

      {/* Trips List */}
      {trips.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <div className="mb-4">
            <span className="text-6xl">✈️</span>
          </div>
          <h3 className="text-xl font-bold text-navy-text mb-2">No trips yet</h3>
          <p className="text-gray-600 mb-6">
            Start planning your next adventure with There-Then
          </p>
          <button
            onClick={() => (window.location.href = '/?view=trip-creation')}
            className="bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-3 px-6 rounded-lg transition-colors inline-block"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.tripId}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-ocean-bright hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => (window.location.href = `/?view=trip-detail&id=${trip.tripId}`)}
            >
              {/* Header Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-ocean-bright to-seafoam flex items-center justify-center text-white">
                <span className="text-6xl">📍</span>
              </div>

              {/* Trip Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-navy-text mb-2 group-hover:text-ocean-bright transition-colors">
                  {trip.destination.city}
                  {trip.destination.state ? `, ${trip.destination.state}` : ''}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>
                      {formatDate(trip.dates.startDate)} - {formatDate(trip.dates.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>{getTripDuration(trip)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{trip.metadata.totalParticipants} traveler{trip.metadata.totalParticipants !== 1 ? 's' : ''}</span>
                  </div>

                  {trip.metadata.totalActivities > 0 && (
                    <div className="flex items-center gap-2">
                      <span>🎯</span>
                      <span>{trip.metadata.totalActivities} activities</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      trip.status === 'draft'
                        ? 'bg-gray-100 text-gray-600'
                        : trip.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {trip.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTrips;
