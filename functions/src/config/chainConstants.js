/**
 * Chain Detection Constants and Utilities
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Chain detection only
 * - DRY: Single source of truth for chain detection logic
 *
 * Note: This mirrors the frontend chainConstants.ts structure
 * but is kept separate due to Node.js/TypeScript boundary.
 * If chains are updated, update both files.
 *
 * @module chainConstants
 * @description Central registry of known restaurant/retail chains for filtering
 * and categorization. Includes 100+ chains across categories:
 * - Fast food (McDonald's, Burger King, etc.)
 * - Pizza chains (Pizza Hut, Domino's, etc.)
 * - Coffee shops (Starbucks, Dunkin, etc.)
 * - Casual dining (Applebee's, Chili's, etc.)
 * - Convenience stores (7-Eleven, Wawa, etc.)
 * - Big box stores (Walmart, Target, etc.)
 */

// ============================================================================
// FAST FOOD CHAINS
// ============================================================================

const FAST_FOOD_CHAINS = [
  'mcdonalds',
  "mcdonald's",
  'burger king',
  "wendy's",
  'wendys',
  'taco bell',
  'kfc',
  'popeyes',
  'chick-fil-a',
  'chick fil a',
  'sonic',
  'dairy queen',
  "arby's",
  'arbys',
  "carl's jr",
  'carls jr',
  "hardee's",
  'hardees',
  'jack in the box',
  'white castle',
  'five guys',
  'in-n-out',
  'shake shack',
  'whataburger',
];

// ============================================================================
// ALL KNOWN CHAINS
// ============================================================================

const KNOWN_CHAINS = [
  ...FAST_FOOD_CHAINS,
  // Pizza Chains
  'pizza hut',
  'dominos',
  "domino's",
  "papa john's",
  'papa johns',
  'little caesars',
  "papa murphy's",
  "marco's pizza",
  // Sandwich/Sub Chains
  'subway',
  "jimmy john's",
  'jimmy johns',
  "jersey mike's",
  'firehouse subs',
  'quiznos',
  'blimpie',
  'potbelly',
  // Coffee Chains
  'starbucks',
  'dunkin',
  'dunkin donuts',
  'tim hortons',
  // Convenience Stores
  'wawa',
  '7-eleven',
  '7 eleven',
  'circle k',
  'sheetz',
  'cumberland farms',
  'speedway',
  'pilot',
  'flying j',
  "love's",
  'loves',
  'ta petro',
  'am/pm',
  'ampm',
  // Casual Dining Chains
  "applebee's",
  'applebees',
  "chili's",
  'chilis',
  "tgi friday's",
  'red lobster',
  'olive garden',
  'outback steakhouse',
  'texas roadhouse',
  'longhorn steakhouse',
  'cracker barrel',
  "denny's",
  'dennys',
  'ihop',
  'waffle house',
  'bob evans',
  'panera bread',
  'panera',
  'chipotle',
  'qdoba',
  "moe's southwest",
  // Other Chains
  'panda express',
  'pei wei',
  'noodles & company',
  'buffalo wild wings',
  'wingstop',
  'hooters',
  'golden corral',
  "cici's pizza",
  'cicis pizza',
  // Big Box Stores
  'walmart',
  'target',
  'costco',
  "sam's club",
  'sams club',
  "bj's wholesale",
  'bjs wholesale',
];

// ============================================================================
// CHAIN DETECTION UTILITIES
// ============================================================================

/**
 * Check if a place name is a known chain
 * @param {string} placeName - Name of the place to check
 * @returns {boolean} True if the place is a known chain
 */
function isKnownChain(placeName) {
  if (!placeName) return false;
  const nameLower = placeName.toLowerCase();
  return KNOWN_CHAINS.some((chain) => nameLower.includes(chain));
}

/**
 * Normalize chain names by removing numbers and special characters
 * @param {string} placeName - Name to normalize
 * @returns {string} Normalized name
 */
function normalizeChainName(placeName) {
  if (!placeName) return '';

  let normalized = placeName.toLowerCase().trim();

  // Remove trailing numbers (e.g., "Starbucks #1234" -> "starbucks")
  normalized = normalized.replace(/#\d+$/, '');
  normalized = normalized.replace(/\d+$/, '');

  return normalized.trim();
}

/**
 * Check if place is a big box store
 * @param {string} placeName - Name of the place
 * @returns {boolean} True if big box store
 */
function isBigBoxStore(placeName) {
  if (!placeName) return false;

  const bigBoxStores = [
    'walmart',
    'target',
    'costco',
    "sam's club",
    'sams club',
    "bj's wholesale",
    'bjs wholesale',
  ];

  const nameLower = placeName.toLowerCase();
  return bigBoxStores.some((store) => nameLower.includes(store));
}

module.exports = {
  FAST_FOOD_CHAINS,
  KNOWN_CHAINS,
  isKnownChain,
  normalizeChainName,
  isBigBoxStore,
};
