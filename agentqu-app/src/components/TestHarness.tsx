import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../hooks/useAuth';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  data?: any;
  error?: string;
  duration?: number;
}

const TestHarness: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [testParams, setTestParams] = useState<string>('{}');
  const [loading, setLoading] = useState(false);

  // All Cloud Function endpoints
  const endpoints = [
    {
      name: 'discoverActivities',
      description: 'Discover activities near a location',
      defaultParams: {
        lat: 38.3365,
        lng: -75.0849,
        radius: 10,
        userId: user?.uid || '',
        enablePlaces: true,
        enableCustomSearch: true
      }
    },
    {
      name: 'submitReview',
      description: 'Submit a review for an activity',
      defaultParams: {
        activityId: 'test_activity_id',
        userId: user?.uid || '',
        rating: 5,
        title: 'Great place!',
        content: 'This is a test review from the test harness.'
      }
    },
    {
      name: 'voteActivity',
      description: 'Vote on an activity',
      defaultParams: {
        activityId: 'test_activity_id',
        userId: user?.uid || '',
        vote: 'upvote'
      }
    },
    {
      name: 'checkInActivity',
      description: 'Check in to an activity',
      defaultParams: {
        activityId: 'test_activity_id',
        userId: user?.uid || '',
        location: { lat: 38.3365, lng: -75.0849 }
      }
    },
    {
      name: 'qupActivity',
      description: 'Mark activity as Qupped',
      defaultParams: {
        activityId: 'test_activity_id',
        userId: user?.uid || ''
      }
    },
    {
      name: 'suggestActivity',
      description: 'Suggest a new activity',
      defaultParams: {
        name: 'Test Activity',
        location: { lat: 38.3365, lng: -75.0849, address: 'Ocean City, MD' },
        category: 'food_and_dining',
        description: 'Test activity from harness',
        userId: user?.uid || ''
      }
    },
    {
      name: 'shareActivity',
      description: 'Share an activity',
      defaultParams: {
        activityId: 'test_activity_id',
        userId: user?.uid || '',
        shareMethod: 'link'
      }
    },
    {
      name: 'getUserHistory',
      description: 'Get user activity history',
      defaultParams: {
        userId: user?.uid || ''
      }
    },
    {
      name: 'getNearbyTowns',
      description: 'Get nearby towns for a location',
      defaultParams: {
        lat: 38.3365,
        lng: -75.0849,
        radius: 50
      }
    },
    {
      name: 'geocode',
      description: 'Geocode an address',
      defaultParams: {
        address: 'Ocean City, MD'
      }
    },
    {
      name: 'inviteToCirqle',
      description: 'Invite someone to your Cirqle',
      defaultParams: {
        email: 'test@example.com',
        nickname: 'Test Friend',
        relationship: 'friend'
      }
    },
    {
      name: 'addExistingUserToCirqle',
      description: 'Add existing user to Cirqle',
      defaultParams: {
        targetUserId: 'test_user_id',
        nickname: 'Test User',
        relationship: 'friend'
      }
    },
    {
      name: 'joinCirqle',
      description: 'Join a Cirqle via invite code',
      defaultParams: {
        inviteCode: 'TEST_INVITE_CODE'
      }
    },
    {
      name: 'getWeatherForecast',
      description: 'Get weather forecast',
      defaultParams: {
        lat: 38.3365,
        lng: -75.0849,
        days: 5
      }
    },
    {
      name: 'getAirQuality',
      description: 'Get air quality data',
      defaultParams: {
        lat: 38.3365,
        lng: -75.0849
      }
    },
    {
      name: 'getSolarData',
      description: 'Get solar data (sunrise/sunset)',
      defaultParams: {
        lat: 38.3365,
        lng: -75.0849,
        date: new Date().toISOString().split('T')[0]
      }
    },
    {
      name: 'scoreThereThenActivities',
      description: 'Score activities for There-Then trip',
      defaultParams: {
        tripId: 'test_trip_id',
        activities: [],
        participants: []
      }
    }
  ];

  const testEndpoint = async (endpointName: string, params: any) => {
    const startTime = Date.now();
    setLoading(true);

    const newResult: TestResult = {
      endpoint: endpointName,
      status: 'pending'
    };

    setResults(prev => [newResult, ...prev]);

    try {
      const functions = getFunctions();
      const callableFunction = httpsCallable(functions, endpointName);

      console.log(`🧪 Testing ${endpointName} with params:`, params);
      const result = await callableFunction(params);

      const duration = Date.now() - startTime;

      setResults(prev => prev.map(r =>
        r.endpoint === endpointName && r.status === 'pending'
          ? { ...r, status: 'success', data: result.data, duration }
          : r
      ));

      console.log(`✅ ${endpointName} success:`, result.data);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      setResults(prev => prev.map(r =>
        r.endpoint === endpointName && r.status === 'pending'
          ? { ...r, status: 'error', error: error.message, duration }
          : r
      ));

      console.error(`❌ ${endpointName} error:`, error);
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint.name, endpoint.defaultParams);
      // Wait 1 second between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const selectEndpoint = (endpointName: string) => {
    const endpoint = endpoints.find(e => e.name === endpointName);
    if (endpoint) {
      setSelectedEndpoint(endpointName);
      setTestParams(JSON.stringify(endpoint.defaultParams, null, 2));
    }
  };

  const testSelected = () => {
    try {
      const params = JSON.parse(testParams);
      testEndpoint(selectedEndpoint, params);
    } catch (error) {
      alert('Invalid JSON in parameters');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-navy-text mb-2">🧪 AgentQu Test Harness</h1>
          <p className="text-gray-600">Test all Cloud Function endpoints with custom parameters</p>

          {user ? (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Authenticated as: <strong>{user.email}</strong> ({user.uid})
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ Not authenticated - Some endpoints may fail
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Endpoint Selector */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-navy-text mb-4">Select Endpoint</h2>

            <div className="space-y-2 mb-6">
              {endpoints.map(endpoint => (
                <button
                  key={endpoint.name}
                  onClick={() => selectEndpoint(endpoint.name)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedEndpoint === endpoint.name
                      ? 'border-ocean-bright bg-ocean-bright/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-navy-text">{endpoint.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{endpoint.description}</div>
                </button>
              ))}
            </div>

            <div className="border-t pt-4">
              <button
                onClick={testAll}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 mb-2"
              >
                {loading ? '🔄 Testing...' : '🚀 Test All Endpoints'}
              </button>
              <button
                onClick={clearResults}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg"
              >
                🗑️ Clear Results
              </button>
            </div>
          </div>

          {/* Right Panel - Test Details */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-navy-text mb-4">Test Parameters</h2>

            {selectedEndpoint ? (
              <div>
                <h3 className="font-bold text-navy-text mb-2">{selectedEndpoint}</h3>
                <p className="text-xs text-gray-600 mb-4">
                  {endpoints.find(e => e.name === selectedEndpoint)?.description}
                </p>

                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Parameters (JSON):
                </label>
                <textarea
                  value={testParams}
                  onChange={(e) => setTestParams(e.target.value)}
                  className="w-full h-64 p-3 border-2 border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="Enter JSON parameters..."
                />

                <button
                  onClick={testSelected}
                  disabled={loading}
                  className="w-full mt-4 bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-3 rounded-lg disabled:opacity-50"
                >
                  {loading ? '🔄 Testing...' : '▶️ Test Endpoint'}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-2xl mb-2">👈</p>
                <p>Select an endpoint to test</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        {results.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-navy-text mb-4">Test Results</h2>

            <div className="space-y-4">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-4 ${
                    result.status === 'success' ? 'border-green-200 bg-green-50' :
                    result.status === 'error' ? 'border-red-200 bg-red-50' :
                    'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {result.status === 'success' ? '✅' :
                         result.status === 'error' ? '❌' : '⏳'}
                      </span>
                      <div>
                        <h3 className="font-bold text-navy-text">{result.endpoint}</h3>
                        {result.duration && (
                          <p className="text-xs text-gray-600">{result.duration}ms</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      result.status === 'success' ? 'bg-green-600 text-white' :
                      result.status === 'error' ? 'bg-red-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>

                  {result.error && (
                    <div className="bg-red-100 border border-red-300 rounded p-3 mb-2">
                      <p className="text-sm text-red-800 font-mono">{result.error}</p>
                    </div>
                  )}

                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-bold text-gray-700 hover:text-ocean-bright">
                        View Response Data
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestHarness;
