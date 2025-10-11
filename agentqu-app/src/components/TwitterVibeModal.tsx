import React from 'react';
import { Tweet, VibeData } from '../hooks/useTwitter';

interface TwitterVibeModalProps {
  events: Tweet[];
  loading: boolean;
  error: string | null;
  vibe?: VibeData;
  rateLimit?: {
    limit: number | null;
    remaining: number | null;
    reset: number | null;
    resetTime: string | null;
  } | null;
  onClose: () => void;
}

const TwitterVibeModal: React.FC<TwitterVibeModalProps> = ({ events, loading, error, vibe, rateLimit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐦</span>
            <div>
              <h2 className="text-2xl font-bold">Local Buzz</h2>
              <p className="text-sm text-blue-100">Events happening near you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Rate Limit Indicator */}
        {rateLimit && rateLimit.remaining !== null && (
          <div className="bg-gray-50 px-6 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">API Status:</span>
              {rateLimit.remaining < 50 ? (
                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  ⚠️ Rate limit: {rateLimit.remaining}/{rateLimit.limit} left
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  ✅ {rateLimit.remaining}/{rateLimit.limit}
                </span>
              )}
              {rateLimit.resetTime && rateLimit.remaining < 50 && (
                <span className="text-[10px] text-gray-500">
                  Resets: {new Date(rateLimit.resetTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Vibe Summary Section */}
        {vibe && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-700">🎭 Local Vibe</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-bold">
                  {vibe.mood}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  vibe.energy === 'high' ? 'bg-green-200 text-green-800' :
                  vibe.energy === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {vibe.energy} energy
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-800 mb-2">{vibe.description}</p>
            {vibe.topThemes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {vibe.topThemes.map((theme) => (
                  <span key={theme} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {theme}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading local buzz...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium">Unable to load local buzz</p>
              <p className="text-sm text-gray-500 mt-2">{error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600 font-medium">No events found</p>
              <p className="text-sm text-gray-500 mt-2">Check back later for updates</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-gray-800">🎉 Upcoming Events</h3>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                  {events.length}
                </span>
              </div>

              {events.map((event) => {
                const timeSince = getTimeSince(event.createdAt);

                return (
                  <div
                    key={event.id}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => window.open(event.url, '_blank')}
                  >
                    {/* Event Badge */}
                    <div className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                      🎉 EVENT
                    </div>

                    {/* Tweet Text */}
                    <p className="text-sm text-gray-800 leading-relaxed mb-3">
                      {event.text}
                    </p>

                    {/* Author & Meta */}
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={event.author.avatar}
                        alt={event.author.name}
                        className="w-8 h-8 rounded-full border-2 border-purple-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {event.author.name}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            @{event.author.username}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400">{timeSince}</div>
                      </div>
                    </div>

                    {/* Engagement */}
                    {(event.engagement.likes > 0 || event.engagement.retweets > 0 || event.engagement.replies > 0) && (
                      <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-purple-200">
                        {event.engagement.likes > 0 && (
                          <span className="flex items-center gap-1">
                            ❤️ {event.engagement.likes}
                          </span>
                        )}
                        {event.engagement.retweets > 0 && (
                          <span className="flex items-center gap-1">
                            🔄 {event.engagement.retweets}
                          </span>
                        )}
                        {event.engagement.replies > 0 && (
                          <span className="flex items-center gap-1">
                            💬 {event.engagement.replies}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Hashtags */}
                    {event.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {event.hashtags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {event.hashtags.length > 5 && (
                          <span className="text-[10px] text-gray-500">
                            +{event.hashtags.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Powered by X (formerly Twitter) • Click events to view on X
          </p>
        </div>
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

export default TwitterVibeModal;
