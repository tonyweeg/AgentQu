/**
 * Coastal Biome Variations
 * Sandy beaches, rocky coasts, barrier islands, etc.
 */

import { Biome } from './Biome';

/**
 * Sandy Beach Biome (Florida, California, North Carolina)
 */
export class SandyBeachBiome extends Biome {
  constructor() {
    super({
      name: 'Sandy Beach',
      type: 'coastal_sandy',
      palette: {
        sky: { start: '#E8F4F8', end: '#B8D4E3' },
        background: { start: '#7FB3D5', end: '#3D8AB8' }, // Ocean
        midground: { start: '#F5E6D3', end: '#E0C9A6' }, // Sand
        foreground: { start: '#D4C5A0', end: '#C0B090' }, // Dunes
        accent: '#A8D5BA', // Sea foam
      },
      timeVariations: {
        dawn: {
          sky: { start: '#FFE4B5', end: '#FFB6C1' },
        },
        dusk: {
          sky: { start: '#FF6B9D', end: '#C44569' },
        },
        night: {
          sky: { start: '#1C1C3C', end: '#2C3E50' },
          background: { start: '#1A4D6D', end: '#0F2C4D' },
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Ocean waves (background)
    layers.push(`
      <path d="M 0 ${height * 0.4} Q ${width * 0.25} ${height * 0.38}, ${width * 0.5} ${height * 0.4} T ${width} ${height * 0.4} V ${height} H 0 Z"
            fill="${this.palette.background.start}" opacity="0.9" />
    `);

    // Sand (midground)
    layers.push(`
      <path d="M 0 ${height * 0.6} Q ${width * 0.3} ${height * 0.58}, ${width * 0.6} ${height * 0.6} T ${width} ${height * 0.6} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" opacity="0.95" />
    `);

    // Sand dunes (foreground)
    layers.push(`
      <ellipse cx="${width * 0.2}" cy="${height * 0.75}" rx="${width * 0.15}" ry="${height * 0.1}"
               fill="${this.palette.foreground.start}" opacity="0.6" />
      <ellipse cx="${width * 0.7}" cy="${height * 0.8}" rx="${width * 0.2}" ry="${height * 0.12}"
               fill="${this.palette.foreground.start}" opacity="0.5" />
    `);

    // Seagulls (optional decorative elements)
    layers.push(`
      <path d="M ${width * 0.3} ${height * 0.25} Q ${width * 0.31} ${height * 0.24}, ${width * 0.32} ${height * 0.25}"
            stroke="#FFFFFF" stroke-width="2" fill="none" opacity="0.7" />
      <path d="M ${width * 0.6} ${height * 0.2} Q ${width * 0.61} ${height * 0.19}, ${width * 0.62} ${height * 0.2}"
            stroke="#FFFFFF" stroke-width="2" fill="none" opacity="0.6" />
    `);

    return layers;
  }
}

/**
 * Rocky Coast Biome (Maine, Oregon, Washington)
 */
export class RockyCoastBiome extends Biome {
  constructor() {
    super({
      name: 'Rocky Coast',
      type: 'coastal_rocky',
      palette: {
        sky: { start: '#D4E4F7', end: '#A5C8E8' },
        background: { start: '#3D5A80', end: '#1C3A5C' }, // Dark ocean
        midground: { start: '#8B9CA3', end: '#5D6D7E' }, // Rocks
        foreground: { start: '#4A5A6A', end: '#2C3E50' }, // Dark rocks
        accent: '#FFFFFF', // Foam
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Ocean (background)
    layers.push(`
      <path d="M 0 ${height * 0.5} Q ${width * 0.3} ${height * 0.48}, ${width * 0.6} ${height * 0.5} T ${width} ${height * 0.5} V ${height} H 0 Z"
            fill="${this.palette.background.start}" />
    `);

    // Rocky cliffs (midground)
    const rockPoints = [
      { x: width * 0.1, y: height * 0.6 },
      { x: width * 0.15, y: height * 0.5 },
      { x: width * 0.25, y: height * 0.55 },
      { x: width * 0.3, y: height },
      { x: 0, y: height },
    ];

    layers.push(`
      <polygon points="${rockPoints.map(p => `${p.x},${p.y}`).join(' ')}"
               fill="${this.palette.midground?.start}" />
    `);

    // Large rocks (foreground)
    layers.push(`
      <polygon points="${width * 0.6},${height * 0.7} ${width * 0.7},${height * 0.65} ${width * 0.75},${height} ${width * 0.55},${height}"
               fill="${this.palette.foreground.start}" />
      <polygon points="${width * 0.85},${height * 0.75} ${width * 0.95},${height * 0.7} ${width},${height} ${width * 0.8},${height}"
               fill="${this.palette.foreground.start}" opacity="0.9" />
    `);

    // Lighthouse (iconic landmark)
    layers.push(`
      <rect x="${width * 0.15}" y="${height * 0.35}" width="${width * 0.03}" height="${height * 0.15}"
            fill="#FFFFFF" stroke="#CC0000" stroke-width="2" />
      <polygon points="${width * 0.14},${height * 0.35} ${width * 0.165},${height * 0.3} ${width * 0.19},${height * 0.35}"
               fill="#CC0000" />
      <circle cx="${width * 0.165}" cy="${height * 0.32}" r="${width * 0.015}" fill="#FFFF00" opacity="0.8" />
    `);

    return layers;
  }

  getLandmarks(): string[] {
    return [
      `<!-- Rocky Coast Lighthouse -->`,
    ];
  }
}

/**
 * Tropical Coast Biome (Hawaii, Florida Keys)
 */
export class TropicalCoastBiome extends Biome {
  constructor() {
    super({
      name: 'Tropical Coast',
      type: 'coastal_tropical',
      palette: {
        sky: { start: '#87CEEB', end: '#4A90E2' },
        background: { start: '#00CED1', end: '#008B8B' }, // Turquoise ocean
        midground: { start: '#FFFAF0', end: '#F5DEB3' }, // White sand
        foreground: { start: '#228B22', end: '#006400' }, // Palm trees
        accent: '#FFD700', // Sun/tropical
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Crystal clear ocean
    layers.push(`
      <path d="M 0 ${height * 0.45} Q ${width * 0.5} ${height * 0.43}, ${width} ${height * 0.45} V ${height} H 0 Z"
            fill="${this.palette.background.start}" opacity="0.95" />
    `);

    // White sand beach
    layers.push(`
      <path d="M 0 ${height * 0.65} Q ${width * 0.4} ${height * 0.63}, ${width * 0.8} ${height * 0.65} T ${width} ${height * 0.65} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Palm trees (foreground)
    const palmX1 = width * 0.15;
    const palmX2 = width * 0.75;

    // Palm tree 1
    layers.push(`
      <!-- Palm Tree 1 -->
      <rect x="${palmX1 - 5}" y="${height * 0.5}" width="10" height="${height * 0.3}" fill="#8B4513" />
      <ellipse cx="${palmX1}" cy="${height * 0.5}" rx="40" ry="15" fill="${this.palette.foreground.start}" opacity="0.8" transform="rotate(-30 ${palmX1} ${height * 0.5})" />
      <ellipse cx="${palmX1}" cy="${height * 0.5}" rx="40" ry="15" fill="${this.palette.foreground.start}" opacity="0.8" transform="rotate(30 ${palmX1} ${height * 0.5})" />
      <ellipse cx="${palmX1}" cy="${height * 0.5}" rx="40" ry="15" fill="${this.palette.foreground.start}" opacity="0.8" />
    `);

    // Palm tree 2
    layers.push(`
      <!-- Palm Tree 2 -->
      <rect x="${palmX2 - 5}" y="${height * 0.55}" width="10" height="${height * 0.25}" fill="#8B4513" />
      <ellipse cx="${palmX2}" cy="${height * 0.55}" rx="35" ry="12" fill="${this.palette.foreground.start}" opacity="0.8" transform="rotate(-25 ${palmX2} ${height * 0.55})" />
      <ellipse cx="${palmX2}" cy="${height * 0.55}" rx="35" ry="12" fill="${this.palette.foreground.start}" opacity="0.8" transform="rotate(25 ${palmX2} ${height * 0.55})" />
      <ellipse cx="${palmX2}" cy="${height * 0.55}" rx="35" ry="12" fill="${this.palette.foreground.start}" opacity="0.8" />
    `);

    return layers;
  }
}
