import React from 'react';
import { Activity } from '../lib/types';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ activity, onClose }) => {
  // Category-based colors
  const category = activity.primaryCategory || 'other';
  const getCategoryColor = () => {
    switch (category) {
      case 'hiking': return { bg: 'from-green-50 to-emerald-100', text: 'text-green-700', border: 'border-green-300' };
      case 'events': return { bg: 'from-purple-50 to-pink-100', text: 'text-purple-700', border: 'border-purple-300' };
      case 'food_and_dining': return { bg: 'from-orange-50 to-amber-100', text: 'text-orange-700', border: 'border-orange-300' };
      case 'arts_and_culture': return { bg: 'from-pink-50 to-rose-100', text: 'text-pink-700', border: 'border-pink-300' };
      case 'sports_and_recreation': return { bg: 'from-blue-50 to-cyan-100', text: 'text-blue-700', border: 'border-blue-300' };
      case 'nature_and_outdoors': return { bg: 'from-teal-50 to-green-100', text: 'text-teal-700', border: 'border-teal-300' };
      case 'entertainment': return { bg: 'from-indigo-50 to-purple-100', text: 'text-indigo-700', border: 'border-indigo-300' };
      case 'shopping': return { bg: 'from-yellow-50 to-amber-100', text: 'text-yellow-700', border: 'border-yellow-300' };
      case 'museums': return { bg: 'from-amber-50 to-orange-100', text: 'text-amber-700', border: 'border-amber-300' };
      default: return { bg: 'from-gray-50 to-slate-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  const colors = getCategoryColor();

  // STOKED meter gradient
  const score = activity.score || 0;
  let stokedLabel = "";
  let stokedGradient = "";
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

  // Google Maps link
  const googleMapsUrl = activity.location?.lat && activity.location?.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${activity.location.lat},${activity.location.lng}`
    : activity.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Image Section */}
        {activity.images && activity.images[0] ? (
          <div className="relative h-80 bg-gray-900">
            <img
              src={activity.images[0]}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 shadow-lg transition-all text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* STOKED Badge Overlay */}
            {stokedLabel && (
              <div className={`absolute bottom-6 left-6 right-6 ${stokedGradient} text-white px-6 py-4 rounded-xl text-lg font-bold shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <span>{stokedLabel}</span>
                  <span className="text-2xl">{score}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`relative h-80 bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="text-8xl mb-4">
                {category === 'hiking' ? '🥾' :
                 category === 'events' ? '🎉' :
                 category === 'food_and_dining' ? '🍽️' :
                 category === 'arts_and_culture' ? '🎨' :
                 category === 'sports_and_recreation' ? '⚽' :
                 category === 'nature_and_outdoors' ? '🌲' :
                 category === 'entertainment' ? '🎭' :
                 category === 'shopping' ? '🛍️' :
                 category === 'museums' ? '🏛️' : '📍'}
              </div>
              {stokedLabel && (
                <div className={`${stokedGradient} text-white px-8 py-3 rounded-full text-lg font-bold shadow-xl inline-block`}>
                  {stokedLabel} • {score}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Grid - Tufte Style */}
        <div className="p-8">
          {/* Title & Quick Stats */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-navy-text mb-3 leading-tight">{activity.name}</h1>

            {/* Dense Info Grid - Tufte approved */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase tracking-wide">Distance</span>
                <span className="text-lg font-bold text-navy-text">{activity.distance?.toFixed(1)} mi</span>
              </div>
              {activity.rating && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Rating</span>
                  <span className="text-lg font-bold text-navy-text flex items-center gap-1">
                    ⭐ {activity.rating.toFixed(1)}
                    {activity.reviewCount && (
                      <span className="text-xs text-gray-500 font-normal">({activity.reviewCount})</span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase tracking-wide">Category</span>
                <span className="text-sm font-bold text-navy-text capitalize">{category.replace(/_/g, ' ')}</span>
              </div>
              {(activity.cost?.free || activity.cost?.priceLevel !== undefined) && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Cost</span>
                  <span className="text-lg font-bold text-green-600">
                    {activity.cost?.free ? 'Free' : activity.cost?.priceLevel ? '$'.repeat(activity.cost.priceLevel) : '—'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b-2 border-gray-100">
            {activity.openNow && (
              <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold">
                🟢 Open Now
              </span>
            )}
            {activity.accessibility?.wheelchairAccessible && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold">
                ♿ Accessible
              </span>
            )}
            {activity.hoursToday && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
                🕐 {activity.hoursToday.open} - {activity.hoursToday.close}
              </span>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">About</h3>
              <p className="text-base text-gray-800 leading-relaxed">{activity.description}</p>
            </div>
          )}

          {/* Location & Directions */}
          {activity.address && (
            <div className={`mb-6 bg-gradient-to-br ${colors.bg} rounded-xl p-5 border-2 ${colors.border}`}>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">📍 Location</h3>
              <p className="text-base text-gray-900 font-medium mb-1">{activity.address}</p>
              {activity.city && activity.state && (
                <p className="text-sm text-gray-600 mb-4">{activity.city}, {activity.state}</p>
              )}
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Get Directions
                </a>
              )}
            </div>
          )}

          {/* Categories & Tags */}
          {activity.categories && activity.categories.length > 1 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {activity.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className={`bg-gradient-to-r ${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-medium border ${colors.border}`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-100">
            {activity.website && (
              <a
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-ocean-bright text-white px-6 py-3 rounded-xl hover:bg-ocean-mid transition-colors font-bold text-center shadow-md"
              >
                🌐 Visit Website
              </a>
            )}
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-bold text-center shadow-md"
              >
                🗺️ Directions
              </a>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors font-medium"
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
