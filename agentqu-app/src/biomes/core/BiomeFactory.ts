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

    // TODO: Add more biome types as they're implemented
    // this.biomeRegistry.set('desert_sonoran', () => new SonoranDesertBiome());
    // this.biomeRegistry.set('desert_mojave', () => new MojaveDesertBiome());
    // this.biomeRegistry.set('plains_great', () => new GreatPlainsBiome());
    // this.biomeRegistry.set('plains_prairie', () => new PrairieBiome());
    // this.biomeRegistry.set('forest_coniferous', () => new ConiferousForestBiome());
    // this.biomeRegistry.set('forest_deciduous', () => new DeciduousForestBiome());
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
