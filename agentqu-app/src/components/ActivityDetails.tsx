import React from 'react';
import { Activity } from '../lib/types';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ activity, onClose, onNext, onPrev, currentIndex, totalCount }) => {
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

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Instagram-style enlarged card */}
      <div
        className="relative bg-black rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

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

          {/* Previous button - left side */}
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full p-4 shadow-lg transition-all text-white z-10"
              title="Previous activity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next button - right side */}
          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full p-4 shadow-lg transition-all text-white z-10"
              title="Next activity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

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
          <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
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

              {/* Q Score */}
              <div className="bg-purple-600/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                Q{score}
              </div>
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

            {/* Description/Highlights */}
            {activity.description && (
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4">
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  Highlights
                </h3>
                <p className="text-white text-base leading-relaxed drop-shadow-lg">
                  {activity.description}
                </p>
              </div>
            )}

            {/* Location */}
            {activity.address && (
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

            {/* AI Score Breakdown */}
            {score > 0 && (
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4">
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Why Q{score}?
                </h3>
                <div className="space-y-2">
                  {activity.distance && (
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm">
                        📍 {activity.distance <= 1 ? 'Very close' : activity.distance <= 3 ? 'Nearby' : 'Reachable'}
                      </span>
                      <span className="text-sm font-bold">
                        {activity.distance <= 1 ? '+30' : activity.distance <= 3 ? '+20' : '+10'} pts
                      </span>
                    </div>
                  )}
                  {activity.rating && (
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm">⭐ Highly rated ({activity.rating.toFixed(1)}/5)</span>
                      <span className="text-sm font-bold">+{Math.round((activity.rating / 5) * 20)} pts</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-white">
                    <span className="text-sm">❤️ Matches your interests</span>
                    <span className="text-sm font-bold">Up to +40 pts</span>
                  </div>
                  {activity.cost?.free && (
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm">🎁 Free activity</span>
                      <span className="text-sm font-bold">+5 pts</span>
                    </div>
                  )}
                  {activity.openNow && (
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm">🟢 Open now</span>
                      <span className="text-sm font-bold">+10 pts</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {activity.website && (
                <a
                  href={activity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 px-6 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Visit Website
                </a>
              )}
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-600/90 backdrop-blur-sm hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Directions
                </a>
              )}
            </div>

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
    </div>
  );
};

export default ActivityDetails;
