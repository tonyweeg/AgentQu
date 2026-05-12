/**
 * Music Genre Affinity System
 *
 * Comprehensive list of music genres for filtering Ticketmaster events.
 * Each genre can be rated 0-100 by users to personalize event discovery.
 *
 * Structure matches Ticketmaster Discovery API v2 classifications:
 * - segment: "Music"
 * - genre: Primary music style (Rock, Pop, Country, etc.)
 * - subGenre: Detailed sub-category (Alternative Rock, Indie Pop, etc.)
 */

export interface MusicGenre {
  id: string;
  name: string;
  icon: string;
  description: string;
  ticketmasterGenres: string[]; // Maps to Ticketmaster genre.name values
  defaultRating: number;
}

/**
 * Comprehensive music genres list
 * Based on Ticketmaster API and industry standards
 */
export const MUSIC_GENRES: MusicGenre[] = [
  // ROCK & ALTERNATIVE
  {
    id: "rock",
    name: "Rock",
    icon: "🎸",
    description: "Classic rock, hard rock, and rock bands",
    ticketmasterGenres: ["Rock", "Classic Rock", "Hard Rock"],
    defaultRating: 50,
  },
  {
    id: "alternative",
    name: "Alternative",
    icon: "🎵",
    description: "Alternative rock, indie rock, and experimental",
    ticketmasterGenres: ["Alternative", "Alternative Rock", "Indie Rock"],
    defaultRating: 50,
  },
  {
    id: "metal",
    name: "Metal",
    icon: "🤘",
    description: "Heavy metal, metalcore, and hard rock",
    ticketmasterGenres: ["Metal", "Heavy Metal", "Metalcore"],
    defaultRating: 50,
  },

  // POP & ELECTRONIC
  {
    id: "pop",
    name: "Pop",
    icon: "✨",
    description: "Pop music, contemporary hits, and mainstream",
    ticketmasterGenres: ["Pop", "Dance Pop", "Electro Pop"],
    defaultRating: 50,
  },
  {
    id: "dance-electronic",
    name: "Dance/Electronic",
    icon: "🎧",
    description: "EDM, house, techno, and electronic dance music",
    ticketmasterGenres: ["Dance/Electronic", "EDM", "House", "Techno", "Electronic"],
    defaultRating: 50,
  },

  // HIP HOP & RAP
  {
    id: "hip-hop-rap",
    name: "Hip-Hop/Rap",
    icon: "🎤",
    description: "Hip-hop, rap, and urban music",
    ticketmasterGenres: ["Hip-Hop/Rap", "Rap", "Hip Hop", "French Rap"],
    defaultRating: 50,
  },

  // R&B & SOUL
  {
    id: "r-and-b",
    name: "R&B/Soul",
    icon: "💜",
    description: "R&B, soul, funk, and neo-soul",
    ticketmasterGenres: ["R&B", "Soul", "Funk", "Neo-Soul"],
    defaultRating: 50,
  },

  // COUNTRY & FOLK
  {
    id: "country",
    name: "Country",
    icon: "🤠",
    description: "Country, bluegrass, and Americana",
    ticketmasterGenres: ["Country", "Bluegrass", "Country Folk", "Americana"],
    defaultRating: 50,
  },
  {
    id: "folk",
    name: "Folk",
    icon: "🪕",
    description: "Folk, singer-songwriter, and acoustic",
    ticketmasterGenres: ["Folk", "Singer-Songwriter", "Acoustic"],
    defaultRating: 50,
  },

  // JAZZ & BLUES
  {
    id: "jazz",
    name: "Jazz",
    icon: "🎺",
    description: "Jazz, swing, bebop, and fusion",
    ticketmasterGenres: ["Jazz", "Swing", "Bebop", "Jazz Fusion"],
    defaultRating: 50,
  },
  {
    id: "blues",
    name: "Blues",
    icon: "🎹",
    description: "Blues, blues rock, and rhythm & blues",
    ticketmasterGenres: ["Blues", "Blues Rock"],
    defaultRating: 50,
  },

  // CLASSICAL & OPERA
  {
    id: "classical",
    name: "Classical",
    icon: "🎻",
    description: "Classical music, orchestral, and chamber",
    ticketmasterGenres: ["Classical", "Orchestral", "Chamber Music", "Symphony"],
    defaultRating: 50,
  },
  {
    id: "opera",
    name: "Opera",
    icon: "🎭",
    description: "Opera, operetta, and musical theatre",
    ticketmasterGenres: ["Opera", "Operetta"],
    defaultRating: 50,
  },

  // LATIN & WORLD
  {
    id: "latin",
    name: "Latin",
    icon: "💃",
    description: "Latin, reggaeton, salsa, and Spanish music",
    ticketmasterGenres: ["Latin", "Reggaeton", "Salsa", "Latin Pop"],
    defaultRating: 50,
  },
  {
    id: "world",
    name: "World",
    icon: "🌍",
    description: "World music, international, and cultural",
    ticketmasterGenres: ["World", "World Music", "International"],
    defaultRating: 50,
  },
  {
    id: "reggae",
    name: "Reggae",
    icon: "🎶",
    description: "Reggae, ska, and Caribbean music",
    ticketmasterGenres: ["Reggae", "Ska", "Caribbean"],
    defaultRating: 50,
  },

  // SPECIAL CATEGORIES
  {
    id: "oldies-classics",
    name: "Oldies & Classics",
    icon: "📻",
    description: "Classic hits, oldies, and retro music",
    ticketmasterGenres: ["Oldies & Classics", "Classic Hits", "Retro"],
    defaultRating: 50,
  },
  {
    id: "christian-gospel",
    name: "Christian/Gospel",
    icon: "⛪",
    description: "Christian music, gospel, and worship",
    ticketmasterGenres: ["Christian", "Gospel", "Contemporary Christian"],
    defaultRating: 50,
  },
  {
    id: "other",
    name: "Other",
    icon: "🎵",
    description: "Other music genres and experimental",
    ticketmasterGenres: ["Other", "Undefined", "Miscellaneous"],
    defaultRating: 50,
  },
];

