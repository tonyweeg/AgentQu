import React, { useState, useEffect } from 'react';
import { Activity, TripPlan } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ activity, onClose, onNext, onPrev, currentIndex, totalCount }) => {
  const { user } = useAuth();
  const [trayExpanded, setTrayExpanded] = useState(false);
  const [nextTrip, setNextTrip] = useState<TripPlan | null>(null);
  const [beenHere, setBeenHere] = useState(false);
  const [addedToTrip, setAddedToTrip] = useState(false);

  const category = activity.primaryCategory || 'other';
  const score = activity.score || 0;

  const getCategoryEmoji = () => {
    switch (category) {
      case 'hiking': return '🥾';
      case 'events': return '🎉';
      case 'food_and_dining': return '🍽️';
      case 'arts_and_culture': return '🎨';
      case 'sports_and_recreation': return '⚽';
      case 'nature_and_outdoors': return '🌲';
      case 'entertainment': return '🎭';
      case 'shopping': return '🛍️';
      case 'museums': return '🏛️';
      default: return '📍';
    }
  };

  // Calculate signal bars based on Q Score
  const signalBars = Math.min(5, Math.max(0, Math.ceil((score - 100) / 40)));

  // Hiking-specific info
  const isHike = category === 'hiking' || category === 'nature_and_outdoors';
  const hikingDuration = activity.duration ? (activity.duration / 60).toFixed(1) : null;
  const hikingDifficulty = activity.accessibility?.mobilityLevel || 'moderate';

  // Google Maps link
  const googleMapsUrl = activity.location?.lat && activity.location?.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${activity.location.lat},${activity.location.lng}`
    : activity.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}`
    : null;

  // Fetch next upcoming trip
  useEffect(() => {
    const fetchNextTrip = async () => {
      if (!user) return;

      try {
        const db = getFirestore();
        const now = Date.now();
        const tripsRef = collection(db, 'trips');
        const q = query(
          tripsRef,
          where('createdBy', '==', user.uid),
          where('dates.startDate', '>', now),
          orderBy('dates.startDate', 'asc'),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setNextTrip(snapshot.docs[0].data() as TripPlan);
        }
      } catch (error) {
        console.error('Error fetching next trip:', error);
      }
    };

    fetchNextTrip();
  }, [user]);

  const handleBeenHere = () => {
    setBeenHere(!beenHere);
    // TODO: Save to user history in Firestore
  };

  const handleAddToTrip = () => {
    if (!nextTrip) return;
    setAddedToTrip(!addedToTrip);
    // TODO: Add activity to trip's suggested activities
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Instagram-style enlarged card */}
      <div
        className="relative bg-black rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable content area */}
        <div className="overflow-y-auto max-h-[95vh] pb-24">
          {/* Full-height background image */}
          <div className="relative min-h-[90vh]">
            {activity.images && activity.images[0] ? (
              <img
                src={activity.images[0]}
                alt={activity.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <span className="text-9xl">{getCategoryEmoji()}</span>
              </div>
            )}

            {/* Gradient overlay - lighter for events to show more image */}
            <div className={`absolute inset-0 ${
              activity.type === 'event'
                ? 'bg-gradient-to-t from-black/90 via-transparent to-transparent'
                : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
            }`}></div>

            {/* Position indicator - top center */}
            {currentIndex !== undefined && totalCount !== undefined && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-10">
                {currentIndex + 1} of {totalCount}
              </div>
            )}

            {/* Close button - top right */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full p-3 shadow-lg transition-all text-white z-10"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Category pill - top left */}
            <div className="absolute top-6 left-6 bg-sky-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg">
              {category.replace(/_/g, ' ')}
            </div>

            {/* Distance badge - top left, below category */}
            {activity.distance && (
              <div className="absolute top-20 left-6 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                <span className="text-sm text-gray-800 font-bold">
                  {activity.distance.toFixed(1)} mi away
                </span>
              </div>
            )}

            {/* Content section - bottom half with translucent pills */}
            <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4 pb-32 max-h-[70vh] overflow-y-auto">
              {/* EVENT LAYOUT - Cleaner, more concise */}
              {activity.type === 'event' ? (
                <>
                  {/* Title */}
                  <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-4">
                    <h1 className="font-bold text-white text-3xl leading-tight">
                      {activity.name}
                    </h1>
                  </div>

                  {/* Event Info - Single compact card */}
                  <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-4 space-y-3">
                    {activity.details?.eventDate && (
                      <div className="flex items-center gap-3 text-white">
                        <span className="text-2xl">📅</span>
                        <div>
                          <div className="font-bold">
                            {new Date(activity.details.eventDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-white/80">
                            {new Date(activity.details.eventDate).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    {activity.details?.venue && (
                      <div className="flex items-center gap-3 text-white">
                        <span className="text-2xl">📍</span>
                        <div>
                          <div className="font-semibold">{activity.details.venue}</div>
                          {activity.address && (
                            <div className="text-sm text-white/70">{activity.address}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {activity.details?.organizerName && (
                      <div className="flex items-center gap-3 text-white">
                        <span className="text-2xl">👤</span>
                        <div className="font-semibold">{activity.details.organizerName}</div>
                      </div>
                    )}
                    {activity.details?.priceRange && (
                      <div className="flex items-center gap-3 text-white">
                        <span className="text-2xl">💰</span>
                        <div className="font-semibold">${activity.details.priceRange}</div>
                      </div>
                    )}
                  </div>

                  {/* Ticket Button - Prominent */}
                  {activity.website && (
                    <a
                      href={activity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      🎫 Get Tickets
                    </a>
                  )}

                  {/* Directions button */}
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Get Directions
                    </a>
                  )}
                </>
              ) : (
                <>
                  {/* NON-EVENT LAYOUT - Original detailed layout */}
                  {/* Title */}
                  <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4 inline-block">
                    <h1 className="font-bold text-white text-4xl leading-tight drop-shadow-2xl">
                      {activity.name}
                    </h1>
                  </div>

                  {/* Rating & Score row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {activity.rating && (
                      <div className="bg-amber-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                        ⭐ {activity.rating.toFixed(1)}
                        {activity.reviewCount && (
                          <span className="text-xs opacity-90">({activity.reviewCount})</span>
                        )}
                      </div>
                    )}

                    {/* Affinity Meter */}
                    <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div
                          key={dot}
                          className={`w-2 h-2 rounded-full transition-all ${
                            dot <= signalBars
                              ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Directions button */}
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600/80 backdrop-blur-sm hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Directions
                      </a>
                    )}
                  </div>

                  {/* Info badges row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {(activity.cost?.free || activity.cost?.priceLevel === 0) && (
                      <div className="bg-green-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Free
                      </div>
                    )}
                    {activity.cost?.priceLevel && activity.cost.priceLevel > 0 && (
                      <div className="bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        {'$'.repeat(activity.cost.priceLevel)}
                      </div>
                    )}
                    {activity.openNow && (
                      <div className="bg-emerald-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Open Now
                      </div>
                    )}
                    {activity.accessibility?.wheelchairAccessible && (
                      <div className="bg-blue-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        ♿ Accessible
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Hiking-specific info */}
              {isHike && (hikingDuration || hikingDifficulty) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {hikingDuration && (
                    <div className="bg-purple-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      🥾 {hikingDuration}h trail
                    </div>
                  )}
                  <div className={`backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    hikingDifficulty === 'easy' ? 'bg-green-500/80' :
                    hikingDifficulty === 'difficult' ? 'bg-red-500/80' :
                    'bg-orange-500/80'
                  }`}>
                    {hikingDifficulty.toUpperCase()} DIFFICULTY
                  </div>
                </div>
              )}

              {/* Description - NOT for events */}
              {activity.type !== 'event' && (activity.description || activity.details?.description) && (
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">📖</span>
                    About this place
                  </h3>
                  <p className="text-white text-base leading-relaxed drop-shadow-lg">
                    {activity.description || activity.details?.description}
                  </p>
                </div>
              )}

              {/* Hours & Contact Info - NOT for events */}
              {activity.type !== 'event' && (activity.hoursToday || activity.website) && (
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4 space-y-3">
                  <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <span className="text-2xl">ℹ️</span>
                    Details
                  </h3>

                  {/* Hours */}
                  {activity.hoursToday && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🕒</span>
                      <div>
                        <div className="text-white font-semibold text-sm">Today's Hours</div>
                        <div className="text-white/90 text-base">
                          {activity.hoursToday.open} - {activity.hoursToday.close}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Level */}
                  {(activity.cost?.priceLevel && activity.cost.priceLevel > 0) && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">💰</span>
                      <div>
                        <div className="text-white font-semibold text-sm">Price Range</div>
                        <div className="text-white/90 text-base">
                          {'$'.repeat(activity.cost.priceLevel)} {activity.cost.priceLevel === 1 ? '(Budget-friendly)' : activity.cost.priceLevel === 2 ? '(Moderate)' : activity.cost.priceLevel === 3 ? '(Upscale)' : '(Fine Dining)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {activity.website && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🌐</span>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">Website</div>
                        <a
                          href={activity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-300 hover:text-sky-200 text-sm underline break-all"
                        >
                          Visit website →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location - NOT for events */}
              {activity.type !== 'event' && activity.address && !(activity as any).isGrouped && (
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4">
                  <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    Location
                  </h3>
                  <p className="text-white text-base leading-relaxed drop-shadow-lg">
                    {activity.address}
                    {activity.city && activity.state && (
                      <span className="block text-white/80 text-sm mt-1">
                        {activity.city}, {activity.state}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Multiple Locations - Tufte-style list for grouped chains */}
              {activity.type !== 'event' && (activity as any).isGrouped && (activity as any).locations && (
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    {(activity as any).locationCount} Locations
                  </h3>
                  {/* Tufte-style compact data table */}
                  <div className="space-y-2">
                    {((activity as any).locations as Activity[]).map((location: Activity, idx: number) => (
                      <div
                        key={location.id || location.activityId || idx}
                        className="flex items-start justify-between gap-4 py-2 border-b border-white/10 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-base font-medium leading-tight">
                            {location.address?.split(',')[0] || 'Address unavailable'}
                          </p>
                          <p className="text-white/70 text-sm mt-0.5">
                            {location.address?.split(',').slice(1).join(',').trim() || ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-white text-base font-bold whitespace-nowrap">
                            {location.distance?.toFixed(1)} mi
                          </span>
                          {location.openNow && (
                            <span className="text-emerald-400 text-xs font-medium">
                              Open
                            </span>
                          )}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-300 hover:text-sky-200 text-xs font-medium underline transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Directions →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why we think you'll like it - NOT for events */}
              {activity.type !== 'event' && score > 0 && (
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">💭</span>
                    Why we think you'll like it
                  </h3>
                  <p className="text-white text-base leading-relaxed">
                    {(() => {
                      const reasons = [];
                      const categoryName = category.replace(/_/g, ' ');

                      // Distance-based reason
                      if (activity.distance && activity.distance <= 1) {
                        reasons.push("it's super close to you");
                      } else if (activity.distance && activity.distance <= 3) {
                        reasons.push("it's nearby");
                      }

                      // Rating-based reason
                      if (activity.rating && activity.rating >= 4.5) {
                        reasons.push("people absolutely love it");
                      } else if (activity.rating && activity.rating >= 4.0) {
                        reasons.push("it's highly rated");
                      }

                      // Review count
                      if (activity.reviewCount && activity.reviewCount > 1000) {
                        reasons.push(`thousands of people have reviewed it`);
                      } else if (activity.reviewCount && activity.reviewCount > 100) {
                        reasons.push(`hundreds of people have reviewed it`);
                      }

                      // Category match reason
                      if (signalBars >= 4) {
                        reasons.push(`it matches your passion for ${categoryName}`);
                      } else if (signalBars >= 2) {
                        reasons.push(`it aligns with your interest in ${categoryName}`);
                      }

                      // Special perks
                      if (activity.cost?.free) {
                        reasons.push("it's free");
                      }
                      if (activity.openNow) {
                        reasons.push("you can check it out right now");
                      }

                      // Construct friendly message
                      if (reasons.length === 0) {
                        return `This ${categoryName} spot caught our attention for you - seems like something you'd enjoy!`;
                      } else if (reasons.length === 1) {
                        return `We picked this because ${reasons[0]}. Sounds like your kind of place!`;
                      } else if (reasons.length === 2) {
                        return `We think you'll really enjoy this - ${reasons[0]} and ${reasons[1]}!`;
                      } else {
                        const lastReason = reasons.pop();
                        return `This one checks a lot of boxes for you: ${reasons.join(', ')}, and ${lastReason}. Worth a visit!`;
                      }
                    })()}
                  </p>
                </div>
              )}

              {/* Additional images gallery */}
              {activity.images && activity.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {activity.images.slice(1, 5).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${activity.name} ${idx + 2}`}
                      className="h-24 w-32 object-cover rounded-xl flex-shrink-0 shadow-lg border-2 border-white/30"
                    />
                  ))}
                  {activity.images.length > 5 && (
                    <div className="h-24 w-32 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold border-2 border-white/30">
                      +{activity.images.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apple Glass Bottom Tray - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Collapsed State - Compact Navigation Bar */}
          {!trayExpanded && (
            <div className="bg-white/10 backdrop-blur-2xl border-t border-white/20 shadow-2xl">
              <div className="px-6 py-4 flex items-center justify-between">
                {/* Previous Button */}
                {onPrev && (
                  <button
                    onClick={onPrev}
                    className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">Previous</span>
                  </button>
                )}

                {/* Expand Handle - Center */}
                <button
                  onClick={() => setTrayExpanded(true)}
                  className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all px-6 py-2 hover:bg-white/10 rounded-full"
                >
                  <div className="w-12 h-1 bg-white/40 rounded-full"></div>
                  <span className="text-xs font-medium">Swipe up</span>
                </button>

                {/* Next Button */}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all"
                  >
                    <span className="text-sm font-medium">Next</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Expanded State - Action Drawer */}
          {trayExpanded && (
            <div className="bg-white/15 backdrop-blur-3xl border-t border-white/20 shadow-2xl animate-slide-up">
              {/* Collapse Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <button
                  onClick={() => setTrayExpanded(false)}
                  className="text-white/70 hover:text-white transition-all p-2"
                >
                  <div className="w-12 h-1 bg-white/40 rounded-full"></div>
                </button>
              </div>

              <div className="px-6 pb-6 space-y-3">
                {/* Navigation Row */}
                <div className="flex items-center justify-between mb-2">
                  {onPrev && (
                    <button
                      onClick={onPrev}
                      className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-sm font-medium">Previous</span>
                    </button>
                  )}

                  <div className="flex-1"></div>

                  {onNext && (
                    <button
                      onClick={onNext}
                      className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all"
                    >
                      <span className="text-sm font-medium">Next</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <button
                  onClick={handleBeenHere}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                    beenHere
                      ? 'bg-green-500/80 backdrop-blur-sm text-white'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                  }`}
                >
                  <svg className="w-6 h-6" fill={beenHere ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{beenHere ? "✓ I've been here" : "I've been here"}</span>
                </button>

                {/* Share on X button */}
                <button
                  onClick={() => {
                    const getCategoryEmoji = () => {
                      switch (category) {
                        case 'hiking': return '🥾';
                        case 'events': return '🎉';
                        case 'food_and_dining': return '🍽️';
                        case 'arts_and_culture': return '🎨';
                        case 'sports_and_recreation': return '⚽';
                        case 'nature_and_outdoors': return '🌲';
                        case 'entertainment': return '🎭';
                        case 'shopping': return '🛍️';
                        case 'museums': return '🏛️';
                        default: return '📍';
                      }
                    };
                    const cityName = activity.location?.address?.split(',')[0] || activity.city || 'my area';
                    const tweetText = `🎯 I'm discovering ${activity.name} in ${cityName} with AgentQu! ${getCategoryEmoji()} Check it out:`;
                    const url = 'https://agentqu-platform.web.app';
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
                    window.open(twitterUrl, '_blank', 'width=550,height=420');
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Share on X</span>
                </button>

                {nextTrip ? (
                  <button
                    onClick={handleAddToTrip}
                    className={`w-full flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                      addedToTrip
                        ? 'bg-blue-500/80 backdrop-blur-sm text-white'
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill={addedToTrip ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>{addedToTrip ? "Added to trip" : "Add to my next trip"}</span>
                    </div>
                    <div className="text-sm text-white/80">
                      📅 {nextTrip.destination.city} - {new Date(nextTrip.dates.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                ) : (
                  <div className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
                    <span className="text-white/60 text-sm">No upcoming trips planned</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetails;
