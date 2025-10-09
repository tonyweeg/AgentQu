/**
 * Regional Forest & Mountain Biomes
 * Distinctive mountain ranges and forest types
 */

import { Biome } from './Biome';

/**
 * Blue Ridge Mountains Biome
 * Gentle blue-tinted Appalachian mountains
 * States: VA, NC, TN, GA
 */
export class BlueRidgeBiome extends Biome {
  constructor() {
    super({
      name: 'Blue Ridge Mountains',
      type: 'mountain_blue_ridge',
      palette: {
        sky: { start: '#D8E8F8', end: '#C0D8E8' },
        background: { start: '#A8C8D8', end: '#90B0C8' },
        midground: { start: '#7898B0', end: '#608098' },
        foreground: { start: '#486880', end: '#305068' },
        accent: '#88A898', // Forest green
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant blue ridges (layered mountains)
    const ridge1Path = `M 0,${height * 0.68} Q ${width * 0.3},${height * 0.62} ${width * 0.6},${height * 0.66} T ${width},${height * 0.68} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${ridge1Path}" fill="${this.palette.background!.start}" opacity="0.7" />`
    );

    const ridge2Path = `M 0,${height * 0.72} Q ${width * 0.4},${height * 0.66} ${width * 0.7},${height * 0.7} L ${width},${height * 0.72} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${ridge2Path}" fill="${this.palette.background!.end}" opacity="0.8" />`
    );

    // Midground: Forested slopes
    const slopePath = `M 0,${height * 0.76} Q ${width * 0.25},${height * 0.7} ${width * 0.5},${height * 0.76} T ${width},${height * 0.76} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${slopePath}" fill="${this.palette.midground!.start}" />`
    );

    // Forest texture (triangular tree silhouettes)
    for (let i = 0; i < 15; i++) {
      const x = (i * width / 15) + Math.random() * 20;
      const treeHeight = Math.random() * 30 + 20;
      const treeWidth = treeHeight * 0.6;
      const treeY = height * 0.7 + Math.random() * 50;
      const treePath = `M ${x},${treeY} L ${x - treeWidth / 2},${treeY + treeHeight} L ${x + treeWidth / 2},${treeY + treeHeight} Z`;
      layers.push(
        `<path d="${treePath}" fill="${this.palette.midground!.end}" opacity="0.6" />`
      );
    }

    // Foreground: Dark forest
    const fgY = height * 0.82;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Foreground trees (larger, closer)
    for (let i = 0; i < 8; i++) {
      const x = (i * width / 8) + Math.random() * 30;
      const treeHeight = Math.random() * 50 + 40;
      const treeWidth = treeHeight * 0.7;
      const treePath = `M ${x},${fgY + 10} L ${x - treeWidth / 2},${fgY + 10 + treeHeight} L ${x + treeWidth / 2},${fgY + 10 + treeHeight} Z`;
      layers.push(
        `<path d="${treePath}" fill="${this.palette.foreground!.end}" opacity="0.8" />`
      );
    }

    return layers;
  }
}

/**
 * Cascade Range Biome
 * Volcanic peaks with dense coniferous forests
 * States: WA, OR, CA
 */
