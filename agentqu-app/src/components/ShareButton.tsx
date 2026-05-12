import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface ShareButtonProps {
  activityId: string;
  activityName: string;
  userId: string;
  onShare?: (shareLink: string) => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  activityId,
  activityName,
  userId,
  onShare
}) => {
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleShare = async () => {
    if (loading || shared) return;

    setLoading(true);

    try {
      const shareActivity = httpsCallable(functions, 'shareActivity');

      const result = await shareActivity({
        activityId,
        userId,
        sharedWith: [], // Will be populated when user selects friends
        message: `Check out ${activityName}!`,
        method: 'link'
      });

      const data = result.data as any;

      if (data.success) {
        setShareLink(data.shareLink);
        setShared(true);

        // Copy to clipboard
        await navigator.clipboard.writeText(data.shareLink);

        onShare?.(data.shareLink);

        // Reset shared state after 3 seconds
        setTimeout(() => {
          setShared(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sharing activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (shared && shareLink) {
    return (
      <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-medium shadow-md text-sm">
        <span className="text-lg">✓</span>
        <span>Link copied! +5 Qus</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
        bg-white border-2 border-gray-300 text-gray-700
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-peach hover:text-peach hover:scale-105'}
      `}
    >
      <span className="text-xl">{loading ? '⏳' : '🔗'}</span>
      <span className="text-sm">{loading ? 'Sharing...' : 'Share'}</span>
    </button>
  );
};

export default ShareButton;
