/**
 * Category and Genre Mapping Utilities
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Mapping logic only
 * - Open/Closed: Easy to extend with new mappings
 */

// ============================================================================
// MUSIC GENRE MAPPING
// ============================================================================

const MUSIC_GENRE_MAP = {
  // Rock & Alternative
  rock: 'rock',
  'classic rock': 'rock',
  'hard rock': 'rock',
  alternative: 'alternative',
  'alternative rock': 'alternative',
  'indie rock': 'alternative',
  metal: 'metal',
  'heavy metal': 'metal',
  metalcore: 'metal',

  // Pop & Electronic
  pop: 'pop',
  'dance pop': 'pop',
  'electro pop': 'pop',
  'dance/electronic': 'dance-electronic',
  edm: 'dance-electronic',
  house: 'dance-electronic',
  techno: 'dance-electronic',
  electronic: 'dance-electronic',

  // Hip Hop & Rap
  'hip-hop/rap': 'hip-hop-rap',
  rap: 'hip-hop-rap',
  'hip hop': 'hip-hop-rap',
  'french rap': 'hip-hop-rap',

  // R&B & Soul
  'r&b': 'r-and-b',
  soul: 'r-and-b',
  funk: 'r-and-b',
  'neo-soul': 'r-and-b',

  // Country & Folk
  country: 'country',
  bluegrass: 'country',
  'country folk': 'country',
  americana: 'country',
  folk: 'folk',
  'singer-songwriter': 'folk',
  acoustic: 'folk',

  // Jazz & Blues
  jazz: 'jazz',
  swing: 'jazz',
  bebop: 'jazz',
  'jazz fusion': 'jazz',
  blues: 'blues',
  'blues rock': 'blues',

  // Classical & Opera
  classical: 'classical',
  orchestral: 'classical',
  'chamber music': 'classical',
  symphony: 'classical',
  opera: 'opera',
  operetta: 'opera',

  // Latin & World
  latin: 'latin',
  reggaeton: 'latin',
  salsa: 'latin',
  'latin pop': 'latin',
  world: 'world',
  'world music': 'world',
  international: 'world',
  reggae: 'reggae',
  ska: 'reggae',
  caribbean: 'reggae',

  // Special Categories
  'oldies & classics': 'oldies-classics',
  'classic hits': 'oldies-classics',
  retro: 'oldies-classics',
  christian: 'christian-gospel',
  gospel: 'christian-gospel',
  'contemporary christian': 'christian-gospel',
  other: 'other',
  undefined: 'other',
  miscellaneous: 'other',
};

// ============================================================================
// RESTAURANT GENRE MAPPING
// ============================================================================

const RESTAURANT_GENRE_MAP = {
  // Indian
  indian: 'indian',
  'indian restaurant': 'indian',
  curry: 'indian',
  tandoori: 'indian',
  biryani: 'indian',

  // Thai
  thai: 'thai',
  'thai restaurant': 'thai',
  'pad thai': 'thai',
  'tom yum': 'thai',

  // Chinese
  chinese: 'chinese',
  'chinese restaurant': 'chinese',
  'dim sum': 'chinese',
  cantonese: 'chinese',
  szechuan: 'chinese',

  // Japanese
  japanese: 'japanese',
  'japanese restaurant': 'japanese',
  sushi: 'japanese',
  'sushi bar': 'japanese',
  ramen: 'japanese',
  izakaya: 'japanese',

  // Mexican
  mexican: 'mexican',
  'mexican restaurant': 'mexican',
  taco: 'mexican',
  burrito: 'mexican',
  'tex-mex': 'mexican',

  // Italian
  italian: 'italian',
  'italian restaurant': 'italian',
  pasta: 'italian',
  pizza: 'pizza',
  pizzeria: 'pizza',
  trattoria: 'italian',

  // Mediterranean
  mediterranean: 'mediterranean',
  'mediterranean restaurant': 'mediterranean',
  greek: 'mediterranean',
  'greek restaurant': 'mediterranean',
  'middle eastern': 'mediterranean',
  lebanese: 'mediterranean',
  turkish: 'mediterranean',

  // Vietnamese
  vietnamese: 'vietnamese',
  'vietnamese restaurant': 'vietnamese',
  pho: 'vietnamese',
  'banh mi': 'vietnamese',

  // Korean
  korean: 'korean',
  'korean restaurant': 'korean',
  'korean bbq': 'korean',
  kimchi: 'korean',
  bibimbap: 'korean',

  // French
  french: 'french',
  'french restaurant': 'french',
  bistro: 'french',
  brasserie: 'french',
  creperie: 'french',

  // American & Western
  american: 'american',
  'american restaurant': 'american',
  burger: 'american',
  grill: 'american',
  hamburger: 'american',
  bar: 'bar-pub',
  pub: 'bar-pub',
  tavern: 'bar-pub',
  brewpub: 'bar-pub',
  'sports bar': 'bar-pub',
  diner: 'diner',
  'comfort food': 'diner',
  'home cooking': 'diner',
  barbecue: 'bbq-southern',
  bbq: 'bbq-southern',
  southern: 'bbq-southern',
  smokehouse: 'bbq-southern',

  // Specialty
  seafood: 'seafood',
  'seafood restaurant': 'seafood',
  fish: 'seafood',
  'oyster bar': 'seafood',
  'crab house': 'seafood',
  lobster: 'seafood',
  steakhouse: 'steakhouse',
  'steak house': 'steakhouse',
  steak: 'steakhouse',
  chophouse: 'steakhouse',
  'prime rib': 'steakhouse',

  // Meal Types & Occasions
  breakfast: 'breakfast-brunch',
  'breakfast restaurant': 'breakfast-brunch',
  brunch: 'breakfast-brunch',
  'brunch restaurant': 'breakfast-brunch',
  pancake: 'breakfast-brunch',
  waffle: 'breakfast-brunch',
  eggs: 'breakfast-brunch',
  coffee: 'coffee-cafe',
  'coffee shop': 'coffee-cafe',
  cafe: 'coffee-cafe',
  espresso: 'coffee-cafe',
  coffeehouse: 'coffee-cafe',
  bakery: 'bakery-dessert',
  dessert: 'bakery-dessert',
  'dessert shop': 'bakery-dessert',
  pastry: 'bakery-dessert',
  'ice cream': 'bakery-dessert',
  sweets: 'bakery-dessert',

  // Vibe & Style
  local: 'local-independent',
  independent: 'local-independent',
  'family-owned': 'local-independent',
  'mom and pop': 'local-independent',
  chain: 'chain-corporate',
  franchise: 'chain-corporate',
  'food truck': 'offgrid-casual',
  'street food': 'offgrid-casual',
  'food cart': 'offgrid-casual',
  'outdoor seating': 'offgrid-casual',
  'casual dining': 'offgrid-casual',
  'fine dining': 'fine-dining',
  upscale: 'fine-dining',
  elegant: 'fine-dining',
  gourmet: 'fine-dining',
  'fast food': 'fast-food',
  'quick service': 'fast-food',
  'drive-through': 'fast-food',
  'drive-thru': 'fast-food',
};

