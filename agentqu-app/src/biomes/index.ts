/**
 * Biome System - Public API
 * Clean exports for easy integration
 */

// Core system
export { BiomeSystem } from './core/BiomeSystem';
export { BiomeDetector } from './core/BiomeDetector';
export { BiomeFactory } from './core/BiomeFactory';

// React component
export { default as BiomeRenderer } from './core/BiomeRenderer';

// Base types
export type { Biome, ColorPalette, BiomeConfig } from './types/Biome';
export type { BiomeType } from './core/BiomeDetector';

// Biome classes (for advanced usage)
export * from './types/CoastalBiome';
export * from './types/MountainBiome';
export * from './types/DesertBiome';
export * from './types/PlainsBiome';
export * from './types/ForestBiome';
export * from './types/WetlandBiome';
export * from './types/SpecialBiome';
export * from './types/AgriculturalBiome';
export * from './types/CoastalVariationsBiome';
export * from './types/AridVariationsBiome';
export * from './types/RegionalMountainBiome';
export * from './types/UniqueEcosystemBiome';
