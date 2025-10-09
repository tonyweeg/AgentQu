/**
 * Unique Ecosystem Biomes
 * Rare and distinctive natural environments
 */

import { Biome } from './Biome';

/**
 * Karst Limestone Biome
 * Cave systems and limestone formations
 * States: KY (Mammoth Cave), MO
 */
export class KarstLimestoneBiome extends Biome {
  constructor() {
    super({
      name: 'Karst Limestone',
      type: 'unique_karst',
      palette: {
        sky: { start: '#D0D8E0', end: '#B8C0C8' },
        background: { start: '#C8D0D8', end: '#B0B8C0' },
        midground: { start: '#989CA0', end: '#808488' },
        foreground: { start: '#686C70', end: '#505458' },
        accent: '#A8A890', // Cave/limestone tan
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant limestone bluffs
    const bluffPath = `M 0,${height * 0.65} L ${width * 0.25},${height * 0.58} L ${width * 0.3},${height * 0.62} L ${width * 0.5},${height * 0.6} L ${width * 0.7},${height * 0.63} L ${width},${height * 0.65} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${bluffPath}" fill="${this.palette.background!.start}" />`
    );

    // Limestone layering (horizontal strata)
    for (let i = 0; i < 6; i++) {
      const y = height * 0.58 + (i * height * 0.02);
      layers.push(
        `<line x1="${width * 0.2}" y1="${y}" x2="${width * 0.8}" y2="${y + 5}" stroke="${this.palette.background!.end}" stroke-width="2" opacity="0.5" />`
      );
    }

    // Midground: Karst formation with cave entrance
    const karstPath = `M 0,${height * 0.72} Q ${width * 0.3},${height * 0.68} ${width * 0.6},${height * 0.72} L ${width},${height * 0.74} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${karstPath}" fill="${this.palette.midground!.start}" />`
    );

    // Cave entrance (dark ellipse)
    const caveX = width * 0.4;
    const caveY = height * 0.7;
    const caveWidth = Math.min(width, height) * 0.08;
    const caveHeight = Math.min(width, height) * 0.05;
    layers.push(
      `<ellipse cx="${caveX}" cy="${caveY}" rx="${caveWidth}" ry="${caveHeight}" fill="${this.palette.foreground!.end}" />`
    );

    // Cave entrance detail (darker inner)
    layers.push(
      `<ellipse cx="${caveX}" cy="${caveY}" rx="${caveWidth * 0.6}" ry="${caveHeight * 0.6}" fill="${this.palette.foreground!.start}" opacity="0.8" />`
    );

    // Limestone formations (sinkhole depression)
    const sinkholePath = `M ${width * 0.65},${height * 0.72} Q ${width * 0.7},${height * 0.74} ${width * 0.75},${height * 0.72}`;
    layers.push(
      `<path d="${sinkholePath}" fill="none" stroke="${this.palette.midground!.end}" stroke-width="3" opacity="0.6" />`
    );

    // Foreground: Rocky limestone terrain
    const fgY = height * 0.82;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Limestone boulders
    for (let i = 0; i < 8; i++) {
      const x = (i * width / 8) + Math.random() * 20;
      const rockSize = Math.random() * 15 + 8;
      layers.push(
        `<rect x="${x - rockSize / 2}" y="${fgY + 10}" width="${rockSize}" height="${rockSize}" fill="${this.palette.accent}" opacity="0.7" />`
      );
    }

    return layers;
  }
}

/**
 * Glacial Valley Biome
 * U-shaped valleys carved by glaciers
 * States: AK, MT
 */
export class GlacialValleyBiome extends Biome {
  constructor() {
    super({
      name: 'Glacial Valley',
      type: 'unique_glacial',
      palette: {
        sky: { start: '#C8D8E8', end: '#B0C0D0' },
        background: { start: '#D8E8F0', end: '#C0D8E8' },
        midground: { start: '#8898A8', end: '#708090' },
        foreground: { start: '#586878', end: '#405060' },
        accent: '#E8F0F8', // Glacier ice blue
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant glacier on mountain
    const glacierPath = `M ${width * 0.4},${height * 0.5} Q ${width * 0.5},${height * 0.45} ${width * 0.6},${height * 0.5} L ${width * 0.58},${height * 0.6} L ${width * 0.42},${height * 0.6} Z`;
    layers.push(
      `<path d="${glacierPath}" fill="${this.palette.accent}" opacity="0.9" />`
    );

    // Crevasses in glacier (dark lines)
    for (let i = 0; i < 4; i++) {
      const x = width * 0.42 + (i * (width * 0.16 / 4));
      layers.push(
        `<line x1="${x}" y1="${height * 0.5}" x2="${x + 5}" y2="${height * 0.6}" stroke="${this.palette.background!.end}" stroke-width="2" opacity="0.6" />`
      );
    }

    // Midground: U-shaped valley walls (steep sides)
    const valley1Path = `M 0,${height * 0.6} L ${width * 0.15},${height * 0.5} L ${width * 0.25},${height * 0.7} L ${width * 0.25},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${valley1Path}" fill="${this.palette.midground!.start}" />`
    );

    const valley2Path = `M ${width},${height * 0.6} L ${width * 0.85},${height * 0.5} L ${width * 0.75},${height * 0.7} L ${width * 0.75},${height} L ${width},${height} Z`;
    layers.push(
      `<path d="${valley2Path}" fill="${this.palette.midground!.start}" />`
    );

    // Valley floor
    const floorPath = `M ${width * 0.25},${height * 0.75} Q ${width * 0.5},${height * 0.7} ${width * 0.75},${height * 0.75} L ${width * 0.75},${height} L ${width * 0.25},${height} Z`;
    layers.push(
      `<path d="${floorPath}" fill="${this.palette.midground!.end}" />`
    );

    // Glacial moraine (deposited rocks)
    for (let i = 0; i < 10; i++) {
      const x = width * 0.3 + Math.random() * (width * 0.4);
      const y = height * 0.7 + Math.random() * (height * 0.1);
      const rockSize = Math.random() * 8 + 4;
      layers.push(
        `<circle cx="${x}" cy="${y}" r="${rockSize}" fill="${this.palette.foreground!.start}" opacity="0.6" />`
      );
    }

    // Foreground: Rocky valley floor
    const fgY = height * 0.85;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Erratics (large boulders left by glacier)
    const erratic1X = width * 0.35;
    const erratic1Size = Math.min(width, height) * 0.04;
    layers.push(
      `<polygon points="${erratic1X - erratic1Size},${fgY + 20} ${erratic1X},${fgY + 20 - erratic1Size} ${erratic1X + erratic1Size},${fgY + 20} ${erratic1X + erratic1Size * 0.7},${fgY + 40} ${erratic1X - erratic1Size * 0.7},${fgY + 40}" fill="${this.palette.foreground!.end}" opacity="0.8" />`
    );

    return layers;
  }
}

/**
 * Geothermal/Hot Springs Biome
 * Volcanic hot springs and geysers
 * States: WY (Yellowstone), AR (Hot Springs)
 */
export class GeothermalBiome extends Biome {
  constructor() {
    super({
      name: 'Geothermal',
      type: 'unique_geothermal',
      palette: {
        sky: { start: '#E8E0D8', end: '#D0C8C0' },
        background: { start: '#E8D8C8', end: '#D0C0B0' },
        midground: { start: '#C8B098', end: '#B09880' },
        foreground: { start: '#988068', end: '#806850' },
        accent: '#F8E8D8', // Steam/mineral deposits
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant geothermal features
    const bgY = height * 0.65;
    layers.push(
      `<rect x="0" y="${bgY}" width="${width}" height="${height - bgY}" fill="${this.palette.background!.start}" />`
    );

    // Background steam plumes
    for (let i = 0; i < 3; i++) {
      const x = (i * width / 3) + width * 0.15;
      const steamHeight = height * 0.15;
      const steamPath = `M ${x},${bgY} Q ${x - 20},${bgY - steamHeight * 0.5} ${x - 10},${bgY - steamHeight} Q ${x},${bgY - steamHeight * 0.7} ${x + 10},${bgY - steamHeight} Q ${x + 20},${bgY - steamHeight * 0.5} ${x},${bgY}`;
      layers.push(
        `<path d="${steamPath}" fill="${this.palette.accent}" opacity="0.4" />`
      );
    }

    // Midground: Colorful mineral terraces
    const terrace1Path = `M ${width * 0.2},${height * 0.72} Q ${width * 0.3},${height * 0.68} ${width * 0.4},${height * 0.72} L ${width * 0.4},${height * 0.76} L ${width * 0.2},${height * 0.76} Z`;
    layers.push(
      `<path d="${terrace1Path}" fill="${this.palette.midground!.start}" opacity="0.8" />`
    );

    const terrace2Path = `M ${width * 0.35},${height * 0.74} Q ${width * 0.45},${height * 0.7} ${width * 0.55},${height * 0.74} L ${width * 0.55},${height * 0.78} L ${width * 0.35},${height * 0.78} Z`;
    layers.push(
      `<path d="${terrace2Path}" fill="${this.palette.midground!.end}" opacity="0.8" />`
    );

    // Hot spring pool (ellipse with gradient effect)
    const poolX = width * 0.5;
    const poolY = height * 0.75;
    const poolWidth = Math.min(width, height) * 0.12;
    const poolHeight = Math.min(width, height) * 0.06;
    layers.push(
      `<ellipse cx="${poolX}" cy="${poolY}" rx="${poolWidth}" ry="${poolHeight}" fill="${this.palette.background!.end}" opacity="0.7" />`
    );

    // Inner pool (darker, suggesting depth)
    layers.push(
      `<ellipse cx="${poolX}" cy="${poolY}" rx="${poolWidth * 0.7}" ry="${poolHeight * 0.7}" fill="${this.palette.midground!.end}" opacity="0.8" />`
    );

    // Steam rising from pool
    const steamPath = `M ${poolX},${poolY - poolHeight} Q ${poolX - 15},${poolY - poolHeight - 30} ${poolX - 8},${poolY - poolHeight - 60} Q ${poolX},${poolY - poolHeight - 45} ${poolX + 8},${poolY - poolHeight - 60} Q ${poolX + 15},${poolY - poolHeight - 30} ${poolX},${poolY - poolHeight}`;
    layers.push(
      `<path d="${steamPath}" fill="${this.palette.accent}" opacity="0.5" />`
    );

    // Foreground: Mineral deposits and crusty terrain
    const fgY = height * 0.83;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Mineral crust formations
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const crustSize = Math.random() * 10 + 5;
      layers.push(
        `<circle cx="${x}" cy="${fgY + 15}" r="${crustSize}" fill="${this.palette.accent}" opacity="0.6" />`
      );
    }

    // Small geothermal vents (circles with steam)
    for (let i = 0; i < 4; i++) {
      const x = width * 0.2 + (i * width * 0.15);
      layers.push(
        `<circle cx="${x}" cy="${fgY + 20}" r="6" fill="${this.palette.foreground!.end}" />`
      );
      // Small steam puff
      layers.push(
        `<ellipse cx="${x}" cy="${fgY}" rx="12" ry="8" fill="${this.palette.accent}" opacity="0.4" />`
      );
    }

    return layers;
  }
}
