/**
 * Forest Biome Variations
 * Coniferous, Deciduous, Mixed, Temperate Rainforest, Boreal, Oak Woodland
 */

import { Biome } from './Biome';

/**
 * Coniferous Forest Biome (Pacific Northwest, Northern Rockies)
 */
export class ConiferousForestBiome extends Biome {
  constructor() {
    super({
      name: 'Coniferous Forest',
      type: 'forest_coniferous',
      palette: {
        sky: { start: '#C8D8E8', end: '#A8B8C8' },
        background: { start: '#6B8E7A', end: '#5A7A68' }, // Distant tree line
        midground: { start: '#4A6A58', end: '#3A5A48' },
        foreground: { start: '#2A4A38', end: '#1A3A28' },
        accent: '#8FA88B', // Mist/fog
      },
      timeVariations: {
        dawn: {
          sky: { start: '#E8D8C8', end: '#C8B8A8' },
        },
        dusk: {
          sky: { start: '#B88878', end: '#987868' },
        },
        night: {
          sky: { start: '#1C2838', end: '#0C1828' },
          background: { start: '#1A2A20', end: '#0A1A10' },
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant tree line (background)
    layers.push(`
      <path d="M 0 ${height * 0.55} L ${width} ${height * 0.55} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.background.start}" opacity="0.6" />
    `);

    // Mid-range trees (triangular evergreens)
    for (let i = 0; i < 8; i++) {
      const x = width * (0.1 + i * 0.12);
      const y = height * 0.6;
      const treeHeight = 60 + Math.random() * 30;
      const treeWidth = 25 + Math.random() * 15;

      layers.push(`
        <polygon points="${x},${y} ${x - treeWidth/2},${y + treeHeight} ${x + treeWidth/2},${y + treeHeight}"
                 fill="${this.palette.midground?.start}" opacity="0.8" />
      `);
    }

    // Foreground trees (larger evergreens)
    for (let i = 0; i < 5; i++) {
      const x = width * (0.15 + i * 0.2);
      const y = height * 0.65;
      const treeHeight = 80 + Math.random() * 40;
      const treeWidth = 35 + Math.random() * 20;

      layers.push(`
        <polygon points="${x},${y} ${x - treeWidth/2},${y + treeHeight} ${x + treeWidth/2},${y + treeHeight}"
                 fill="${this.palette.foreground.start}" />
      `);
    }

    // Fog/mist layer
    layers.push(`
      <ellipse cx="${width * 0.5}" cy="${height * 0.65}" rx="${width * 0.4}" ry="${height * 0.08}"
               fill="${this.palette.accent}" opacity="0.4" />
    `);

    return layers;
  }
}

/**
 * Deciduous Forest Biome (Eastern US, Midwest)
 */
export class DeciduousForestBiome extends Biome {
  constructor() {
    super({
      name: 'Deciduous Forest',
      type: 'forest_deciduous',
      palette: {
        sky: { start: '#D8E8D8', end: '#B8C8B8' },
        background: { start: '#8AA87A', end: '#7A987A' }, // Green distant trees
        midground: { start: '#6A886A', end: '#5A785A' },
        foreground: { start: '#4A684A', end: '#3A583A' },
        accent: '#A8C898', // Light green leaves
      },
      timeVariations: {
        dawn: {
          sky: { start: '#F8E8D8', end: '#D8C8B8' },
        },
        dusk: {
          sky: { start: '#E8A878', end: '#C88858' },
        },
        night: {
          sky: { start: '#1C2828', end: '#0C1818' },
          background: { start: '#1A2A1A', end: '#0A1A0A' },
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant tree canopy (rounded tops)
    layers.push(`
      <path d="M 0 ${height * 0.58} Q ${width * 0.25} ${height * 0.55}, ${width * 0.5} ${height * 0.58} T ${width} ${height * 0.58} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // Mid-range trees (rounded canopies)
    for (let i = 0; i < 7; i++) {
      const x = width * (0.08 + i * 0.14);
      const y = height * 0.63;
      const canopyRadius = 20 + Math.random() * 15;
      const trunkHeight = 40 + Math.random() * 20;

      layers.push(`
        <!-- Tree canopy -->
        <circle cx="${x}" cy="${y}" r="${canopyRadius}" fill="${this.palette.midground?.start}" opacity="0.8" />
        <!-- Trunk -->
        <rect x="${x - 5}" y="${y + canopyRadius}" width="10" height="${trunkHeight}" fill="#3D2817" opacity="0.8" />
      `);
    }

    // Foreground trees (larger rounded canopies)
    for (let i = 0; i < 4; i++) {
      const x = width * (0.2 + i * 0.25);
      const y = height * 0.68;
      const canopyRadius = 30 + Math.random() * 20;
      const trunkHeight = 50 + Math.random() * 30;

      layers.push(`
        <!-- Tree canopy -->
        <ellipse cx="${x}" cy="${y}" rx="${canopyRadius}" ry="${canopyRadius * 0.9}" fill="${this.palette.foreground.start}" />
        <!-- Trunk -->
        <rect x="${x - 8}" y="${y + canopyRadius}" width="16" height="${trunkHeight}" fill="#2A1810" />
      `);
    }

    return layers;
  }
}

/**
 * Mixed Forest Biome (Transition zones)
 */
export class MixedForestBiome extends Biome {
  constructor() {
    super({
      name: 'Mixed Forest',
      type: 'forest_mixed',
      palette: {
        sky: { start: '#D0E0D8', end: '#B0C0B8' },
        background: { start: '#7A9A8A', end: '#6A8A7A' }, // Mix of greens
        midground: { start: '#5A7A6A', end: '#4A6A5A' },
        foreground: { start: '#3A5A4A', end: '#2A4A3A' },
        accent: '#90A890', // Medium green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant mixed tree line
    layers.push(`
      <path d="M 0 ${height * 0.56} L ${width} ${height * 0.56} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.background.start}" opacity="0.6" />
    `);

    // Mid-range mixed trees (alternating coniferous and deciduous)
    for (let i = 0; i < 8; i++) {
      const x = width * (0.1 + i * 0.11);
      const y = height * 0.62;
      const isConiferous = i % 2 === 0;

      if (isConiferous) {
        // Triangular evergreen
        const treeHeight = 50 + Math.random() * 25;
        const treeWidth = 20 + Math.random() * 10;
        layers.push(`
          <polygon points="${x},${y} ${x - treeWidth/2},${y + treeHeight} ${x + treeWidth/2},${y + treeHeight}"
                   fill="${this.palette.midground?.start}" opacity="0.8" />
        `);
      } else {
        // Rounded deciduous
        const canopyRadius = 18 + Math.random() * 12;
        const trunkHeight = 35 + Math.random() * 15;
        layers.push(`
          <circle cx="${x}" cy="${y}" r="${canopyRadius}" fill="${this.palette.midground?.start}" opacity="0.8" />
          <rect x="${x - 4}" y="${y + canopyRadius}" width="8" height="${trunkHeight}" fill="#3D2817" opacity="0.8" />
        `);
      }
    }

    // Foreground mixed trees
    for (let i = 0; i < 5; i++) {
      const x = width * (0.15 + i * 0.18);
      const y = height * 0.68;
      const isConiferous = i % 2 === 1;

      if (isConiferous) {
        const treeHeight = 70 + Math.random() * 35;
        const treeWidth = 30 + Math.random() * 15;
        layers.push(`
          <polygon points="${x},${y} ${x - treeWidth/2},${y + treeHeight} ${x + treeWidth/2},${y + treeHeight}"
                   fill="${this.palette.foreground.start}" />
        `);
      } else {
        const canopyRadius = 25 + Math.random() * 15;
        const trunkHeight = 45 + Math.random() * 25;
        layers.push(`
          <ellipse cx="${x}" cy="${y}" rx="${canopyRadius}" ry="${canopyRadius * 0.9}" fill="${this.palette.foreground.start}" />
          <rect x="${x - 6}" y="${y + canopyRadius}" width="12" height="${trunkHeight}" fill="#2A1810" />
        `);
      }
    }

    return layers;
  }
}

/**
 * Temperate Rainforest Biome (Pacific Northwest coastal)
 */
export class TemperateRainforestBiome extends Biome {
  constructor() {
    super({
      name: 'Temperate Rainforest',
      type: 'forest_temperate_rainforest',
      palette: {
        sky: { start: '#B8C8D0', end: '#98A8B0' },
        background: { start: '#5A7A6A', end: '#4A6A5A' }, // Deep green, misty
        midground: { start: '#3A5A4A', end: '#2A4A3A' },
        foreground: { start: '#1A3A2A', end: '#0A2A1A' },
        accent: '#C8D8C8', // Mist/rain
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Dense forest background
    layers.push(`
      <rect x="0" y="${height * 0.5}" width="${width}" height="${height * 0.5}"
            fill="${this.palette.background.start}" opacity="0.8" />
    `);

    // Heavy mist layers
    layers.push(`
      <ellipse cx="${width * 0.3}" cy="${height * 0.55}" rx="${width * 0.3}" ry="${height * 0.08}"
               fill="${this.palette.accent}" opacity="0.5" />
      <ellipse cx="${width * 0.7}" cy="${height * 0.6}" rx="${width * 0.35}" ry="${height * 0.1}"
               fill="${this.palette.accent}" opacity="0.4" />
    `);

    // Very tall trees (giant redwoods/cedars)
    for (let i = 0; i < 6; i++) {
      const x = width * (0.15 + i * 0.15);
      const y = height * 0.4; // Start very high
      const treeHeight = height * 0.45; // Very tall
      const treeWidth = 40 + Math.random() * 20;

      layers.push(`
        <polygon points="${x},${y} ${x - treeWidth/2},${y + treeHeight} ${x + treeWidth/2},${y + treeHeight}"
                 fill="${i % 2 === 0 ? this.palette.midground?.start : this.palette.foreground.start}" opacity="0.9" />
      `);
    }

    // Rain effect (vertical lines)
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = height * (0.3 + Math.random() * 0.4);
      const rainLength = 30 + Math.random() * 20;

      layers.push(`
        <line x1="${x}" y1="${y}" x2="${x}" y2="${y + rainLength}"
              stroke="#FFFFFF" stroke-width="1" opacity="0.3" />
      `);
    }

    return layers;
  }
}

/**
 * Boreal Forest Biome (Northern states, Alaska)
 */
export class BorealForestBiome extends Biome {
  constructor() {
    super({
      name: 'Boreal Forest',
      type: 'forest_boreal',
      palette: {
        sky: { start: '#C0D0E0', end: '#A0B0C0' },
        background: { start: '#5A6A7A', end: '#4A5A6A' }, // Cool tones
        midground: { start: '#3A4A5A', end: '#2A3A4A' },
        foreground: { start: '#1A2A3A', end: '#0A1A2A' },
        accent: '#E0E8F0', // Snow/frost
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant evergreen tree line
    layers.push(`
      <path d="M 0 ${height * 0.52} L ${width} ${height * 0.52} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // Mid-range sparse trees
    for (let i = 0; i < 9; i++) {
      const x = width * (0.08 + i * 0.11);
      const y = height * 0.58;
      const treeHeight = 55 + Math.random() * 25;
      const treeWidth = 22 + Math.random() * 12;

      layers.push(`
        <polygon points="${x},${y} ${x - treeWidth/2},${y + treeHeight} ${x + treeWidth/2},${y + treeHeight}"
                 fill="${this.palette.midground?.start}" opacity="0.85" />
      `);
    }

    // Foreground trees with snow
    for (let i = 0; i < 5; i++) {
      const x = width * (0.18 + i * 0.18);
      const y = height * 0.64;
      const treeHeight = 75 + Math.random() * 35;
      const treeWidth = 32 + Math.random() * 18;

      // Tree
      layers.push(`
        <polygon points="${x},${y} ${x - treeWidth/2},${y + treeHeight} ${x + treeWidth/2},${y + treeHeight}"
                 fill="${this.palette.foreground.start}" />
      `);

      // Snow on branches
      layers.push(`
        <polygon points="${x},${y + 10} ${x - treeWidth/3},${y + 15} ${x + treeWidth/3},${y + 15}"
                 fill="${this.palette.accent}" opacity="0.8" />
        <polygon points="${x},${y + 25} ${x - treeWidth/3},${y + 30} ${x + treeWidth/3},${y + 30}"
                 fill="${this.palette.accent}" opacity="0.8" />
      `);
    }

    // Snow on ground
    layers.push(`
      <rect x="0" y="${height * 0.88}" width="${width}" height="${height * 0.12}"
            fill="${this.palette.accent}" opacity="0.6" />
    `);

    return layers;
  }
}

/**
 * Oak Woodland Biome (California, Texas)
 */
export class OakWoodlandBiome extends Biome {
  constructor() {
    super({
      name: 'Oak Woodland',
      type: 'forest_oak_woodland',
      palette: {
        sky: { start: '#E0D8C8', end: '#C0B8A8' },
        background: { start: '#A8987A', end: '#88786A' }, // Golden brown
        midground: { start: '#78685A', end: '#68584A' },
        foreground: { start: '#58483A', end: '#48382A' },
        accent: '#556B2F', // Oak green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Rolling grassland with sparse trees
    layers.push(`
      <path d="M 0 ${height * 0.6} Q ${width * 0.3} ${height * 0.58}, ${width * 0.6} ${height * 0.6} T ${width} ${height * 0.6} L ${width} ${height} L 0 ${height} Z"
            fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // Mid-range oak trees (distinctive wide canopies)
    const midOaks = [
      { x: width * 0.2, y: height * 0.62 },
      { x: width * 0.55, y: height * 0.64 },
      { x: width * 0.8, y: height * 0.63 },
    ];

    midOaks.forEach(({ x, y }) => {
      const canopyWidth = 50 + Math.random() * 20;
      const canopyHeight = 30 + Math.random() * 15;
      const trunkHeight = 35 + Math.random() * 15;

      layers.push(`
        <!-- Wide oak canopy -->
        <ellipse cx="${x}" cy="${y}" rx="${canopyWidth}" ry="${canopyHeight}" fill="${this.palette.midground?.start}" opacity="0.8" />
        <!-- Thick trunk -->
        <rect x="${x - 8}" y="${y + canopyHeight}" width="16" height="${trunkHeight}" fill="#3D2817" opacity="0.8" />
      `);
    });

    // Foreground oak trees (larger, gnarled appearance)
    const foregroundOaks = [
      { x: width * 0.3, y: height * 0.7 },
      { x: width * 0.7, y: height * 0.72 },
    ];

    foregroundOaks.forEach(({ x, y }) => {
      const canopyWidth = 70 + Math.random() * 30;
      const canopyHeight = 40 + Math.random() * 20;
      const trunkHeight = 45 + Math.random() * 25;

      layers.push(`
        <!-- Large oak canopy -->
        <ellipse cx="${x}" cy="${y}" rx="${canopyWidth}" ry="${canopyHeight}" fill="${this.palette.foreground.start}" />
        <!-- Thick, gnarled trunk -->
        <rect x="${x - 12}" y="${y + canopyHeight}" width="24" height="${trunkHeight}" fill="#2A1810" />
      `);
    });

    // Dry grass patches (golden/brown)
    for (let i = 0; i < 6; i++) {
      const x = width * (0.15 + i * 0.15);
      const y = height * (0.75 + Math.random() * 0.08);
      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="${20 + Math.random() * 15}" ry="${10 + Math.random() * 8}"
                 fill="#D4C4A0" opacity="0.6" />
      `);
    }

    return layers;
  }
}
