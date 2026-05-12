/**
 * Chain Restaurant and Brand Constants
 *
 * Shared with backend (functions/src/config/constants.js)
 * Single source of truth for known chain identification
 */

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

export const KNOWN_CHAINS = [
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

/**
 * Check if a place name matches a known chain
 * @param placeName - Name of the place to check
 * @returns True if the place is a known chain
 */
export function isKnownChain(placeName: string): boolean {
  const nameLower = (placeName || '').toLowerCase();
  return KNOWN_CHAINS.some(chain => nameLower.includes(chain));
}

/**
 * Normalize chain name for grouping (remove numbers, addresses, etc)
 * @param placeName - Name to normalize
 * @returns Normalized chain name
 */
export function normalizeChainName(placeName: string): string {
  let normalized = placeName.toLowerCase().trim();

  // Remove common suffixes and prefixes
  normalized = normalized.replace(/#\d+$/, ''); // Remove #123
  normalized = normalized.replace(/\d+$/, ''); // Remove trailing numbers
  normalized = normalized.replace(/\s+-\s+.*$/, ''); // Remove everything after " - "
  normalized = normalized.replace(/\s+\(.*\)/, ''); // Remove parenthetical info

  return normalized.trim();
}
