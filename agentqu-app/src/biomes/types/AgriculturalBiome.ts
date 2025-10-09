/**
 * Agricultural & Rural Biomes
 * Farmland, orchards, vineyards, and rangeland ecosystems
 */

import { Biome, BiomeConfig } from './Biome';

/**
 * Cropland/Farmland Biome
 * Endless fields of corn, soybeans, wheat
 * States: IA, IL, IN, KS, NE
 */
export class CroplandBiome extends Biome {
  constructor() {
    super({
      name: 'Cropland',
      type: 'agricultural_cropland',
      palette: {
        sky: { start: '#E8F0F8', end: '#D0E0F0' },
        background: { start: '#E8D4A8', end: '#D0BC90' },
        midground: { start: '#C0A478', end: '#A88C60' },
        foreground: { start: '#8F7548', end: '#776030' },
        accent: '#F4E4C8', // Golden wheat/corn
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant fields with subtle rows
    const bgFieldY = height * 0.6;
    layers.push(
      `<rect x="0" y="${bgFieldY}" width="${width}" height="${height - bgFieldY}" fill="${this.palette.background.start}" />`
    );

    // Field rows (subtle texture)
    for (let i = 0; i < 8; i++) {
      const y = bgFieldY + (i * (height - bgFieldY) / 8);
      layers.push(
        `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${this.palette.background.end}" stroke-width="1" opacity="0.3" />`
      );
    }

    // Midground: Crop field with subtle texture
    const mgFieldY = height * 0.7;
    layers.push(
      `<rect x="0" y="${mgFieldY}" width="${width}" height="${height - mgFieldY}" fill="${this.palette.midground!.start}" />`
    );

    // Crop rows (visible texture)
    for (let i = 0; i < 10; i++) {
      const y = mgFieldY + (i * (height - mgFieldY) / 10);
      layers.push(
        `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${this.palette.midground!.end}" stroke-width="2" opacity="0.5" />`
      );
    }

    // Foreground: Close-up crop field
    const fgFieldY = height * 0.8;
    layers.push(
      `<rect x="0" y="${fgFieldY}" width="${width}" height="${height - fgFieldY}" fill="${this.palette.foreground!.start}" />`
    );

    // Windmill (iconic farmland structure)
    const windmillX = width * 0.75;
    const windmillY = height * 0.55;
    const windmillSize = Math.min(width, height) * 0.08;

    // Windmill tower
    layers.push(
      `<rect x="${windmillX - windmillSize * 0.15}" y="${windmillY}" width="${windmillSize * 0.3}" height="${windmillSize * 1.5}" fill="${this.palette.accent}" opacity="0.6" />`
    );

    // Windmill blades (3 blades)
    const bladeLength = windmillSize;
    const centerX = windmillX;
    const centerY = windmillY - windmillSize * 0.2;

    for (let i = 0; i < 3; i++) {
      const angle = (i * 120) * Math.PI / 180;
      const x1 = centerX + Math.cos(angle) * bladeLength;
      const y1 = centerY + Math.sin(angle) * bladeLength;
      layers.push(
        `<line x1="${centerX}" y1="${centerY}" x2="${x1}" y2="${y1}" stroke="${this.palette.accent}" stroke-width="${windmillSize * 0.1}" opacity="0.7" />`
      );
    }

    return layers;
  }
}

/**
 * Orchard Biome
 * Organized rows of fruit trees
 * States: CA, WA, MI, NY
 */
export class OrchardBiome extends Biome {
  constructor() {
    super({
      name: 'Orchard',
      type: 'agricultural_orchard',
      palette: {
        sky: { start: '#F0F8E8', end: '#D8E8D0' },
        background: { start: '#B8D4A8', end: '#A0C090' },
        midground: { start: '#88AC78', end: '#709860' },
        foreground: { start: '#588448', end: '#407030' },
        accent: '#E8B8A8', // Fruit blossom pink
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant orchard rows
    const bgY = height * 0.65;
    layers.push(
      `<rect x="0" y="${bgY}" width="${width}" height="${height - bgY}" fill="${this.palette.background.start}" />`
    );

    // Distant tree rows
    for (let i = 0; i < 5; i++) {
      const x = (i * width / 5) + width * 0.1;
      const treeSize = Math.min(width, height) * 0.04;
      layers.push(
        `<circle cx="${x}" cy="${bgY + treeSize}" r="${treeSize}" fill="${this.palette.background.end}" opacity="0.6" />`
      );
    }

    // Midground: Orchard rows
    const mgY = height * 0.75;
    layers.push(
      `<rect x="0" y="${mgY}" width="${width}" height="${height - mgY}" fill="${this.palette.midground!.start}" />`
    );

    // Mid-distance trees (rounded canopies)
    for (let i = 0; i < 4; i++) {
      const x = (i * width / 4) + width * 0.125;
      const treeSize = Math.min(width, height) * 0.06;
      const trunkHeight = treeSize * 0.8;

      // Trunk
      layers.push(
        `<rect x="${x - treeSize * 0.1}" y="${mgY + treeSize * 0.5}" width="${treeSize * 0.2}" height="${trunkHeight}" fill="${this.palette.foreground!.start}" opacity="0.4" />`
      );

      // Canopy
      layers.push(
        `<circle cx="${x}" cy="${mgY + treeSize * 0.8}" r="${treeSize}" fill="${this.palette.midground!.end}" opacity="0.7" />`
      );

      // Blossoms/fruit
      layers.push(
        `<circle cx="${x}" cy="${mgY + treeSize * 0.8}" r="${treeSize * 0.6}" fill="${this.palette.accent}" opacity="0.5" />`
      );
    }

    // Foreground: Close trees
    const fgY = height * 0.85;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    return layers;
  }
}

/**
 * Vineyard Biome
 * Organized grape vine rows
 * States: CA, OR, WA, NY
 */
export class VineyardBiome extends Biome {
  constructor() {
    super({
      name: 'Vineyard',
      type: 'agricultural_vineyard',
      palette: {
        sky: { start: '#F4E8F0', end: '#E0D0E0' },
        background: { start: '#C8B4A8', end: '#B09C90' },
        midground: { start: '#988478', end: '#806C60' },
        foreground: { start: '#685448', end: '#504030' },
        accent: '#8A6888', // Grape purple
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Rolling hills with vineyard rows
    const hillPath = `M 0,${height * 0.7} Q ${width * 0.25},${height * 0.65} ${width * 0.5},${height * 0.7} T ${width},${height * 0.7} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${hillPath}" fill="${this.palette.background.start}" />`
    );

    // Distant vine rows (horizontal lines)
    for (let i = 0; i < 6; i++) {
      const y = height * 0.7 + (i * height * 0.05);
      layers.push(
        `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${this.palette.background.end}" stroke-width="2" opacity="0.4" />`
      );
    }

    // Midground: Vine posts and vines
    const mgY = height * 0.8;
    layers.push(
      `<rect x="0" y="${mgY}" width="${width}" height="${height - mgY}" fill="${this.palette.midground!.start}" />`
    );

    // Vine trellises
    for (let i = 0; i < 6; i++) {
      const x = (i * width / 6) + width * 0.08;
      const postHeight = height * 0.15;

      // Trellis post
      layers.push(
        `<rect x="${x - 3}" y="${mgY - postHeight * 0.5}" width="6" height="${postHeight}" fill="${this.palette.foreground!.start}" opacity="0.6" />`
      );

      // Horizontal wire
      layers.push(
        `<line x1="${x - width * 0.05}" y1="${mgY}" x2="${x + width * 0.05}" y2="${mgY}" stroke="${this.palette.foreground!.end}" stroke-width="2" opacity="0.5" />`
      );

      // Grape clusters
      const grapeY = mgY + height * 0.02;
      layers.push(
        `<circle cx="${x}" cy="${grapeY}" r="${Math.min(width, height) * 0.015}" fill="${this.palette.accent}" opacity="0.7" />`
      );
    }

    return layers;
  }
}

/**
 * Rangeland Biome
 * Open grazing land with sparse vegetation
 * States: MT, WY, NE, SD, ND
 */
export class RangelandBiome extends Biome {
  constructor() {
    super({
      name: 'Rangeland',
      type: 'agricultural_rangeland',
      palette: {
        sky: { start: '#E0E8F0', end: '#C8D8E8' },
        background: { start: '#D8C8A8', end: '#C0B090' },
        midground: { start: '#A89878', end: '#908060' },
        foreground: { start: '#786848', end: '#605030' },
        accent: '#8B7355', // Fence brown
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant rolling hills
    const bgHillPath = `M 0,${height * 0.65} Q ${width * 0.3},${height * 0.6} ${width * 0.6},${height * 0.65} T ${width},${height * 0.65} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${bgHillPath}" fill="${this.palette.background.start}" />`
    );

    // Sparse background vegetation
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width;
      const y = height * 0.65 + Math.random() * height * 0.15;
      const grassHeight = Math.min(width, height) * 0.02;
      layers.push(
        `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - grassHeight}" stroke="${this.palette.background.end}" stroke-width="2" opacity="0.4" />`
      );
    }

    // Midground: Open grassland
    const mgY = height * 0.78;
    layers.push(
      `<rect x="0" y="${mgY}" width="${width}" height="${height - mgY}" fill="${this.palette.midground!.start}" />`
    );

    // Barbed wire fence (iconic rangeland feature)
    const fenceY = height * 0.75;
    const fencePostSpacing = width / 6;

    for (let i = 0; i <= 6; i++) {
      const x = i * fencePostSpacing;
      const postHeight = height * 0.1;

      // Fence post
      layers.push(
        `<rect x="${x - 4}" y="${fenceY - postHeight * 0.5}" width="8" height="${postHeight}" fill="${this.palette.accent}" opacity="0.6" />`
      );

      // Wire (connect to next post)
      if (i < 6) {
        layers.push(
          `<line x1="${x}" y1="${fenceY}" x2="${x + fencePostSpacing}" y2="${fenceY}" stroke="${this.palette.accent}" stroke-width="2" opacity="0.5" />`
        );
        layers.push(
          `<line x1="${x}" y1="${fenceY + 15}" x2="${x + fencePostSpacing}" y2="${fenceY + 15}" stroke="${this.palette.accent}" stroke-width="2" opacity="0.5" />`
        );
      }
    }

    // Foreground: Tall grass
    const fgY = height * 0.88;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Foreground grass clumps
    for (let i = 0; i < 12; i++) {
      const x = (i * width / 12) + Math.random() * 20;
      const grassHeight = Math.min(width, height) * 0.04;
      layers.push(
        `<line x1="${x}" y1="${fgY + 10}" x2="${x}" y2="${fgY + 10 - grassHeight}" stroke="${this.palette.foreground!.end}" stroke-width="3" opacity="0.6" />`
      );
    }

    return layers;
  }
}
