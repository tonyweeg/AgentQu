/**
 * Location Error Screen Component
 *
 * Displays user-friendly error messages when location access fails
 * with specific guidance for each error type.
 */

import React from 'react';

interface LocationErrorScreenProps {
  error: GeolocationPositionError;
  onRetry: () => void;
}

const LocationErrorScreen: React.FC<LocationErrorScreenProps> = ({ error, onRetry }) => {
  const errorMessages = {
    1: {
      title: 'Location Permission Denied',
      message: 'Please enable location access in your device settings to use AgentQu.',
      tip: 'On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → Choose "While Using the App" and enable "Use Precise Location"'
    },
    2: {
      title: 'Location Unavailable',
      message: 'Unable to determine your location. Please check your device settings.',
      tip: 'Make sure Location Services are enabled: Settings → Privacy & Security → Location Services (turn ON)'
    },
    3: {
      title: 'Location Request Timeout',
      message: 'The location request took too long. Please try again.',
      tip: 'This can happen on slower connections or if GPS signal is weak. We\'ll retry automatically.'
    }
  };

  const errorInfo = errorMessages[error.code as keyof typeof errorMessages] || {
    title: 'Location Error',
    message: 'Unable to get your location. Please try again.',
    tip: 'Make sure Location Services are enabled in your device settings.'
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-seafoam p-4">
      <div className="text-center max-w-lg bg-white rounded-2xl shadow-xl p-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-navy-text mb-3">{errorInfo.title}</h2>
        <p className="text-gray-700 mb-4">{errorInfo.message}</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-900 leading-relaxed">
            <span className="font-bold">💡 How to fix:</span>
          </p>
          <p className="text-sm text-blue-800 mt-2 leading-relaxed">
            {errorInfo.tip}
          </p>
        </div>

        <button
          onClick={onRetry}
          className="bg-ocean-bright text-white px-8 py-3 rounded-xl hover:bg-ocean-mid transition-colors font-medium shadow-lg w-full"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default LocationErrorScreen;
