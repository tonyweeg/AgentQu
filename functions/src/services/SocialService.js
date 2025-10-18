/**
 * Social Media Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Social media integration and VibeIndex calculation only
 * - Dependency Inversion: Depends on TwitterClient and repository interfaces
 */

const { TwitterClient } = require('../api');
const { createLogger } = require('../utils/logger');
const { VIBE_CATEGORIES } = require('../config/constants');
const { getFirestore } = require('../config/firebase');
const geohash = require('ngeohash');

class SocialService {
  constructor() {
    this.twitterClient = new TwitterClient();
    this.logger = createLogger('SOCIAL_SERVICE');
    this.db = getFirestore();
  }

  /**
   * Search Twitter for local content
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Structured tweet results
   */
  async searchTwitter(params) {
    try {
      const {
        lat,
        lng,
        radius = 10,
        affinities = {},
        userId = null,
        cityName = null,
        stateName = null,
      } = params;

      if (!lat || !lng) {
        throw new Error('Location (lat, lng) is required');
      }

      this.logger.info('Twitter search started', { lat, lng, radius, cityName, stateName });

      const allTweets = [];

      // Strategy 1: Event search with affinity hashtags
      const topCategories = Object.entries(affinities)
        .filter(([_, rating]) => rating >= 10)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 5)
        .map(([category, _]) => category);

      let hashtags = topCategories.map(cat => cat.replace(/_/g, ''));

      // Fallback to general local hashtags if no affinities
      if (hashtags.length === 0) {
        hashtags = ['local', 'community', 'downtown', 'smalltown'];
      }

      this.logger.info('Searching with hashtags', { hashtags });

      try {
        const eventQuery = this.twitterClient.buildEventQuery(hashtags);
        const eventResults = await this.twitterClient.searchRecent({
          query: eventQuery,
          maxResults: 20,
        });

        if (eventResults.tweets.length > 0) {
          allTweets.push(
            ...eventResults.tweets.map(tweet => ({
              ...tweet,
              searchType: 'event',
              includes: eventResults.includes,
            }))
          );
        }

        this.logger.info('Event search results', { count: eventResults.tweets.length });
      } catch (error) {
        this.logger.error('Event search failed', error);
      }

      // Strategy 2: Location-based search (geospatial)
      try {
        const locationQuery = this.twitterClient.buildLocationQuery(lat, lng, radius);
        const locationResults = await this.twitterClient.searchRecent({
          query: locationQuery,
          maxResults: 50,
        });

        if (locationResults.tweets.length > 0) {
          allTweets.push(
            ...locationResults.tweets.map(tweet => ({
              ...tweet,
              searchType: 'local',
              includes: locationResults.includes,
            }))
          );
        }

        this.logger.info('Location search results', { count: locationResults.tweets.length });
      } catch (error) {
        this.logger.error('Location search failed', error);
      }

      // Strategy 3: City/State name mentions
      if (cityName || stateName) {
        try {
          const nameQuery = this.twitterClient.buildLocationNameQuery(cityName, stateName);
          const nameResults = await this.twitterClient.searchRecent({
            query: nameQuery,
            maxResults: 20,
          });

          if (nameResults.tweets.length > 0) {
            allTweets.push(
              ...nameResults.tweets.map(tweet => ({
                ...tweet,
                searchType: 'location_name',
                includes: nameResults.includes,
              }))
            );
          }

          this.logger.info('Name search results', { count: nameResults.tweets.length });
        } catch (error) {
          this.logger.error('Name search failed', error);
        }
      }

      // Deduplicate by tweet ID
      const uniqueTweets = Array.from(new Map(allTweets.map(tweet => [tweet.id, tweet])).values());

      // Structure tweets with metadata
      const structuredTweets = this.structureTweets(uniqueTweets);

      this.logger.info('Twitter search completed', {
        totalUnique: uniqueTweets.length,
        withEventInfo: structuredTweets.filter(t => t.hasEventInfo).length,
      });

      return {
        success: true,
        tweets: structuredTweets,
        totalResults: uniqueTweets.length,
      };
    } catch (error) {
      this.logger.error('Twitter search failed', error);
      throw error;
    }
  }

  /**
   * Calculate VibeIndex for a city
   * @param {Object} params - Calculation parameters
   * @returns {Promise<Object>} VibeIndex scores
   */
  async calculateVibeIndex(params) {
    try {
      const { cityName, state, lat, lng, radius = 15, population = 10000 } = params;

      this.logger.info('Calculating VibeIndex', { cityName, state, lat, lng });

      // Fetch tweets from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const locationQuery = this.twitterClient.buildLocationQuery(lat, lng, radius);

      const results = await this.twitterClient.searchRecent({
        query: locationQuery,
        maxResults: 100,
        startTime: thirtyDaysAgo.toISOString(),
      });

      const tweets = results.tweets;

      this.logger.info('Fetched tweets for VibeIndex', { count: tweets.length });

      // Calculate scores for each category
      const scores = {};
      let totalScore = 0;
      const trendingCategories = [];

      for (const [categoryKey, categoryDef] of Object.entries(VIBE_CATEGORIES)) {
        const categoryTweets = this.filterTweetsByCategory(tweets, categoryDef);
        const categoryScore = this.calculateCategoryScore(categoryTweets, categoryDef, population);

        scores[categoryKey] = {
          ...categoryScore,
          name: categoryDef.name,
          lastUpdated: new Date().toISOString(),
        };

        totalScore += categoryScore.score;

        if (categoryScore.score >= 60) {
          trendingCategories.push({
            key: categoryKey,
            name: categoryDef.name,
            score: categoryScore.score,
          });
        }

        this.logger.info('Category score calculated', {
          category: categoryDef.name,
          score: categoryScore.score,
          tweetCount: categoryScore.tweetCount,
        });
      }

      // Sort trending categories
      trendingCategories.sort((a, b) => b.score - a.score);
      const topTrending = trendingCategories.slice(0, 2).map(c => c.key);

      const overallVibeScore = Math.round(totalScore / Object.keys(VIBE_CATEGORIES).length);

      // Store in Firestore
      const cityId = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;
      const vibeDoc = {
        cityId,
        cityName,
        state,
        country: 'US',
        location: {
          lat,
          lng,
          geohash: geohash.encode(lat, lng, 6),
        },
        population,
        scores,
        overallVibeScore,
        trendingCategories: topTrending,
        calculatedAt: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.db.collection('vibeScores').doc(cityId).set(vibeDoc);

      this.logger.info('VibeIndex calculated and stored', {
        cityId,
        overallScore: overallVibeScore,
        trending: topTrending,
      });

      return {
        success: true,
        cityId,
        cityName,
        state,
        overallVibeScore,
        scores,
        trendingCategories: topTrending,
        totalTweets: tweets.length,
      };
    } catch (error) {
      this.logger.error('VibeIndex calculation failed', error);
      throw error;
    }
  }

  /**
   * Get VibeIndex for a city (from cache)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} VibeIndex data
   */
  async getVibeIndex(params) {
    try {
      const { cityId, cityName, state } = params;

      let docId = cityId;
      if (!docId && cityName && state) {
        docId = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;
      }

      if (!docId) {
        throw new Error('Either cityId or (cityName + state) required');
      }

      const doc = await this.db.collection('vibeScores').doc(docId).get();

      if (!doc.exists) {
        return {
          success: false,
          error: 'City not found in VibeIndex database',
        };
      }

      this.logger.info('VibeIndex retrieved', { cityId: docId });

      return {
        success: true,
        ...doc.data(),
      };
    } catch (error) {
      this.logger.error('Get VibeIndex failed', error);
      throw error;
    }
  }

  /**
   * Structure tweets with metadata
   * @private
   */
  structureTweets(tweets) {
    return tweets.map(tweet => {
      const author = tweet.includes?.users?.find(u => u.id === tweet.author_id) || {};
      const place = tweet.includes?.places?.find(p => p.id === tweet.geo?.place_id) || null;

      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          profileImage: author.profile_image_url,
        },
        metrics: tweet.public_metrics || {},
        location: place
          ? {
              name: place.full_name,
              placeType: place.place_type,
            }
          : null,
        hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
        urls: tweet.entities?.urls?.map(u => u.expanded_url) || [],
        hasEventInfo: this.hasEventInfo(tweet.text),
        searchType: tweet.searchType,
      };
    });
  }

  /**
   * Check if tweet contains event information
   * @private
   */
  hasEventInfo(text) {
    if (!text) return false;

    const datePatterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i,
      /\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?/,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /\b(today|tomorrow|tonight|this\s+(week|weekend|month))/i,
    ];

    const timePatterns = [/\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?/, /\b(at|from|starting|begins)\s+\d{1,2}/i];

    return (
      datePatterns.some(p => p.test(text)) || timePatterns.some(p => p.test(text))
    );
  }

  /**
   * Filter tweets by category keywords and hashtags
   * @private
   */
  filterTweetsByCategory(tweets, category) {
    return tweets.filter(tweet => {
      const text = tweet.text.toLowerCase();
      const tweetHashtags = tweet.entities?.hashtags?.map(h => h.tag.toLowerCase()) || [];

      const hasKeyword = category.keywords.some(keyword =>
        text.includes(keyword.toLowerCase())
      );

      const hasHashtag = category.hashtags.some(hashtag =>
        tweetHashtags.includes(hashtag.toLowerCase())
      );

      return hasKeyword || hasHashtag;
    });
  }

  /**
   * Calculate VibeIndex score for a category
   * @private
   */
  calculateCategoryScore(tweets, category, population) {
    if (tweets.length === 0) {
      return {
        score: 0,
        tweetCount: 0,
        uniqueUsers: 0,
        avgEngagement: 0,
      };
    }

    // Volume Score (0-30): Normalized by population
    const volumeScore = Math.min(30, (tweets.length / (population / 1000)) * 10);

    // Engagement Score (0-30): Average engagement per tweet
    const totalEngagement = tweets.reduce((sum, tweet) => {
      const likes = tweet.public_metrics?.like_count || 0;
      const retweets = tweet.public_metrics?.retweet_count || 0;
      const replies = tweet.public_metrics?.reply_count || 0;
      return sum + likes + retweets + replies;
    }, 0);
    const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;
    const engagementScore = Math.min(30, (avgEngagement / 5) * 5);

    // Diversity Score (0-20): Unique users
    const uniqueUsers = new Set(tweets.map(t => t.author_id)).size;
    const diversityScore = Math.min(20, uniqueUsers / 10);

    // Recency Score (0-10): Time decay
    const now = new Date();
    let recencyScore = 0;
    tweets.forEach(tweet => {
      const tweetDate = new Date(tweet.created_at);
      const daysAgo = (now - tweetDate) / (1000 * 60 * 60 * 24);
      if (daysAgo <= 7) recencyScore += 10 / tweets.length;
      else if (daysAgo <= 14) recencyScore += 7 / tweets.length;
      else if (daysAgo <= 21) recencyScore += 4 / tweets.length;
      else if (daysAgo <= 30) recencyScore += 2 / tweets.length;
    });
    recencyScore = Math.min(10, recencyScore);

    // Event Density Score (0-10): Tweets with date/time patterns
    const eventRegex =
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}|\d{1,2}:\d{2}|at \d|pm|am)\b/i;
    const eventTweets = tweets.filter(t => eventRegex.test(t.text)).length;
    const eventScore = Math.min(10, eventTweets / 2);

    const finalScore = Math.round(
      volumeScore + engagementScore + diversityScore + recencyScore + eventScore
    );

    return {
      score: finalScore,
      tweetCount: tweets.length,
      uniqueUsers,
      avgEngagement: Math.round(avgEngagement * 10) / 10,
    };
  }
}

module.exports = SocialService;
