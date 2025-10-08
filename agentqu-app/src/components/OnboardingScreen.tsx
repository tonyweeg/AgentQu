import React, { useState } from 'react';
import { AFFINITY_CATEGORIES, AffinityCategory } from '../lib/affinityCategories';

interface OnboardingScreenProps {
  userName: string;
  onComplete: (selectedAffinities: Record<string, number>) => void;
  onSignOut?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ userName, onComplete, onSignOut }) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleContinue = () => {
    // Convert selections to affinity scores
    const affinities: Record<string, number> = {};
    AFFINITY_CATEGORIES.forEach((category) => {
      // Selected = 0.9, Not selected = 0.3 (slight preference for variety)
      affinities[category.id] = selectedCategories.has(category.id) ? 0.9 : 0.3;
    });
    onComplete(affinities);
  };

  const firstName = userName.split(' ')[0];

  return (
    <div className="min-h-screen bg-transparent p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-navy-text mb-3">
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            What activities interest you?
          </p>
          <p className="text-gray-600">
            Select all that apply - we'll personalize your discoveries
          </p>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="mt-4 text-sm text-gray-500 hover:text-ocean-bright underline transition-colors"
            >
              Not {firstName}? Sign in as a different user
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-ocean-bright">
              {selectedCategories.size} selected
            </span>
            <span>•</span>
            <span>Pick at least 3 to continue</span>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {AFFINITY_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.has(category.id);
            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`
                  p-6 rounded-2xl border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'bg-ocean-bright/10 border-ocean-bright shadow-md scale-105'
                      : 'bg-white border-gray-200 hover:border-ocean-bright/50 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{category.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-navy-text mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-ocean-bright rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            {selectedCategories.size < 3 ? (
              <span>Select at least {3 - selectedCategories.size} more</span>
            ) : (
              <span className="text-green-600 font-medium">✓ Ready to continue</span>
            )}
          </div>
          <button
            onClick={handleContinue}
            disabled={selectedCategories.size < 3}
            className="bg-ocean-bright hover:bg-ocean-bright/90 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
