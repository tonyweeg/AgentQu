/**
 * BiomeFactory - Creates biome instances based on type
 * Central registry for all biome classes
 */

import { Biome } from '../types/Biome';
import {
  SandyBeachBiome,
  RockyCoastBiome,
  TropicalCoastBiome,
} from '../types/CoastalBiome';
import {
  RockyMountainsBiome,
  AppalachianBiome,
  DesertMountainsBiome,
} from '../types/MountainBiome';
import {
  SonoranDesertBiome,
  MojaveDesertBiome,
  GreatBasinDesertBiome,
  ChihuahuanDesertBiome,
} from '../types/DesertBiome';
import {
  GreatPlainsBiome,
  TallgrassPrairieBiome,
  PalouseBiome,
  CentralValleyBiome,
  TexasHillCountryBiome,
} from '../types/PlainsBiome';
import {
  ConiferousForestBiome,
  DeciduousForestBiome,
  MixedForestBiome,
  TemperateRainforestBiome,
  BorealForestBiome,
  OakWoodlandBiome,
} from '../types/ForestBiome';
import {
  EvergladesBiome,
  BayouSwampBiome,
  GreatLakesShoreBiome,
  RiverValleyBiome,
  CoastalMarshBiome,
  SubtropicalHumidBiome,
} from '../types/WetlandBiome';
import {
  AlpineBiome,
  ArcticTundraBiome,
  UrbanSkylineBiome,
  VolcanicBiome,
  CanyonBiome,
  TropicalIslandBiome,
} from '../types/SpecialBiome';
import {
  CroplandBiome,
  OrchardBiome,
  VineyardBiome,
  RangelandBiome,
} from '../types/AgriculturalBiome';
import { BiomeType } from './BiomeDetector';

/**
 * Biome Factory - Singleton pattern
 */
export class BiomeFactory {
  private static instance: BiomeFactory;
  private biomeRegistry: Map<BiomeType, () => Biome>;

  private constructor() {
    this.biomeRegistry = new Map();
    this.registerBiomes();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BiomeFactory {
    if (!BiomeFactory.instance) {
      BiomeFactory.instance = new BiomeFactory();
    }
    return BiomeFactory.instance;
  }

  /**
   * Register all biome classes
   */
  private registerBiomes(): void {
    // Coastal biomes
    this.biomeRegistry.set('coastal_sandy', () => new SandyBeachBiome());
    this.biomeRegistry.set('coastal_rocky', () => new RockyCoastBiome());
    this.biomeRegistry.set('coastal_tropical', () => new TropicalCoastBiome());

    // Mountain biomes
    this.biomeRegistry.set('mountain_rockies', () => new RockyMountainsBiome());
    this.biomeRegistry.set('mountain_appalachian', () => new AppalachianBiome());
    this.biomeRegistry.set('mountain_desert', () => new DesertMountainsBiome());

    // Desert biomes
    this.biomeRegistry.set('desert_sonoran', () => new SonoranDesertBiome());
    this.biomeRegistry.set('desert_mojave', () => new MojaveDesertBiome());
    this.biomeRegistry.set('desert_great_basin', () => new GreatBasinDesertBiome());
    this.biomeRegistry.set('desert_chihuahuan', () => new ChihuahuanDesertBiome());

    // Plains biomes
    this.biomeRegistry.set('plains_great', () => new GreatPlainsBiome());
    this.biomeRegistry.set('plains_prairie', () => new TallgrassPrairieBiome());
    this.biomeRegistry.set('plains_palouse', () => new PalouseBiome());
    this.biomeRegistry.set('plains_central_valley', () => new CentralValleyBiome());
    this.biomeRegistry.set('plains_texas_hills', () => new TexasHillCountryBiome());

    // Forest biomes
    this.biomeRegistry.set('forest_coniferous', () => new ConiferousForestBiome());
    this.biomeRegistry.set('forest_deciduous', () => new DeciduousForestBiome());
    this.biomeRegistry.set('forest_mixed', () => new MixedForestBiome());
    this.biomeRegistry.set('forest_temperate_rainforest', () => new TemperateRainforestBiome());
    this.biomeRegistry.set('forest_boreal', () => new BorealForestBiome());
    this.biomeRegistry.set('forest_oak_woodland', () => new OakWoodlandBiome());

    // Wetland & Subtropical biomes
    this.biomeRegistry.set('wetland_everglades', () => new EvergladesBiome());
    this.biomeRegistry.set('wetland_bayou', () => new BayouSwampBiome());
    this.biomeRegistry.set('wetland_great_lakes', () => new GreatLakesShoreBiome());
    this.biomeRegistry.set('wetland_river_valley', () => new RiverValleyBiome());
    this.biomeRegistry.set('wetland_coastal_marsh', () => new CoastalMarshBiome());
    this.biomeRegistry.set('subtropical_humid', () => new SubtropicalHumidBiome());

    // Special & Unique biomes
    this.biomeRegistry.set('special_alpine', () => new AlpineBiome());
    this.biomeRegistry.set('special_arctic_tundra', () => new ArcticTundraBiome());
    this.biomeRegistry.set('special_urban', () => new UrbanSkylineBiome());
    this.biomeRegistry.set('special_volcanic', () => new VolcanicBiome());
    this.biomeRegistry.set('special_canyon', () => new CanyonBiome());
    this.biomeRegistry.set('special_tropical_island', () => new TropicalIslandBiome());

    // Agricultural & Rural biomes
    this.biomeRegistry.set('agricultural_cropland', () => new CroplandBiome());
    this.biomeRegistry.set('agricultural_orchard', () => new OrchardBiome());
    this.biomeRegistry.set('agricultural_vineyard', () => new VineyardBiome());
    this.biomeRegistry.set('agricultural_rangeland', () => new RangelandBiome());
  }

  /**
   * Create a biome instance by type
   */
  public createBiome(biomeType: BiomeType): Biome {
    const biomeConstructor = this.biomeRegistry.get(biomeType);

    if (!biomeConstructor) {
      console.warn(`Biome type '${biomeType}' not found, using default`);
      return new SandyBeachBiome(); // Default fallback
    }

    return biomeConstructor();
  }

  /**
   * Get all available biome types
   */
  public getAvailableBiomes(): BiomeType[] {
    return Array.from(this.biomeRegistry.keys());
  }

  /**
   * Check if biome type is registered
   */
  public hasBiome(biomeType: BiomeType): boolean {
    return this.biomeRegistry.has(biomeType);
  }

  /**
   * Register a custom biome (for extensibility)
   */
  public registerCustomBiome(biomeType: BiomeType, constructor: () => Biome): void {
    this.biomeRegistry.set(biomeType, constructor);
  }
}
