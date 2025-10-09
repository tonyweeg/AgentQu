/**
 * BiomeDetector - Analyzes location and determines appropriate biome
 * Uses state, elevation, distance to coast, and geographic features
 */

import { Location } from '../../lib/types';

export type BiomeType =
  | 'coastal_sandy'
  | 'coastal_rocky'
  | 'coastal_tropical'
  | 'mountain_rockies'
  | 'mountain_appalachian'
  | 'mountain_desert'
  | 'desert_sonoran'
  | 'desert_mojave'
  | 'desert_great_basin'
  | 'desert_chihuahuan'
  | 'plains_great'
  | 'plains_prairie'
  | 'plains_palouse'
  | 'plains_central_valley'
  | 'plains_texas_hills'
  | 'forest_coniferous'
  | 'forest_deciduous'
  | 'forest_mixed'
  | 'forest_temperate_rainforest'
  | 'forest_boreal'
  | 'forest_oak_woodland'
  | 'wetland_everglades'
  | 'wetland_bayou'
  | 'wetland_great_lakes'
  | 'wetland_river_valley'
  | 'wetland_coastal_marsh'
  | 'subtropical_humid'
  | 'special_alpine'
  | 'special_arctic_tundra'
  | 'special_urban'
  | 'special_volcanic'
  | 'special_canyon'
  | 'special_tropical_island';

interface BiomeDetectionResult {
  biomeType: BiomeType;
  confidence: number;
  metadata: {
    state?: string | null;
    elevation?: number;
    coastalDistance?: number;
    landmarks?: string[];
  };
}

/**
 * State-to-Biome mapping (primary classification)
 */
const STATE_BIOME_MAP: Record<string, BiomeType[]> = {
  // Coastal States
  FL: ['subtropical_humid', 'wetland_everglades', 'coastal_tropical', 'coastal_sandy'],
  CA: ['special_alpine', 'special_urban', 'forest_oak_woodland', 'plains_central_valley', 'coastal_sandy', 'coastal_rocky', 'mountain_desert'],
  NC: ['wetland_coastal_marsh', 'coastal_sandy', 'mountain_appalachian'],
  SC: ['wetland_coastal_marsh', 'coastal_sandy'],
  GA: ['wetland_coastal_marsh', 'coastal_sandy', 'subtropical_humid'],
  LA: ['wetland_bayou', 'wetland_coastal_marsh', 'coastal_sandy'],
  MS: ['wetland_bayou', 'coastal_sandy'],
  AL: ['wetland_bayou', 'coastal_sandy'],
  ME: ['forest_boreal', 'forest_coniferous', 'coastal_rocky'],
  OR: ['forest_temperate_rainforest', 'plains_palouse', 'coastal_rocky', 'mountain_rockies', 'forest_coniferous'],
  WA: ['forest_temperate_rainforest', 'plains_palouse', 'coastal_rocky', 'mountain_rockies', 'forest_coniferous'],
  HI: ['special_tropical_island', 'special_volcanic', 'coastal_tropical'],

  // Mountain States
  CO: ['special_alpine', 'mountain_rockies', 'forest_coniferous', 'plains_great'],
  WY: ['special_alpine', 'mountain_rockies', 'forest_coniferous', 'plains_great'],
  MT: ['special_alpine', 'mountain_rockies', 'forest_coniferous', 'plains_great'],
  ID: ['plains_palouse', 'mountain_rockies', 'forest_coniferous', 'desert_great_basin'],
  NV: ['desert_great_basin', 'desert_mojave', 'mountain_desert'],
  UT: ['special_canyon', 'desert_great_basin', 'desert_mojave', 'mountain_desert'],

  // Appalachian States
  VA: ['mountain_appalachian', 'forest_deciduous', 'forest_mixed'],
  WV: ['mountain_appalachian', 'forest_deciduous', 'forest_mixed'],
  TN: ['mountain_appalachian', 'forest_deciduous', 'forest_mixed'],
  KY: ['mountain_appalachian', 'forest_deciduous', 'forest_mixed'],

  // Desert States
  AZ: ['special_canyon', 'desert_sonoran', 'mountain_desert'],
  NM: ['desert_chihuahuan', 'desert_sonoran', 'mountain_desert'],
  TX: ['plains_texas_hills', 'desert_chihuahuan', 'plains_great'],

  // Plains States
  KS: ['plains_great', 'plains_prairie'],
  NE: ['plains_great', 'plains_prairie'],
  OK: ['plains_prairie', 'plains_great'],
  SD: ['special_canyon', 'plains_great', 'mountain_rockies'],
  ND: ['plains_great'],
  IA: ['wetland_river_valley', 'plains_prairie', 'plains_great'],
  IL: ['special_urban', 'wetland_river_valley', 'plains_prairie'],
  MO: ['wetland_river_valley', 'plains_prairie', 'plains_great'],
  AR: ['wetland_bayou', 'wetland_river_valley', 'plains_prairie'],

  // Forest & Wetland States
  MI: ['wetland_great_lakes', 'forest_deciduous', 'forest_mixed'],
  WI: ['wetland_great_lakes', 'forest_deciduous', 'forest_mixed'],
  MN: ['wetland_great_lakes', 'forest_boreal', 'forest_deciduous', 'plains_prairie'],
  OH: ['wetland_great_lakes', 'wetland_river_valley', 'forest_deciduous'],
  IN: ['wetland_river_valley', 'forest_deciduous'],
  NH: ['forest_mixed', 'forest_deciduous'],
  VT: ['forest_mixed', 'forest_deciduous'],
  AK: ['special_arctic_tundra', 'forest_boreal', 'forest_coniferous'],

  // Mid-Atlantic
  DE: ['coastal_sandy'], // Delaware - coastal
  MD: ['coastal_sandy', 'mountain_appalachian', 'forest_deciduous'],
  NJ: ['coastal_sandy', 'forest_deciduous'],
  NY: ['special_urban', 'coastal_rocky', 'mountain_appalachian', 'forest_deciduous', 'forest_mixed'],
  PA: ['mountain_appalachian', 'forest_deciduous', 'forest_mixed'],
};

