/**
 * Wetland & Subtropical Biome Variations
 * Everglades, Bayou/Swamp, Great Lakes Shore, River Valley, Marshes, Subtropical
 */

import { Biome } from './Biome';

/**
 * Everglades Biome (Florida - subtropical wetland)
 */
export class EvergladesBiome extends Biome {
  constructor() {
    super({
      name: 'Everglades',
      type: 'wetland_everglades',
      palette: {
        sky: { start: '#D0E0E8', end: '#B0C0D0' },
        background: { start: '#6A8A9A', end: '#5A7A8A' }, // Distant water/grass
        midground: { start: '#4A6A7A', end: '#3A5A6A' }, // Mid-range sawgrass
        foreground: { start: '#2A4A5A', end: '#1A3A4A' }, // Near vegetation
        accent: '#8FA87A', // Sawgrass green
      },
      timeVariations: {
        dawn: {
          sky: { start: '#FFD8C8', end: '#FFB8A8' },
        },
        dusk: {
          sky: { start: '#FF9878', end: '#D87858' },
        },
        night: {
          sky: { start: '#1C2838', end: '#0C1828' },
          background: { start: '#1A2A3A', end: '#0A1A2A' },
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant water horizon
    layers.push(`
      <rect x="0" y="${height * 0.55}" width="${width}" height="${height * 0.05}"
            fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // Sawgrass plains (characteristic of Everglades)
    layers.push(`
      <path d="M 0 ${height * 0.65} Q ${width * 0.5} ${height * 0.63}, ${width} ${height * 0.65} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.midground?.start}" opacity="0.8" />
    `);

    // Foreground wetland vegetation
    layers.push(`
      <path d="M 0 ${height * 0.75} Q ${width * 0.4} ${height * 0.73}, ${width * 0.8} ${height * 0.75} T ${width} ${height * 0.75} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Sawgrass clumps (tall grass in water)
    for (let i = 0; i < 10; i++) {
      const x = width * (0.1 + i * 0.09);
      const y = height * (0.68 + Math.random() * 0.1);
      const grassHeight = 40 + Math.random() * 20;

      // Grass blades
      for (let j = 0; j < 3; j++) {
        const bladeX = x + (j - 1) * 5;
        const sway = Math.random() * 8 - 4;
        layers.push(`
          <path d="M ${bladeX} ${y + grassHeight} Q ${bladeX + sway} ${y + grassHeight/2}, ${bladeX} ${y}"
                stroke="${this.palette.accent}" stroke-width="2" fill="none" opacity="0.7" />
        `);
      }
    }

    // Water reflections (subtle horizontal lines)
    for (let i = 0; i < 3; i++) {
      const y = height * (0.72 + i * 0.05);
      layers.push(`
        <line x1="0" y1="${y}" x2="${width}" y2="${y}"
              stroke="#FFFFFF" stroke-width="1" opacity="0.2" />
      `);
    }

    return layers;
  }
}

/**
 * Bayou/Swamp Biome (Louisiana, Mississippi, Alabama)
 */
export class BayouSwampBiome extends Biome {
  constructor() {
    super({
      name: 'Bayou Swamp',
      type: 'wetland_bayou',
      palette: {
        sky: { start: '#C8D8C8', end: '#A8B8A8' },
        background: { start: '#5A6A5A', end: '#4A5A4A' }, // Murky water
        midground: { start: '#3A4A3A', end: '#2A3A2A' }, // Dense vegetation
        foreground: { start: '#1A2A1A', end: '#0A1A0A' }, // Near vegetation
        accent: '#8A9A7A', // Spanish moss gray-green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Dark murky water
    layers.push(`
      <rect x="0" y="${height * 0.6}" width="${width}" height="${height * 0.4}"
            fill="${this.palette.background.start}" opacity="0.8" />
    `);

    // Cypress trees with wide bases
    const cypressTrees = [
      { x: width * 0.15, y: height * 0.55 },
      { x: width * 0.4, y: height * 0.6 },
      { x: width * 0.65, y: height * 0.58 },
      { x: width * 0.85, y: height * 0.62 },
    ];

    cypressTrees.forEach(({ x, y }) => {
      const treeHeight = 70 + Math.random() * 30;
      const baseWidth = 30 + Math.random() * 15;
      const topWidth = 25 + Math.random() * 10;

      // Cypress trunk (wider at base - "knees")
      layers.push(`
        <path d="M ${x - baseWidth/2} ${y + treeHeight} L ${x - topWidth/2} ${y} L ${x + topWidth/2} ${y} L ${x + baseWidth/2} ${y + treeHeight} Z"
              fill="${this.palette.midground?.start}" opacity="0.9" />
      `);

      // Spanish moss hanging down
      for (let i = 0; i < 3; i++) {
        const mossX = x + (i - 1) * 12;
        const mossLength = 20 + Math.random() * 15;
        const curvature = 5 + Math.random() * 5;

        layers.push(`
          <path d="M ${mossX} ${y + 10} Q ${mossX + curvature} ${y + 10 + mossLength/2}, ${mossX} ${y + 10 + mossLength}"
                stroke="${this.palette.accent}" stroke-width="3" fill="none" opacity="0.6" />
        `);
      }
    });

    // Lily pads on water surface
    for (let i = 0; i < 8; i++) {
      const x = width * (0.1 + Math.random() * 0.8);
      const y = height * (0.75 + Math.random() * 0.1);
      const size = 15 + Math.random() * 10;

      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.8}" fill="#3A5A3A" opacity="0.7" />
      `);
    }

    return layers;
  }
}

/**
 * Great Lakes Shore Biome (Michigan, Wisconsin, Minnesota, Ohio)
 */
export class GreatLakesShoreBiome extends Biome {
  constructor() {
    super({
      name: 'Great Lakes Shore',
      type: 'wetland_great_lakes',
      palette: {
        sky: { start: '#D0E0F0', end: '#B0C0D0' },
        background: { start: '#6A8AAA', end: '#5A7A9A' }, // Lake water
        midground: { start: '#A8B8C8', end: '#88A8B8' }, // Sandy/rocky shore
        foreground: { start: '#7A8A9A', end: '#6A7A8A' }, // Near shore
        accent: '#FFFFFF', // Foam/waves
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Vast lake (background)
    layers.push(`
      <rect x="0" y="${height * 0.5}" width="${width}" height="${height * 0.5}"
            fill="${this.palette.background.start}" opacity="0.9" />
    `);

    // Gentle waves
    for (let i = 0; i < 4; i++) {
      const y = height * (0.58 + i * 0.05);
      layers.push(`
        <path d="M 0 ${y} Q ${width * 0.25} ${y - 3}, ${width * 0.5} ${y} T ${width} ${y}"
              stroke="${this.palette.accent}" stroke-width="2" fill="none" opacity="0.4" />
      `);
    }

    // Sandy/rocky shoreline
    layers.push(`
      <path d="M 0 ${height * 0.7} Q ${width * 0.3} ${height * 0.68}, ${width * 0.6} ${height * 0.7} T ${width} ${height * 0.7} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Beach grass and dune vegetation
    for (let i = 0; i < 12; i++) {
      const x = width * (0.1 + i * 0.08);
      const y = height * (0.72 + Math.random() * 0.05);
      const grassHeight = 25 + Math.random() * 15;

      layers.push(`
        <path d="M ${x} ${y + grassHeight} Q ${x + 5} ${y + grassHeight/2}, ${x} ${y}"
              stroke="#6A7A5A" stroke-width="2" fill="none" opacity="0.6" />
      `);
    }

    // Lighthouse (optional iconic landmark)
    const lighthouseX = width * 0.8;
    const lighthouseY = height * 0.65;

    layers.push(`
      <!-- Lighthouse -->
      <rect x="${lighthouseX - 10}" y="${lighthouseY}" width="20" height="60"
            fill="#FFFFFF" stroke="#CC0000" stroke-width="2" />
      <polygon points="${lighthouseX - 15},${lighthouseY} ${lighthouseX},${lighthouseY - 10} ${lighthouseX + 15},${lighthouseY}"
               fill="#CC0000" />
      <circle cx="${lighthouseX}" cy="${lighthouseY - 5}" r="5" fill="#FFFF00" opacity="0.8" />
    `);

    return layers;
  }
}

/**
 * River Valley Biome (Mississippi, Missouri, Ohio river valleys)
 */
export class RiverValleyBiome extends Biome {
  constructor() {
    super({
      name: 'River Valley',
      type: 'wetland_river_valley',
      palette: {
        sky: { start: '#D8E8D8', end: '#B8C8B8' },
        background: { start: '#8AA89A', end: '#7A988A' }, // Distant valley
        midground: { start: '#5A7A6A', end: '#4A6A5A' }, // Mid-range riparian
        foreground: { start: '#3A5A4A', end: '#2A4A3A' }, // Near vegetation
        accent: '#6A9AAA', // River water
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Valley hillsides (background)
    layers.push(`
      <path d="M 0 ${height * 0.5} Q ${width * 0.3} ${height * 0.45}, ${width * 0.6} ${height * 0.5} T ${width} ${height * 0.5} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // River running through valley
    layers.push(`
      <!-- River water -->
      <path d="M 0 ${height * 0.7} Q ${width * 0.25} ${height * 0.68}, ${width * 0.5} ${height * 0.7} T ${width} ${height * 0.7} L ${width} ${height * 0.75} Q ${width * 0.75} ${height * 0.77}, ${width * 0.5} ${height * 0.75} T 0 ${height * 0.75} Z"
            fill="${this.palette.accent}" opacity="0.8" />
    `);

    // Riparian vegetation (trees along river)
    for (let i = 0; i < 10; i++) {
      const x = width * (0.05 + i * 0.1);
      const y = height * 0.68;
      const isLeft = i % 2 === 0;
      const canopyRadius = 15 + Math.random() * 10;

      layers.push(`
        <circle cx="${x}" cy="${y}" r="${canopyRadius}" fill="${this.palette.midground?.start}" opacity="0.8" />
        <rect x="${x - 4}" y="${y + canopyRadius}" width="8" height="30" fill="#3D2817" opacity="0.8" />
      `);
    }

    // Foreground riverbank
    layers.push(`
      <path d="M 0 ${height * 0.8} Q ${width * 0.4} ${height * 0.78}, ${width * 0.7} ${height * 0.8} T ${width} ${height * 0.8} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.foreground.start}" />
    `);

    return layers;
  }
}

/**
 * Coastal Marsh Biome (Atlantic/Gulf coast wetlands)
 */
export class CoastalMarshBiome extends Biome {
  constructor() {
    super({
      name: 'Coastal Marsh',
      type: 'wetland_coastal_marsh',
      palette: {
        sky: { start: '#E0E8F0', end: '#C0D0E0' },
        background: { start: '#7A9AAA', end: '#6A8A9A' }, // Tidal water
        midground: { start: '#6A8A7A', end: '#5A7A6A' }, // Marsh grass
        foreground: { start: '#4A6A5A', end: '#3A5A4A' }, // Near vegetation
        accent: '#8AA88A', // Cordgrass green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Tidal water channels
    layers.push(`
      <rect x="0" y="${height * 0.6}" width="${width}" height="${height * 0.1}"
            fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // Marsh grass islands
    const grassIslands = [
      { x: width * 0.15, width: width * 0.2, y: height * 0.68 },
      { x: width * 0.45, width: width * 0.25, y: height * 0.7 },
      { x: width * 0.75, width: width * 0.2, y: height * 0.69 },
    ];

    grassIslands.forEach(({ x, width: islandWidth, y }) => {
      layers.push(`
        <rect x="${x}" y="${y}" width="${islandWidth}" height="${height * 0.08}"
              fill="${this.palette.midground?.start}" opacity="0.8" />
      `);

      // Cordgrass on islands
      for (let i = 0; i < 8; i++) {
        const grassX = x + (islandWidth / 8) * i;
        const grassY = y;
        const grassHeight = 30 + Math.random() * 15;

        layers.push(`
          <path d="M ${grassX} ${grassY + grassHeight} L ${grassX} ${grassY}"
                stroke="${this.palette.accent}" stroke-width="2" opacity="0.7" />
        `);
      }
    });

    // Foreground marsh
    layers.push(`
      <path d="M 0 ${height * 0.78} Q ${width * 0.5} ${height * 0.76}, ${width} ${height * 0.78} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Wading birds (egrets/herons) silhouettes
    const birdPositions = [
      { x: width * 0.3, y: height * 0.65 },
      { x: width * 0.6, y: height * 0.68 },
    ];

    birdPositions.forEach(({ x, y }) => {
      layers.push(`
        <!-- Bird silhouette -->
        <ellipse cx="${x}" cy="${y}" rx="8" ry="12" fill="#2A3A3A" opacity="0.7" />
        <line x1="${x}" y1="${y + 12}" x2="${x}" y2="${y + 35}" stroke="#2A3A3A" stroke-width="2" opacity="0.7" />
      `);
    });

    return layers;
  }
}

/**
 * Subtropical Humid Biome (Florida, Southern coastal areas)
 */
export class SubtropicalHumidBiome extends Biome {
  constructor() {
    super({
      name: 'Subtropical Humid',
      type: 'subtropical_humid',
      palette: {
        sky: { start: '#D8E8F8', end: '#B8C8D8' },
        background: { start: '#7AA88A', end: '#6A987A' }, // Lush green
        midground: { start: '#5A8A6A', end: '#4A7A5A' }, // Dense vegetation
        foreground: { start: '#3A6A4A', end: '#2A5A3A' }, // Tropical plants
        accent: '#FF6B9D', // Hibiscus/tropical flower colors
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Dense tropical vegetation background
    layers.push(`
      <rect x="0" y="${height * 0.55}" width="${width}" height="${height * 0.45}"
            fill="${this.palette.background.start}" opacity="0.8" />
    `);

    // Palm fronds and broad-leaf plants (mid-range)
    for (let i = 0; i < 6; i++) {
      const x = width * (0.15 + i * 0.15);
      const y = height * 0.6;

      // Broad tropical leaves
      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="35" ry="20" fill="${this.palette.midground?.start}" opacity="0.7" transform="rotate(-30 ${x} ${y})" />
        <ellipse cx="${x + 20}" cy="${y + 10}" rx="30" ry="18" fill="${this.palette.midground?.start}" opacity="0.7" transform="rotate(20 ${x + 20} ${y + 10})" />
      `);
    }

    // Foreground dense foliage
    layers.push(`
      <path d="M 0 ${height * 0.75} Q ${width * 0.5} ${height * 0.73}, ${width} ${height * 0.75} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Tropical flowers (vibrant accents)
    for (let i = 0; i < 6; i++) {
      const x = width * (0.2 + Math.random() * 0.6);
      const y = height * (0.7 + Math.random() * 0.1);

      layers.push(`
        <circle cx="${x}" cy="${y}" r="6" fill="${this.palette.accent}" opacity="0.8" />
      `);
    }

    // Humidity/heat haze effect
    layers.push(`
      <rect x="0" y="${height * 0.6}" width="${width}" height="${height * 0.15}"
            fill="#FFFFFF" opacity="0.1" />
    `);

    return layers;
  }
}
