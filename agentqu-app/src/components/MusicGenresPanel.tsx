import React, { useState, useEffect } from 'react';
import { MUSIC_GENRES, getDefaultMusicGenreAffinities } from '../lib/musicGenres';

interface MusicGenresPanelProps {
  initialAffinities?: Record<string, number>;
  onSave: (affinities: Record<string, number>) => Promise<void>;
}

const MusicGenresPanel: React.FC<MusicGenresPanelProps> = ({ initialAffinities, onSave }) => {
  const [genreAffinities, setGenreAffinities] = useState<Record<string, number>>(
    initialAffinities || getDefaultMusicGenreAffinities()
  );
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (initialAffinities) {
      setGenreAffinities(initialAffinities);
    }
  }, [initialAffinities]);

  const handleSliderChange = (genreId: string, value: number) => {
    setGenreAffinities(prev => ({
      ...prev,
      [genreId]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(genreAffinities);
      console.log('✅ Music genre affinities saved');
    } catch (error) {
      console.error('❌ Error saving music genre affinities:', error);
      alert('Failed to save music genres. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getAffinityLabel = (value: number) => {
    if (value < 25) return 'Skip';
    if (value < 50) return 'Maybe';
    if (value < 75) return 'Like';
    return 'Love';
  };

  const getAffinityColor = (value: number) => {
    if (value < 25) return 'text-red-600';
    if (value < 50) return 'text-yellow-600';
    if (value < 75) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 space-y-4">
      {/* Header with toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-bold text-navy-text flex items-center gap-2">
            🎵 Music Genres
          </h3>
          <p className="text-sm text-gray-600">
            Filter Ticketmaster events by your music taste
          </p>
        </div>
        <button className="text-2xl text-gray-400 hover:text-gray-600">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Collapsible genre list */}
      {isExpanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {MUSIC_GENRES.map(genre => {
              const value = genreAffinities[genre.id] || 50;
              return (
                <div key={genre.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{genre.icon}</span>
                      <h4 className="font-medium text-sm text-navy-text">
                        {genre.name}
                      </h4>
                    </div>
                    <span className={`text-xs font-bold ${getAffinityColor(value)}`}>
                      {getAffinityLabel(value)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleSliderChange(genre.id, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium disabled:opacity-50 text-sm"
          >
            {saving ? 'Saving...' : '💾 Save Music Genres'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Events below 20% affinity will be filtered out
          </p>
        </>
      )}
    </div>
  );
};

export default MusicGenresPanel;