/**
 * Elevation thresholds (in meters)
 */
const ELEVATION_THRESHOLDS = {
  COASTAL: 50,
  PLAINS: 500,
  FOOTHILLS: 1000,
  MOUNTAINS: 2000,
  HIGH_MOUNTAINS: 3000,
};

export class BiomeDetector {
  /**
   * Detect biome from location data
   */
  public static async detectBiome(
    location: Location,
    state?: string | null,
    elevation?: number
  ): Promise<BiomeDetectionResult> {
    // 1. Get state-based biome options
    const stateBiomes = state ? STATE_BIOME_MAP[state] || [] : [];

    // 2. If we have elevation data, refine selection
    if (elevation !== undefined) {
      return this.detectByElevation(stateBiomes, elevation, state);
    }

    // 3. If we have state but no elevation, use distance to coast heuristic
    if (state) {
      const coastalDistance = await this.estimateCoastalDistance(location);
      return this.detectByCoastalDistance(stateBiomes, coastalDistance, state);
    }

    // 4. Fallback to generic biome based on lat/lng
    return this.detectByLatLng(location);
  }

  /**
   * Detect biome based on elevation
   */
  private static detectByElevation(
    stateBiomes: BiomeType[],
    elevation: number,
    state?: string | null
  ): BiomeDetectionResult {
    // High mountains
    if (elevation > ELEVATION_THRESHOLDS.HIGH_MOUNTAINS) {
      const mountainBiome = stateBiomes.find(b => b.includes('mountain')) || 'mountain_rockies';
      return {
        biomeType: mountainBiome as BiomeType,
        confidence: 0.95,
        metadata: { state, elevation },
      };
    }

    // Mountains
    if (elevation > ELEVATION_THRESHOLDS.MOUNTAINS) {
      const mountainBiome = stateBiomes.find(b => b.includes('mountain')) || 'mountain_appalachian';
      return {
        biomeType: mountainBiome as BiomeType,
        confidence: 0.9,
        metadata: { state, elevation },
      };
    }

    // Foothills
    if (elevation > ELEVATION_THRESHOLDS.FOOTHILLS) {
      const hillBiome = stateBiomes.find(b => b.includes('mountain') || b.includes('forest')) || 'forest_deciduous';
      return {
        biomeType: hillBiome as BiomeType,
        confidence: 0.8,
        metadata: { state, elevation },
      };
    }

    // Plains/Low elevation
    if (elevation > ELEVATION_THRESHOLDS.PLAINS) {
      const plainsBiome = stateBiomes.find(b => b.includes('plains') || b.includes('desert')) || 'plains_great';
      return {
        biomeType: plainsBiome as BiomeType,
        confidence: 0.85,
        metadata: { state, elevation },
      };
    }

    // Coastal/Sea level
    const coastalBiome = stateBiomes.find(b => b.includes('coastal')) || 'coastal_sandy';
    return {
      biomeType: coastalBiome as BiomeType,
      confidence: 0.75,
      metadata: { state, elevation },
    };
  }

