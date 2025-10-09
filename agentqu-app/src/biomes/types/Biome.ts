/**
 * Base Biome Class (Abstract)
 * All biomes inherit from this class
 */

export interface ColorPalette {
  sky: { start: string; end: string };
  foreground: { start: string; end: string };
  midground?: { start: string; end: string };
  background: { start: string; end: string };
  accent?: string;
}

export interface BiomeConfig {
  name: string;
  type: string;
  palette: ColorPalette;
  timeVariations?: {
    dawn?: Partial<ColorPalette>;
    day?: Partial<ColorPalette>;
    dusk?: Partial<ColorPalette>;
    night?: Partial<ColorPalette>;
  };
}

export abstract class Biome {
  public readonly name: string;
  public readonly type: string;
  protected palette: ColorPalette;
  protected timeVariations: BiomeConfig['timeVariations'];

  constructor(config: BiomeConfig) {
    this.name = config.name;
    this.type = config.type;
    this.palette = config.palette;
    this.timeVariations = config.timeVariations;
  }

  /**
   * Get color palette adjusted for time of day
   */
  public getPalette(timeOfDay: 'dawn' | 'day' | 'dusk' | 'night' = 'day'): ColorPalette {
    if (this.timeVariations && this.timeVariations[timeOfDay]) {
      return {
        ...this.palette,
        ...this.timeVariations[timeOfDay],
      };
    }
    return this.palette;
  }

  /**
   * Generate SVG layers for this biome (abstract - must implement)
   */
  abstract generateLayers(width: number, height: number): string[];

  /**
   * Get landmark SVGs (optional - override in subclasses)
   */
  public getLandmarks(): string[] {
    return [];
  }

  /**
   * Get animation config (optional - override in subclasses)
   */
  public getAnimations(): { layer: number; animation: string }[] {
    return [];
  }

  /**
   * Render complete SVG background
   */
  public render(width: number, height: number, timeOfDay: 'dawn' | 'day' | 'dusk' | 'night' = 'day'): string {
    const palette = this.getPalette(timeOfDay);
    const layers = this.generateLayers(width, height);
    const landmarks = this.getLandmarks();

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Sky Gradient -->
        <defs>
          <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${palette.sky.start};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${palette.sky.end};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#sky-gradient)" />

        <!-- Biome Layers -->
        ${layers.join('\n')}

        <!-- Landmarks -->
        ${landmarks.join('\n')}
      </svg>
    `;
  }
}
