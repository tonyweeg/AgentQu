import React, { useState } from 'react';
import { useAuth, VisitedPlace } from '../hooks/useAuth';

interface BeenThereViewProps {
  onBackToResults?: () => void;
}

const BeenThereView: React.FC<BeenThereViewProps> = ({ onBackToResults }) => {
  const { profile, removeVisitedPlace } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [removing, setRemoving] = useState<string | null>(null);

  // Get visited places sorted by most recent first
  const visitedPlaces = (profile?.visitedPlaces || []).sort(
    (a, b) => b.visitedAt - a.visitedAt
  );

  const handleRemove = async (activityId: string) => {
    if (removing) return;

    setRemoving(activityId);
    try {
      await removeVisitedPlace(activityId);
    } catch (error) {
      console.error('Failed to remove:', error);
    } finally {
      setRemoving(null);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'hiking': '🥾',
      'events': '🎉',
      'food_and_dining': '🍽️',
      'arts_and_culture': '🎨',
      'sports_and_recreation': '⚽',
      'nature_and_outdoors': '🌲',
      'entertainment': '🎭',
      'shopping': '🛍️',
      'museums': '🏛️',
      'camping': '⛺',
      'parks': '🌳',
    };
    return emojiMap[category] || '📍';
  };

  const getCategoryGradient = (category: string) => {
    const gradientMap: { [key: string]: string } = {
      'food_and_dining': 'from-amber-400 to-orange-500',
      'arts_and_culture': 'from-purple-400 to-pink-500',
      'shopping': 'from-blue-400 to-indigo-500',
      'nature_and_outdoors': 'from-green-400 to-emerald-500',
      'sports_and_recreation': 'from-red-400 to-rose-500',
      'entertainment': 'from-indigo-400 to-purple-500',
      'events': 'from-pink-400 to-rose-500',
      'hiking': 'from-green-500 to-teal-500',
      'museums': 'from-yellow-400 to-amber-500',
      'camping': 'from-green-600 to-lime-600',
      'parks': 'from-lime-400 to-green-500',
    };
    return gradientMap[category] || 'from-gray-400 to-gray-500';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (visitedPlaces.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-navy-text mb-3">No places visited yet</h2>
          <p className="text-gray-600">Start exploring and mark places you've been to!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      {onBackToResults && (
        <button
          onClick={onBackToResults}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors shadow-sm"
        >
          <span>←</span>
          <span>Back to Results</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy-text mb-2">Places I've Been 📍</h1>
          <p className="text-gray-600">
            {visitedPlaces.length} place{visitedPlaces.length !== 1 ? 's' : ''} you've visited
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-white rounded-full p-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-ocean-bright text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-base">⊞</span>
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-ocean-bright text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-base">☰</span>
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visitedPlaces.map((place) => {
            const gradient = getCategoryGradient(place.category);
            const emoji = getCategoryEmoji(place.category);

            return (
              <div
                key={place.activityId}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-200"
              >
                {/* Image or Gradient */}
                <div className="h-40 relative">
                  {place.images && place.images[0] ? (
                    <img
                      src={place.images[0]}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <span className="text-5xl">{emoji}</span>
                    </div>
                  )}

                  {/* Visited Badge */}
                  <div className="absolute top-2 right-2 bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                    ✓ Visited
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-sm text-navy-text mb-1 line-clamp-2">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span className="capitalize">{place.category.replace(/_/g, ' ')}</span>
                    {place.rating && <span>⭐ {place.rating.toFixed(1)}</span>}
                  </div>
                  {place.city && place.state && (
                    <p className="text-xs text-gray-500 mb-2">
                      📍 {place.city}, {place.state}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mb-3">
                    {formatDate(place.visitedAt)}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-3 py-1.5 bg-ocean-bright/10 hover:bg-ocean-bright/20 text-ocean-bright rounded-md text-xs font-medium transition-colors"
                    >
                      Directions
                    </a>
                    <button
                      onClick={() => handleRemove(place.activityId)}
                      disabled={removing === place.activityId}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {removing === place.activityId ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {visitedPlaces.map((place) => {
            const emoji = getCategoryEmoji(place.category);

            return (
              <div
                key={place.activityId}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-ocean-bright transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Emoji or Image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                    {place.images && place.images[0] ? (
                      <img
                        src={place.images[0]}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(place.category)} flex items-center justify-center`}>
                        <span className="text-2xl">{emoji}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-navy-text mb-1">
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="capitalize">{place.category.replace(/_/g, ' ')}</span>
                      {place.rating && <span>⭐ {place.rating.toFixed(1)}</span>}
                      {place.city && place.state && (
                        <span>📍 {place.city}, {place.state}</span>
                      )}
                      <span className="text-gray-400">• {formatDate(place.visitedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-ocean-bright/10 hover:bg-ocean-bright/20 text-ocean-bright rounded-md text-xs font-medium transition-colors"
                    >
                      Directions
                    </a>
                    <button
                      onClick={() => handleRemove(place.activityId)}
                      disabled={removing === place.activityId}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {removing === place.activityId ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BeenThereView;
