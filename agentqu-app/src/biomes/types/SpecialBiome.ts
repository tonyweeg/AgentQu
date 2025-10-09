/**
 * Special & Unique Biome Variations
 * Alpine, Tundra, Urban, Volcanic, Canyon, Badlands, Island
 */

import { Biome } from './Biome';

/**
 * Alpine Biome (High elevation mountains - CO, WY, MT, CA)
 */
export class AlpineBiome extends Biome {
  constructor() {
    super({
      name: 'Alpine',
      type: 'special_alpine',
      palette: {
        sky: { start: '#B0C8E0', end: '#90A8C0' },
        background: { start: '#C0D0E0', end: '#A0B0C0' }, // Distant peaks
        midground: { start: '#8090A0', end: '#607080' }, // Rocky slopes
        foreground: { start: '#505060', end: '#303040' }, // Near rocks
        accent: '#F0F4F8', // Snow/ice
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Jagged peaks (background) - above treeline
    layers.push(`
      <polygon points="${width * 0.2},${height * 0.4} ${width * 0.25},${height * 0.3} ${width * 0.3},${height * 0.35} ${width * 0.35},${height * 0.28} ${width * 0.4},${height * 0.4} ${width},${height * 0.4} ${width},${height} 0,${height} 0,${height * 0.4}"
               fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // Snow caps on peaks
    layers.push(`
      <polygon points="${width * 0.25},${height * 0.3} ${width * 0.23},${height * 0.33} ${width * 0.27},${height * 0.33}"
               fill="${this.palette.accent}" />
      <polygon points="${width * 0.35},${height * 0.28} ${width * 0.33},${height * 0.31} ${width * 0.37},${height * 0.31}"
               fill="${this.palette.accent}" />
    `);

    // Rocky slopes (midground)
    layers.push(`
      <polygon points="0,${height * 0.6} ${width * 0.3},${height * 0.5} ${width * 0.6},${height * 0.55} ${width},${height * 0.6} ${width},${height} 0,${height}"
               fill="${this.palette.midground?.start}" />
    `);

    // Alpine tundra (low vegetation)
    layers.push(`
      <path d="M 0 ${height * 0.75} Q ${width * 0.5} ${height * 0.73}, ${width} ${height * 0.75} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Snow patches on ground
    for (let i = 0; i < 5; i++) {
      const x = width * (0.2 + i * 0.15);
      const y = height * (0.78 + Math.random() * 0.05);
      const size = 20 + Math.random() * 15;

      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.6}" fill="${this.palette.accent}" opacity="0.8" />
      `);
    }

    return layers;
  }
}

/**
 * Arctic Tundra Biome (Alaska, far northern states)
 */
export class ArcticTundraBiome extends Biome {
  constructor() {
    super({
      name: 'Arctic Tundra',
      type: 'special_arctic_tundra',
      palette: {
        sky: { start: '#D0E0F0', end: '#B0C0D0' },
        background: { start: '#E0E8F0', end: '#C0C8D0' }, // Ice/snow horizon
        midground: { start: '#B0B8C0', end: '#9098A0' }, // Frozen ground
        foreground: { start: '#808890', end: '#606870' }, // Near terrain
        accent: '#FFFFFF', // Bright snow/ice
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant ice fields
    layers.push(`
      <rect x="0" y="${height * 0.55}" width="${width}" height="${height * 0.05}"
            fill="${this.palette.background.start}" opacity="0.9" />
    `);

    // Frozen tundra (midground)
    layers.push(`
      <path d="M 0 ${height * 0.65} Q ${width * 0.5} ${height * 0.63}, ${width} ${height * 0.65} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Foreground with ice patches
    layers.push(`
      <path d="M 0 ${height * 0.78} Q ${width * 0.4} ${height * 0.76}, ${width * 0.8} ${height * 0.78} T ${width} ${height * 0.78} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Ice formations
    for (let i = 0; i < 6; i++) {
      const x = width * (0.15 + i * 0.15);
      const y = height * 0.72;
      const iceHeight = 20 + Math.random() * 15;

      layers.push(`
        <polygon points="${x},${y + iceHeight} ${x - 10},${y + iceHeight} ${x - 5},${y} ${x + 5},${y} ${x + 10},${y + iceHeight}"
                 fill="${this.palette.accent}" opacity="0.7" />
      `);
    }

    // Low tundra plants (sparse)
    for (let i = 0; i < 8; i++) {
      const x = width * (0.1 + i * 0.11);
      const y = height * (0.8 + Math.random() * 0.05);

      layers.push(`
        <circle cx="${x}" cy="${y}" r="5" fill="#4A5A4A" opacity="0.6" />
      `);
    }

    return layers;
  }
}

/**
 * Urban Skyline Biome (Major cities - NYC, Chicago, LA, etc.)
 */
export class UrbanSkylineBiome extends Biome {
  constructor() {
    super({
      name: 'Urban Skyline',
      type: 'special_urban',
      palette: {
        sky: { start: '#B8C8D8', end: '#98A8B8' },
        background: { start: '#8898A8', end: '#687888' }, // Distant buildings
        midground: { start: '#586878', end: '#485868' }, // Mid buildings
        foreground: { start: '#384858', end: '#283848' }, // Near buildings
        accent: '#F8C848', // City lights/windows
      },
      timeVariations: {
        dusk: {
          sky: { start: '#E88878', end: '#C86858' },
        },
        night: {
          sky: { start: '#1C2838', end: '#0C1828' },
          background: { start: '#2A3A4A', end: '#1A2A3A' },
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant skyline
    for (let i = 0; i < 8; i++) {
      const x = width * (i * 0.125);
      const buildingWidth = width * (0.08 + Math.random() * 0.06);
      const buildingHeight = height * (0.3 + Math.random() * 0.15);
      const y = height * 0.6;

      layers.push(`
        <rect x="${x}" y="${y - buildingHeight}" width="${buildingWidth}" height="${buildingHeight}"
              fill="${this.palette.background.start}" opacity="0.6" />
      `);
    }

    // Mid-range buildings
    for (let i = 0; i < 6; i++) {
      const x = width * (0.1 + i * 0.15);
      const buildingWidth = width * (0.09 + Math.random() * 0.05);
      const buildingHeight = height * (0.35 + Math.random() * 0.2);
      const y = height * 0.7;

      layers.push(`
        <rect x="${x}" y="${y - buildingHeight}" width="${buildingWidth}" height="${buildingHeight}"
              fill="${this.palette.midground?.start}" opacity="0.8" />
      `);

      // Windows
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 3; col++) {
          const windowX = x + col * (buildingWidth / 4) + buildingWidth * 0.15;
          const windowY = y - buildingHeight + row * (buildingHeight / 10);

          layers.push(`
            <rect x="${windowX}" y="${windowY}" width="4" height="6" fill="${this.palette.accent}" opacity="0.7" />
          `);
        }
      }
    }

    // Foreground skyscrapers
    for (let i = 0; i < 3; i++) {
      const x = width * (0.25 + i * 0.25);
      const buildingWidth = width * 0.12;
      const buildingHeight = height * (0.5 + Math.random() * 0.15);
      const y = height * 0.8;

      layers.push(`
        <rect x="${x}" y="${y - buildingHeight}" width="${buildingWidth}" height="${buildingHeight}"
              fill="${this.palette.foreground.start}" />
      `);
    }

    return layers;
  }
}

/**
 * Volcanic/Geothermal Biome (Hawaii, Yellowstone)
 */
export class VolcanicBiome extends Biome {
  constructor() {
    super({
      name: 'Volcanic',
      type: 'special_volcanic',
      palette: {
        sky: { start: '#D8C8B8', end: '#B8A898' },
        background: { start: '#8A7A6A', end: '#6A5A4A' }, // Volcanic rock
        midground: { start: '#5A4A3A', end: '#4A3A2A' }, // Lava rock
        foreground: { start: '#3A2A1A', end: '#2A1A0A' }, // Near terrain
        accent: '#FF6B3D', // Lava glow
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Volcanic cone (background)
    layers.push(`
      <polygon points="${width * 0.5},${height * 0.35} ${width * 0.3},${height * 0.6} ${width * 0.7},${height * 0.6}"
               fill="${this.palette.background.start}" opacity="0.8" />
    `);

    // Lava glow at crater
    layers.push(`
      <ellipse cx="${width * 0.5}" cy="${height * 0.38}" rx="30" ry="15" fill="${this.palette.accent}" opacity="0.6" />
    `);

    // Lava rock field (midground)
    layers.push(`
      <path d="M 0 ${height * 0.7} Q ${width * 0.5} ${height * 0.68}, ${width} ${height * 0.7} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Foreground lava rocks
    layers.push(`
      <path d="M 0 ${height * 0.8} Q ${width * 0.4} ${height * 0.78}, ${width * 0.8} ${height * 0.8} T ${width} ${height * 0.8} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Lava cracks/fissures (glowing)
    const fissures = [
      { x: width * 0.2, y: height * 0.75, length: 40 },
      { x: width * 0.6, y: height * 0.78, length: 50 },
    ];

    fissures.forEach(({ x, y, length }) => {
      layers.push(`
        <path d="M ${x} ${y} Q ${x + 20} ${y + length/2}, ${x + 10} ${y + length}"
              stroke="${this.palette.accent}" stroke-width="3" fill="none" opacity="0.7" />
      `);
    });

    // Steam vents
    for (let i = 0; i < 3; i++) {
      const x = width * (0.3 + i * 0.2);
      const y = height * 0.72;

      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="15" ry="30" fill="#FFFFFF" opacity="0.3" />
      `);
    }

    return layers;
  }
}

/**
 * Canyon/Badlands Biome (Grand Canyon, Badlands - AZ, UT, SD)
 */
export class CanyonBiome extends Biome {
  constructor() {
    super({
      name: 'Canyon',
      type: 'special_canyon',
      palette: {
        sky: { start: '#E8D8C8', end: '#C8B8A8' },
        background: { start: '#D4A474', end: '#B48454' }, // Red rock distant
        midground: { start: '#A47444', end: '#846434' }, // Mid canyon walls
        foreground: { start: '#745434', end: '#544424' }, // Near canyon
        accent: '#FF8858', // Sunset glow on rocks
      },
      timeVariations: {
        dusk: {
          sky: { start: '#FF9878', end: '#D87858' },
          accent: '#FFB88C',
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant canyon walls (layered horizontal strata)
    for (let i = 0; i < 6; i++) {
      const y = height * (0.45 + i * 0.04);
      const opacity = 0.4 + (i * 0.1);

      layers.push(`
        <rect x="0" y="${y}" width="${width}" height="${height * 0.04}"
              fill="${this.palette.background.start}" opacity="${opacity}" />
      `);
    }

    // Canyon walls (steep sides)
    layers.push(`
      <!-- Left wall -->
      <polygon points="0,${height * 0.5} ${width * 0.25},${height * 0.7} ${width * 0.25},${height} 0,${height}"
               fill="${this.palette.midground?.start}" opacity="0.9" />
      <!-- Right wall -->
      <polygon points="${width},${height * 0.5} ${width * 0.75},${height * 0.7} ${width * 0.75},${height} ${width},${height}"
               fill="${this.palette.midground?.start}" opacity="0.9" />
    `);

    // Canyon floor/valley
    layers.push(`
      <rect x="${width * 0.25}" y="${height * 0.85}" width="${width * 0.5}" height="${height * 0.15}"
            fill="${this.palette.foreground.start}" />
    `);

    // Rock formations (hoodoos/pillars)
    const pillars = [
      { x: width * 0.35, height: height * 0.12 },
      { x: width * 0.5, height: height * 0.15 },
      { x: width * 0.65, height: height * 0.1 },
    ];

    pillars.forEach(({ x, height: pillarHeight }) => {
      const y = height * 0.85 - pillarHeight;
      layers.push(`
        <rect x="${x - 8}" y="${y}" width="16" height="${pillarHeight}" fill="${this.palette.midground?.end}" />
        <polygon points="${x - 12},${y} ${x},${y - 15} ${x + 12},${y}" fill="${this.palette.accent}" opacity="0.7" />
      `);
    });

    return layers;
  }
}

/**
 * Tropical Island Biome (Hawaii, US Virgin Islands, Puerto Rico)
 */
export class TropicalIslandBiome extends Biome {
  constructor() {
    super({
      name: 'Tropical Island',
      type: 'special_tropical_island',
      palette: {
        sky: { start: '#87CEEB', end: '#4A90E2' },
        background: { start: '#00CED1', end: '#008B8B' }, // Ocean
        midground: { start: '#FFFAF0', end: '#F5DEB3' }, // White sand
        foreground: { start: '#228B22', end: '#006400' }, // Tropical vegetation
        accent: '#FFD700', // Tropical flowers/sun
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Ocean horizon
    layers.push(`
      <rect x="0" y="${height * 0.45}" width="${width}" height="${height * 0.55}"
            fill="${this.palette.background.start}" opacity="0.95" />
    `);

    // Gentle waves
    for (let i = 0; i < 3; i++) {
      const y = height * (0.55 + i * 0.05);
      layers.push(`
        <path d="M 0 ${y} Q ${width * 0.25} ${y - 2}, ${width * 0.5} ${y} T ${width} ${y}"
              stroke="#FFFFFF" stroke-width="2" fill="none" opacity="0.5" />
      `);
    }

    // White sand beach
    layers.push(`
      <path d="M 0 ${height * 0.7} Q ${width * 0.5} ${height * 0.68}, ${width} ${height * 0.7} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Palm trees
    const palmPositions = [
      { x: width * 0.2, y: height * 0.65 },
      { x: width * 0.5, y: height * 0.68 },
      { x: width * 0.75, y: height * 0.66 },
    ];

    palmPositions.forEach(({ x, y }) => {
      // Trunk
      layers.push(`
        <rect x="${x - 6}" y="${y}" width="12" height="${height * 0.25}" fill="#8B4513" />
      `);

      // Fronds
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) - 30;
        const frondLength = 40;
        layers.push(`
          <ellipse cx="${x}" cy="${y}" rx="${frondLength}" ry="12"
                   fill="${this.palette.foreground.start}" opacity="0.8"
                   transform="rotate(${angle} ${x} ${y})" />
        `);
      }
    });

    return layers;
  }
}
