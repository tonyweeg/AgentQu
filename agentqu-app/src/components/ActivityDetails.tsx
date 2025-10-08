import React from 'react';
import { Activity } from '../lib/types';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ activity, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header Image */}
        {activity.images && activity.images[0] && (
          <div className="relative h-64 bg-gray-100">
            <img
              src={activity.images[0]}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/95 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {/* Title and Score */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-navy-text mb-2">{activity.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">{activity.distance?.toFixed(1)} mi away</span>
                <span>•</span>
                <span className="capitalize">{activity.primaryCategory?.replace(/_/g, ' ')}</span>
                {(activity.cost?.free || activity.cost?.priceLevel === 0) && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </>
                )}
              </div>
            </div>
            {activity.score !== undefined && (
              <div className="bg-ocean-bright/20 text-ocean-bright px-5 py-2 rounded-full text-lg font-bold ml-4">
                {activity.score}
              </div>
            )}
          </div>

          {/* Rating */}
          {activity.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(activity.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">
                {activity.rating.toFixed(1)} ({activity.reviewCount || 0} reviews)
              </span>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {activity.openNow && (
              <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                🟢 Open now
              </span>
            )}
            {activity.accessibility?.wheelchairAccessible && (
              <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                ♿ Wheelchair Accessible
              </span>
            )}
            {activity.cost?.free && (
              <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                💰 Free
              </span>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy-text mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{activity.description}</p>
            </div>
          )}

          {/* Location */}
          {activity.address && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy-text mb-2">Location</h3>
              <p className="text-gray-700">{activity.address}</p>
              {activity.city && activity.state && (
                <p className="text-gray-600">
                  {activity.city}, {activity.state}
                </p>
              )}
            </div>
          )}

          {/* Categories */}
          {activity.categories && activity.categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy-text mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {activity.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm capitalize"
                  >
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            {activity.website && (
              <a
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-ocean-bright text-white px-6 py-3 rounded-xl hover:bg-ocean-bright/90 transition-colors font-medium text-center"
              >
                Visit Website
              </a>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetails;
