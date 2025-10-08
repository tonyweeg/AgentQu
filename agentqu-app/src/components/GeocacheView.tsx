import React from 'react';
import { Activity } from '../lib/types';
import ActivityCard from './ActivityCard';

interface GeocacheViewProps {
  geocaches: Activity[];
  onClose: () => void;
}

const GeocacheView: React.FC<GeocacheViewProps> = ({ geocaches, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl shadow-sm p-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-dark-text mb-1">
              📍 Geocaches Nearby
            </h2>
            <p className="text-gray-600">
              {geocaches.length} {geocaches.length === 1 ? 'geocache' : 'geocaches'} found
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {geocaches.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-dark-text mb-2">No Geocaches Found</h3>
              <p className="text-gray-600">Try expanding your search radius to find geocaches nearby</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {geocaches.map((geocache) => (
                <ActivityCard key={geocache.id || geocache.activityId} activity={geocache} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeocacheView;
