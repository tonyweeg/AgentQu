/**
 * Desert Biome Variations
 * Sonoran, Mojave, Great Basin, Chihuahuan
 */

import { Biome } from './Biome';

/**
 * Sonoran Desert Biome (Arizona, California, parts of Mexico)
 */
export class SonoranDesertBiome extends Biome {
  constructor() {
    super({
      name: 'Sonoran Desert',
      type: 'desert_sonoran',
      palette: {
        sky: { start: '#F9E0C7', end: '#E8C4A0' },
        background: { start: '#D4A574', end: '#B8864C' }, // Distant dunes
        midground: { start: '#A67C52', end: '#8B6341' }, // Mid-range terrain
        foreground: { start: '#7A5230', end: '#5C3D22' }, // Near ground
        accent: '#3A5F3A', // Saguaro cacti green
      },
      timeVariations: {
        dawn: {
          sky: { start: '#FFD4A3', end: '#FFB88C' },
        },
        dusk: {
          sky: { start: '#FF8C69', end: '#D2691E' },
        },
        night: {
          sky: { start: '#1C1C3C', end: '#2C3E50' },
          background: { start: '#3D2817', end: '#2A1810' },
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Desert floor with rolling terrain
    layers.push(`
      <path d="M 0 ${height * 0.7} Q ${width * 0.25} ${height * 0.68}, ${width * 0.5} ${height * 0.7} T ${width} ${height * 0.7} V ${height} H 0 Z"
            fill="${this.palette.background.start}" opacity="0.6" />
    `);

    // Mid-range sandy hills
    layers.push(`
      <path d="M 0 ${height * 0.75} Q ${width * 0.3} ${height * 0.73}, ${width * 0.6} ${height * 0.75} T ${width} ${height * 0.75} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" opacity="0.8" />
    `);

    // Foreground terrain
    layers.push(`
      <path d="M 0 ${height * 0.8} Q ${width * 0.4} ${height * 0.78}, ${width * 0.7} ${height * 0.8} T ${width} ${height * 0.8} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Iconic Saguaro cacti (multiple sizes)
    const cactiPositions = [
      { x: width * 0.15, y: height * 0.65, scale: 1.2 },
      { x: width * 0.3, y: height * 0.7, scale: 0.9 },
      { x: width * 0.65, y: height * 0.68, scale: 1.1 },
      { x: width * 0.8, y: height * 0.73, scale: 0.8 },
    ];

    cactiPositions.forEach(({ x, y, scale }) => {
      const baseWidth = 12 * scale;
      const height_cactus = 80 * scale;

      layers.push(`
        <!-- Saguaro Cactus -->
        <rect x="${x - baseWidth/2}" y="${y}" width="${baseWidth}" height="${height_cactus}" fill="${this.palette.accent}" rx="${baseWidth/2}" />
        <rect x="${x - baseWidth*2.5}" y="${y + height_cactus*0.3}" width="${baseWidth*0.8}" height="${height_cactus*0.6}" fill="${this.palette.accent}" rx="${baseWidth*0.4}" />
        <rect x="${x + baseWidth*1.2}" y="${y + height_cactus*0.4}" width="${baseWidth*0.8}" height="${height_cactus*0.5}" fill="${this.palette.accent}" rx="${baseWidth*0.4}" />
      `);
    });

    return layers;
  }
}

/**
 * Mojave Desert Biome (California, Nevada, Utah, Arizona)
 */
export class MojaveDesertBiome extends Biome {
  constructor() {
    super({
      name: 'Mojave Desert',
      type: 'desert_mojave',
      palette: {
        sky: { start: '#E8D4B8', end: '#D4B896' },
        background: { start: '#C9A882', end: '#A88860' }, // Sandy brown distant
        midground: { start: '#8B7355', end: '#6F5C45' },
        foreground: { start: '#5D4E37', end: '#4A3C2A' },
        accent: '#556B2F', // Joshua tree green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant mountains
    layers.push(`
      <polygon points="0,${height * 0.55} ${width * 0.2},${height * 0.45} ${width * 0.4},${height * 0.5} ${width * 0.6},${height * 0.48} ${width * 0.8},${height * 0.52} ${width},${height * 0.55} ${width},${height} 0,${height}"
               fill="${this.palette.background.start}" opacity="0.5" />
    `);

    // Sandy plains with sparse vegetation
    layers.push(`
      <path d="M 0 ${height * 0.72} Q ${width * 0.35} ${height * 0.7}, ${width * 0.65} ${height * 0.72} T ${width} ${height * 0.72} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Foreground with rock formations
    layers.push(`
      <path d="M 0 ${height * 0.82} Q ${width * 0.25} ${height * 0.8}, ${width * 0.5} ${height * 0.82} T ${width} ${height * 0.82} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Joshua Trees (iconic to Mojave)
    const joshuaPositions = [
      { x: width * 0.25, y: height * 0.68 },
      { x: width * 0.6, y: height * 0.7 },
      { x: width * 0.75, y: height * 0.75 },
    ];

    joshuaPositions.forEach(({ x, y }) => {
      layers.push(`
        <!-- Joshua Tree -->
        <rect x="${x - 8}" y="${y}" width="16" height="60" fill="${this.palette.accent}" />
        <polygon points="${x - 20},${y + 15} ${x - 8},${y + 10} ${x - 8},${y + 35}" fill="${this.palette.accent}" opacity="0.9" />
        <polygon points="${x + 20},${y + 20} ${x + 8},${y + 15} ${x + 8},${y + 40}" fill="${this.palette.accent}" opacity="0.9" />
        <polygon points="${x - 15},${y + 35} ${x - 8},${y + 30} ${x - 8},${y + 55}" fill="${this.palette.accent}" opacity="0.85" />
      `);
    });

    return layers;
  }
}

/**
 * Great Basin Desert Biome (Nevada, Utah, Oregon, Idaho)
 */
export class GreatBasinDesertBiome extends Biome {
  constructor() {
    super({
      name: 'Great Basin Desert',
      type: 'desert_great_basin',
      palette: {
        sky: { start: '#D4E4F0', end: '#B0C4D8' },
        background: { start: '#A8B8C0', end: '#8A9AA8' }, // Cool gray mountains
        midground: { start: '#7A8A98', end: '#5A6A78' },
        foreground: { start: '#4A5A68', end: '#3A4A58' },
        accent: '#8B9467', // Sagebrush green-gray
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant mountain ranges (multiple layers for depth)
    layers.push(`
      <polygon points="0,${height * 0.5} ${width * 0.25},${height * 0.4} ${width * 0.5},${height * 0.45} ${width * 0.75},${height * 0.42} ${width},${height * 0.48} ${width},${height} 0,${height}"
               fill="${this.palette.background.start}" opacity="0.4" />
    `);

    layers.push(`
      <polygon points="0,${height * 0.6} ${width * 0.3},${height * 0.5} ${width * 0.6},${height * 0.55} ${width},${height * 0.6} ${width},${height} 0,${height}"
               fill="${this.palette.background.end}" opacity="0.6" />
    `);

    // Basin floor with sagebrush
    layers.push(`
      <path d="M 0 ${height * 0.75} Q ${width * 0.5} ${height * 0.73}, ${width} ${height * 0.75} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Foreground terrain
    layers.push(`
      <path d="M 0 ${height * 0.85} Q ${width * 0.4} ${height * 0.83}, ${width * 0.8} ${height * 0.85} T ${width} ${height * 0.85} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Sagebrush (low bushes characteristic of Great Basin)
    for (let i = 0; i < 8; i++) {
      const x = width * (0.1 + i * 0.12);
      const y = height * (0.78 + Math.random() * 0.08);
      const size = 15 + Math.random() * 10;

      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.6}" fill="${this.palette.accent}" opacity="0.7" />
      `);
    }

    return layers;
  }
}

/**
 * Chihuahuan Desert Biome (New Mexico, Texas, parts of Mexico)
 */
export class ChihuahuanDesertBiome extends Biome {
  constructor() {
    super({
      name: 'Chihuahuan Desert',
      type: 'desert_chihuahuan',
      palette: {
        sky: { start: '#F5E6D3', end: '#E0D1BE' },
        background: { start: '#C8A882', end: '#A88860' }, // Tan/brown distant
        midground: { start: '#8B6F47', end: '#6F5938' },
        foreground: { start: '#5D4E37', end: '#4A3C2A' },
        accent: '#2F4F2F', // Ocotillo/Yucca dark green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant mesas and plateaus
    layers.push(`
      <rect x="${width * 0.1}" y="${height * 0.48}" width="${width * 0.18}" height="${height * 0.15}"
            fill="${this.palette.background.start}" opacity="0.5" />
      <rect x="${width * 0.55}" y="${height * 0.52}" width="${width * 0.22}" height="${height * 0.12}"
            fill="${this.palette.background.start}" opacity="0.5" />
    `);

    // Rolling hills
    layers.push(`
      <path d="M 0 ${height * 0.7} Q ${width * 0.3} ${height * 0.65}, ${width * 0.6} ${height * 0.7} T ${width} ${height * 0.7} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" opacity="0.8" />
    `);

    // Foreground terrain
    layers.push(`
      <path d="M 0 ${height * 0.78} Q ${width * 0.4} ${height * 0.76}, ${width * 0.7} ${height * 0.78} T ${width} ${height * 0.78} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Ocotillo plants (tall spindly desert plants)
    const ocotilloPositions = [
      { x: width * 0.2, y: height * 0.7 },
      { x: width * 0.45, y: height * 0.72 },
      { x: width * 0.7, y: height * 0.74 },
    ];

    ocotilloPositions.forEach(({ x, y }) => {
      // Multiple thin stalks
      for (let i = 0; i < 5; i++) {
        const offsetX = (i - 2) * 8;
        const height_stalk = 50 + Math.random() * 20;
        const curve = 10 + Math.random() * 10;

        layers.push(`
          <path d="M ${x + offsetX} ${y + height_stalk} Q ${x + offsetX + curve} ${y + height_stalk/2}, ${x + offsetX} ${y}"
                stroke="${this.palette.accent}" stroke-width="2" fill="none" opacity="0.8" />
        `);
      }
    });

    return layers;
  }
}
