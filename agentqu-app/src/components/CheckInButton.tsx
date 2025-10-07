import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface CheckInButtonProps {
  activityId: string;
  userId: string;
  activityLat: number;
  activityLng: number;
  onCheckIn?: (success: boolean, qusEarned: number) => void;
}

const CheckInButton: React.FC<CheckInButtonProps> = ({
  activityId,
  userId,
  activityLat,
  activityLng,
  onCheckIn
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [qusEarned, setQusEarned] = useState(0);

  const handleCheckIn = async () => {
    if (loading || success) return;

    setLoading(true);
    setError(null);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;

      // Call check-in function
      const checkInActivity = httpsCallable(functions, 'checkInActivity');

      const result = await checkInActivity({
        activityId,
        userId,
        lat,
        lng,
        photos: [],
        notes: ''
      });

      const data = result.data as any;

      if (data.success) {
        setSuccess(true);
        setQusEarned(data.qusEarned || 0);
        onCheckIn?.(true, data.qusEarned || 0);

        // Reset success state after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          setQusEarned(0);
        }, 3000);
      } else if (data.error === 'too_far') {
        setError(`Too far away! You're ${(data.distance * 1609).toFixed(0)}m from the activity.`);
      } else {
        setError('Check-in failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Check-in error:', err);

      if (err.code === 1) { // PERMISSION_DENIED
        setError('Location permission denied. Please enable location access.');
      } else if (err.message?.includes('too_far')) {
        setError('You must be within 100m to check in.');
      } else {
        setError('Failed to get your location. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-medium shadow-md">
        <span className="text-xl">✅</span>
        <span>Checked In! +{qusEarned} Qus</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
          bg-gradient-to-r from-peach to-orange-400 text-white shadow-md
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}
        `}
      >
        <span className="text-xl">{loading ? '📡' : '📍'}</span>
        <span>{loading ? 'Checking in...' : 'Check In'}</span>
      </button>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0
                        bg-red-100 border border-red-300 text-red-800
                        text-xs p-2 rounded-lg shadow-sm z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default CheckInButton;
