import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TripPlan } from '../lib/types';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import EnvironmentalDashboard from './EnvironmentalDashboard';

interface TripDetailProps {
  tripId: string;
}

const TripDetail: React.FC<TripDetailProps> = ({ tripId }) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !tripId) return;

    const loadTrip = async () => {
      try {
        const db = getFirestore();
        const tripRef = doc(db, 'trips', tripId);
        const tripDoc = await getDoc(tripRef);

        if (tripDoc.exists()) {
          const tripData = tripDoc.data() as TripPlan;
          // Verify user has access
          if (tripData.createdBy === user.uid) {
            setTrip(tripData);
          } else {
            setError('You do not have access to this trip');
          }
        } else {
          setError('Trip not found');
        }
      } catch (err) {
        console.error('Error loading trip:', err);
        setError('Failed to load trip');
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [user, tripId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-bright border-t-transparent"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">{error || 'Trip not found'}</p>
          <button
            onClick={() => (window.location.href = '/?view=trips')}
            className="text-ocean-bright hover:text-ocean-mid font-medium"
          >
            ← Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Back Button */}
      <button
        onClick={() => (window.location.href = '/?view=trips')}
        className="text-ocean-bright hover:text-ocean-mid font-medium mb-4 flex items-center gap-1"
      >
        ← Back to My Trips
      </button>

      {/* Header */}
      <div className="bg-gradient-to-br from-ocean-bright to-seafoam rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-4xl font-bold mb-3">
          {trip.destination.city}
          {trip.destination.state ? `, ${trip.destination.state}` : ''}
        </h1>
        <div className="flex flex-wrap gap-4 text-white/90">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatDate(trip.dates.startDate)} - {formatDate(trip.dates.endDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span>{trip.metadata.totalParticipants} traveler{trip.metadata.totalParticipants !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span>{trip.metadata.totalActivities} activities</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Participants */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-navy-text mb-4">👥 Travelers</h2>
            <div className="space-y-3">
              {trip.participants.map((participant, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="w-10 h-10 bg-ocean-bright/20 rounded-full flex items-center justify-center text-ocean-bright font-bold">
                    {participant.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-navy-text">{participant.nickname}</p>
                    {participant.relationship && (
                      <p className="text-sm text-gray-600 capitalize">{participant.relationship}</p>
                    )}
                  </div>
                  {participant.role === 'owner' && (
                    <span className="bg-ocean-bright text-white px-2 py-1 rounded-full text-xs font-bold">
                      OWNER
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Dashboard */}
          <EnvironmentalDashboard
            tripId={trip.tripId}
            destination={trip.destination}
            dates={trip.dates}
          />

          {/* Suggested Activities */}
          {trip.suggestedActivities.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-navy-text mb-4">🎯 Suggested Activities</h2>
              <div className="space-y-3">
                {trip.suggestedActivities.map((activity, idx) => (
                  <div key={idx} className="bg-seafoam/10 rounded-lg p-4 border border-seafoam">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-navy-text">Activity {idx + 1}</p>
                        <p className="text-sm text-gray-600">ID: {activity.activityId}</p>
                      </div>
                      {activity.affinityScore > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Affinity Score</p>
                          <p className="font-bold text-ocean-bright">{(activity.affinityScore * 100).toFixed(0)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itinerary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-navy-text mb-4">📅 Itinerary</h2>
            {trip.itinerary.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No itinerary created yet</p>
                <button className="text-ocean-bright hover:text-ocean-mid font-medium">
                  + Build Itinerary
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {trip.itinerary.map((day) => (
                  <div key={day.dayIndex} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-navy-text mb-3">Day {day.dayIndex + 1}</h3>
                    {day.timeSlots.map((slot, idx) => (
                      <div key={idx} className="ml-4 border-l-2 border-ocean-bright pl-4 pb-3">
                        <p className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</p>
                        <p className="font-medium text-navy-text">Activity: {slot.activityId}</p>
                        {slot.notes && <p className="text-sm text-gray-600">{slot.notes}</p>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trip Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-navy-text mb-4">📍 Trip Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Destination</p>
                <p className="font-medium text-navy-text">{trip.destination.address}</p>
              </div>
              <div>
                <p className="text-gray-600">Coordinates</p>
                <p className="font-mono text-xs text-navy-text">
                  {trip.destination.location.lat.toFixed(4)}, {trip.destination.location.lng.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Timezone</p>
                <p className="font-medium text-navy-text">{trip.dates.timezone}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
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

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-navy-text mb-4">⚙️ Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-2 rounded-lg transition-colors">
                Edit Trip
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-navy-text font-bold py-2 rounded-lg transition-colors">
                Share Trip
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-navy-text font-bold py-2 rounded-lg transition-colors">
                Export PDF
              </button>
              <button className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg transition-colors">
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
