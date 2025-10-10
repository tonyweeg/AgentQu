import React from 'react';
import { Tweet } from '../hooks/useTwitter';

interface LocalFlavorColumnProps {
  events: Tweet[];
  buzz: Tweet[];
  loading: boolean;
  error: string | null;
  rateLimit?: {
    limit: number | null;
    remaining: number | null;
    reset: number | null;
    resetTime: string | null;
  } | null;
}

const LocalFlavorColumn: React.FC<LocalFlavorColumnProps> = ({ events, buzz, loading, error, rateLimit }) => {
  // Mix events and buzz - prioritize events
  const mixedContent = [...events, ...buzz].slice(0, 20);

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-blue-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🐦</span>
          <h2 className="text-xl font-bold text-navy-text">Local Flavor from X</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-red-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🐦</span>
          <h2 className="text-xl font-bold text-navy-text">Local Flavor from X</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-red-600">Unable to load X content</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (mixedContent.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🐦</span>
          <h2 className="text-xl font-bold text-navy-text">Local Flavor from X</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-gray-600">No local buzz found</p>
          <p className="text-xs text-gray-500 mt-1">Check back later for updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-blue-200 shadow-lg p-6 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white/90 backdrop-blur-sm pb-2 border-b border-gray-200">
        <span className="text-3xl">🐦</span>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-navy-text">Local Flavor from X</h2>
          <p className="text-xs text-gray-500">
            {events.length} events · {buzz.length} buzz
          </p>

          {/* Rate Limit Indicator */}
          {rateLimit && rateLimit.remaining !== null && (
            <div className="mt-1 flex items-center gap-2">
              {rateLimit.remaining < 50 ? (
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  ⚠️ Rate limit: {rateLimit.remaining}/{rateLimit.limit} left
                </span>
              ) : (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  ✅ API: {rateLimit.remaining}/{rateLimit.limit}
                </span>
              )}
              {rateLimit.resetTime && rateLimit.remaining < 50 && (
                <span className="text-[9px] text-gray-500">
                  Resets: {new Date(rateLimit.resetTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tweet Stream */}
      <div className="space-y-4">
        {mixedContent.map((tweet) => {
          const timeSince = getTimeSince(tweet.createdAt);

          return (
            <div
              key={tweet.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                tweet.isEvent
                  ? 'bg-purple-50 border-purple-200 hover:border-purple-300'
                  : 'bg-blue-50 border-blue-200 hover:border-blue-300'
              }`}
              onClick={() => window.open(tweet.url, '_blank')}
            >
              {/* Badge */}
              {tweet.isEvent && (
                <div className="inline-block bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                  🎉 EVENT
                </div>
              )}

              {/* Tweet Text */}
              <p className="text-sm text-gray-800 leading-relaxed mb-3 line-clamp-4">
                {tweet.text}
              </p>

              {/* Author & Meta */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={tweet.author.avatar}
                  alt={tweet.author.name}
                  className="w-6 h-6 rounded-full border border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {tweet.author.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      @{tweet.author.username}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">{timeSince}</div>
                </div>
              </div>

              {/* Engagement */}
              {(tweet.engagement.likes > 0 || tweet.engagement.retweets > 0) && (
                <div className="flex items-center gap-3 text-xs text-gray-600 pt-2 border-t border-gray-200">
                  {tweet.engagement.likes > 0 && (
                    <span className="flex items-center gap-1">
                      ❤️ {tweet.engagement.likes}
                    </span>
                  )}
                  {tweet.engagement.retweets > 0 && (
                    <span className="flex items-center gap-1">
                      🔄 {tweet.engagement.retweets}
                    </span>
                  )}
                  {tweet.engagement.replies > 0 && (
                    <span className="flex items-center gap-1">
                      💬 {tweet.engagement.replies}
                    </span>
                  )}
                </div>
              )}

              {/* Hashtags */}
              {tweet.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tweet.hashtags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {tweet.hashtags.length > 3 && (
                    <span className="text-[10px] text-gray-500">
                      +{tweet.hashtags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Powered by X (formerly Twitter)
        </p>
      </div>
    </div>
  );
};

// Helper: Calculate time since tweet
function getTimeSince(createdAt: string): string {
  const now = new Date();
  const tweetDate = new Date(createdAt);
  const seconds = Math.floor((now.getTime() - tweetDate.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return tweetDate.toLocaleDateString();
}

export default LocalFlavorColumn;
