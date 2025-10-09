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
