import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityDetails from './ActivityDetails';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-br from-seafoam to-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-ocean-bright/20">
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
                // Convert score to Q rating (1-5)
                // Score ranges: 0-150=Low, 150-200=Medium, 200-250=High, 250-300=VeryHigh, 300+=Perfect
                let qLevel = 1;
                let qLabel = "Worth a try";
                let qColor = "bg-gray-400";

                if (activity.score >= 300) {
                  qLevel = 5;
                  qLabel = "Perfect match!";
                  qColor = "bg-gradient-to-r from-coral to-sand";
                } else if (activity.score >= 250) {
                  qLevel = 4;
                  qLabel = "You'll love it";
                  qColor = "bg-gradient-to-r from-sand to-coral";
                } else if (activity.score >= 200) {
                  qLevel = 3;
                  qLabel = "Good match";
                  qColor = "bg-ocean-bright";
                } else if (activity.score >= 150) {
                  qLevel = 2;
                  qLabel = "Might like it";
                  qColor = "bg-ocean-mid";
                }

                return (
                  <>
                    {/* Q Meter Bars */}
                    <div className="flex gap-1 items-end">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-1.5 rounded-t transition-all ${
                            level <= qLevel
                              ? qColor
                              : 'bg-gray-200'
                          }`}
                          style={{ height: `${level * 6}px` }}
                        />
                      ))}
                    </div>
                    {/* Q Label */}
                    <div className="text-xs font-bold text-navy-text whitespace-nowrap">
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
