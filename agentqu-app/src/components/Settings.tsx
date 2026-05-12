import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ActivityInterestsPanel from './ActivityInterestsPanel';
import MusicGenresPanel from './MusicGenresPanel';
import RestaurantGenresPanel from './RestaurantGenresPanel';
import { SUPPORTED_LANGUAGES, getLanguage, DEFAULT_LANGUAGE } from '../lib/languages';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { profile, updateAffinities, updateMusicGenreAffinities, updateRestaurantGenreAffinities, updateEVStatus, updateLanguageCode } = useAuth();
  const [affinities, setAffinities] = useState<Record<string, number>>(profile?.affinities || {});
  const [isEV, setIsEV] = useState<boolean>(profile?.isEV || false);
  const [languageCode, setLanguageCode] = useState<string>(profile?.languageCode || DEFAULT_LANGUAGE);
  const [saving, setSaving] = useState(false);
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);

  // Update local state when profile changes (after reload)
  useEffect(() => {
    if (profile?.affinities) {
      console.log('📊 Loading saved affinities:', profile.affinities);
      setAffinities(profile.affinities);
    }
    if (profile?.isEV !== undefined) {
      setIsEV(profile.isEV);
    }
    if (profile?.languageCode) {
      setLanguageCode(profile.languageCode);
    }
  }, [profile?.affinities, profile?.isEV, profile?.languageCode]);

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
      console.log('🔋 Saving EV status:', isEV);
      console.log('🌍 Saving language preference:', languageCode);

      // Save affinities, EV status, and language preference
      await Promise.all([
        updateAffinities(affinities),
        updateEVStatus(isEV),
        updateLanguageCode(languageCode)
      ]);

      console.log('✅ Settings saved successfully');

      // Close modal and trigger page refresh to show new results
      onClose();

      // Force a small delay to ensure Firestore write completes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
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

          {/* Language Preference Panel */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
            {/* Header with toggle */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsLanguageExpanded(!isLanguageExpanded)}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">🌍</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-navy-text mb-1">
                    Language Preference
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose your preferred language for activity categories
                  </p>
                </div>
              </div>
              <button className="text-2xl text-gray-400 hover:text-gray-600">
                {isLanguageExpanded ? '−' : '+'}
              </button>
            </div>

            {/* Collapsible language grid */}
            {isLanguageExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {SUPPORTED_LANGUAGES.map((language) => {
                  const isSelected = languageCode === language.code;
                  return (
                    <button
                      key={language.code}
                      onClick={() => setLanguageCode(language.code)}
                      className={`
                        p-3 rounded-xl border-2 transition-all text-left
                        ${
                          isSelected
                            ? 'bg-ocean-bright/10 border-ocean-bright shadow-md'
                            : 'bg-white border-gray-200 hover:border-ocean-bright/50 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{language.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-navy-text truncate">{language.name}</p>
                          <p className="text-xs text-gray-600 truncate">{language.nativeName}</p>
                        </div>
                        {isSelected && (
                          <svg
                            className="w-5 h-5 text-ocean-bright flex-shrink-0"
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
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* EV Owner Checkbox */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">⚡</span>
                <div>
                  <h3 className="text-lg font-bold text-navy-text flex items-center gap-2">
                    Electric Vehicle Owner
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Unlock eco-friendly visuals 🌞🌳🐦 + supercharger locations
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEV}
                  onChange={(e) => setIsEV(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
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
