export interface AffinityCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  subcategories?: string[];
}

export const AFFINITY_CATEGORIES: AffinityCategory[] = [
  // Events & Entertainment
  {
    id: 'events',
    name: 'Events & Concerts',
    emoji: '🎭',
    description: 'Live performances, concerts, shows',
    subcategories: ['concerts', 'theater', 'comedy', 'performances'],
  },
  {
    id: 'nightlife',
    name: 'Nightlife & Clubs',
    emoji: '🌃',
    description: 'Bars, nightclubs, lounges, live music',
    subcategories: ['nightclubs', 'bars', 'lounges', 'dance_clubs'],
  },
  {
    id: 'festivals',
    name: 'Festivals & Fairs',
    emoji: '🎪',
    description: 'Street fairs, festivals, outdoor events',
    subcategories: ['festivals', 'fairs', 'street_fairs', 'carnivals'],
  },

  // Food & Dining
  {
    id: 'dining',
    name: 'Restaurants & Dining',
    emoji: '🍽️',
    description: 'Fine dining, casual restaurants, eateries',
    subcategories: ['restaurants', 'fine_dining', 'casual_dining'],
  },
  {
    id: 'coffee',
    name: 'Coffee & Cafes',
    emoji: '☕',
    description: 'Coffee shops, cafes, tea houses',
    subcategories: ['coffee', 'cafes', 'tea', 'bakery'],
  },
  {
    id: 'food_trucks',
    name: 'Food Trucks & Street Food',
    emoji: '🚚',
    description: 'Food trucks, pop-ups, street vendors',
    subcategories: ['food_trucks', 'street_food', 'pop_ups'],
  },
  {
    id: 'happy_hour',
    name: 'Happy Hour & Specials',
    emoji: '🍻',
    description: 'Drink specials, happy hours, deals',
    subcategories: ['happy_hour', 'drink_specials', 'bar_deals'],
  },

  // Outdoor & Nature
  {
    id: 'hiking',
    name: 'Hiking & Trails',
    emoji: '🥾',
    description: 'Hiking trails, nature walks, trekking',
    subcategories: ['hiking', 'trails', 'nature_walks', 'trekking'],
  },
  {
    id: 'parks',
    name: 'Parks & Gardens',
    emoji: '🌳',
    description: 'Public parks, botanical gardens, green spaces',
    subcategories: ['parks', 'gardens', 'green_spaces', 'botanical'],
  },
  {
    id: 'beaches',
    name: 'Beaches & Waterfront',
    emoji: '🏖️',
    description: 'Beaches, waterfronts, coastal areas',
    subcategories: ['beaches', 'waterfront', 'coastal', 'lakefront'],
  },

  // Water Sports & Activities
  {
    id: 'watersports',
    name: 'Water Sports',
    emoji: '🏄',
    description: 'Surfing, kayaking, paddleboarding, water activities',
    subcategories: ['surfing', 'kayaking', 'paddleboarding', 'swimming'],
  },
  {
    id: 'fishing',
    name: 'Fishing',
    emoji: '🎣',
    description: 'Fishing spots, charters, angling',
    subcategories: ['fishing', 'charters', 'fly_fishing', 'pier_fishing'],
  },
  {
    id: 'boating',
    name: 'Boating & Sailing',
    emoji: '⛵',
    description: 'Boating, sailing, yacht clubs, marinas',
    subcategories: ['boating', 'sailing', 'yacht', 'marinas'],
  },

  // Sports & Fitness
  {
    id: 'sports',
    name: 'Sports & Recreation',
    emoji: '⚽',
    description: 'Sports games, recreational activities',
    subcategories: ['sports', 'games', 'recreation', 'athletics'],
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    emoji: '🏃',
    description: 'Gyms, yoga, fitness classes, wellness',
    subcategories: ['fitness', 'yoga', 'gyms', 'wellness'],
  },

  // Arts & Culture
  {
    id: 'museums',
    name: 'Museums & Galleries',
    emoji: '🎨',
    description: 'Art museums, galleries, exhibitions',
    subcategories: ['museums', 'galleries', 'exhibitions', 'art'],
  },
  {
    id: 'movies',
    name: 'Movies & Cinema',
    emoji: '🎬',
    description: 'Movie theaters, film screenings, cinema',
    subcategories: ['movies', 'cinema', 'film', 'theaters'],
  },
  {
    id: 'classes',
    name: 'Classes & Workshops',
    emoji: '🎓',
    description: 'Educational classes, workshops, seminars',
    subcategories: ['classes', 'workshops', 'seminars', 'learning'],
  },

  // Community & Social
  {
    id: 'volunteering',
    name: 'Volunteering',
    emoji: '🤝',
    description: 'Volunteer opportunities, community service',
    subcategories: ['volunteering', 'community_service', 'charity'],
  },
  {
    id: 'meetups',
    name: 'Meetups & Social Groups',
    emoji: '👥',
    description: 'Social gatherings, networking, meetup groups',
    subcategories: ['meetups', 'networking', 'social_groups'],
  },
  {
    id: 'farmers_markets',
    name: 'Farmers Markets',
    emoji: '🥕',
    description: 'Local farmers markets, fresh produce',
    subcategories: ['farmers_markets', 'local_markets', 'produce'],
  },

  // Entertainment & Fun
  {
    id: 'gaming',
    name: 'Gaming & Arcades',
    emoji: '🎮',
    description: 'Arcade games, board game cafes, gaming',
    subcategories: ['gaming', 'arcades', 'board_games', 'esports'],
  },
  {
    id: 'live_music',
    name: 'Live Music Venues',
    emoji: '🎵',
    description: 'Live music, jazz clubs, music venues',
    subcategories: ['live_music', 'jazz', 'music_venues', 'bands'],
  },
  {
    id: 'comedy',
    name: 'Comedy Shows',
    emoji: '😂',
    description: 'Stand-up comedy, improv, comedy clubs',
    subcategories: ['comedy', 'stand_up', 'improv', 'comedy_clubs'],
  },

  // Shopping & Local
  {
    id: 'shopping',
    name: 'Shopping & Boutiques',
    emoji: '🛍️',
    description: 'Shopping districts, boutiques, local shops',
    subcategories: ['shopping', 'boutiques', 'retail', 'markets'],
  },
  {
    id: 'local_favorites',
    name: 'Local Favorites',
    emoji: '⭐',
    description: 'Hidden gems, local favorites, unique spots',
    subcategories: ['local', 'hidden_gems', 'favorites', 'unique'],
  },

  // Special Interests
  {
    id: 'wine_tasting',
    name: 'Wine & Breweries',
    emoji: '🍷',
    description: 'Wineries, breweries, tastings, tours',
    subcategories: ['wine', 'breweries', 'tastings', 'vineyards'],
  },
  {
    id: 'tours',
    name: 'Tours & Sightseeing',
    emoji: '🗺️',
    description: 'Guided tours, sightseeing, attractions',
    subcategories: ['tours', 'sightseeing', 'attractions', 'landmarks'],
  },
  {
    id: 'free_activities',
    name: 'Free Activities',
    emoji: '🎁',
    description: 'Free events, activities, no-cost fun',
    subcategories: ['free', 'no_cost', 'budget_friendly'],
  },
];

// Default affinity score for new users (0.5 = neutral)
export const DEFAULT_AFFINITY_SCORE = 0.5;

// Helper to get affinity category by ID
export function getAffinityCategory(id: string): AffinityCategory | undefined {
  return AFFINITY_CATEGORIES.find((cat) => cat.id === id);
}

// Helper to initialize default affinities
export function getDefaultAffinities(): Record<string, number> {
  const affinities: Record<string, number> = {};
  AFFINITY_CATEGORIES.forEach((category) => {
    affinities[category.id] = DEFAULT_AFFINITY_SCORE;
  });
  return affinities;
}
