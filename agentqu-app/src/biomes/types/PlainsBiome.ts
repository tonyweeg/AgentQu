/**
 * Plains Biome Variations
 * Great Plains, Tallgrass Prairie, Palouse, Central Valley, Texas Hill Country
 */

import { Biome } from './Biome';

/**
 * Great Plains Biome (Kansas, Nebraska, South Dakota, North Dakota)
 */
export class GreatPlainsBiome extends Biome {
  constructor() {
    super({
      name: 'Great Plains',
      type: 'plains_great',
      palette: {
        sky: { start: '#E8F0F8', end: '#C8D8E8' },
        background: { start: '#D4C4A0', end: '#B8A88C' }, // Distant fields
        midground: { start: '#A89878', end: '#8C7C60' }, // Mid-range grassland
        foreground: { start: '#6F5F47', end: '#5D4E37' }, // Near ground
        accent: '#F4E4C8', // Wheat/grain fields
      },
      timeVariations: {
        dawn: {
          sky: { start: '#FFE4C8', end: '#FFC8A8' },
        },
        dusk: {
          sky: { start: '#FF9868', end: '#D87848' },
        },
        night: {
          sky: { start: '#1C2838', end: '#2C3848' },
          background: { start: '#3D2817', end: '#2A1810' },
        },
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant horizon with minimal elevation change
    layers.push(`
      <rect x="0" y="${height * 0.55}" width="${width}" height="${height * 0.05}"
            fill="${this.palette.background.start}" opacity="0.6" />
    `);

    // Rolling grasslands (very gentle waves)
    layers.push(`
      <path d="M 0 ${height * 0.65} Q ${width * 0.25} ${height * 0.63}, ${width * 0.5} ${height * 0.65} T ${width} ${height * 0.65} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" opacity="0.8" />
    `);

    // Foreground grass with slight variation
    layers.push(`
      <path d="M 0 ${height * 0.75} Q ${width * 0.3} ${height * 0.73}, ${width * 0.6} ${height * 0.75} T ${width} ${height * 0.75} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Wheat/grain field patches
    const fieldPositions = [
      { x: width * 0.15, width: width * 0.2, y: height * 0.67 },
      { x: width * 0.55, width: width * 0.25, y: height * 0.69 },
    ];

    fieldPositions.forEach(({ x, width: fieldWidth, y }) => {
      layers.push(`
        <rect x="${x}" y="${y}" width="${fieldWidth}" height="${height * 0.08}"
              fill="${this.palette.accent}" opacity="0.7" />
      `);
    });

    // Sparse windmills/farms (simple vertical lines suggesting distance)
    const windmillPositions = [
      { x: width * 0.25, y: height * 0.58 },
      { x: width * 0.7, y: height * 0.6 },
    ];

    windmillPositions.forEach(({ x, y }) => {
      layers.push(`
        <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 20}"
              stroke="#FFFFFF" stroke-width="2" opacity="0.5" />
        <line x1="${x - 8}" y1="${y + 5}" x2="${x + 8}" y2="${y + 5}"
              stroke="#FFFFFF" stroke-width="2" opacity="0.5" />
      `);
    });

    return layers;
  }
}

/**
 * Tallgrass Prairie Biome (Iowa, Illinois, Missouri, Oklahoma)
 */
export class TallgrassPrairieBiome extends Biome {
  constructor() {
    super({
      name: 'Tallgrass Prairie',
      type: 'plains_prairie',
      palette: {
        sky: { start: '#D8E8F0', end: '#B8C8D8' },
        background: { start: '#A8C890', end: '#88A870' }, // Green grassland
        midground: { start: '#789858', end: '#587838' },
        foreground: { start: '#486028', end: '#384820' },
        accent: '#D4A874', // Prairie flowers
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distant rolling prairie
    layers.push(`
      <path d="M 0 ${height * 0.6} Q ${width * 0.33} ${height * 0.58}, ${width * 0.66} ${height * 0.6} T ${width} ${height * 0.6} V ${height} H 0 Z"
            fill="${this.palette.background.start}" opacity="0.7" />
    `);

    // Mid-range grass with more variation
    layers.push(`
      <path d="M 0 ${height * 0.7} Q ${width * 0.25} ${height * 0.68}, ${width * 0.5} ${height * 0.7} T ${width} ${height * 0.7} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Foreground tallgrass
    layers.push(`
      <path d="M 0 ${height * 0.78} Q ${width * 0.4} ${height * 0.76}, ${width * 0.7} ${height * 0.78} T ${width} ${height * 0.78} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Tallgrass blades (foreground detail)
    for (let i = 0; i < 12; i++) {
      const x = width * (0.1 + i * 0.08);
      const y = height * 0.78;
      const grassHeight = 30 + Math.random() * 20;
      const sway = Math.random() * 10 - 5;

      layers.push(`
        <path d="M ${x} ${y + grassHeight} Q ${x + sway} ${y + grassHeight/2}, ${x} ${y}"
              stroke="${this.palette.foreground.end}" stroke-width="2" fill="none" opacity="0.6" />
      `);
    }

    // Prairie wildflowers (small colored dots)
    for (let i = 0; i < 8; i++) {
      const x = width * (0.15 + Math.random() * 0.7);
      const y = height * (0.72 + Math.random() * 0.08);

      layers.push(`
        <circle cx="${x}" cy="${y}" r="3" fill="${this.palette.accent}" opacity="0.8" />
      `);
    }

    return layers;
  }
}

/**
 * Palouse Hills Biome (Washington, Idaho, Oregon - rolling wheat fields)
 */
export class PalouseBiome extends Biome {
  constructor() {
    super({
      name: 'Palouse Hills',
      type: 'plains_palouse',
      palette: {
        sky: { start: '#E0E8F0', end: '#C0D0E0' },
        background: { start: '#F4E4C8', end: '#D4C4A8' }, // Golden wheat distant
        midground: { start: '#B8A078', end: '#988858' },
        foreground: { start: '#786848', end: '#584828' },
        accent: '#F8E8D0', // Bright wheat
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Distinctive rolling hills (Palouse characteristic)
    layers.push(`
      <ellipse cx="${width * 0.25}" cy="${height * 0.58}" rx="${width * 0.2}" ry="${height * 0.12}"
               fill="${this.palette.background.start}" opacity="0.6" />
      <ellipse cx="${width * 0.65}" cy="${height * 0.6}" rx="${width * 0.25}" ry="${height * 0.15}"
               fill="${this.palette.background.start}" opacity="0.5" />
    `);

    // Mid-range rolling hills
    layers.push(`
      <ellipse cx="${width * 0.15}" cy="${height * 0.68}" rx="${width * 0.18}" ry="${height * 0.1}"
               fill="${this.palette.midground?.start}" opacity="0.7" />
      <ellipse cx="${width * 0.5}" cy="${height * 0.7}" rx="${width * 0.22}" ry="${height * 0.12}"
               fill="${this.palette.midground?.start}" opacity="0.7" />
      <ellipse cx="${width * 0.8}" cy="${height * 0.72}" rx="${width * 0.2}" ry="${height * 0.11}"
               fill="${this.palette.midground?.start}" opacity="0.7" />
    `);

    // Foreground hills
    layers.push(`
      <ellipse cx="${width * 0.3}" cy="${height * 0.8}" rx="${width * 0.25}" ry="${height * 0.15}"
               fill="${this.palette.foreground.start}" />
      <ellipse cx="${width * 0.75}" cy="${height * 0.82}" rx="${width * 0.28}" ry="${height * 0.16}"
               fill="${this.palette.foreground.start}" />
    `);

    // Wheat field contour lines (subtle texture)
    const contourY = [height * 0.68, height * 0.74, height * 0.78];
    contourY.forEach(y => {
      layers.push(`
        <path d="M 0 ${y} Q ${width * 0.25} ${y - 5}, ${width * 0.5} ${y} T ${width} ${y}"
              stroke="${this.palette.accent}" stroke-width="1" fill="none" opacity="0.3" />
      `);
    });

    return layers;
  }
}

/**
 * Central Valley Biome (California - agricultural heartland)
 */
export class CentralValleyBiome extends Biome {
  constructor() {
    super({
      name: 'Central Valley',
      type: 'plains_central_valley',
      palette: {
        sky: { start: '#E8E0D0', end: '#C8C0B0' },
        background: { start: '#B8A890', end: '#988870' }, // Distant farms
        midground: { start: '#8A7860', end: '#6A5840' },
        foreground: { start: '#5A4830', end: '#4A3820' },
        accent: '#68A848', // Crop green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Flat valley floor with distant mountains silhouette
    layers.push(`
      <polygon points="0,${height * 0.5} ${width * 0.2},${height * 0.48} ${width * 0.4},${height * 0.5} ${width * 0.6},${height * 0.49} ${width * 0.8},${height * 0.51} ${width},${height * 0.5} ${width},${height * 0.52} 0,${height * 0.52}"
               fill="${this.palette.background.start}" opacity="0.4" />
    `);

    // Agricultural fields in geometric patterns
    const fieldRows = 3;
    for (let i = 0; i < fieldRows; i++) {
      const y = height * (0.62 + i * 0.08);
      const fieldColors = [this.palette.accent, this.palette.midground?.start || '', this.palette.foreground.start];

      layers.push(`
        <rect x="${width * 0.05}" y="${y}" width="${width * 0.25}" height="${height * 0.06}"
              fill="${fieldColors[i]}" opacity="0.8" />
        <rect x="${width * 0.35}" y="${y}" width="${width * 0.28}" height="${height * 0.06}"
              fill="${fieldColors[(i + 1) % 3]}" opacity="0.8" />
        <rect x="${width * 0.68}" y="${y}" width="${width * 0.27}" height="${height * 0.06}"
              fill="${fieldColors[(i + 2) % 3]}" opacity="0.8" />
      `);
    }

    // Irrigation rows (thin lines)
    for (let i = 0; i < 5; i++) {
      const y = height * (0.64 + i * 0.04);
      layers.push(`
        <line x1="0" y1="${y}" x2="${width}" y2="${y}"
              stroke="#FFFFFF" stroke-width="1" opacity="0.2" />
      `);
    }

    return layers;
  }
}

/**
 * Texas Hill Country Biome (Texas - rolling limestone hills)
 */
export class TexasHillCountryBiome extends Biome {
  constructor() {
    super({
      name: 'Texas Hill Country',
      type: 'plains_texas_hills',
      palette: {
        sky: { start: '#E8D8C0', end: '#C8B8A0' },
        background: { start: '#A89878', end: '#887858' }, // Limestone hills
        midground: { start: '#786850', end: '#584838' },
        foreground: { start: '#483828', end: '#382818' },
        accent: '#556B2F', // Live oak green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Rolling limestone hills (characteristic of Hill Country)
    layers.push(`
      <path d="M 0 ${height * 0.58} Q ${width * 0.2} ${height * 0.55}, ${width * 0.4} ${height * 0.58} T ${width * 0.8} ${height * 0.58} T ${width} ${height * 0.58} V ${height * 0.6} H 0 Z"
            fill="${this.palette.background.start}" opacity="0.6" />
    `);

    // Mid-range hills with more pronounced rolling
    layers.push(`
      <path d="M 0 ${height * 0.68} Q ${width * 0.25} ${height * 0.65}, ${width * 0.5} ${height * 0.68} T ${width} ${height * 0.68} V ${height} H 0 Z"
            fill="${this.palette.midground?.start}" />
    `);

    // Foreground hills
    layers.push(`
      <path d="M 0 ${height * 0.76} Q ${width * 0.35} ${height * 0.73}, ${width * 0.65} ${height * 0.76} T ${width} ${height * 0.76} V ${height} H 0 Z"
            fill="${this.palette.foreground.start}" />
    `);

    // Live oak trees (scattered, characteristic of Hill Country)
    const oakPositions = [
      { x: width * 0.2, y: height * 0.68 },
      { x: width * 0.55, y: height * 0.7 },
      { x: width * 0.75, y: height * 0.73 },
    ];

    oakPositions.forEach(({ x, y }) => {
      // Wide, spreading canopy
      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="30" ry="18" fill="${this.palette.accent}" opacity="0.7" />
        <rect x="${x - 5}" y="${y + 15}" width="10" height="25" fill="#3D2817" />
      `);
    });

    // Limestone outcroppings (light patches)
    for (let i = 0; i < 4; i++) {
      const x = width * (0.3 + i * 0.15);
      const y = height * (0.65 + Math.random() * 0.08);

      layers.push(`
        <ellipse cx="${x}" cy="${y}" rx="${15 + Math.random() * 10}" ry="${8 + Math.random() * 5}"
                 fill="#D4C4B0" opacity="0.6" />
      `);
    }

    return layers;
  }
}