export class CascadeRangeBiome extends Biome {
  constructor() {
    super({
      name: 'Cascade Range',
      type: 'mountain_cascade',
      palette: {
        sky: { start: '#C8D8E8', end: '#B0C0D0' },
        background: { start: '#E8F0F8', end: '#D0E0F0' },
        midground: { start: '#607880', end: '#486068' },
        foreground: { start: '#304850', end: '#183038' },
        accent: '#F8F8F8', // Snow
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Snow-capped volcanic peak
    const peakPath = `M ${width * 0.5},${height * 0.4} L ${width * 0.35},${height * 0.65} L ${width * 0.65},${height * 0.65} Z`;
    layers.push(
      `<path d="${peakPath}" fill="${this.palette.background!.start}" />`
    );

    // Snow cap on peak
    const snowPath = `M ${width * 0.5},${height * 0.4} L ${width * 0.42},${height * 0.5} L ${width * 0.58},${height * 0.5} Z`;
    layers.push(
      `<path d="${snowPath}" fill="${this.palette.accent}" opacity="0.9" />`
    );

    // Midground: Dense coniferous forest slopes
    const forestPath = `M 0,${height * 0.7} Q ${width * 0.3},${height * 0.65} ${width * 0.7},${height * 0.7} L ${width},${height * 0.72} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${forestPath}" fill="${this.palette.midground!.start}" />`
    );

    // Dense evergreen forest texture
    for (let i = 0; i < 20; i++) {
      const x = (i * width / 20) + Math.random() * 15;
      const treeHeight = Math.random() * 40 + 30;
      const treeWidth = treeHeight * 0.5;
      const treeY = height * 0.65 + Math.random() * 60;
      const treePath = `M ${x},${treeY} L ${x - treeWidth / 2},${treeY + treeHeight} L ${x + treeWidth / 2},${treeY + treeHeight} Z`;
      layers.push(
        `<path d="${treePath}" fill="${this.palette.midground!.end}" opacity="0.7" />`
      );
    }

    // Foreground: Very dark forest
    const fgY = height * 0.85;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Foreground massive trees
    for (let i = 0; i < 6; i++) {
      const x = (i * width / 6) + Math.random() * 40;
      const treeHeight = Math.random() * 60 + 50;
      const treeWidth = treeHeight * 0.6;
      const treePath = `M ${x},${fgY} L ${x - treeWidth / 2},${fgY + treeHeight} L ${x + treeWidth / 2},${fgY + treeHeight} Z`;
      layers.push(
        `<path d="${treePath}" fill="${this.palette.foreground!.end}" opacity="0.9" />`
      );
    }

    return layers;
  }
}

/**
 * Sierra Nevada Biome
 * Granite peaks with high alpine environment
 * States: CA, NV
 */
export class SierraNevadaBiome extends Biome {
  constructor() {
    super({
      name: 'Sierra Nevada',
      type: 'mountain_sierra_nevada',
      palette: {
        sky: { start: '#C0D8F0', end: '#A8C0D8' },
        background: { start: '#D0D8E0', end: '#B8C0C8' },
        midground: { start: '#889098', end: '#707880' },
        foreground: { start: '#586068', end: '#404850' },
        accent: '#E8F0F8', // Granite/snow
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Jagged granite peaks
    const peak1Path = `M ${width * 0.25},${height * 0.55} L ${width * 0.3},${height * 0.45} L ${width * 0.35},${height * 0.55} L ${width * 0.32},${height * 0.65} L ${width * 0.28},${height * 0.65} Z`;
    layers.push(
      `<path d="${peak1Path}" fill="${this.palette.background!.start}" />`
    );

    const peak2Path = `M ${width * 0.6},${height * 0.5} L ${width * 0.68},${height * 0.4} L ${width * 0.72},${height * 0.48} L ${width * 0.68},${height * 0.65} L ${width * 0.62},${height * 0.65} Z`;
    layers.push(
      `<path d="${peak2Path}" fill="${this.palette.background!.end}" />`
    );

    // Snow patches on peaks
    layers.push(
      `<path d="M ${width * 0.68},${height * 0.4} L ${width * 0.66},${height * 0.45} L ${width * 0.7},${height * 0.45} Z" fill="${this.palette.accent}" opacity="0.9" />`
    );

    // Midground: Rocky alpine slopes
    const slopePath = `M 0,${height * 0.72} L ${width * 0.3},${height * 0.65} L ${width * 0.5},${height * 0.7} L ${width * 0.7},${height * 0.68} L ${width},${height * 0.72} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${slopePath}" fill="${this.palette.midground!.start}" />`
    );

    // Rocky texture (angular boulders)
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width;
      const rockSize = Math.random() * 20 + 10;
      const rockY = height * 0.65 + Math.random() * 70;
      const rockPath = `M ${x - rockSize / 2},${rockY} L ${x},${rockY - rockSize} L ${x + rockSize / 2},${rockY} Z`;
      layers.push(
        `<path d="${rockPath}" fill="${this.palette.midground!.end}" opacity="0.6" />`
      );
    }

    // Foreground: Granite boulders
    const fgY = height * 0.82;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Large granite boulders
    for (let i = 0; i < 5; i++) {
      const x = (i * width / 5) + Math.random() * 30;
      const boulderSize = Math.random() * 40 + 30;
      const boulderPath = `M ${x - boulderSize / 2},${fgY + 20} L ${x},${fgY + 20 - boulderSize} L ${x + boulderSize / 2},${fgY + 20} L ${x + boulderSize / 3},${fgY + 40} L ${x - boulderSize / 3},${fgY + 40} Z`;
      layers.push(
        `<path d="${boulderPath}" fill="${this.palette.foreground!.end}" opacity="0.8" />`
      );
    }

    return layers;
  }
}

/**
 * Redwood Forest Biome
 * Towering ancient redwood trees
 * States: CA (Northern coast)
 */
export class RedwoodForestBiome extends Biome {
  constructor() {
    super({
      name: 'Redwood Forest',
      type: 'forest_redwood',
      palette: {
        sky: { start: '#C8D8D0', end: '#B0C0B8' },
        background: { start: '#789078', end: '#607860' },
        midground: { start: '#506050', end: '#384838' },
        foreground: { start: '#283028', end: '#101810' },
        accent: '#A86848', // Redwood bark
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant redwood canopy
    const canopyY = height * 0.5;
    layers.push(
      `<rect x="0" y="${canopyY}" width="${width}" height="${height - canopyY}" fill="${this.palette.background!.start}" />`
    );

    // Background tree trunks (very tall, narrow)
    for (let i = 0; i < 5; i++) {
      const x = (i * width / 5) + width * 0.1;
      const trunkWidth = Math.min(width, height) * 0.015;
      const trunkHeight = height * 0.4;
      layers.push(
        `<rect x="${x - trunkWidth / 2}" y="${canopyY - trunkHeight}" width="${trunkWidth}" height="${trunkHeight}" fill="${this.palette.accent}" opacity="0.4" />`
      );
    }

    // Midground: Massive redwood trunks
    const mgY = height * 0.65;
    layers.push(
      `<rect x="0" y="${mgY}" width="${width}" height="${height - mgY}" fill="${this.palette.midground!.start}" />`
    );

    // Midground redwood trunks (towering)
    for (let i = 0; i < 4; i++) {
      const x = (i * width / 4) + width * 0.125;
      const trunkWidth = Math.min(width, height) * 0.025;
      const trunkHeight = height * 0.55;
      layers.push(
        `<rect x="${x - trunkWidth / 2}" y="${mgY - trunkHeight}" width="${trunkWidth}" height="${trunkHeight}" fill="${this.palette.accent}" opacity="0.6" />`
      );

      // Bark texture (vertical lines)
      for (let j = 0; j < 3; j++) {
        const lineX = x - trunkWidth / 2 + (j * trunkWidth / 3);
        layers.push(
          `<line x1="${lineX}" y1="${mgY - trunkHeight}" x2="${lineX}" y2="${mgY}" stroke="${this.palette.midground!.end}" stroke-width="1" opacity="0.5" />`
        );
      }
    }

    // Foreground: Forest floor and close trunks
    const fgY = height * 0.8;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Foreground massive redwood trunks
    for (let i = 0; i < 3; i++) {
      const x = (i * width / 3) + width * 0.15;
      const trunkWidth = Math.min(width, height) * 0.04;
      const trunkHeight = height * 0.7;
      layers.push(
        `<rect x="${x - trunkWidth / 2}" y="${fgY - trunkHeight}" width="${trunkWidth}" height="${trunkHeight}" fill="${this.palette.accent}" opacity="0.8" />`
      );
    }

    return layers;
  }
}
