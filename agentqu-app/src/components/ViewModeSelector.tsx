/**
 * View Mode Selector Component
 *
 * Toggles between List, Map, and Off-Grid views with optional EV Charging button
 * Memoized to prevent unnecessary re-renders
 */

import React, { memo } from 'react';

interface ViewModeSelectorProps {
  viewMode: 'list' | 'map' | 'offgrid' | 'trip-creation' | 'trips' | 'trip-detail' | 'cirqle' | 'been-there';
  offgridViewMode: 'list' | 'map';
  showEVPanel: boolean;
  isEVOwner: boolean;
  chargingStationsCount: number;
  onViewModeChange: (mode: 'list' | 'map' | 'offgrid') => void;
  onOffgridViewModeChange: (mode: 'list' | 'map') => void;
  onEVPanelToggle: () => void;
}

const ViewModeSelector: React.FC<ViewModeSelectorProps> = memo(({
  viewMode,
  offgridViewMode,
  showEVPanel,
  isEVOwner,
  chargingStationsCount,
  onViewModeChange,
  onOffgridViewModeChange,
  onEVPanelToggle,
}) => {
  // Only show for list/map/offgrid modes
  if (viewMode !== 'list' && viewMode !== 'map' && viewMode !== 'offgrid') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* List/Map Toggle */}
      <div className="flex bg-white/80 backdrop-blur-sm rounded-full p-1 border border-gray-200 shadow-sm">
        <button
          onClick={() => {
            if (viewMode === 'offgrid') {
              onOffgridViewModeChange('list');
            } else {
              onViewModeChange('list');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            (viewMode === 'list') || (viewMode === 'offgrid' && offgridViewMode === 'list')
              ? 'bg-ocean-bright text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-base">📋</span>
          <span>List</span>
        </button>
        <button
          onClick={() => {
            if (viewMode === 'offgrid') {
              onOffgridViewModeChange('map');
            } else {
              onViewModeChange('map');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            (viewMode === 'map') || (viewMode === 'offgrid' && offgridViewMode === 'map')
              ? 'bg-ocean-bright text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-base">🗺️</span>
          <span>Map</span>
        </button>
      </div>

      {/* Off-Grid Button */}
      <button
        onClick={() => onViewModeChange('offgrid')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border backdrop-blur-sm whitespace-nowrap ${
          viewMode === 'offgrid'
            ? 'bg-green-600 text-white shadow-md border-green-700'
            : 'bg-white/80 text-gray-700 hover:bg-green-50 border-gray-200'
        }`}
      >
        <span className="text-base">🏕️</span>
        <span>Off-Grid</span>
      </button>

      {/* EV Charging Button - Only show for EV owners with stations */}
      {isEVOwner && chargingStationsCount > 0 && (
        <button
          onClick={onEVPanelToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border backdrop-blur-sm whitespace-nowrap ${
            showEVPanel
              ? 'bg-green-600 text-white shadow-md border-green-700'
              : 'bg-white/80 text-gray-700 hover:bg-green-50 border-gray-200'
          }`}
        >
          <span className="text-base">⚡</span>
          <span>Charging</span>
          <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded-full">
            {chargingStationsCount}
          </span>
        </button>
      )}
    </div>
  );
});

ViewModeSelector.displayName = 'ViewModeSelector';

export default ViewModeSelector;