  /**
   * Detect biome based on distance to coast
   */
  private static detectByCoastalDistance(
    stateBiomes: BiomeType[],
    coastalDistance: number,
    state?: string | null
  ): BiomeDetectionResult {
    // Near coast (<50 miles)
    if (coastalDistance < 80000) { // ~50 miles in meters
      const coastalBiome = stateBiomes.find(b => b.includes('coastal')) || 'coastal_sandy';
      return {
        biomeType: coastalBiome as BiomeType,
        confidence: 0.85,
        metadata: { state, coastalDistance },
      };
    }

    // Inland - use first non-coastal biome from state list
    const inlandBiome = stateBiomes.find(b => !b.includes('coastal')) || 'plains_great';
    return {
      biomeType: inlandBiome as BiomeType,
      confidence: 0.75,
      metadata: { state, coastalDistance },
    };
  }

  /**
   * Detect biome based on lat/lng (fallback)
   */
  private static detectByLatLng(location: Location): BiomeDetectionResult {
    const { lat, lng } = location;

    // Tropical (Florida, Hawaii) - lat < 30
    if (lat < 30 && lat > 20) {
      return {
        biomeType: 'coastal_tropical',
        confidence: 0.6,
        metadata: {},
      };
    }

    // Northern states (lat > 45) - likely forest
    if (lat > 45) {
      return {
        biomeType: 'forest_coniferous',
        confidence: 0.6,
        metadata: {},
      };
    }

    // Western states (lng < -100) - likely mountains/desert
    if (lng < -100) {
      return {
        biomeType: 'mountain_rockies',
        confidence: 0.5,
        metadata: {},
      };
    }

    // Default to plains
    return {
      biomeType: 'plains_great',
      confidence: 0.5,
      metadata: {},
    };
  }

  /**
   * Estimate distance to nearest coast (approximate)
   */
  private static async estimateCoastalDistance(location: Location): Promise<number> {
    // Simplified coastal distance estimation
    // In production, this would use a coastal distance API or pre-computed dataset

    const { lat, lng } = location;

    // East Coast approximation
    if (lng > -80) {
      const distToAtlantic = Math.abs(lng + 75) * 111000; // Rough conversion to meters
      return distToAtlantic;
    }

    // West Coast approximation
    if (lng < -115) {
      const distToPacific = Math.abs(lng + 120) * 111000;
      return distToPacific;
    }

    // Gulf Coast approximation
    if (lat < 35 && lng > -100 && lng < -80) {
      const distToGulf = Math.abs(lat - 29) * 111000;
      return distToGulf;
    }

    // Far inland
    return 500000; // 500km default for inland locations
  }

  /**
   * Get elevation from Google Elevation API (optional integration)
   */
  public static async getElevation(location: Location): Promise<number | undefined> {
    // This would call Google Elevation API in production
    // For now, return undefined and rely on other detection methods
    return undefined;
  }
}
