/**
 * Concrete Scoring Strategies
 *
 * Each strategy implements a specific scoring component following the Strategy pattern
 */

const ScoringStrategy = require('./ScoringStrategy');
const { calculateDistanceBonus } = require('../distance');

/**
 * Distance Scoring Strategy
 *
 * Awards points based on proximity to user location
 * Closer activities score higher
 */
class DistanceScoringStrategy extends ScoringStrategy {
  constructor(maxPoints = 30) {
    super('Distance', maxPoints);
  }

  calculate(activity, context) {
    if (!activity.distance || !context.userLocation) {
      return 0;
    }

    // calculateDistanceBonus returns 0-1, we scale to maxPoints
    const distanceBonus = calculateDistanceBonus(activity.distance, context.radius || 10);
    const score = distanceBonus * this.maxPoints;

    this.logScore(activity.name, score, { distance: activity.distance });
    return score;
  }
}

/**
 * Rating Scoring Strategy
 *
 * Awards points based on activity rating (1-5 stars)
 */
class RatingScoringStrategy extends ScoringStrategy {
  constructor(maxPoints = 20) {
    super('Rating', maxPoints);
  }

  calculate(activity, context) {
    if (!activity.rating) {
      return 0;
    }

    // Normalize rating (0-5) to score (0-maxPoints)
    const normalized = this.normalize(activity.rating, 5);
    const score = normalized * this.maxPoints;

    this.logScore(activity.name, score, { rating: activity.rating });
    return score;
  }
}

/**
 * Affinity Scoring Strategy
 *
 * Awards points based on match between activity categories and user preferences
 */
class AffinityScoringStrategy extends ScoringStrategy {
  constructor(maxPoints = 40) {
    super('Affinity', maxPoints);
  }

  calculate(activity, context) {
    if (!context.userAffinities || !activity.categories || activity.categories.length === 0) {
      return this.maxPoints * 0.5; // Neutral score
    }

    let totalScore = 0;
    let matchCount = 0;

    activity.categories.forEach((category) => {
      const affinityScore = context.userAffinities[category];
      if (affinityScore !== undefined) {
        totalScore += affinityScore;
        matchCount++;
      }
    });

    if (matchCount === 0) {
      return this.maxPoints * 0.5; // Neutral if no matches
    }

    // Average affinity (0-100) normalized to score
    const averageAffinity = totalScore / matchCount;
    const normalized = this.normalize(averageAffinity, 100);
    const score = normalized * this.maxPoints;

    this.logScore(activity.name, score, {
      matchedCategories: matchCount,
      averageAffinity: Math.round(averageAffinity),
    });

    return score;
  }
}

/**
 * Open Now Scoring Strategy
 *
 * Awards bonus points if activity is currently open
 */
class OpenNowScoringStrategy extends ScoringStrategy {
  constructor(maxPoints = 10) {
    super('OpenNow', maxPoints);
  }

  calculate(activity, context) {
    const score = activity.openNow ? this.maxPoints : 0;

    if (activity.openNow) {
      this.logScore(activity.name, score);
    }

    return score;
  }
}

/**
 * Free Entry Scoring Strategy
 *
 * Awards bonus points for free activities
 */
class FreeScoringStrategy extends ScoringStrategy {
  constructor(maxPoints = 5) {
    super('Free', maxPoints);
  }

  calculate(activity, context) {
    const isFree = activity.cost?.free || activity.cost?.price === 0;
    const score = isFree ? this.maxPoints : 0;

    if (isFree) {
      this.logScore(activity.name, score);
    }

    return score;
  }
}

/**
 * Popularity Scoring Strategy
 *
 * Awards points based on number of reviews (indicator of popularity)
 */
class PopularityScoringStrategy extends ScoringStrategy {
  constructor(maxPoints = 15) {
    super('Popularity', maxPoints);
  }

  calculate(activity, context) {
    if (!activity.reviewCount) {
      return 0;
    }

    // Logarithmic scale: 1 review = 1 point, 100 reviews = 10 points, 1000+ = max
    const normalizedReviews = Math.log10(Math.max(1, activity.reviewCount)) / 3; // /3 because log10(1000) = 3
    const score = Math.min(1, normalizedReviews) * this.maxPoints;

    this.logScore(activity.name, score, { reviewCount: activity.reviewCount });
    return score;
  }
}

/**
 * Music Genre Scoring Strategy
 *
 * Awards bonus points for events matching user's music genre preferences
 */
class MusicGenreScoringStrategy extends ScoringStrategy {
  constructor(maxPoints = 20) {
    super('MusicGenre', maxPoints);
  }

  calculate(activity, context) {
    if (!activity.musicGenres || !context.musicGenreAffinities) {
      return 0;
    }

    let totalScore = 0;
    let matchCount = 0;

    activity.musicGenres.forEach((genre) => {
      const affinityScore = context.musicGenreAffinities[genre];
      if (affinityScore !== undefined) {
        totalScore += affinityScore;
        matchCount++;
      }
    });

    if (matchCount === 0) {
      return 0;
    }

    const averageAffinity = totalScore / matchCount;
    const normalized = this.normalize(averageAffinity, 100);
    const score = normalized * this.maxPoints;

    this.logScore(activity.name, score, {
      genres: activity.musicGenres,
      averageAffinity: Math.round(averageAffinity),
    });

    return score;
  }
}

/**
 * EV Charging Bonus Strategy
 *
 * Awards bonus points for EV charging stations (for EV owners)
 */
class EVChargingBonusStrategy extends ScoringStrategy {
  constructor(maxPoints = 20) {
    super('EVCharging', maxPoints);
  }

  calculate(activity, context) {
    if (!context.isEVOwner) {
      return 0;
    }

    const isEVStation = activity.type === 'ev_charging' || activity.categories?.includes('ev_charging_station');
    const score = isEVStation ? this.maxPoints : 0;

    if (isEVStation) {
      this.logScore(activity.name, score);
    }

    return score;
  }
}

module.exports = {
  DistanceScoringStrategy,
  RatingScoringStrategy,
  AffinityScoringStrategy,
  OpenNowScoringStrategy,
  FreeScoringStrategy,
  PopularityScoringStrategy,
  MusicGenreScoringStrategy,
  EVChargingBonusStrategy,
};
