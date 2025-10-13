import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityCard from './ActivityCard';
import ActivityMap from './ActivityMap';

interface OffGridViewProps {
  activities: Activity[];
  onLocationSearch?: (city: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  viewMode: 'list' | 'map';
}

// Off-grid categories - outdoor and nature activities
const OFF_GRID_CATEGORIES = [
  'hiking',
  'nature_and_outdoors',
  'sports_and_recreation',
  'camping',
  'biking',
  'water_sports',
  'adventure',
  'parks',
  'trails',
  'wildlife'
];

const OffGridView: React.FC<OffGridViewProps> = ({ activities, onLocationSearch, userLocation, viewMode }) => {
  const [citySearch, setCitySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (citySearch.trim() && onLocationSearch) {
      onLocationSearch(citySearch.trim());
    }
  };

  // Filter activities to only show off-grid categories
  const offGridActivities = activities.filter(activity =>
    OFF_GRID_CATEGORIES.some(category =>
      activity.primaryCategory?.toLowerCase().includes(category.toLowerCase()) ||
      activity.categories?.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
    )
  );

  // Group by category
  const groupedActivities = offGridActivities.reduce((acc, activity) => {
    const category = activity.primaryCategory || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-navy-text dark:text-white flex items-center gap-3">
              <span className="text-4xl">🏕️</span>
              <span>Off Grid</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Discover hiking, biking, parks, and nature activities
            </p>
          </div>
        </div>

        {/* City Search */}
        <form onSubmit={handleCitySearch} className="mb-6">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search by city or town (e.g., Salisbury, MD)"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dark-text focus:border-dark-text"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button
              type="submit"
              className="bg-ocean-deep text-white hover:bg-ocean-mid px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-navy-text dark:text-white">{offGridActivities.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Activities</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-navy-text dark:text-white">{Object.keys(groupedActivities).length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Categories</div>
          </div>
        </div>
      </div>

      {/* Content - Map View or List View */}
      <div>
        {offGridActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏞️</div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No Off-Grid Activities Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your location or search radius to find outdoor adventures nearby.
            </p>
          </div>
        ) : viewMode === 'map' && userLocation ? (
          <div className="space-y-4">
            {/* Map */}
            <ActivityMap
              activities={offGridActivities}
              userLocation={userLocation}
            />

            {/* Compact Activity List below map */}
            <div className="space-y-2">
              {offGridActivities
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, 20)
                .map((activity) => {
                  const category = activity.primaryCategory || 'other';
                  const getCategoryGradient = (cat: string) => {
                    switch (cat) {
                      case 'hiking': return 'from-green-50 to-emerald-50 border-green-200';
                      case 'nature_and_outdoors': return 'from-teal-50 to-green-50 border-teal-200';
                      case 'sports_and_recreation': return 'from-blue-50 to-cyan-50 border-blue-200';
                      case 'camping': return 'from-orange-50 to-amber-50 border-orange-200';
                      case 'parks': return 'from-lime-50 to-green-50 border-lime-200';
                      default: return 'from-gray-50 to-slate-50 border-gray-200';
                    }
                  };

                  const getCategoryEmoji = (cat: string) => {
                    const emojiMap: Record<string, string> = {
                      hiking: '🥾', nature_and_outdoors: '🌲', sports_and_recreation: '⚽',
                      camping: '⛺', parks: '🌳', trails: '🥾', biking: '🚴',
                      water_sports: '🏄', adventure: '🧗', wildlife: '🦌', other: '🏞️'
                    };
                    return emojiMap[cat] || '🏞️';
                  };

                  const score = activity.score || 0;
                  let stokedText = "";
                  let stokedColor = "";
                  if (score >= 280) {
                    stokedText = "You'll love it";
                    stokedColor = "bg-gradient-to-r from-[#FF6B9D] via-[#FEC163] to-[#EE4E4E]";
                  } else if (score >= 220) {
                    stokedText = "You'll like it";
                    stokedColor = "bg-gradient-to-r from-[#FEC163] via-[#FF6B9D] to-[#F97171]";
                  } else if (score >= 180) {
                    stokedText = "You should like it";
                    stokedColor = "bg-gradient-to-r from-[#4FACFE] via-[#00F2FE] to-[#43E97B]";
                  } else if (score >= 140) {
                    stokedText = "Give it a shot!";
                    stokedColor = "bg-gradient-to-r from-[#667EEA] via-[#764BA2] to-[#F093FB]";
                  }

                  return (
                    <div
                      key={activity.id || activity.activityId}
                      className={`bg-gradient-to-r ${getCategoryGradient(category)} border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">
                          {getCategoryEmoji(category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h4 className="font-bold text-base text-navy-text dark:text-white line-clamp-2 flex-1 leading-snug">
                              {activity.name}
                            </h4>
                            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium">
                              {activity.distance?.toFixed(1)} mi
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 mb-2 flex-wrap">
                            <span className="capitalize text-gray-600 dark:text-gray-400 font-medium">
                              {category.replace(/_/g, ' ')}
                            </span>
                            {activity.rating && (
                              <span className="flex items-center gap-1 font-medium">
                                ⭐ {activity.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {stokedText && (
                            <div className={`${stokedColor} text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide inline-block shadow-sm`}>
                              {stokedText}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {offGridActivities.length > 20 && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                Showing top 20 of {offGridActivities.length} activities • Switch to List view for full details
              </p>
            )}
          </div>
        ) : (
          <>
            {(() => {
              // Helper function to check if text contains date/time information
              const hasDateInfo = (text: string): boolean => {
                if (!text) return false;
                const lower = text.toLowerCase();

                // Date patterns
                const datePatterns = [
                  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i, // "Oct 12", "October 12"
                  /\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?/,  // "10/12", "10-12-2025"
                  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, // Day names
                  /\b(today|tomorrow|tonight|this\s+(week|weekend|month))/i, // Relative dates
                  /\b\d{1,2}(st|nd|rd|th)\s+(of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // "12th of October"
                ];

                // Time patterns
                const timePatterns = [
                  /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?/,  // "7:30pm", "19:30"
                  /\b(at|from|starting|begins)\s+\d{1,2}/i, // "at 7", "from 6"
                ];

                return datePatterns.some(pattern => pattern.test(text)) ||
                       timePatterns.some(pattern => pattern.test(text));
              };

              // Separate places from events
              const places = offGridActivities.filter(a => a.type === 'permanent');

              // Filter events to only those with date/time information
              const events = offGridActivities.filter(a => {
                if (a.type !== 'event') return false;

                // Check name, description, and snippet for date/time info
                const textToCheck = [
                  a.name,
                  a.description,
                  (a as any).details?.description,
                  (a as any).details?.shortDescription
                ].filter(Boolean).join(' ');

                return hasDateInfo(textToCheck);
              });

              // Get unique categories from places only
              const allCategories = Array.from(new Set(places.map(a => a.primaryCategory || 'other')));

              // Filter places by selected category
              const filteredPlaces = selectedCategory === 'all'
                ? places
                : places.filter(a => (a.primaryCategory || 'other') === selectedCategory);

              // Sort places by Q Score
              const sortedPlaces = [...filteredPlaces].sort((a, b) => (b.score || 0) - (a.score || 0));

              // Sort events by Q Score
              const sortedEvents = [...events].sort((a, b) => (b.score || 0) - (a.score || 0));

              // Category emoji mapping
              const getCategoryEmoji = (cat: string) => {
                const emojiMap: Record<string, string> = {
                  hiking: '🥾', nature_and_outdoors: '🌲', sports_and_recreation: '⚽',
                  camping: '⛺', parks: '🌳', trails: '🥾', biking: '🚴',
                  water_sports: '🏄', adventure: '🧗', wildlife: '🦌', other: '🏞️'
                };
                return emojiMap[cat] || '🏞️';
              };

              // Count places per category
              const categoryCounts = allCategories.reduce((acc, cat) => {
                acc[cat] = places.filter(a => (a.primaryCategory || 'other') === cat).length;
                return acc;
              }, {} as Record<string, number>);

              return (
                <>
                  {/* Category Filter Chips - For Places Only */}
                  {places.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === 'all'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-green-600 dark:hover:border-green-500'
                        }`}
                      >
                        All Places ({places.length})
                      </button>
                      {allCategories
                        .sort((a, b) => categoryCounts[b] - categoryCounts[a])
                        .map(category => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                              selectedCategory === category
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-green-600 dark:hover:border-green-500'
                            }`}
                          >
                            <span>{getCategoryEmoji(category)}</span>
                            <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                            <span className="text-xs opacity-75">({categoryCounts[category]})</span>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Places Grid - Cards */}
                  {sortedPlaces.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                      {sortedPlaces.map((activity, index) => (
                        <ActivityCard
                          key={activity.id || activity.activityId}
                          activity={activity}
                          index={index}
                          allActivities={sortedPlaces}
                        />
                      ))}
                    </div>
                  )}

                  {sortedPlaces.length === 0 && places.length > 0 && (
                    <div className="text-center py-12 mb-12">
                      <div className="text-4xl mb-3">{getCategoryEmoji(selectedCategory)}</div>
                      <p className="text-gray-600 dark:text-gray-400">No {selectedCategory.replace(/_/g, ' ')} places found</p>
                    </div>
                  )}

                  {/* Events Section - Card Grid */}
                  {sortedEvents.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-2xl font-bold text-navy-text dark:text-white">🎉 Upcoming Events</h3>
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-bold">
                          {sortedEvents.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {sortedEvents.map((event, index) => (
                          <ActivityCard
                            key={event.id || event.activityId}
                            activity={event}
                            index={index}
                            allActivities={sortedEvents}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default OffGridView;
