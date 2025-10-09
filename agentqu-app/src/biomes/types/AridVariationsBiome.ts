/**
 * Arid/Desert Variations Biomes
 * Unique desert environments with distinctive features
 */

import { Biome } from './Biome';

/**
 * Painted Desert Biome
 * Colorful layered rock formations
 * States: AZ (Painted Desert, Petrified Forest)
 */
export class PaintedDesertBiome extends Biome {
  constructor() {
    super({
      name: 'Painted Desert',
      type: 'desert_painted',
      palette: {
        sky: { start: '#E8D8F0', end: '#D0C0E0' },
        background: { start: '#E8C8B8', end: '#D0B0A0' },
        midground: { start: '#C89878', end: '#B08060' },
        foreground: { start: '#A86848', end: '#905030' },
        accent: '#D88868', // Rust/iron oxide red
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant colorful mesas
    const mesaY = height * 0.6;
    const mesa1Path = `M ${width * 0.15},${mesaY} L ${width * 0.25},${mesaY - height * 0.15} L ${width * 0.35},${mesaY - height * 0.15} L ${width * 0.4},${mesaY} Z`;
    layers.push(
      `<path d="${mesa1Path}" fill="${this.palette.background!.start}" opacity="0.8" />`
    );

    const mesa2Path = `M ${width * 0.55},${mesaY} L ${width * 0.62},${mesaY - height * 0.12} L ${width * 0.75},${mesaY - height * 0.12} L ${width * 0.78},${mesaY} Z`;
    layers.push(
      `<path d="${mesa2Path}" fill="${this.palette.background!.end}" opacity="0.8" />`
    );

    // Colorful striations in background
    for (let i = 0; i < 4; i++) {
      const y = mesaY - height * 0.15 + (i * height * 0.035);
      const color = i % 2 === 0 ? this.palette.accent : this.palette.background!.end;
      layers.push(
        `<line x1="${width * 0.25}" y1="${y}" x2="${width * 0.35}" y2="${y}" stroke="${color}" stroke-width="4" opacity="0.6" />`
      );
    }

    // Midground: Layered badlands formations
    const bgPath = `M 0,${height * 0.72} L ${width * 0.2},${height * 0.68} L ${width * 0.3},${height * 0.72} L ${width * 0.5},${height * 0.65} L ${width * 0.7},${height * 0.7} L ${width},${height * 0.72} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${bgPath}" fill="${this.palette.midground!.start}" />`
    );

    // Color bands (striations)
    const bandY = height * 0.65;
    for (let i = 0; i < 6; i++) {
      const y = bandY + (i * height * 0.02);
      const colors = [this.palette.accent, this.palette.midground!.end, this.palette.background!.end];
      const color = colors[i % 3];
      layers.push(
        `<line x1="0" y1="${y}" x2="${width}" y2="${y + 5}" stroke="${color}" stroke-width="3" opacity="0.5" />`
      );
    }

    // Foreground: Desert floor with colorful sediment
    const fgY = height * 0.82;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Scattered colored rocks/sediment
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const rockSize = Math.random() * 8 + 3;
      layers.push(
        `<circle cx="${x}" cy="${fgY + 15}" r="${rockSize}" fill="${this.palette.accent}" opacity="0.6" />`
      );
    }

    return layers;
  }
}

/**
 * Salt Flats Biome
 * Vast white salt deposits
 * States: UT, NV (Bonneville Salt Flats)
 */
export class SaltFlatsBiome extends Biome {
  constructor() {
    super({
      name: 'Salt Flats',
      type: 'desert_salt_flats',
      palette: {
        sky: { start: '#E8F4F8', end: '#D0E4F0' },
        background: { start: '#F0F8F8', end: '#E0E8E8' },
        midground: { start: '#F8F8F0', end: '#E8E8E0' },
        foreground: { start: '#F0F0E8', end: '#E0E0D8' },
        accent: '#D0D0C8', // Slight mineral tint
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant mountains (very faint)
    const mtPath = `M 0,${height * 0.65} L ${width * 0.25},${height * 0.55} L ${width * 0.5},${height * 0.6} L ${width * 0.75},${height * 0.58} L ${width},${height * 0.65} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${mtPath}" fill="${this.palette.background!.start}" opacity="0.4" />`
    );

    // Midground: Vast white salt plain
    const plainY = height * 0.7;
    layers.push(
      `<rect x="0" y="${plainY}" width="${width}" height="${height - plainY}" fill="${this.palette.midground!.start}" />`
    );

    // Salt polygon cracks (hexagonal patterns)
    for (let i = 0; i < 6; i++) {
      const x = (i * width / 6) + width * 0.05;
      const crackSize = Math.min(width, height) * 0.04;
      const hexPath = `M ${x},${plainY + crackSize} L ${x + crackSize * 0.5},${plainY + crackSize * 0.3} L ${x + crackSize * 0.5},${plainY - crackSize * 0.3} L ${x},${plainY - crackSize} L ${x - crackSize * 0.5},${plainY - crackSize * 0.3} L ${x - crackSize * 0.5},${plainY + crackSize * 0.3} Z`;
      layers.push(
        `<path d="${hexPath}" fill="none" stroke="${this.palette.accent}" stroke-width="2" opacity="0.4" />`
      );
    }

    // Distant heat shimmer effect (wavy horizontal lines)
    for (let i = 0; i < 3; i++) {
      const y = height * 0.65 + (i * 8);
      const wavePath = `M 0,${y} Q ${width * 0.25},${y + 3} ${width * 0.5},${y} T ${width},${y}`;
      layers.push(
        `<path d="${wavePath}" fill="none" stroke="${this.palette.background!.end}" stroke-width="1" opacity="0.3" />`
      );
    }

    // Foreground: Pure white salt with subtle texture
    const fgY = height * 0.85;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Foreground salt crystals (small polygons)
    for (let i = 0; i < 8; i++) {
      const x = (i * width / 8) + Math.random() * 20;
      const size = Math.random() * 6 + 2;
      const crystalPath = `M ${x},${fgY + 15 - size} L ${x + size},${fgY + 15} L ${x},${fgY + 15 + size} L ${x - size},${fgY + 15} Z`;
      layers.push(
        `<path d="${crystalPath}" fill="${this.palette.foreground!.end}" opacity="0.5" />`
      );
    }

    return layers;
  }
}

/**
 * Badlands Biome
 * Eroded layered rock formations
 * States: SD (Badlands National Park)
 */
export class BadlandsBiome extends Biome {
  constructor() {
    super({
      name: 'Badlands',
      type: 'desert_badlands',
      palette: {
        sky: { start: '#E0D8E8', end: '#C8C0D0' },
        background: { start: '#C8B8A8', end: '#B0A090' },
        midground: { start: '#A88878', end: '#907060' },
        foreground: { start: '#786048', end: '#604830' },
        accent: '#D8A088', // Rust/pink tones
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Distant eroded peaks
    const peak1Path = `M ${width * 0.2},${height * 0.65} L ${width * 0.25},${height * 0.55} L ${width * 0.3},${height * 0.65} L ${width * 0.28},${height * 0.7} L ${width * 0.22},${height * 0.7} Z`;
    layers.push(
      `<path d="${peak1Path}" fill="${this.palette.background!.start}" opacity="0.7" />`
    );

    const peak2Path = `M ${width * 0.6},${height * 0.68} L ${width * 0.67},${height * 0.58} L ${width * 0.72},${height * 0.62} L ${width * 0.68},${height * 0.7} L ${width * 0.62},${height * 0.7} Z`;
    layers.push(
      `<path d="${peak2Path}" fill="${this.palette.background!.end}" opacity="0.7" />`
    );

    // Midground: Jagged badlands formations
    const formation1Path = `M 0,${height * 0.72} L ${width * 0.15},${height * 0.65} L ${width * 0.2},${height * 0.7} L ${width * 0.25},${height * 0.68} L ${width * 0.3},${height * 0.72} L ${width * 0.3},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${formation1Path}" fill="${this.palette.midground!.start}" />`
    );

    const formation2Path = `M ${width * 0.28},${height * 0.74} L ${width * 0.45},${height * 0.66} L ${width * 0.5},${height * 0.7} L ${width * 0.6},${height * 0.68} L ${width * 0.65},${height * 0.74} L ${width * 0.65},${height} L ${width * 0.28},${height} Z`;
    layers.push(
      `<path d="${formation2Path}" fill="${this.palette.midground!.end}" />`
    );

    // Erosion striations (horizontal banding)
    const strataStartY = height * 0.66;
    const strataEndY = height * 0.74;
    for (let i = 0; i < 8; i++) {
      const y = strataStartY + (i * (strataEndY - strataStartY) / 8);
      const color = i % 2 === 0 ? this.palette.accent : this.palette.midground!.end;
      layers.push(
        `<line x1="${width * 0.15}" y1="${y}" x2="${width * 0.65}" y2="${y + 5}" stroke="${color}" stroke-width="3" opacity="0.5" />`
      );
    }

    // Foreground: Rocky desert floor
    const fgY = height * 0.82;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Scattered rocks
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const rockSize = Math.random() * 6 + 2;
      const rockPath = `M ${x - rockSize},${fgY + 15} L ${x},${fgY + 15 - rockSize} L ${x + rockSize},${fgY + 15} Z`;
      layers.push(
        `<path d="${rockPath}" fill="${this.palette.foreground!.end}" opacity="0.6" />`
      );
    }

    return layers;
  }
}
