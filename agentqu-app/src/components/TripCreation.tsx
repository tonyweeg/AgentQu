import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TripPlan } from '../lib/types';

const TripCreation: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Form state
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const handleContinue = () => {
    if (step === 1 && destination && startDate && endDate) {
      // TODO: Geocode destination and create trip
      console.log('Creating trip:', { destination, startDate, endDate });
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-seafoam to-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold text-navy-text mb-2">
            🌍 There-Then
          </h1>
          <p className="text-gray-600">AI-Powered Trip Planning</p>
        </div>

        {/* Step 1: Where & When */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-ocean-bright">
            <h2 className="text-2xl font-bold text-navy-text mb-6">
              Where & When
            </h2>

            {/* Destination */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🌍 Where do you want to go?
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City, State, or Address"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none text-lg"
              />
            </div>

            {/* Dates */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📅 When?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Collaborators (optional) */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                👥 Who's coming? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <button className="text-ocean-bright font-medium hover:text-ocean-mid transition-colors">
                + Add Collaborators
              </button>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!destination || !startDate || !endDate}
              className="w-full bg-ocean-bright hover:bg-ocean-mid disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg transition-colors shadow-md"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Activity Discovery (Coming Soon) */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">
              🎯 {destination}
            </h2>
            <p className="text-gray-600 mb-4">
              {startDate} to {endDate}
            </p>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Activity Discovery Coming Soon...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripCreation;