/**
 * Get genre configuration by ID
 */
export function getGenreById(id: string): MusicGenre | undefined {
  return MUSIC_GENRES.find((genre) => genre.id === id);
}

/**
 * Get genre configuration by Ticketmaster genre name
 */
export function getGenreByTicketmasterName(ticketmasterGenre: string): MusicGenre | undefined {
  return MUSIC_GENRES.find((genre) =>
    genre.ticketmasterGenres.some(
      (tm) => tm.toLowerCase() === ticketmasterGenre.toLowerCase()
    )
  );
}

/**
 * Default music genre affinities (all genres at 50)
 */
export function getDefaultMusicGenreAffinities(): Record<string, number> {
  const affinities: Record<string, number> = {};
  MUSIC_GENRES.forEach((genre) => {
    affinities[genre.id] = genre.defaultRating;
  });
  return affinities;
}

/**
 * Calculate genre affinity score for an event
 * @param eventGenres - Array of Ticketmaster genre names from the event
 * @param userAffinities - User's music genre affinities (0-100)
 * @returns Affinity score (0-100)
 */
export function calculateGenreAffinityScore(
  eventGenres: string[],
  userAffinities: Record<string, number>
): number {
  if (!eventGenres || eventGenres.length === 0) {
    return 50; // Neutral score if no genre data
  }

  // Find all matching genres and get their affinity scores
  const scores: number[] = [];

  eventGenres.forEach((eventGenre) => {
    const matchedGenre = getGenreByTicketmasterName(eventGenre);
    if (matchedGenre && userAffinities[matchedGenre.id] !== undefined) {
      scores.push(userAffinities[matchedGenre.id]);
    }
  });

  if (scores.length === 0) {
    return 50; // Neutral score if no matches
  }

  // Return average affinity score
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average);
}

/**
 * Filter threshold: events below this score will be filtered out
 * Can be configured by user (default: 20)
 */
export const DEFAULT_GENRE_FILTER_THRESHOLD = 20;