// ============================================================================
// PLACE TYPE TO CATEGORY MAPPING
// ============================================================================

const PLACE_TYPE_CATEGORIES = {
  // Watersports & Water Activities
  beach: ['watersports', 'beaches', 'swimming'],
  aquarium: ['watersports', 'family'],
  marina: ['boating', 'watersports'],

  // Dining & Food
  restaurant: ['dining', 'restaurants'],
  cafe: ['coffee', 'cafes'],
  bar: ['nightlife', 'bars'],
  night_club: ['nightlife', 'clubs'],
  food: ['dining', 'food_trucks'],
  bakery: ['coffee', 'cafes'],

  // Nature & Outdoors
  park: ['parks', 'hiking', 'picnic'],
  campground: ['camping', 'outdoors'],
  hiking_area: ['hiking', 'outdoors'],
  natural_feature: ['hiking', 'nature'],

  // Culture & Arts
  museum: ['museums', 'culture'],
  art_gallery: ['arts', 'culture'],
  library: ['culture', 'reading'],
  movie_theater: ['movies', 'entertainment'],

  // Sports & Fitness
  gym: ['fitness', 'sports'],
  stadium: ['sports', 'events'],
  bowling_alley: ['sports', 'entertainment'],
  golf_course: ['sports', 'golf'],

  // Entertainment & Events
  amusement_park: ['family', 'entertainment'],
  casino: ['entertainment', 'nightlife'],
  spa: ['wellness', 'relaxation'],
  shopping_mall: ['shopping', 'entertainment'],

  // Community & Volunteering
  church: ['volunteering', 'community'],
  community_center: ['volunteering', 'community'],
  local_government_office: ['community'],
};

/**
 * Map Google Place types to affinity categories
 * @param {string[]} types - Google Place types
 * @returns {string[]} Mapped categories
 */
function mapPlaceTypeToCategories(types = []) {
  const categories = new Set();
  types.forEach((type) => {
    if (PLACE_TYPE_CATEGORIES[type]) {
      PLACE_TYPE_CATEGORIES[type].forEach((cat) => categories.add(cat));
    }
  });
  return Array.from(categories);
}

/**
 * Map Ticketmaster genre to our genre ID
 * @param {string} tmGenre - Ticketmaster genre name
 * @returns {string|null} Our genre ID
 */
function mapMusicGenre(tmGenre) {
  return MUSIC_GENRE_MAP[tmGenre.toLowerCase()] || null;
}

/**
 * Map restaurant category to our genre ID
 * @param {string} category - Restaurant category
 * @returns {string|null} Our genre ID
 */
function mapRestaurantGenre(category) {
  return RESTAURANT_GENRE_MAP[category.toLowerCase()] || null;
}

module.exports = {
  MUSIC_GENRE_MAP,
  RESTAURANT_GENRE_MAP,
  PLACE_TYPE_CATEGORIES,
  mapPlaceTypeToCategories,
  mapMusicGenre,
  mapRestaurantGenre,
};
