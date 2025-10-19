/**
 * Category Filter Component
 *
 * Horizontal scrollable category chips for filtering activities
 */

import React, { useRef, useState, useEffect } from 'react';
import { Activity } from '../lib/types';

interface CategoryFilterProps {
  places: Activity[];
  selectedCategory: string;
  activeTextSearch: string;
  showFastFood: boolean;
  onCategoryChange: (category: string) => void;
  onClearSearch: () => void;
  onToggleFastFood: () => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  places,
  selectedCategory,
  activeTextSearch,
  showFastFood,
  onCategoryChange,
  onClearSearch,
  onToggleFastFood,
}) => {
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Category emoji mapping
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

  // Get unique categories
  const allCategories = Array.from(new Set(places.map((a) => a.primaryCategory || 'other')));

  // Count places per category
  const categoryCounts = allCategories.reduce((acc, cat) => {
    acc[cat] = places.filter((a) => (a.primaryCategory || 'other') === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Check scroll position
  const checkScrollPosition = () => {
    const container = categoriesScrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const canLeft = scrollLeft > 5;
    const canRight = scrollLeft < scrollWidth - clientWidth - 5;

    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  };

  // Attach scroll listener
  useEffect(() => {
    const container = categoriesScrollRef.current;
    if (!container) return;

    checkScrollPosition();

    const safariDelayCheck = setTimeout(() => {
      checkScrollPosition();
    }, 100);

    let scrollTimer: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (scrollTimer) clearInterval(scrollTimer);
      scrollTimer = setInterval(checkScrollPosition, 50);

      setTimeout(() => {
        if (scrollTimer) {
          clearInterval(scrollTimer);
          scrollTimer = null;
          checkScrollPosition();
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      clearTimeout(safariDelayCheck);
      if (scrollTimer) clearInterval(scrollTimer);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  if (places.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 relative">
      {/* Horizontal scrolling container */}
      <div
        ref={categoriesScrollRef}
        className="overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex gap-2 items-center">
          {/* Active Text Search Indicator */}
          {activeTextSearch && (
            <div className="flex items-center gap-2 bg-sky-100 border-2 border-sky-300 px-4 py-2 rounded-full whitespace-nowrap">
              <span className="text-sm font-bold text-gray-800">🔍 Searching:</span>
              <span className="text-sm font-bold text-gray-800">"{activeTextSearch}"</span>
              <button
                onClick={onClearSearch}
                className="ml-1 bg-white hover:bg-sky-200 text-gray-800 font-bold px-2 py-0.5 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* All Places Button */}
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-ocean-bright text-white shadow-md'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-ocean-bright'
            }`}
          >
            All Places ({places.length})
          </button>

          {/* Category Chips */}
          {allCategories
            .sort((a, b) => {
              const nameA = a.replace(/_/g, ' ');
              const nameB = b.replace(/_/g, ' ');
              return nameA.localeCompare(nameB);
            })
            .map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-ocean-bright text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-ocean-bright'
                }`}
              >
                <span>{getCategoryEmoji(category)}</span>
                <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                <span className="text-xs opacity-75">({categoryCounts[category]})</span>
              </button>
            ))}

          {/* Fast Food Toggle - Only show when viewing food/dining category */}
          {selectedCategory === 'food_and_dining' && (
            <button
              onClick={onToggleFastFood}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${
                showFastFood
                  ? 'bg-red-500 text-white border-red-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-red-400 hover:text-red-500'
              }`}
              title={showFastFood ? 'Hide chains & fast food' : 'Show chains & fast food'}
            >
              <span>🍔 Give me all the calories!</span>
            </button>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      {(canScrollRight || canScrollLeft) && (
        <div className="absolute -right-4 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end pr-4 z-10">
          <span className="text-ocean-bright text-base animate-pulse font-bold">
            {canScrollLeft ? '←' : '→'}
          </span>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
