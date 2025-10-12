import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ActivityInterestsPanel from './ActivityInterestsPanel';
import MusicGenresPanel from './MusicGenresPanel';
import RestaurantGenresPanel from './RestaurantGenresPanel';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { profile, updateAffinities, updateMusicGenreAffinities, updateRestaurantGenreAffinities } = useAuth();
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy-text">Settings</h2>
            <p className="text-gray-600 mt-1">Manage your discovery preferences</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Settings Panels */}
        <div className="p-6 space-y-6">
          {/* Activity Interests Panel */}
          <ActivityInterestsPanel
            affinities={affinities}
            onChange={handleSliderChange}
          />

          {/* Restaurant Genres Panel */}
          <RestaurantGenresPanel
            initialAffinities={profile?.restaurantGenreAffinities}
            onSave={updateRestaurantGenreAffinities}
          />

          {/* Music Genres Panel */}
          <MusicGenresPanel
            initialAffinities={profile?.musicGenreAffinities}
            onSave={updateMusicGenreAffinities}
          />

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
              className="flex-1 px-6 py-3 bg-ocean-bright text-white rounded-xl hover:bg-ocean-bright/90 transition-colors font-medium disabled:opacity-50"
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
