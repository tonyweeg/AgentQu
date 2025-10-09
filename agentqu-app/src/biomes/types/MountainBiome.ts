/**
 * Mountain Biome Variations
 * Rockies, Appalachian, Sierra Nevada, etc.
 */

import { Biome } from './Biome';

/**
 * Rocky Mountains Biome (Colorado, Wyoming, Montana)
 */
export class RockyMountainsBiome extends Biome {
  constructor() {
    super({
      name: 'Rocky Mountains',
      type: 'mountain_rockies',
      palette: {
        sky: { start: '#D4E4F7', end: '#A5C8E8' },
        background: { start: '#B0C4DE', end: '#8FA8C7' }, // Distant peaks
        midground: { start: '#8B9CA3', end: '#5D6D7E' }, // Mid peaks
        foreground: { start: '#4A5A6A', end: '#2C3E50' }, // Near peaks
        accent: '#F0F4F8', // Snow caps
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant mountains (background)
    layers.push(`
      <polygon points="0,${height * 0.6} ${width * 0.2},${height * 0.4} ${width * 0.4},${height * 0.5} ${width * 0.6},${height * 0.45} ${width * 0.8},${height * 0.55} ${width},${height * 0.6} ${width},${height} 0,${height}"
               fill="${this.palette.background.start}" opacity="0.6" />
    `);

    // Mid-range mountains
    layers.push(`
      <polygon points="0,${height * 0.7} ${width * 0.3},${height * 0.5} ${width * 0.5},${height * 0.55} ${width * 0.7},${height * 0.5} ${width},${height * 0.65} ${width},${height} 0,${height}"
               fill="${this.palette.midground?.start}" opacity="0.8" />
    `);

    // Foreground mountains
    layers.push(`
      <polygon points="0,${height * 0.75} ${width * 0.25},${height * 0.6} ${width * 0.4},${height * 0.65} ${width * 0.6},${height * 0.55} ${width * 0.8},${height * 0.7} ${width},${height * 0.75} ${width},${height} 0,${height}"
               fill="${this.palette.foreground.start}" />
    `);

    // Snow caps
    layers.push(`
      <polygon points="${width * 0.25},${height * 0.6} ${width * 0.22},${height * 0.63} ${width * 0.28},${height * 0.63}"
               fill="${this.palette.accent}" />
      <polygon points="${width * 0.6},${height * 0.55} ${width * 0.57},${height * 0.58} ${width * 0.63},${height * 0.58}"
               fill="${this.palette.accent}" />
    `);

    // Pine trees (silhouettes)
    for (let i = 0; i < 5; i++) {
      const x = width * (0.15 + i * 0.15);
      const y = height * (0.75 + Math.random() * 0.05);
      layers.push(`
        <polygon points="${x},${y} ${x - 10},${y + 30} ${x + 10},${y + 30}"
                 fill="#1C4A2D" opacity="0.7" />
      `);
    }

    return layers;
  }
}

/**
 * Appalachian Mountains Biome (Virginia, North Carolina, Tennessee)
 */
export class AppalachianBiome extends Biome {
  constructor() {
    super({
      name: 'Appalachian Mountains',
      type: 'mountain_appalachian',
      palette: {
        sky: { start: '#E0E8E3', end: '#C3D3C8' },
        background: { start: '#9BB19F', end: '#7A9A7E' }, // Tree-covered hills
        midground: { start: '#6B8E6F', end: '#4A6B4E' },
        foreground: { start: '#3D5A40', end: '#2C4A2F' },
        accent: '#8FA88B', // Fog/mist
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Rolling ridges (background) - multiple layers for depth
    for (let i = 0; i < 4; i++) {
      const opacity = 0.3 + (i * 0.15);
      const yOffset = height * (0.5 + i * 0.1);

      layers.push(`
        <path d="M 0 ${yOffset} Q ${width * 0.25} ${yOffset - 30}, ${width * 0.5} ${yOffset} T ${width} ${yOffset} V ${height} H 0 Z"
              fill="${this.palette.background.start}" opacity="${opacity}" />
      `);
    }

    // Foreground ridge
    layers.push(`
      <path d="M 0 ${height * 0.7} Q ${width * 0.3} ${height * 0.65}, ${width * 0.6} ${height * 0.7} T ${width} ${height * 0.7} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Morning mist effect
    layers.push(`
      <ellipse cx="${width * 0.3}" cy="${height * 0.6}" rx="${width * 0.2}" ry="${height * 0.05}"
               fill="${this.palette.accent}" opacity="0.4" />
      <ellipse cx="${width * 0.7}" cy="${height * 0.65}" rx="${width * 0.15}" ry="${height * 0.04}"
               fill="${this.palette.accent}" opacity="0.3" />
    `);

    return layers;
  }
}

/**
 * Desert Mountains Biome (Nevada, Utah, Arizona)
 */
export class DesertMountainsBiome extends Biome {
  constructor() {
    super({
      name: 'Desert Mountains',
      type: 'mountain_desert',
      palette: {
        sky: { start: '#F9E0C7', end: '#E8C4A0' },
        background: { start: '#D4A574', end: '#B8864C' }, // Red rock distant
        midground: { start: '#A67C52', end: '#8B6341' },
        foreground: { start: '#7A5230', end: '#5C3D22' },
        accent: '#CD853F', // Sandy desert
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Mesa formations (background)
    layers.push(`
      <rect x="${width * 0.1}" y="${height * 0.45}" width="${width * 0.15}" height="${height * 0.15}"
            fill="${this.palette.background.start}" opacity="0.6" />
      <rect x="${width * 0.6}" y="${height * 0.5}" width="${width * 0.2}" height="${height * 0.12}"
            fill="${this.palette.background.start}" opacity="0.5" />
    `);

    // Jagged peaks (midground)
    layers.push(`
      <polygon points="${width * 0.3},${height * 0.7} ${width * 0.35},${height * 0.5} ${width * 0.4},${height * 0.55} ${width * 0.45},${height * 0.5} ${width * 0.5},${height * 0.7} ${width},${height} 0,${height}"
               fill="${this.palette.midground?.start}" opacity="0.8" />
    `);

    // Foreground rock formations
    layers.push(`
      <polygon points="0,${height * 0.8} ${width * 0.15},${height * 0.65} ${width * 0.25},${height * 0.7} ${width * 0.3},${height * 0.8} ${width},${height} 0,${height}"
               fill="${this.palette.foreground.start}" />
    `);

    // Saguaro cactus (iconic desert element)
    const cactusX = width * 0.75;
    const cactusY = height * 0.65;
    layers.push(`
      <!-- Saguaro Cactus -->
      <rect x="${cactusX}" y="${cactusY}" width="15" height="${height * 0.25}" fill="#3A5F3A" rx="7" />
      <rect x="${cactusX - 20}" y="${cactusY + 30}" width="12" height="60" fill="#3A5F3A" rx="6" />
      <rect x="${cactusX + 23}" y="${cactusY + 40}" width="12" height="50" fill="#3A5F3A" rx="6" />
    `);

    return layers;
  }
}
