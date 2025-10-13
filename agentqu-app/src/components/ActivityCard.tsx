import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityDetails from './ActivityDetails';
import { useAuth } from '../hooks/useAuth';

interface ActivityCardProps {
  activity: Activity;
  index: number;
  allActivities: Activity[];
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, index, allActivities }) => {
  const { profile } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [detailsIndex, setDetailsIndex] = useState(index);

  const category = activity.primaryCategory || 'other';
  const score = activity.score || 0;

  // Check if this place has been visited
  const isVisited = profile?.visitedPlaces?.some(
    p => p.activityId === (activity.id || activity.activityId)
  );

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

  // Calculate signal bars based on Q Score (0-5 bars)
  // Q Score ranges typically 100-300+, map to 0-5 bars
  const qScore = activity.score || 0;
  const signalBars = Math.min(5, Math.max(0, Math.ceil((qScore - 100) / 40)));

  // Check if off-grid (no internet/remote location)
  const isOffGrid = activity.location?.address?.toLowerCase().includes('off grid') ||
                    activity.location?.address?.toLowerCase().includes('remote') ||
                    (activity as any).offGrid === true;

  // Hiking-specific info
  const isHike = category === 'hiking' || category === 'nature_and_outdoors';
  const hikingDuration = activity.duration ? (activity.duration / 60).toFixed(1) : null; // Convert minutes to hours
  const hikingDifficulty = activity.accessibility?.mobilityLevel || 'moderate';

  // Extract highlight text from description (first 60 chars)
  const highlight = activity.description
    ? activity.description.substring(0, 60) + (activity.description.length > 60 ? '...' : '')
    : null;

  // Navigation handlers
  const handleNext = () => {
    if (detailsIndex < allActivities.length - 1) {
      setDetailsIndex(detailsIndex + 1);
    }
  };

  const handlePrev = () => {
    if (detailsIndex > 0) {
      setDetailsIndex(detailsIndex - 1);
    }
  };

  const handleCardClick = () => {
    setDetailsIndex(index); // Reset to this card's index
    setShowDetails(true);
  };

  return (
    <>
      {/* Mobile-optimized landscape card with 3:2 aspect ratio */}
      <div
        className="relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer aspect-[3/2] group"
        onClick={handleCardClick}
      >
        {/* Full-height image */}
        <div className="absolute inset-0">
          {activity.images && activity.images[0] ? (
            <>
              <img
                src={activity.images[0]}
                alt={activity.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center';
                    placeholder.innerHTML = `<span class="text-6xl">${getCategoryEmoji()}</span>`;
                    parent.appendChild(placeholder);
                  }
                }}
              />
            </>
          ) : (
            /* No image - show gradient with emoji */
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <span className="text-6xl">{getCategoryEmoji()}</span>
            </div>
          )}
        </div>

        {/* Sky Blue Category Pill - Top Left */}
        <div className="absolute top-3 left-3 bg-sky-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-lg">
          {category.replace(/_/g, ' ')}
        </div>

        {/* Distance badge - Top Right */}
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
          <span className="text-xs text-gray-800 font-bold">
            {activity.distance?.toFixed(1)} mi
          </span>
        </div>

        {/* Visited badge - below distance */}
        {isVisited && (
          <div className="absolute top-12 right-3 bg-green-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow-lg">
            <span className="text-xs font-bold">✓ Visited</span>
          </div>
        )}

        {/* Location count badge for grouped chains - below visited or distance */}
        {(activity as any).isGrouped && (activity as any).locationCount && (
          <div className={`absolute ${isVisited ? 'top-[4.5rem]' : 'top-12'} right-3 bg-orange-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow-lg`}>
            <span className="text-xs font-bold">📍 {(activity as any).locationCount} locations</span>
          </div>
        )}

        {/* Off-Grid Icon - Bottom Left corner of image */}
        {isOffGrid && (
          <div className="absolute bottom-16 left-3 bg-green-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow-lg">
            <span className="text-xs font-bold">🏕️ Off-Grid</span>
          </div>
        )}

        {/* Gradient overlay at bottom - adjusted for landscape aspect ratio */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>

        {/* Translucent text highlights on bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
          {/* Title with translucent background */}
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-2.5 py-1.5 inline-block max-w-full">
            <h3 className="font-bold text-white text-xs leading-tight line-clamp-1 drop-shadow-lg">
              {activity.name}
            </h3>
          </div>

          {/* Info badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {(activity.cost?.free || activity.cost?.priceLevel === 0) && (
              <div className="bg-green-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                Free
              </div>
            )}
            {activity.cost?.priceLevel && activity.cost.priceLevel > 0 && (
              <div className="bg-white/80 backdrop-blur-sm text-gray-800 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                {'$'.repeat(activity.cost.priceLevel)}
              </div>
            )}
            {activity.openNow && (
              <div className="bg-emerald-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                Open Now
              </div>
            )}

            {/* Affinity Meter */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
              {[1, 2, 3, 4, 5].map((dot) => (
                <div
                  key={dot}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    dot <= signalBars
                      ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Star Rating */}
            {activity.rating && (
              <div className="bg-amber-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                ⭐ {activity.rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Hiking-Specific Info */}
          {isHike && (hikingDuration || hikingDifficulty) && (
            <div className="flex items-center gap-2 flex-wrap">
              {hikingDuration && (
                <div className="bg-purple-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                  🥾 {hikingDuration}h trail
                </div>
              )}
              <div className={`backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg ${
                hikingDifficulty === 'easy' ? 'bg-green-500/80' :
                hikingDifficulty === 'difficult' ? 'bg-red-500/80' :
                'bg-orange-500/80'
              }`}>
                {hikingDifficulty.toUpperCase()}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Activity Details Modal */}
      {showDetails && (
        <ActivityDetails
          activity={allActivities[detailsIndex]}
          onClose={() => setShowDetails(false)}
          onNext={detailsIndex < allActivities.length - 1 ? handleNext : undefined}
          onPrev={detailsIndex > 0 ? handlePrev : undefined}
          currentIndex={detailsIndex}
          totalCount={allActivities.length}
        />
      )}
    </>
  );
};

export default ActivityCard;
