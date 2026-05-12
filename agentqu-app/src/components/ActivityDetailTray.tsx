import React, { useState, useEffect } from 'react';
import { Activity } from '../lib/types';
import { useAuth, VisitedPlace } from '../hooks/useAuth';

interface ActivityDetailTrayProps {
  activity: Activity | null;
  isVisible: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentActivityIndex: number;
  totalActivities: number;
  userAffinities?: { [key: string]: number };
}

const ActivityDetailTray: React.FC<ActivityDetailTrayProps> = ({
  activity,
  isVisible,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  currentActivityIndex,
  totalActivities,
  userAffinities = {},
}) => {
  const { profile, markAsVisited } = useAuth();
  const [wikiInfo, setWikiInfo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Wikipedia info when activity changes
  useEffect(() => {
    if (!activity || !isVisible) {
      setWikiInfo(null);
      return;
    }

    const fetchWikiInfo = async () => {
      try {
        // Try activity name first
        const searchQuery = activity.name;
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`;

        const response = await fetch(wikiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.extract && data.type !== 'disambiguation') {
            setWikiInfo(data.extract);
            return;
          }
        }

        // Fallback: if no activity info, use city info
        if (activity.city) {
          const cityUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(activity.city)}`;
          const cityResponse = await fetch(cityUrl);
          if (cityResponse.ok) {
            const cityData = await cityResponse.json();
            if (cityData.extract) {
              setWikiInfo(`About ${activity.city}: ${cityData.extract}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Wikipedia info:', error);
        setWikiInfo(null);
      }
    };

    fetchWikiInfo();
  }, [activity, isVisible]);

  if (!activity) return null;

  const getCategoryEmoji = (category: string = '') => {
    const emojiMap: { [key: string]: string } = {
      'Food & Drink': '🍽️',
      'Arts & Entertainment': '🎭',
      'Shopping': '🛍️',
      'Outdoors & Recreation': '🏞️',
      'Sports & Fitness': '⚽',
      'Health & Wellness': '🧘',
      'Education': '📚',
      'Nightlife': '🌙',
      'Events': '🎉',
      'Services': '🔧',
      'Travel': '✈️',
      'Community': '👥',
    };
    return emojiMap[category] || '📍';
  };

  const getCategoryGradient = (category: string = '') => {
    const gradientMap: { [key: string]: string } = {
      'Food & Drink': 'from-amber-400 to-orange-500',
      'Arts & Entertainment': 'from-purple-400 to-pink-500',
      'Shopping': 'from-blue-400 to-indigo-500',
      'Outdoors & Recreation': 'from-green-400 to-emerald-500',
      'Sports & Fitness': 'from-red-400 to-rose-500',
      'Health & Wellness': 'from-teal-400 to-cyan-500',
      'Education': 'from-yellow-400 to-amber-500',
      'Nightlife': 'from-indigo-400 to-purple-500',
      'Events': 'from-pink-400 to-rose-500',
      'Services': 'from-gray-400 to-slate-500',
      'Travel': 'from-sky-400 to-blue-500',
      'Community': 'from-lime-400 to-green-500',
    };
    return gradientMap[category] || 'from-gray-400 to-gray-500';
  };

  const getAffinityReason = () => {
    const category = activity.categories?.[0] || '';
    const affinity = userAffinities[category] || 0;

    if (affinity >= 80) {
      return `You love ${category.toLowerCase()}! This is a top match for your interests.`;
    } else if (affinity >= 60) {
      return `This ${category.toLowerCase()} spot aligns well with your preferences.`;
    } else if (affinity >= 40) {
      return `A nice ${category.toLowerCase()} option that might interest you.`;
    } else {
      return `Discover something new in ${category.toLowerCase()}.`;
    }
  };

  const getAISuggestions = () => {
    const suggestions = [];
    const category = activity.categories?.[0] || '';

    // Time-based suggestions
    const hour = new Date().getHours();
    if (category === 'Food & Drink') {
      if (hour >= 6 && hour < 10) {
        suggestions.push('Perfect timing for breakfast!');
      } else if (hour >= 11 && hour < 14) {
        suggestions.push('Great lunch spot!');
      } else if (hour >= 17 && hour < 21) {
        suggestions.push('Excellent dinner choice!');
      }
    }

    // Rating-based
    if (activity.rating && activity.rating >= 4.5) {
      suggestions.push('Highly rated by locals');
    }

    // Distance-based
    if (activity.distance && activity.distance < 1) {
      suggestions.push('Very close by - easy walk!');
    }

    // Free event
    if (activity.cost?.free) {
      suggestions.push('Free admission');
    }

    return suggestions;
  };

  const category = activity.categories?.[0] || '';
  const gradient = getCategoryGradient(category);
  const emoji = getCategoryEmoji(category);
  const affinityReason = getAffinityReason();
  const suggestions = getAISuggestions();

  // Check if this place has been visited
  const isVisited = profile?.visitedPlaces?.some(
    p => p.activityId === (activity.id || activity.activityId)
  );

  const handleMarkVisited = async () => {
    if (!activity || !activity.location || isSaving) return;

    setIsSaving(true);
    try {
      const visitedPlace: VisitedPlace = {
        activityId: activity.id || activity.activityId || '',
        name: activity.name,
        city: activity.city,
        state: activity.state,
        category: category,
        visitedAt: Date.now(),
        lat: activity.location.lat,
        lng: activity.location.lng,
        images: activity.images,
        rating: activity.rating,
      };

      await markAsVisited(visitedPlace);
    } catch (error) {
      console.error('Failed to mark as visited:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm border-b border-gray-300 shadow-sm transition-all duration-300 ease-in-out ${
        isVisible ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Tufte-style layout with image */}
        <div className="flex items-start gap-4">
          {/* Left: Thumbnail Image */}
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
            {activity.images && activity.images[0] ? (
              <img
                src={activity.images[0]}
                alt={activity.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.className = `w-24 h-24 flex-shrink-0 rounded-lg border border-gray-200 bg-gradient-to-br ${gradient} flex items-center justify-center`;
                    parent.innerHTML = `<span class="text-3xl">${emoji}</span>`;
                  }
                }}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-3xl">{emoji}</span>
              </div>
            )}
          </div>

          {/* Middle: Details */}
          <div className="flex-1 min-w-0">
            {/* Name + Distance */}
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-bold text-base text-navy-text truncate flex-1">
                {activity.name}
              </h3>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {activity.distance?.toFixed(1)} mi
              </span>
            </div>

            {/* Quick stats row */}
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
              <span className="font-medium capitalize">{category.replace(/_/g, ' ')}</span>
              {activity.rating && <span>⭐ {activity.rating.toFixed(1)}</span>}
              {activity.cost?.free && <span className="text-green-600 font-bold">Free</span>}
              {!activity.cost?.free && activity.cost?.priceLevel && (
                <span className="font-medium">{'$'.repeat(activity.cost.priceLevel)}</span>
              )}
              {activity.openNow && <span className="text-green-600">Open now</span>}
            </div>

            {/* Highlights section */}
            <div className="space-y-1">
              {/* Why you'd like it */}
              <p className="text-xs text-gray-700 line-clamp-1">
                <span className="font-semibold text-ocean-dark">Why: </span>
                {affinityReason}
              </p>

              {/* Wikipedia info or Description */}
              {wikiInfo ? (
                <p className="text-xs text-gray-600 line-clamp-2">
                  <span className="font-semibold text-blue-600">ℹ️ </span>
                  {wikiInfo}
                </p>
              ) : activity.description ? (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {activity.description}
                </p>
              ) : null}

              {/* AI suggestions - compact */}
              {suggestions.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-purple-600 font-semibold">✨</span>
                  <span className="line-clamp-1">{suggestions.join(' • ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Navigation + Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  hasPrev
                    ? 'text-ocean-bright hover:text-ocean-dark'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                ←
              </button>
              <span className="text-xs text-gray-400 font-mono">
                {currentActivityIndex + 1}/{totalActivities}
              </span>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  hasNext
                    ? 'text-ocean-bright hover:text-ocean-dark'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                →
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Been There button */}
              <button
                onClick={handleMarkVisited}
                disabled={isVisited || isSaving}
                className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded transition-colors ${
                  isVisited
                    ? 'text-green-600 cursor-default'
                    : 'text-ocean-bright hover:text-ocean-dark hover:bg-ocean-bright/10'
                }`}
                title={isVisited ? 'Already marked as visited' : 'Mark as visited'}
              >
                {isSaving ? '...' : isVisited ? '✓ Visited' : '+ Been There'}
              </button>
              {activity.location && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activity.location.lat},${activity.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ocean-bright hover:text-ocean-dark font-medium whitespace-nowrap"
                >
                  Directions →
                </a>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailTray;
