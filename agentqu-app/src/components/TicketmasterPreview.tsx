/**
 * Ticketmaster Preview Component
 *
 * Shows a small preview of upcoming Ticketmaster events (3-5 max)
 * with a "View More" button to open the full Ticketmaster view
 */

import React from 'react';
import { Activity } from '../lib/types';
import ActivityCard from './ActivityCard';

interface TicketmasterPreviewProps {
  activities: Activity[];
  onViewMore: () => void;
}

const TicketmasterPreview: React.FC<TicketmasterPreviewProps> = ({ activities, onViewMore }) => {
  // Filter Ticketmaster events, sort by score (AI/ML personalization), and limit to 5
  // The score already includes affinity matching, distance, rating, and other factors
  const ticketmasterEvents = activities
    .filter((activity) => activity.source === 'ticketmaster' && activity.type === 'event')
    .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by highest score first (personalized!)
    .slice(0, 5);

  if (ticketmasterEvents.length === 0) {
    return null; // Don't show section if no Ticketmaster events
  }

  return (
    <div className="mt-8 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎟️</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Events You Might Like</h2>
            <p className="text-sm text-gray-600">
              Personalized picks based on your interests
            </p>
          </div>
        </div>

        {/* View More Button */}
        <button
          onClick={onViewMore}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold"
        >
          <span>View All Events</span>
          <span>→</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ticketmasterEvents.map((event, index) => (
          <ActivityCard
            key={event.id || event.activityId}
            activity={event}
            index={index}
            allActivities={ticketmasterEvents}
          />
        ))}
      </div>

      {/* Bottom View More (for mobile) */}
      <div className="mt-4 text-center md:hidden">
        <button
          onClick={onViewMore}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold"
        >
          View All {ticketmasterEvents.length}+ Events →
        </button>
      </div>
    </div>
  );
};

export default TicketmasterPreview;
