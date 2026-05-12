import React, { useState } from 'react';
import { CirqleMember } from '../lib/types';
import { AFFINITY_CATEGORIES } from '../lib/affinityCategories';

interface MemberAffinitiesProps {
  member: CirqleMember;
  onClose: () => void;
  onSave: (memberId: string, affinities: Record<string, number>) => Promise<void>;
}

const MemberAffinities: React.FC<MemberAffinitiesProps> = ({ member, onClose, onSave }) => {
  const [affinities, setAffinities] = useState<Record<string, number>>(
    member.affinities || {}
  );
  const [saving, setSaving] = useState(false);

  const handleAffinityChange = (categoryId: string, value: number) => {
    console.log(`🎯 AFFINITY_MODAL: ${member.nickname} - ${categoryId}: ${value}`);
    setAffinities((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(member.memberId, affinities);
      console.log(`✅ AFFINITY_MODAL: Saved preferences for ${member.nickname}`, affinities);
      onClose();
    } catch (error) {
      console.error('❌ AFFINITY_MODAL: Error saving affinities:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-navy-text">
              {member.nickname}'s Preferences
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Set {member.nickname}'s activity preferences to personalize trip recommendations
          </p>
          {member.age && (
            <div className="mt-2 inline-block bg-ocean-bright/10 text-ocean-bright px-3 py-1 rounded-full text-xs font-bold">
              Age {member.age}
            </div>
          )}
        </div>

        {/* Affinity Sliders */}
        <div className="p-6 space-y-6">
          {AFFINITY_CATEGORIES.map((category) => {
            const value = affinities[category.id] ?? 5; // Default to 5 (neutral) - using ?? to catch 0
            return (
              <div key={category.id}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-700">
                    {category.emoji} {category.name}
                  </label>
                  <span className="text-sm font-bold text-ocean-bright">{value}/9</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="9"
                  step="1"
                  value={value}
                  onChange={(e) => handleAffinityChange(category.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not interested</span>
                  <span>Love it!</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-ocean-bright hover:bg-ocean-mid disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>Save Preferences</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberAffinities;
