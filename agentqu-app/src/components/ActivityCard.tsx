import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityDetails from './ActivityDetails';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Category-based colorful gradients
  const category = activity.primaryCategory || 'other';
  const getCategoryGradient = () => {
    switch (category) {
      case 'hiking': return 'from-green-50 to-emerald-100';
      case 'events': return 'from-purple-50 to-pink-100';
      case 'food_and_dining': return 'from-orange-50 to-amber-100';
      case 'arts_and_culture': return 'from-pink-50 to-rose-100';
      case 'sports_and_recreation': return 'from-blue-50 to-cyan-100';
      case 'nature_and_outdoors': return 'from-teal-50 to-green-100';
      case 'entertainment': return 'from-indigo-50 to-purple-100';
      case 'shopping': return 'from-yellow-50 to-amber-100';
      case 'museums': return 'from-amber-50 to-orange-100';
      default: return 'from-gray-50 to-slate-100';
    }
  };

  const getCategoryBorder = () => {
    switch (category) {
      case 'hiking': return 'border-green-300';
      case 'events': return 'border-purple-300';
      case 'food_and_dining': return 'border-orange-300';
      case 'arts_and_culture': return 'border-pink-300';
      case 'sports_and_recreation': return 'border-blue-300';
      case 'nature_and_outdoors': return 'border-teal-300';
      case 'entertainment': return 'border-indigo-300';
      case 'shopping': return 'border-yellow-300';
      case 'museums': return 'border-amber-300';
      default: return 'border-gray-300';
    }
  };

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

  // STOKED badge with vibrant gradients
  let stokedLabel = "";
  let stokedGradient = "";
  const score = activity.score || 0;

  if (score >= 280) {
    stokedLabel = "You'll love it";
    stokedGradient = "bg-gradient-to-r from-[#FF6B9D] via-[#FEC163] to-[#EE4E4E]";
  } else if (score >= 220) {
    stokedLabel = "You'll like it";
    stokedGradient = "bg-gradient-to-r from-[#FEC163] via-[#FF6B9D] to-[#F97171]";
  } else if (score >= 180) {
    stokedLabel = "You should like it";
    stokedGradient = "bg-gradient-to-r from-[#4FACFE] via-[#00F2FE] to-[#43E97B]";
  } else if (score >= 140) {
    stokedLabel = "Give it a shot!";
    stokedGradient = "bg-gradient-to-r from-[#667EEA] via-[#764BA2] to-[#F093FB]";
  }

  return (
    <>
      <div
        className={`bg-gradient-to-br ${getCategoryGradient()} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${getCategoryBorder()} cursor-pointer`}
        onClick={() => setShowDetails(true)}
      >
        {/* Always try to show image first */}
        <div className="relative h-48 bg-gray-100">
          {activity.images && activity.images[0] ? (
            <>
              <img
                src={activity.images[0]}
                alt={activity.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback to placeholder if image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const placeholder = document.createElement('div');
                    placeholder.className = `absolute inset-0 bg-gradient-to-br ${getCategoryGradient()} flex items-center justify-center`;
                    placeholder.innerHTML = `<span class="text-6xl">${getCategoryEmoji()}</span>`;
                    parent.appendChild(placeholder);
                  }
                }}
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

              {/* Small category emoji badge - top left */}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xl shadow-md">
                {getCategoryEmoji()}
              </div>

              {/* STOKED Badge - bottom overlay */}
              {stokedLabel && (
                <div className={`absolute bottom-0 left-0 right-0 ${stokedGradient} text-white px-3 py-2 text-xs font-bold`}>
                  {stokedLabel}
                </div>
              )}
            </>
          ) : (
            /* Fallback: No image available */
            <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient()} flex flex-col items-center justify-center`}>
              <div className="text-6xl mb-2">
                {getCategoryEmoji()}
              </div>
              {stokedLabel && (
                <div className={`${stokedGradient} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                  {stokedLabel}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Title + Distance */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base text-navy-text line-clamp-2 flex-1 leading-snug">
              {activity.name}
            </h3>
            <span className="text-sm text-gray-700 font-bold whitespace-nowrap">
              {activity.distance?.toFixed(1)} mi
            </span>
          </div>

          {/* Dense Info Row - Tufte style */}
          <div className="flex items-center gap-3 text-sm text-gray-700 mb-2 flex-wrap">
            <span className="capitalize text-gray-600 font-medium">
              {category.replace(/_/g, ' ')}
            </span>
            {activity.rating && (
              <span className="flex items-center gap-1 font-medium">
                ⭐ {activity.rating.toFixed(1)}
              </span>
            )}
            {(activity.cost?.free || activity.cost?.priceLevel === 0) && (
              <span className="text-green-600 font-bold">Free</span>
            )}
            {activity.cost?.priceLevel && activity.cost.priceLevel > 0 && (
              <span className="font-medium">{'$'.repeat(activity.cost.priceLevel)}</span>
            )}
            {activity.openNow && (
              <span className="text-green-600 font-bold">Open Now</span>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <p className="text-gray-700 text-sm line-clamp-2 leading-snug">{activity.description}</p>
          )}
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
