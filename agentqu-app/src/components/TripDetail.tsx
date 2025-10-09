import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TripPlan, Activity, Cirqle, CirqleMember, TripParticipant } from '../lib/types';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import EnvironmentalDashboard from './EnvironmentalDashboard';
import ItineraryBuilder from './ItineraryBuilder';

interface TripDetailProps {
  tripId: string;
}

interface ScoredActivity extends Activity {
  thereThenScore?: number;
  thereThenBreakdown?: {
    weather: number;
    airQuality: number;
    timeOptimization: number;
    userAffinity: number;
  };
}

const TripDetail: React.FC<TripDetailProps> = ({ tripId }) => {
  const { user, profile } = useAuth();
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scored activities state
  const [scoredActivities, setScoredActivities] = useState<ScoredActivity[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);

  // Cirqle members state
  const [cirqle, setCirqle] = useState<Cirqle | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

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

  // Fetch user's Cirqle for adding members
  useEffect(() => {
    if (!user) return;

    const loadCirqle = async () => {
      try {
        const db = getFirestore();
        // Cirqle document ID is the user's UID
        const cirqleRef = doc(db, 'cirqles', user.uid);
        const cirqleDoc = await getDoc(cirqleRef);

        if (cirqleDoc.exists()) {
          const cirqleData = cirqleDoc.data() as Cirqle;
          setCirqle(cirqleData);
          console.log(`✅ TRIP_DETAIL: Loaded Cirqle with ${cirqleData.members.length} members`);
        } else {
          console.log('⚠️ TRIP_DETAIL: No Cirqle found for user');
        }
      } catch (err) {
        console.error('❌ TRIP_DETAIL: Error loading Cirqle:', err);
      }
    };

    loadCirqle();
  }, [user]);

  // Fetch activities and score them when trip loads
  useEffect(() => {
    if (!trip || !user || !profile) return;

    const fetchAndScoreActivities = async () => {
      setLoadingScores(true);
      try {
        const functions = getFunctions();

        console.log('🎯 Fetching environmental data and scoring activities...');

        // Fetch activities for the trip location
        const discoverActivities = httpsCallable(functions, 'discoverActivities');
        const activitiesResult = await discoverActivities({
          location: { lat: trip.destination.location.lat, lng: trip.destination.location.lng },
          userId: user.uid,
          filters: { maxDistance: 25 },
          enablePlaces: true,
          enableCustomSearch: true,
        });

        const activitiesData = activitiesResult.data as { success: boolean; activities?: Activity[]; error?: string };

        if (!activitiesData.success || !activitiesData.activities) {
          console.error('Failed to fetch activities');
          return;
        }

        // Fetch environmental data in parallel
        const [weatherResult, aqResult, solarResult] = await Promise.all([
          httpsCallable(functions, 'getWeatherForecast')({
            lat: trip.destination.location.lat,
            lng: trip.destination.location.lng,
            startDate: trip.dates.startDate,
            endDate: trip.dates.endDate,
          }),
          httpsCallable(functions, 'getAirQuality')({
            lat: trip.destination.location.lat,
            lng: trip.destination.location.lng,
            startDate: trip.dates.startDate,
            endDate: trip.dates.endDate,
          }),
          httpsCallable(functions, 'getSolarData')({
            lat: trip.destination.location.lat,
            lng: trip.destination.location.lng,
            startDate: trip.dates.startDate,
            endDate: trip.dates.endDate,
          }),
        ]);

        const weatherData = weatherResult.data as { success: boolean; forecasts?: any };
        const aqData = aqResult.data as { success: boolean; current?: any };
        const solarDataResult = solarResult.data as { success: boolean; solarData?: any };

        // Score activities using the There-Then algorithm
        const scoreActivities = httpsCallable(functions, 'scoreThereThenActivities');
        const scoreResult = await scoreActivities({
          activities: activitiesData.activities,
          weather: { forecasts: weatherData.forecasts },
          airQuality: { current: aqData.current },
          solarData: { solarData: solarDataResult.solarData },
          userAffinities: profile.affinities || {},
          tripDates: {
            startDate: trip.dates.startDate,
            endDate: trip.dates.endDate,
          },
          participants: trip.participants || [], // Pass trip participants for age filtering
        });

        const scoreData = scoreResult.data as { success: boolean; activities?: ScoredActivity[] };

        if (scoreData.success && scoreData.activities) {
          setScoredActivities(scoreData.activities);
          console.log(`✅ Scored ${scoreData.activities.length} activities. Top score: ${scoreData.activities[0]?.thereThenScore}`);
        }
      } catch (err) {
        console.error('Error fetching and scoring activities:', err);
      } finally {
        setLoadingScores(false);
      }
    };

    fetchAndScoreActivities();
  }, [trip, user, profile]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate group affinities (average across all participants)
  const calculateGroupAffinities = (participants: TripParticipant[]): Record<string, number> => {
    const groupAffinities: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    // Sum up all affinities across participants
    participants.forEach((participant) => {
      if (participant.affinities) {
        Object.entries(participant.affinities).forEach(([category, score]) => {
          groupAffinities[category] = (groupAffinities[category] || 0) + score;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });

    // Average them out
    Object.keys(groupAffinities).forEach((category) => {
      groupAffinities[category] = groupAffinities[category] / categoryCounts[category];
    });

    console.log(`🎯 Calculated group affinities for ${participants.length} participants:`, groupAffinities);
    return groupAffinities;
  };

  // Re-score activities with group affinities
  const rescoreWithGroupAffinities = async (participants: TripParticipant[]) => {
    if (!trip) return;

    setLoadingScores(true);
    try {
      const functions = getFunctions();
      const groupAffinities = calculateGroupAffinities(participants);

      // Fetch activities again if needed
      const discoverActivities = httpsCallable(functions, 'discoverActivities');
      const activitiesResult = await discoverActivities({
        location: { lat: trip.destination.location.lat, lng: trip.destination.location.lng },
        userId: user?.uid,
        filters: { maxDistance: 25 },
        enablePlaces: true,
        enableCustomSearch: true,
      });

      const activitiesData = activitiesResult.data as { success: boolean; activities?: Activity[] };

      if (!activitiesData.success || !activitiesData.activities) {
        console.error('Failed to fetch activities for rescoring');
        return;
      }

      // Fetch environmental data (reuse if available, otherwise fetch fresh)
      const [weatherResult, aqResult, solarResult] = await Promise.all([
        httpsCallable(functions, 'getWeatherForecast')({
          lat: trip.destination.location.lat,
          lng: trip.destination.location.lng,
          startDate: trip.dates.startDate,
          endDate: trip.dates.endDate,
        }),
        httpsCallable(functions, 'getAirQuality')({
          lat: trip.destination.location.lat,
          lng: trip.destination.location.lng,
          startDate: trip.dates.startDate,
          endDate: trip.dates.endDate,
        }),
        httpsCallable(functions, 'getSolarData')({
          lat: trip.destination.location.lat,
          lng: trip.destination.location.lng,
          startDate: trip.dates.startDate,
          endDate: trip.dates.endDate,
        }),
      ]);

      const weatherData = weatherResult.data as { success: boolean; forecasts?: any };
      const aqData = aqResult.data as { success: boolean; current?: any };
      const solarDataResult = solarResult.data as { success: boolean; solarData?: any };

      // Score activities with GROUP affinities and participant ages
      const scoreActivities = httpsCallable(functions, 'scoreThereThenActivities');
      const scoreResult = await scoreActivities({
        activities: activitiesData.activities,
        weather: { forecasts: weatherData.forecasts },
        airQuality: { current: aqData.current },
        solarData: { solarData: solarDataResult.solarData },
        userAffinities: groupAffinities, // Use group affinities instead of individual
        tripDates: {
          startDate: trip.dates.startDate,
          endDate: trip.dates.endDate,
        },
        participants: participants, // Pass participants for age filtering
      });

      const scoreData = scoreResult.data as { success: boolean; activities?: ScoredActivity[] };

      if (scoreData.success && scoreData.activities) {
        setScoredActivities(scoreData.activities);
        console.log(`✅ Re-scored ${scoreData.activities.length} activities with group affinities. Top score: ${scoreData.activities[0]?.thereThenScore}`);
      }
    } catch (err) {
      console.error('Error rescoring activities with group affinities:', err);
    } finally {
      setLoadingScores(false);
    }
  };

  // Add Cirqle member to trip
  const addMemberToTrip = async (member: CirqleMember) => {
    if (!trip || !user) return;

    console.log(`🎯 TRIP_DETAIL: Adding ${member.nickname} to trip`, { member, tripId: trip.tripId });

    setAddingMember(true);
    try {
      const db = getFirestore();
      const tripRef = doc(db, 'trips', trip.tripId);

      // Create new participant from Cirqle member (only include defined values - Firestore doesn't accept undefined)
      const newParticipant: TripParticipant = {
        familyMemberId: member.memberId,
        nickname: member.nickname,
        relationship: member.relationship,
        role: 'editor', // Default role for added members
        invitedAt: Date.now(),
        joinedAt: Date.now(),
        affinities: member.affinities || {},
      };

      // Only add optional fields if they exist (Firestore doesn't accept undefined)
      if (member.userId) {
        newParticipant.userId = member.userId;
      }
      if (member.age !== undefined) {
        newParticipant.age = member.age;
      }

      console.log(`📝 TRIP_DETAIL: Created participant`, newParticipant);

      // Check if already added
      const alreadyAdded = trip.participants.some(
        (p) => p.familyMemberId === member.memberId || (member.userId && p.userId === member.userId)
      );

      if (alreadyAdded) {
        console.log(`⚠️ TRIP_DETAIL: ${member.nickname} already on trip`);
        alert(`${member.nickname} is already on this trip!`);
        setAddingMember(false);
        return;
      }

      const updatedParticipants = [...trip.participants, newParticipant];
      console.log(`📊 TRIP_DETAIL: Updating trip with ${updatedParticipants.length} participants`);

      // Update Firestore
      await updateDoc(tripRef, {
        participants: updatedParticipants,
        'metadata.totalParticipants': updatedParticipants.length,
        updatedAt: Date.now(),
      });

      console.log(`✅ TRIP_DETAIL: Firestore updated successfully`);

      // Update local state
      setTrip({
        ...trip,
        participants: updatedParticipants,
        metadata: {
          ...trip.metadata,
          totalParticipants: updatedParticipants.length,
        },
      });

      console.log(`✅ TRIP_DETAIL: Added ${member.nickname} to trip. Total participants: ${updatedParticipants.length}`);

      // Re-score activities with group affinities
      if (scoredActivities.length > 0) {
        console.log(`🔄 TRIP_DETAIL: Re-scoring activities with group affinities`);
        rescoreWithGroupAffinities(updatedParticipants);
      }
    } catch (err: any) {
      console.error('❌ TRIP_DETAIL: Error adding member to trip:', err);
      console.error('❌ TRIP_DETAIL: Error details:', {
        message: err.message,
        code: err.code,
        name: err.name,
      });
      alert(`Failed to add member to trip: ${err.message || 'Unknown error'}`);
    } finally {
      setAddingMember(false);
      setShowAddMember(false);
    }
  };

  // Remove participant from trip
  const removeParticipant = async (participantIndex: number) => {
    if (!trip || !user) return;

    const participant = trip.participants[participantIndex];

    // Prevent removing the owner
    if (participant.role === 'owner') {
      alert('Cannot remove the trip owner!');
      return;
    }

    const confirmRemove = window.confirm(`Remove ${participant.nickname} from this trip?`);
    if (!confirmRemove) return;

    try {
      const db = getFirestore();
      const tripRef = doc(db, 'trips', trip.tripId);

      const updatedParticipants = trip.participants.filter((_, idx) => idx !== participantIndex);

      await updateDoc(tripRef, {
        participants: updatedParticipants,
        'metadata.totalParticipants': updatedParticipants.length,
        updatedAt: Date.now(),
      });

      setTrip({
        ...trip,
        participants: updatedParticipants,
        metadata: {
          ...trip.metadata,
          totalParticipants: updatedParticipants.length,
        },
      });

      console.log(`✅ Removed ${participant.nickname} from trip`);

      // Re-score activities with updated group
      if (scoredActivities.length > 0) {
        rescoreWithGroupAffinities(updatedParticipants);
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      alert('Failed to remove participant');
    }
  };

  // Save itinerary to Firestore
  const handleSaveItinerary = async (itinerary: any[]) => {
    if (!user || !trip) return;

    try {
      const db = getFirestore();
      const tripRef = doc(db, 'trips', tripId);

      await updateDoc(tripRef, {
        itinerary,
        updatedAt: Date.now(),
      });

      setTrip({
        ...trip,
        itinerary,
        updatedAt: Date.now(),
      });

      console.log(`✅ Saved itinerary with ${itinerary.length} days`);
      alert('Itinerary saved successfully!');
    } catch (err) {
      console.error('Error saving itinerary:', err);
      alert('Failed to save itinerary');
    }
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-navy-text">👥 Travelers</h2>
              {cirqle && cirqle.members.length > 0 && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-gradient-to-r from-ocean-bright to-seafoam text-white px-4 py-2 rounded-full text-sm font-bold hover:shadow-md transition-all"
                >
                  + Add from Cirqle
                </button>
              )}
            </div>
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
                  {participant.role === 'owner' ? (
                    <span className="bg-ocean-bright text-white px-2 py-1 rounded-full text-xs font-bold">
                      OWNER
                    </span>
                  ) : (
                    <button
                      onClick={() => removeParticipant(idx)}
                      className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 flex items-center justify-center transition-colors font-bold text-lg"
                      title={`Remove ${participant.nickname}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Member Modal */}
            {showAddMember && cirqle && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-navy-text">Add from Cirqle</h3>
                      <button
                        onClick={() => setShowAddMember(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">Select members to add to this trip</p>
                  </div>

                  <div className="p-6 space-y-3">
                    {cirqle.members.map((member) => {
                      const isAlreadyAdded = trip.participants.some(
                        (p) => p.familyMemberId === member.memberId || (member.userId && p.userId === member.userId)
                      );

                      return (
                        <div
                          key={member.memberId}
                          className={`border-2 rounded-xl p-4 transition-all ${
                            isAlreadyAdded
                              ? 'border-gray-300 bg-gray-50 opacity-50'
                              : 'border-ocean-bright/30 hover:border-ocean-bright hover:shadow-md cursor-pointer'
                          }`}
                          onClick={() => !isAlreadyAdded && !addingMember && addMemberToTrip(member)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-ocean-bright to-seafoam rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {member.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-navy-text">{member.nickname}</p>
                              <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                            </div>
                            {isAlreadyAdded ? (
                              <span className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                                ADDED
                              </span>
                            ) : (
                              <span className="text-ocean-bright text-sm font-medium">+ Add</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {cirqle.members.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No members in your Cirqle yet</p>
                        <button
                          onClick={() => (window.location.href = '/?view=cirqle')}
                          className="text-ocean-bright hover:text-ocean-mid font-medium"
                        >
                          → Go to Cirqle to add members
                        </button>
                      </div>
                    )}
                  </div>

                  {addingMember && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-bright border-t-transparent mx-auto mb-4"></div>
                        <p className="text-navy-text font-medium">Adding member...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Environmental Dashboard */}
          <EnvironmentalDashboard
            tripId={trip.tripId}
            destination={trip.destination}
            dates={trip.dates}
          />

          {/* AI-Scored Activities */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-navy-text">🎯 Smart Activity Recommendations</h2>
              {loadingScores && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-ocean-bright border-t-transparent"></div>
                  <span>Scoring...</span>
                </div>
              )}
            </div>

            {scoredActivities.length === 0 && !loadingScores ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No activities available for scoring</p>
              </div>
            ) : (
              <>
                {/* Scoring Legend */}
                <div className="bg-gradient-to-r from-seafoam/20 to-ocean-bright/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-navy-text">AI Scoring Algorithm</p>
                    {trip.participants.length > 1 && (
                      <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        GROUP SCORING ({trip.participants.length} travelers)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                    <div>🌤️ Weather: 40%</div>
                    <div>💨 Air Quality: 20%</div>
                    <div>⏰ Time Optimization: 20%</div>
                    <div>❤️ {trip.participants.length > 1 ? 'Group' : 'Your'} Affinity: 20%</div>
                  </div>
                </div>

                {/* Top 10 Scored Activities */}
                <div className="space-y-4">
                  {scoredActivities.slice(0, 10).map((activity, idx) => (
                    <div key={activity.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-ocean-bright transition-all">
                      {/* Score Badge */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-md ${
                            (activity.thereThenScore || 0) >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                            (activity.thereThenScore || 0) >= 60 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                            (activity.thereThenScore || 0) >= 40 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                            'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {activity.thereThenScore || 0}
                          </div>
                          <p className="text-xs text-center text-gray-500 mt-1">#{idx + 1}</p>
                        </div>

                        {/* Activity Details */}
                        <div className="flex-1">
                          <h3 className="font-bold text-navy-text text-lg mb-1">{activity.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {activity.categories?.slice(0, 3).map((cat, i) => (
                              <span key={i} className="bg-seafoam/30 text-navy-text px-2 py-1 rounded-full text-xs font-medium">
                                {cat}
                              </span>
                            ))}
                          </div>

                          {/* Score Breakdown */}
                          {activity.thereThenBreakdown && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div className="bg-blue-50 rounded-lg p-2">
                                <p className="text-xs text-gray-600">🌤️ Weather</p>
                                <p className="font-bold text-blue-700">{activity.thereThenBreakdown.weather}</p>
                              </div>
                              <div className="bg-green-50 rounded-lg p-2">
                                <p className="text-xs text-gray-600">💨 Air Quality</p>
                                <p className="font-bold text-green-700">{activity.thereThenBreakdown.airQuality}</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-2">
                                <p className="text-xs text-gray-600">⏰ Timing</p>
                                <p className="font-bold text-purple-700">{activity.thereThenBreakdown.timeOptimization}</p>
                              </div>
                              <div className="bg-pink-50 rounded-lg p-2">
                                <p className="text-xs text-gray-600">❤️ Affinity</p>
                                <p className="font-bold text-pink-700">{activity.thereThenBreakdown.userAffinity}</p>
                              </div>
                            </div>
                          )}

                          {/* Distance & Cost */}
                          <div className="flex gap-4 mt-3 text-sm text-gray-600">
                            {activity.distance && (
                              <span>📍 {activity.distance.toFixed(1)} mi</span>
                            )}
                            {activity.cost.free ? (
                              <span className="text-green-600 font-medium">FREE</span>
                            ) : activity.cost.priceLevel && (
                              <span>{'$'.repeat(activity.cost.priceLevel)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {scoredActivities.length > 10 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    +{scoredActivities.length - 10} more activities scored
                  </p>
                )}
              </>
            )}
          </div>

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

          {/* Itinerary Builder */}
          {scoredActivities.length > 0 && (
            <ItineraryBuilder
              tripDates={trip.dates}
              scoredActivities={scoredActivities}
              onSaveItinerary={handleSaveItinerary}
            />
          )}
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
