import React, { useState } from 'react';
import { AFFINITY_CATEGORIES } from '../lib/affinityCategories';

interface ActivityInterestsPanelProps {
  affinities: Record<string, number>;
  onChange: (category: string, value: number) => void;
}

const ActivityInterestsPanel: React.FC<ActivityInterestsPanelProps> = ({ affinities, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default

  const getAffinityLevel = (value: number) => {
    if (value === 0) return 'Not interested';
    if (value <= 3) return 'Casual';
    if (value <= 6) return 'Interested';
    return 'Very interested';
  };

  return (
    <div className="bg-gradient-to-br from-ocean-bright/10 to-teal-50 rounded-2xl p-6 space-y-4">
      {/* Header with toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-bold text-navy-text flex items-center gap-2">
            🎯 Activity Interests
          </h3>
          <p className="text-sm text-gray-600">
            Your core activity categories and interests
          </p>
        </div>
        <button className="text-2xl text-gray-400 hover:text-gray-600">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Collapsible category list */}
      {isExpanded && (
        <div className="space-y-4">
          {AFFINITY_CATEGORIES.map(category => {
            const value = affinities[category.id] || 0;
            return (
              <div key={category.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.emoji}</span>
                    <div>
                      <h4 className="font-medium text-navy-text capitalize">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-ocean-bright">
                    {getAffinityLevel(value)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="9"
                  value={value}
                  onChange={(e) => onChange(category.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-ocean-bright"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not interested</span>
                  <span>Very interested</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityInterestsPanel;
