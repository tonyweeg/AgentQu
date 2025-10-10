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
        {/* Hero Image Section with Gallery */}
        {activity.images && activity.images[0] ? (
          <div className="relative">
            {/* Main Hero Image */}
            <div className="relative h-96 bg-gray-900">
              <img
                src={activity.images[0]}
                alt={activity.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40"></div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 shadow-lg transition-all text-white z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Count Badge */}
              {activity.images.length > 1 && (
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  📷 {activity.images.length} photos
                </div>
              )}

              {/* STOKED Badge Overlay - Larger & More Prominent */}
              {stokedLabel && (
                <div className={`absolute bottom-0 left-0 right-0 ${stokedGradient} text-white px-8 py-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold mb-1">{stokedLabel}</div>
                      <div className="text-white/80 text-sm">Based on your preferences</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">{score}</div>
                      <div className="text-white/80 text-xs">Q Score</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Image Gallery Thumbnails */}
            {activity.images.length > 1 && (
              <div className="flex gap-2 p-3 bg-gray-900 overflow-x-auto">
                {activity.images.slice(1, 5).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${activity.name} ${idx + 2}`}
                    className="h-20 w-28 object-cover rounded-lg flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                ))}
                {activity.images.length > 5 && (
                  <div className="h-20 w-28 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                    +{activity.images.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={`relative h-96 bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="text-9xl mb-6">
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
                <div className={`${stokedGradient} text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-2xl inline-block`}>
                  <div className="mb-1">{stokedLabel}</div>
                  <div className="text-3xl">{score}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Grid - Enhanced Stats */}
        <div className="p-8">
          {/* Title & Enhanced Quick Stats */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-navy-text mb-6 leading-tight">{activity.name}</h1>

            {/* Enhanced Stats Grid with Visual Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Distance Card */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📍</span>
                  <span className="text-gray-600 text-xs uppercase tracking-wide font-semibold">Distance</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">{activity.distance?.toFixed(1)} mi</div>
                <div className="text-xs text-gray-600 mt-1">From your location</div>
              </div>

              {/* Rating Card */}
              {activity.rating && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⭐</span>
                    <span className="text-gray-600 text-xs uppercase tracking-wide font-semibold">Rating</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700 flex items-baseline gap-2">
                    {activity.rating.toFixed(1)}
                    {activity.reviewCount && (
                      <span className="text-sm text-gray-500 font-normal">({activity.reviewCount})</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Google Reviews</div>
                </div>
              )}

              {/* Category Card */}
              <div className={`bg-gradient-to-br ${colors.bg} rounded-xl p-4 border-2 ${colors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {category === 'hiking' ? '🥾' :
                     category === 'events' ? '🎉' :
                     category === 'food_and_dining' ? '🍽️' :
                     category === 'arts_and_culture' ? '🎨' :
                     category === 'sports_and_recreation' ? '⚽' :
                     category === 'nature_and_outdoors' ? '🌲' :
                     category === 'entertainment' ? '🎭' :
                     category === 'shopping' ? '🛍️' :
                     category === 'museums' ? '🏛️' : '📍'}
                  </span>
                  <span className="text-gray-600 text-xs uppercase tracking-wide font-semibold">Category</span>
                </div>
                <div className={`text-base font-bold ${colors.text} capitalize`}>{category.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-600 mt-1">Primary type</div>
              </div>

              {/* Cost Card */}
              {(activity.cost?.free || activity.cost?.priceLevel !== undefined) && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-gray-600 text-xs uppercase tracking-wide font-semibold">Cost</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {activity.cost?.free ? 'Free' : activity.cost?.priceLevel ? '$'.repeat(activity.cost.priceLevel) : '—'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {activity.cost?.free ? 'No charge' : 'Estimated'}
                  </div>
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

          {/* Score Breakdown - Show why this activity scored well */}
          {score > 0 && (
            <div className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Why This Scored {score} Points
              </h3>
              <div className="space-y-3">
                {/* Distance Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <span className="text-gray-700">
                      {activity.distance && activity.distance <= 1 ? 'Very close by' :
                       activity.distance && activity.distance <= 3 ? 'Nearby' :
                       activity.distance && activity.distance <= 5 ? 'Short drive' :
                       'Within reach'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {activity.distance && activity.distance <= 1 ? '+30' :
                     activity.distance && activity.distance <= 3 ? '+20' :
                     activity.distance && activity.distance <= 5 ? '+10' : '+5'} pts
                  </span>
                </div>

                {/* Rating Score */}
                {activity.rating && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <span className="text-gray-700">Highly rated ({activity.rating.toFixed(1)}/5)</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      +{Math.round((activity.rating / 5) * 20)} pts
                    </span>
                  </div>
                )}

                {/* Category Match */}
                {stokedLabel && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">❤️</span>
                      <span className="text-gray-700">Matches your interests</span>
                    </div>
                    <span className="text-sm font-medium text-purple-700 font-bold">
                      Up to +40 pts
                    </span>
                  </div>
                )}

                {/* Free/Open bonuses */}
                {activity.cost?.free && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎁</span>
                      <span className="text-gray-700">Free activity</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">+5 pts</span>
                  </div>
                )}
                {activity.openNow && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🟢</span>
                      <span className="text-gray-700">Open right now</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">+10 pts</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {activity.description && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                About This Place
              </h3>
              <p className="text-base text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
                {activity.description}
              </p>
            </div>
          )}

          {/* Location & Directions */}
          {activity.address && (
            <div className="mb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📍</span>
                Location & Directions
              </h3>
              <div className="space-y-3 mb-4">
                <p className="text-lg text-gray-900 font-semibold">{activity.address}</p>
                {activity.city && activity.state && (
                  <p className="text-base text-gray-700">{activity.city}, {activity.state}</p>
                )}
                {activity.distance && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{activity.distance.toFixed(1)} miles from your location</span>
                  </div>
                )}
              </div>
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-base font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Get Directions in Google Maps
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

          {/* Enhanced Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t-2 border-gray-200">
            {/* Website Button */}
            {activity.website && (
              <a
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-ocean-bright to-ocean-mid hover:from-ocean-mid hover:to-ocean-bright text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Visit Website
              </a>
            )}

            {/* Directions Button */}
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Get Directions
              </a>
            )}

            {/* Close Button - Full Width */}
            <button
              onClick={onClose}
              className="sm:col-span-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all font-semibold text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetails;
