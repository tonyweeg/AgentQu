/**
 * Loading Screen Component
 *
 * Displays loading state with AgentQu branding
 */

import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-seafoam">
      <div className="text-center">
        {/* AgentQu Logo/Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-ocean-bright rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-4xl">🔍</span>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-navy-text mb-2">AgentQu</h2>
        <p className="text-gray-600">{message}</p>

        {/* Loading Spinner */}
        <div className="mt-6">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-ocean-bright border-r-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
