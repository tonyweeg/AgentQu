import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityDetails from './ActivityDetails';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Determine card gradient based on activity score
  let cardGradient = 'from-gray-50 to-white'; // Default/low score
  let borderColor = 'border-gray-200';

  if (activity.score !== undefined) {
    if (activity.score >= 300) {
      cardGradient = 'from-[#FFE5EE] to-white'; // Perfect - soft pink glow
      borderColor = 'border-[#FF6B9D]/30';
    } else if (activity.score >= 250) {
      cardGradient = 'from-[#FFF4E5] to-white'; // High - warm coral glow
      borderColor = 'border-[#FEC163]/30';
    } else if (activity.score >= 200) {
      cardGradient = 'from-[#E5F9FF] to-white'; // Good - cool cyan glow
      borderColor = 'border-[#4FACFE]/30';
    } else if (activity.score >= 150) {
      cardGradient = 'from-[#F0E5FF] to-white'; // Medium - purple glow
      borderColor = 'border-[#667EEA]/30';
    }
  }

  return (
    <>
      <div className={`bg-gradient-to-br ${cardGradient} rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border ${borderColor}`}>
      {/* Image */}
      {activity.images && activity.images[0] && (
        <div
          className="relative h-48 bg-gray-100 cursor-pointer group"
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
          {/* Type Badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-navy-text">
            {activity.type}
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-2 text-navy-text">{activity.name}</h3>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{activity.distance?.toFixed(1)} mi</span>
              <span>•</span>
              <span>{activity.primaryCategory}</span>
              {(activity.cost?.free || activity.cost?.priceLevel === 0) && (
                <>
                  <span>•</span>
                  <span className="text-green-600 font-medium">Free</span>
                </>
              )}
            </div>
          </div>

          {/* Q Meter - Visual Match Indicator */}
          {activity.score !== undefined && (
            <div className="ml-4 flex flex-col items-center gap-1">
              {(() => {
                // Convert score to Q rating with compact gradient meter
                let qLabel = "Worth a try";

                // Calculate percentage for gradient bar
                const percentage = Math.min(100, (activity.score / 350) * 100);

                // Rich vibrant gradients based on score
                let gradientColors = 'from-gray-300 to-gray-400'; // Low
                if (activity.score >= 300) {
                  gradientColors = 'from-[#FF6B9D] via-[#FEC163] to-[#EE4E4E]'; // Perfect - vibrant pink/coral/red
                  qLabel = 'Perfect!';
                } else if (activity.score >= 250) {
                  gradientColors = 'from-[#FEC163] via-[#FF6B9D] to-[#F97171]'; // High - warm coral/orange
                  qLabel = "Love it";
                } else if (activity.score >= 200) {
                  gradientColors = 'from-[#4FACFE] via-[#00F2FE] to-[#43E97B]'; // Good - bright blue/cyan/green
                } else if (activity.score >= 150) {
                  gradientColors = 'from-[#667EEA] via-[#764BA2] to-[#F093FB]'; // Medium - purple/lavender
                  qLabel = 'Might like';
                }

                return (
                  <>
                    {/* Compact Q Meter - Horizontal gradient bar */}
                    <div className="relative w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full bg-gradient-to-r ${gradientColors} transition-all duration-500 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {/* Q Label */}
                    <div className="text-[10px] font-bold text-navy-text whitespace-nowrap tracking-tight">
                      {qLabel}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activity.description}</p>
        )}

        {/* Accessibility Badges */}
        {activity.accessibility && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activity.accessibility.wheelchairAccessible && (
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                ♿ Wheelchair Accessible
              </span>
            )}
            {activity.accessibility.mobilityLevel && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                {activity.accessibility.mobilityLevel.charAt(0).toUpperCase() +
                  activity.accessibility.mobilityLevel.slice(1)}
              </span>
            )}
          </div>
        )}

        {/* Quick Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {activity.openNow && <span className="text-green-600 font-medium">🟢 Open now</span>}

          {activity.rating && (
            <span>
              ⭐ {activity.rating.toFixed(1)} ({activity.reviewCount || 0})
            </span>
          )}

          {activity.duration && <span>⏱️ {activity.duration} min</span>}
        </div>

        {/* Additional Details Section */}
        <div className="border-t pt-4 space-y-3">
          {/* Hours */}
          {activity.hoursToday && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">🕐 Hours:</span>
              <span className="text-gray-700 font-medium">
                {activity.hoursToday.open} - {activity.hoursToday.close}
              </span>
            </div>
          )}

          {/* Phone (if available in details) */}
          {(activity as any).details?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">📞</span>
              <a href={`tel:${(activity as any).details.phone}`} className="text-ocean-bright hover:underline font-medium">
                {(activity as any).details.phone}
              </a>
            </div>
          )}

          {/* Website */}
          {activity.website && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">🌐</span>
              <a
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ocean-bright hover:underline font-medium truncate"
              >
                Visit Website
              </a>
            </div>
          )}

          {/* Address */}
          {(activity.address || activity.location?.address) && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-500 mt-0.5">📍</span>
              <span className="text-gray-700 flex-1">
                {activity.address || activity.location?.address}
              </span>
            </div>
          )}

          {/* View on Map Button */}
          <button
            onClick={() => setShowDetails(true)}
            className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-navy-text rounded-lg text-sm font-medium transition-colors"
          >
            View Full Details
          </button>
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
