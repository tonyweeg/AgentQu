// Restaurant Genre Configuration for AgentQu
// Helps users filter and score dining experiences based on cuisine, style, and vibe preferences

export interface RestaurantGenre {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[]; // For matching against Google Places categories
}

export const RESTAURANT_GENRES: RestaurantGenre[] = [
  // Ethnic & International Cuisines
  {
    id: 'indian',
    name: 'Indian',
    icon: '🍛',
    description: 'Indian cuisine and curry houses',
    keywords: ['indian', 'curry', 'tandoori', 'biryani']
  },
  {
    id: 'thai',
    name: 'Thai',
    icon: '🍜',
    description: 'Thai cuisine and noodle dishes',
    keywords: ['thai', 'pad thai', 'tom yum']
  },
  {
    id: 'chinese',
    name: 'Chinese',
    icon: '🥡',
    description: 'Chinese cuisine and dim sum',
    keywords: ['chinese', 'dim sum', 'cantonese', 'szechuan']
  },
  {
    id: 'japanese',
    name: 'Japanese',
    icon: '🍱',
    description: 'Japanese cuisine, sushi, and ramen',
    keywords: ['japanese', 'sushi', 'ramen', 'izakaya']
  },
  {
    id: 'mexican',
    name: 'Mexican',
    icon: '🌮',
    description: 'Mexican and Tex-Mex cuisine',
    keywords: ['mexican', 'taco', 'burrito', 'tex-mex']
  },
  {
    id: 'italian',
    name: 'Italian',
    icon: '🍝',
    description: 'Italian cuisine and pasta',
    keywords: ['italian', 'pasta', 'pizza', 'trattoria']
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    icon: '🫒',
    description: 'Mediterranean, Greek, and Middle Eastern',
    keywords: ['mediterranean', 'greek', 'middle eastern', 'lebanese', 'turkish']
  },
  {
    id: 'vietnamese',
    name: 'Vietnamese',
    icon: '🍲',
    description: 'Vietnamese pho and banh mi',
    keywords: ['vietnamese', 'pho', 'banh mi']
  },
  {
    id: 'korean',
    name: 'Korean',
    icon: '🍖',
    description: 'Korean BBQ and kimchi',
    keywords: ['korean', 'bbq', 'kimchi', 'bibimbap']
  },
  {
    id: 'french',
    name: 'French',
    icon: '🥐',
    description: 'French cuisine and bistros',
    keywords: ['french', 'bistro', 'brasserie', 'crêpe']
  },

  // American & Western Styles
  {
    id: 'american',
    name: 'American',
    icon: '🍔',
    description: 'Classic American fare',
    keywords: ['american', 'burger', 'grill']
  },
  {
    id: 'bar-pub',
    name: 'Bar & Pub',
    icon: '🍺',
    description: 'Bar food and pub grub',
    keywords: ['bar', 'pub', 'tavern', 'brewpub']
  },
  {
    id: 'diner',
    name: 'Diner',
    icon: '🥞',
    description: 'Classic diners and comfort food',
    keywords: ['diner', 'comfort food', 'home cooking']
  },
  {
    id: 'bbq-southern',
    name: 'BBQ & Southern',
    icon: '🍗',
    description: 'Barbecue and Southern cuisine',
    keywords: ['barbecue', 'bbq', 'southern', 'smokehouse']
  },

  // Specialty Categories
  {
    id: 'seafood',
    name: 'Seafood',
    icon: '🦞',
    description: 'Fresh seafood and fish houses',
    keywords: ['seafood', 'fish', 'oyster', 'crab', 'lobster']
  },
  {
    id: 'steakhouse',
    name: 'Steakhouse',
    icon: '🥩',
    description: 'Steakhouses and chophouses',
    keywords: ['steakhouse', 'steak', 'chophouse', 'prime rib']
  },
  {
    id: 'pizza',
    name: 'Pizza',
    icon: '🍕',
    description: 'Pizza and pizzerias',
    keywords: ['pizza', 'pizzeria', 'pie']
  },

  // Meal Types & Occasions
  {
    id: 'breakfast-brunch',
    name: 'Breakfast & Brunch',
    icon: '🥓',
    description: 'Breakfast spots and brunch',
    keywords: ['breakfast', 'brunch', 'pancake', 'waffle', 'eggs']
  },
  {
    id: 'coffee-cafe',
    name: 'Coffee & Café',
    icon: '☕',
    description: 'Coffee shops and cafés',
    keywords: ['coffee', 'cafe', 'espresso', 'coffeehouse']
  },
  {
    id: 'bakery-dessert',
    name: 'Bakery & Dessert',
    icon: '🧁',
    description: 'Bakeries and dessert shops',
    keywords: ['bakery', 'dessert', 'pastry', 'ice cream', 'sweets']
  },

  // Vibe & Style
  {
    id: 'local-independent',
    name: 'Local & Independent',
    icon: '🏪',
    description: 'Local, independent, mom & pop',
    keywords: ['local', 'independent', 'family-owned', 'mom and pop']
  },
  {
    id: 'chain-corporate',
    name: 'Chain & Corporate',
    icon: '🏢',
    description: 'Chain restaurants and franchises',
    keywords: ['chain', 'franchise', 'corporate']
  },
  {
    id: 'offgrid-casual',
    name: 'Off-Grid & Casual',
    icon: '🚚',
    description: 'Food trucks, street food, casual outdoor',
    keywords: ['food truck', 'street food', 'food cart', 'outdoor seating', 'casual']
  },
  {
    id: 'fine-dining',
    name: 'Fine Dining',
    icon: '🍷',
    description: 'Upscale and fine dining',
    keywords: ['fine dining', 'upscale', 'elegant', 'gourmet', 'michelin']
  },
  {
    id: 'fast-food',
    name: 'Fast Food',
    icon: '🍟',
    description: 'Quick service and fast food',
    keywords: ['fast food', 'quick service', 'drive-through']
  }
];

/**
 * Get default restaurant genre affinities (50/100 for all genres)
 */
export function getDefaultRestaurantGenreAffinities(): Record<string, number> {
  const defaults: Record<string, number> = {};
  RESTAURANT_GENRES.forEach(genre => {
    defaults[genre.id] = 50; // Neutral default
  });
  return defaults;
}

/**
 * Calculate affinity score for a restaurant based on user preferences
 * @param restaurantCategories - Array of category strings from Google Places
 * @param userAffinities - User's restaurant genre preferences (0-100)
 * @returns Affinity score (0-100) or null if no match
 */
export function calculateRestaurantGenreAffinityScore(
  restaurantCategories: string[],
  userAffinities: Record<string, number>
): number | null {
  if (!restaurantCategories || restaurantCategories.length === 0) {
    return null;
  }

  const matches: number[] = [];
  const categoriesLower = restaurantCategories.map(c => c.toLowerCase());

  // Check each genre against the restaurant's categories
  RESTAURANT_GENRES.forEach(genre => {
    const hasMatch = genre.keywords.some(keyword =>
      categoriesLower.some(cat => cat.includes(keyword.toLowerCase()))
    );

    if (hasMatch) {
      const affinity = userAffinities[genre.id] ?? 50; // Default to neutral
      matches.push(affinity);
    }
  });

  // If no matches, return null (neutral)
  if (matches.length === 0) {
    return null;
  }

  // Average the matching affinities
  const avgAffinity = matches.reduce((sum, score) => sum + score, 0) / matches.length;
  return Math.round(avgAffinity);
}

/**
 * Default filter threshold - restaurants below this will be filtered out
 */
export const DEFAULT_RESTAURANT_FILTER_THRESHOLD = 20; // 20/100
