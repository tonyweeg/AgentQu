import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface QuupButtonProps {
  activityId: string;
  userId: string;
  initialQup?: boolean;
  onQuupChange?: (qupped: boolean, qusEarned: number) => void;
}

const QuupButton: React.FC<QuupButtonProps> = ({
  activityId,
  userId,
  initialQup,
  onQuupChange
}) => {
  const [qupped, setQupped] = useState(initialQup || false);
  const [loading, setLoading] = useState(false);
  const [qusEarned, setQusEarned] = useState(0);

  const handleQup = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const qupActivity = httpsCallable(functions, 'qupActivity');

      const result = await qupActivity({
        activityId,
        userId,
        qup: !qupped, // Toggle
      });

      const data = result.data as any;

      if (data.success) {
        setQupped(data.qup);

        if (data.qusEarned > 0) {
          setQusEarned(data.qusEarned);

          // Show Qus earned notification
          setTimeout(() => setQusEarned(0), 3000);
        }

        onQuupChange?.(data.qup, data.qusEarned || 0);
      }
    } catch (error) {
      console.error('Error Qu-ing activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleQup}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
          ${qupped
            ? 'bg-peach text-white shadow-md'
            : 'bg-white border-2 border-peach text-peach hover:bg-peach/10'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        <span className="text-xl">{qupped ? '🎯' : '○'}</span>
        <span>{qupped ? 'Qu\'d Up!' : 'Qu-up'}</span>
      </button>

      {/* Qus Earned Notification */}
      {qusEarned > 0 && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2
                        bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full
                        animate-bounce shadow-lg whitespace-nowrap">
          +{qusEarned} Qus!
        </div>
      )}
    </div>
  );
};

export default QuupButton;
