import React, { useState } from 'react';
import { Activity } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import QuupButton from './QuupButton';
import CheckInButton from './CheckInButton';
import ShareButton from './ShareButton';
import ActivityDetails from './ActivityDetails';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-dark-text">
            {activity.type}
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-2 text-dark-text">{activity.name}</h3>

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

          {/* Score */}
          {activity.score !== undefined && (
            <div className="ml-4">
              <div className="bg-peach/20 text-peach px-4 py-2 rounded-full text-sm font-bold">
                {activity.score}
              </div>
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

        {/* Action Buttons */}
        {user && (
          <div className="space-y-3">
            {/* Check In Button */}
            <CheckInButton
              activityId={activity.activityId || activity.id}
              userId={user.uid}
              activityLat={activity.location?.lat || activity.lat}
              activityLng={activity.location?.lng || activity.lng}
            />

            {/* Qu-up and Share Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <QuupButton
                  activityId={activity.activityId || activity.id}
                  userId={user.uid}
                />
              </div>
              <ShareButton
                activityId={activity.activityId || activity.id}
                activityName={activity.name}
                userId={user.uid}
              />
            </div>
          </div>
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
