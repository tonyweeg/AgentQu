/**
 * Activity List View Component
 *
 * Displays activities in a responsive grid layout
 */

import React from 'react';
import ActivityCard from './ActivityCard';
import { Activity } from '../lib/types';

interface ActivityListViewProps {
  activities: Activity[];
  selectedCategory?: string;
}

const ActivityListView: React.FC<ActivityListViewProps> = ({ activities, selectedCategory }) => {
  // Category emoji mapping for empty state
  const getCategoryEmoji = (cat: string) => {
    const emojiMap: Record<string, string> = {
      hiking: '🥾',
      events: '🎉',
      food_and_dining: '🍽️',
      arts_and_culture: '🎨',
      sports_and_recreation: '⚽',
      nature_and_outdoors: '🌲',
      entertainment: '🎭',
      shopping: '🛍️',
      museums: '🏛️',
      camping: '⛺',
      parks: '🌳',
      other: '📍',
    };
    return emojiMap[cat] || '📍';
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 mb-12">
        <div className="text-4xl mb-3">
          {selectedCategory ? getCategoryEmoji(selectedCategory) : '📍'}
        </div>
        <p className="text-gray-600">
          {selectedCategory
            ? `No ${selectedCategory.replace(/_/g, ' ')} places found`
            : 'No activities found'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-12">
      {activities.map((activity, index) => (
        <ActivityCard
          key={activity.id || activity.activityId}
          activity={activity}
          index={index}
          allActivities={activities}
        />
      ))}
    </div>
  );
};

export default ActivityListView;
