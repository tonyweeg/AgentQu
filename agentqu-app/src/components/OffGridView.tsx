import React, { useState } from 'react';
import { Activity } from '../lib/types';
import ActivityCard from './ActivityCard';

interface OffGridViewProps {
  activities: Activity[];
  onLocationSearch?: (city: string) => void;
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

const OffGridView: React.FC<OffGridViewProps> = ({ activities, onLocationSearch }) => {
  const [citySearch, setCitySearch] = useState('');

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
            <h2 className="text-3xl font-bold text-navy-text flex items-center gap-3">
              <span className="text-4xl">🏕️</span>
              <span>Off Grid</span>
            </h2>
            <p className="text-gray-600 mt-2">
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
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-navy-text">{offGridActivities.length}</div>
            <div className="text-xs text-gray-600">Activities</div>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-navy-text">{Object.keys(groupedActivities).length}</div>
            <div className="text-xs text-gray-600">Categories</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {offGridActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏞️</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Off-Grid Activities Found</h3>
            <p className="text-gray-600">
              Try adjusting your location or search radius to find outdoor adventures nearby.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Category: Hiking & Trails */}
            {(() => {
              const hikingActivities = offGridActivities.filter(a =>
                a.primaryCategory?.toLowerCase().includes('hiking') ||
                a.primaryCategory?.toLowerCase().includes('trail')
              );
              if (hikingActivities.length === 0) return null;

              return (
                <div>
                  <h3 className="text-2xl font-bold text-navy-text mb-4 flex items-center gap-2">
                    <span>🥾</span>
                    <span>Hiking & Trails</span>
                    <span className="text-sm bg-gray-100 text-navy-text px-2 py-1 rounded-full">
                      {hikingActivities.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hikingActivities.map(activity => (
                      <ActivityCard key={activity.id || activity.activityId} activity={activity} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Category: Parks & Nature */}
            {(() => {
              const parksActivities = offGridActivities.filter(a =>
                a.primaryCategory?.toLowerCase().includes('nature') ||
                a.primaryCategory?.toLowerCase().includes('park') ||
                a.name?.toLowerCase().includes('state park') ||
                a.name?.toLowerCase().includes('national park')
              );
              if (parksActivities.length === 0) return null;

              return (
                <div>
                  <h3 className="text-2xl font-bold text-navy-text mb-4 flex items-center gap-2">
                    <span>🌲</span>
                    <span>Parks & Nature</span>
                    <span className="text-sm bg-gray-100 text-navy-text px-2 py-1 rounded-full">
                      {parksActivities.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parksActivities.map(activity => (
                      <ActivityCard key={activity.id || activity.activityId} activity={activity} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Category: Sports & Recreation */}
            {(() => {
              const sportsActivities = offGridActivities.filter(a =>
                a.primaryCategory?.toLowerCase().includes('sports') ||
                a.primaryCategory?.toLowerCase().includes('biking') ||
                a.primaryCategory?.toLowerCase().includes('recreation')
              );
              if (sportsActivities.length === 0) return null;

              return (
                <div>
                  <h3 className="text-2xl font-bold text-navy-text mb-4 flex items-center gap-2">
                    <span>⚽</span>
                    <span>Sports & Recreation</span>
                    <span className="text-sm bg-gray-100 text-navy-text px-2 py-1 rounded-full">
                      {sportsActivities.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sportsActivities.map(activity => (
                      <ActivityCard key={activity.id || activity.activityId} activity={activity} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Other Off-Grid Activities */}
            {(() => {
              const otherActivities = offGridActivities.filter(a =>
                !a.primaryCategory?.toLowerCase().includes('hiking') &&
                !a.primaryCategory?.toLowerCase().includes('trail') &&
                !a.primaryCategory?.toLowerCase().includes('nature') &&
                !a.primaryCategory?.toLowerCase().includes('park') &&
                !a.primaryCategory?.toLowerCase().includes('sports') &&
                !a.primaryCategory?.toLowerCase().includes('biking') &&
                !a.primaryCategory?.toLowerCase().includes('recreation')
              );
              if (otherActivities.length === 0) return null;

              return (
                <div>
                  <h3 className="text-2xl font-bold text-navy-text mb-4 flex items-center gap-2">
                    <span>🏞️</span>
                    <span>Other Outdoor Activities</span>
                    <span className="text-sm bg-gray-100 text-navy-text px-2 py-1 rounded-full">
                      {otherActivities.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherActivities.map(activity => (
                      <ActivityCard key={activity.id || activity.activityId} activity={activity} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default OffGridView;
