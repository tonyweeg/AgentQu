import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityDetails from './ActivityDetails';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Adventure ocean palette - solid camel/tan/sand backgrounds
  let cardBg = 'bg-[#E8D5C4]'; // Warm sand/camel
  let accentColor = '#C89F7B'; // Darker camel for borders

  // Calculate stoked percentage and label
  const stokedPercentage = activity.score ? Math.min(100, (activity.score / 350) * 100) : 0;
  let stokedLabel = "Give it a shot!";
  let stokedBadgeColor = 'bg-[#8B7355]'; // Muted brown

  if (activity.score && activity.score >= 280) {
    stokedLabel = "You'll love it";
    cardBg = 'bg-[#F5E6D3]'; // Light warm sand
    accentColor = '#D4A574';
    stokedBadgeColor = 'bg-[#C89F7B]';
  } else if (activity.score && activity.score >= 220) {
    stokedLabel = "You'll like it";
    cardBg = 'bg-[#EDD9C0]'; // Medium sand
    accentColor = '#C89F7B';
    stokedBadgeColor = 'bg-[#A67C52]';
  } else if (activity.score && activity.score >= 180) {
    stokedLabel = "You should like it";
    cardBg = 'bg-[#E8D5C4]'; // Camel
    accentColor = '#C89F7B';
    stokedBadgeColor = 'bg-[#8B7355]';
  }

  return (
    <>
      <div className={`${cardBg} rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2`} style={{ borderColor: accentColor }}>
      {/* Image with Stoked Badge Overlay */}
      {activity.images && activity.images[0] && (
        <div
          className="relative h-40 bg-gray-100 cursor-pointer group"
          onClick={() => setShowDetails(true)}
        >
          <img
            src={activity.images[0]}
            alt={activity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              View Details
            </span>
          </div>
          {/* Stoked Badge - Top Right */}
          <div className={`absolute top-2 right-2 ${stokedBadgeColor} text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg`}>
            {stokedLabel}
          </div>
          {/* Type Badge - Top Left */}
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur px-2 py-1 rounded-md text-xs font-medium text-navy-text">
            {activity.type}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header - More Compact */}
        <h3 className="font-bold text-lg mb-2 text-navy-text line-clamp-2">{activity.name}</h3>

        {/* Quick Info Row */}
        <div className="flex items-center gap-2 text-xs text-gray-700 mb-3 flex-wrap">
          <span className="font-bold">{activity.distance?.toFixed(1)} mi</span>
          <span>•</span>
          <span>{activity.primaryCategory}</span>
          {activity.rating && (
            <>
              <span>•</span>
              <span>⭐ {activity.rating.toFixed(1)}</span>
            </>
          )}
          {(activity.cost?.free || activity.cost?.priceLevel === 0) && (
            <>
              <span>•</span>
              <span className="text-green-700 font-bold">Free</span>
            </>
          )}
          {activity.openNow && (
            <>
              <span>•</span>
              <span className="text-green-700 font-bold">Open</span>
            </>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-gray-700 text-xs mb-3 line-clamp-2">{activity.description}</p>
        )}

        {/* Compact Details Grid */}
        <div className="space-y-1.5 text-xs">
          {/* Hours */}
          {activity.hoursToday && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">🕐</span>
              <span className="text-gray-800 font-medium">
                {activity.hoursToday.open} - {activity.hoursToday.close}
              </span>
            </div>
          )}

          {/* Duration */}
          {activity.duration && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">⏱️</span>
              <span className="text-gray-800 font-medium">{activity.duration} min</span>
            </div>
          )}

          {/* Address */}
          {(activity.address || activity.location?.address) && (
            <div className="flex items-start gap-1.5">
              <span className="text-gray-600 mt-0.5">📍</span>
              <span className="text-gray-800 flex-1 line-clamp-1">
                {activity.address || activity.location?.address}
              </span>
            </div>
          )}

          {/* Accessibility */}
          {activity.accessibility?.wheelchairAccessible && (
            <div className="flex items-center gap-1.5">
              <span>♿</span>
              <span className="text-gray-800 font-medium">Accessible</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={() => setShowDetails(true)}
          className="w-full mt-3 px-3 py-2 bg-navy-text hover:bg-ocean-mid text-white rounded-lg text-xs font-bold transition-colors"
        >
          View Full Details
        </button>
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
