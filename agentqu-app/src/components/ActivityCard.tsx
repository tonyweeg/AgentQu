import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityDetails from './ActivityDetails';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const [showDetails, setShowDetails] = useState(false);

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

  // Smaller, subtler Q Score badge (text only, no gradients)
  let qScoreBadge = "";
  if (score >= 280) {
    qScoreBadge = "❤️ You'll love it";
  } else if (score >= 220) {
    qScoreBadge = "😊 You'll like it";
  } else if (score >= 180) {
    qScoreBadge = "👍 You should like it";
  } else if (score >= 140) {
    qScoreBadge = "🎯 Give it a shot";
  }

  return (
    <>
      {/* Compact list-style card with sandy background */}
      <div
        className="bg-amber-50 border border-amber-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        {/* Horizontal layout: image left, content right */}
        <div className="flex gap-3 p-2">
          {/* Small thumbnail image (60x60) */}
          <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-amber-100 relative">
            {activity.images && activity.images[0] ? (
              <>
                <img
                  src={activity.images[0]}
                  alt={activity.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to emoji if image fails
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'absolute inset-0 bg-amber-100 flex items-center justify-center';
                      placeholder.innerHTML = `<span class="text-3xl">${getCategoryEmoji()}</span>`;
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </>
            ) : (
              /* No image - show emoji */
              <div className="absolute inset-0 bg-amber-100 flex items-center justify-center">
                <span className="text-3xl">{getCategoryEmoji()}</span>
              </div>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Title and Distance */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-sm text-gray-900 line-clamp-1 leading-tight">
                {activity.name}
              </h3>
              <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">
                {activity.distance?.toFixed(1)} mi
              </span>
            </div>

            {/* Compact info row */}
            <div className="flex items-center gap-1.5 text-xs text-gray-700 flex-wrap mb-1">
              <span className="text-amber-700 font-medium">{getCategoryEmoji()}</span>
              {activity.rating && (
                <span className="flex items-center gap-0.5">
                  ⭐ {activity.rating.toFixed(1)}
                </span>
              )}
              {(activity.cost?.free || activity.cost?.priceLevel === 0) && (
                <span className="text-green-600 font-semibold">Free</span>
              )}
              {activity.cost?.priceLevel && activity.cost.priceLevel > 0 && (
                <span className="text-gray-600">{'$'.repeat(activity.cost.priceLevel)}</span>
              )}
              {activity.openNow && (
                <span className="text-green-600 font-semibold">Open</span>
              )}
            </div>

            {/* Small Q Score badge - subtle text only */}
            {qScoreBadge && (
              <div className="text-[10px] text-amber-700 font-medium">
                {qScoreBadge} · Q{score}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      {showDetails && (
        <ActivityDetails activity={activity} onClose={() => setShowDetails(false)} />
      )}
    </>
  );
};

export default ActivityCard;
