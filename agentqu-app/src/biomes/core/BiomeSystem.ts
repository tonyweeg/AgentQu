/**
 * BiomeSystem - Main orchestrator for the biome background system
 * Singleton pattern for managing biome state across the application
 */

import { Location } from '../../lib/types';
import { BiomeDetector, BiomeType } from './BiomeDetector';
import { BiomeFactory } from './BiomeFactory';
import { Biome } from '../types/Biome';

interface BiomeState {
  currentBiome: Biome | null;
  biomeType: BiomeType | null;
  location: Location | null;
  state?: string | null;
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
}

export class BiomeSystem {
  private static instance: BiomeSystem;
  private factory: BiomeFactory;
  private state: BiomeState;
  private listeners: Set<(state: BiomeState) => void>;

  private constructor() {
    this.factory = BiomeFactory.getInstance();
    this.state = {
      currentBiome: null,
      biomeType: null,
      location: null,
      timeOfDay: this.calculateTimeOfDay(),
    };
    this.listeners = new Set();

    // Update time of day every 15 minutes
    setInterval(() => {
      this.updateTimeOfDay();
    }, 15 * 60 * 1000);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BiomeSystem {
    if (!BiomeSystem.instance) {
      BiomeSystem.instance = new BiomeSystem();
    }
    return BiomeSystem.instance;
  }

  /**
   * Update location and detect new biome
   */
  public async updateLocation(location: Location, state?: string | null): Promise<void> {
    // Detect biome type
    const detection = await BiomeDetector.detectBiome(location, state);

    // Create new biome instance if type changed
    if (detection.biomeType !== this.state.biomeType) {
      const newBiome = this.factory.createBiome(detection.biomeType);

      this.state = {
        ...this.state,
        currentBiome: newBiome,
        biomeType: detection.biomeType,
        location,
        state: state || detection.metadata.state,
      };

      console.log(`🌍 Biome updated: ${detection.biomeType} (${this.state.state || 'unknown state'})`);
      this.notifyListeners();
    }
  }

  /**
   * Get current biome
   */
  public getCurrentBiome(): Biome | null {
    return this.state.currentBiome;
  }

  /**
   * Get current biome type
   */
  public getCurrentBiomeType(): BiomeType | null {
    return this.state.biomeType;
  }

  /**
   * Get current state
   */
  public getState(): BiomeState {
    return { ...this.state };
  }

  /**
   * Calculate time of day based on current hour
   */
  private calculateTimeOfDay(): 'dawn' | 'day' | 'dusk' | 'night' {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  }

  /**
   * Update time of day
   */
  private updateTimeOfDay(): void {
    const newTimeOfDay = this.calculateTimeOfDay();

    if (newTimeOfDay !== this.state.timeOfDay) {
      this.state = {
        ...this.state,
        timeOfDay: newTimeOfDay,
      };

      console.log(`🌅 Time of day updated: ${newTimeOfDay}`);
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to biome state changes
   */
  public subscribe(listener: (state: BiomeState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Render current biome as SVG
   */
  public renderBiome(width: number, height: number): string {
    if (!this.state.currentBiome) {
      return this.getDefaultSVG(width, height);
    }

    return this.state.currentBiome.render(width, height, this.state.timeOfDay);
  }

  /**
   * Get default SVG fallback
   */
  private getDefaultSVG(width: number, height: number): string {
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="default-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#A8E6CF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#default-gradient)" />
      </svg>
    `;
  }
}
