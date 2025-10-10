import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Location } from '../lib/types';

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  url: string;
  author: {
    username: string;
    name: string;
    avatar: string;
  };
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
  location: string | null;
  isEvent: boolean;
  hashtags: string[];
  searchType: 'event' | 'local';
}

export interface TwitterSearchResult {
  success: boolean;
  events: Tweet[];
  buzz: Tweet[];
  total: number;
  location: { lat: number; lng: number; radius: number };
  affinityCategories: string[];
}

interface UseTwitterParams {
  location: Location | null;
  userId: string | null;
  affinities?: Record<string, number>;
  radius?: number;
  enabled?: boolean;
}

export function useTwitter({
  location,
  userId,
  affinities = {},
  radius = 10,
  enabled = true
}: UseTwitterParams) {
  const [tweets, setTweets] = useState<TwitterSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTwitter = useCallback(async () => {
    if (!location || !userId || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const searchTwitterFn = httpsCallable<any, TwitterSearchResult>(functions, 'searchTwitter');

      console.log('🐦 CLIENT: Searching Twitter...', { location, affinities, radius });

      const result = await searchTwitterFn({
        lat: location.lat,
        lng: location.lng,
        radius,
        affinities,
        userId,
      });

      console.log('🐦 CLIENT: Twitter search result:', result.data);

      setTweets(result.data);
    } catch (err: any) {
      console.error('🐦 CLIENT: Twitter search error:', err);
      setError(err.message || 'Failed to search Twitter');
    } finally {
      setLoading(false);
    }
  }, [location, userId, affinities, radius, enabled]);

  useEffect(() => {
    searchTwitter();
  }, [searchTwitter]);

  return {
    tweets,
    loading,
    error,
    refresh: searchTwitter,
  };
}
