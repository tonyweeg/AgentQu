import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AFFINITY_CATEGORIES } from '../lib/affinityCategories';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { profile, updateAffinities } = useAuth();
  const [affinities, setAffinities] = useState<Record<string, number>>(profile?.affinities || {});
  const [saving, setSaving] = useState(false);

  // Update local state when profile changes (after reload)
  useEffect(() => {
    if (profile?.affinities) {
      console.log('📊 Loading saved affinities:', profile.affinities);
      setAffinities(profile.affinities);
    }
  }, [profile?.affinities]);

  const handleSliderChange = (category: string, value: number) => {
    setAffinities(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving affinities:', affinities);
      await updateAffinities(affinities);
      console.log('✅ Affinities saved successfully');

      // Close modal and trigger page refresh to show new results
      onClose();

      // Force a small delay to ensure Firestore write completes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Error saving affinities:', error);
      alert('Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  const getAffinityLevel = (value: number) => {
    if (value === 0) return 'Not interested';
    if (value <= 3) return 'Casual';
    if (value <= 6) return 'Interested';
    return 'Very interested';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dark-text">Settings</h2>
            <p className="text-gray-600 mt-1">Manage your discovery preferences</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Affinity Categories */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-dark-text mb-2">Your Interests</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adjust the sliders to tell us what you're interested in. This helps us find better activities for you!
            </p>
          </div>

          <div className="space-y-4">
            {AFFINITY_CATEGORIES.map(category => {
              const value = affinities[category.id] || 0;
              return (
                <div key={category.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.emoji}</span>
                      <div>
                        <h4 className="font-medium text-dark-text capitalize">
                          {category.name}
                        </h4>
                        <p className="text-xs text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-peach">
                      {getAffinityLevel(value)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={value}
                    onChange={(e) => handleSliderChange(category.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-peach"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Not interested</span>
                    <span>Very interested</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-peach text-white rounded-xl hover:bg-peach/90 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
