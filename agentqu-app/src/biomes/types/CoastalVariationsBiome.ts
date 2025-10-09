/**
 * Coastal Variations Biomes
 * Specialized coastal environments beyond sandy/rocky beaches
 */

import { Biome } from './Biome';

/**
 * Barrier Island Biome
 * Sandy barrier islands with dunes and sea oats
 * States: NC, SC, GA, TX (Outer Banks, Sea Islands, Padre Island)
 */
export class BarrierIslandBiome extends Biome {
  constructor() {
    super({
      name: 'Barrier Island',
      type: 'coastal_barrier_island',
      palette: {
        sky: { start: '#E8F4F8', end: '#D0E4F0' },
        background: { start: '#D8E8F0', end: '#C0D8E8' },
        midground: { start: '#E8D8C0', end: '#D0C0A8' },
        foreground: { start: '#C0A890', end: '#A89078' },
        accent: '#B8D4A8', // Sea oats/dune grass
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Ocean horizon
    const oceanY = height * 0.6;
    layers.push(
      `<rect x="0" y="${oceanY}" width="${width}" height="${height - oceanY}" fill="${this.palette.background!.start}" />`
    );

    // Gentle waves (horizontal lines)
    for (let i = 0; i < 5; i++) {
      const y = oceanY + (i * (height - oceanY) / 5);
      layers.push(
        `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${this.palette.background!.end}" stroke-width="2" opacity="0.3" />`
      );
    }

    // Midground: Sandy beach with gentle slope
    const beachPath = `M 0,${height * 0.7} Q ${width * 0.5},${height * 0.65} ${width},${height * 0.7} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${beachPath}" fill="${this.palette.midground!.start}" />`
    );

    // Sand dunes (rounded hills)
    const dune1X = width * 0.25;
    const dune2X = width * 0.65;
    const duneHeight = height * 0.15;
    const duneY = height * 0.7;

    // Dune 1
    const dune1Path = `M ${dune1X - width * 0.15},${duneY} Q ${dune1X},${duneY - duneHeight} ${dune1X + width * 0.15},${duneY} Z`;
    layers.push(
      `<path d="${dune1Path}" fill="${this.palette.midground!.end}" opacity="0.8" />`
    );

    // Dune 2
    const dune2Path = `M ${dune2X - width * 0.12},${duneY} Q ${dune2X},${duneY - duneHeight * 0.8} ${dune2X + width * 0.12},${duneY} Z`;
    layers.push(
      `<path d="${dune2Path}" fill="${this.palette.midground!.end}" opacity="0.8" />`
    );

    // Sea oats/dune grass on dunes
    for (let i = 0; i < 8; i++) {
      const x = dune1X - width * 0.1 + (i * width * 0.025);
      const grassHeight = Math.min(width, height) * 0.04;
      const grassY = duneY - duneHeight * 0.7;
      layers.push(
        `<line x1="${x}" y1="${grassY}" x2="${x + 5}" y2="${grassY - grassHeight}" stroke="${this.palette.accent}" stroke-width="2" opacity="0.7" />`
      );
    }

    // Foreground: Beach sand
    const fgY = height * 0.82;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    return layers;
  }
}

/**
 * Sand Dunes Biome
 * Great Lakes sand dunes
 * States: MI, IN (Sleeping Bear Dunes, Indiana Dunes)
 */
export class SandDunesBiome extends Biome {
  constructor() {
    super({
      name: 'Sand Dunes',
      type: 'coastal_sand_dunes',
      palette: {
        sky: { start: '#E0F0F8', end: '#C8E0F0' },
        background: { start: '#C8D8E8', end: '#B0C0D0' },
        midground: { start: '#E8D0B0', end: '#D0B898' },
        foreground: { start: '#B89870', end: '#A08058' },
        accent: '#98B878', // Dune grass
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Lake water
    const lakeY = height * 0.55;
    layers.push(
      `<rect x="0" y="${lakeY}" width="${width}" height="${height - lakeY}" fill="${this.palette.background!.start}" />`
    );

    // Subtle lake waves
    for (let i = 0; i < 4; i++) {
      const y = lakeY + (i * (height - lakeY) / 4);
      layers.push(
        `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${this.palette.background!.end}" stroke-width="2" opacity="0.25" />`
      );
    }

    // Midground: Large sand dunes (dramatic slopes)
    const dune1Path = `M 0,${height * 0.75} Q ${width * 0.2},${height * 0.55} ${width * 0.4},${height * 0.75} L ${width * 0.4},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${dune1Path}" fill="${this.palette.midground!.start}" opacity="0.9" />`
    );

    const dune2Path = `M ${width * 0.35},${height * 0.78} Q ${width * 0.6},${height * 0.6} ${width * 0.85},${height * 0.78} L ${width},${height} L ${width * 0.35},${height} Z`;
    layers.push(
      `<path d="${dune2Path}" fill="${this.palette.midground!.end}" opacity="0.9" />`
    );

    // Dune grass on slopes
    for (let i = 0; i < 12; i++) {
      const x = width * 0.15 + (i * width * 0.05);
      const grassHeight = Math.min(width, height) * 0.03;
      const grassY = height * 0.62 + (i * 5);
      layers.push(
        `<line x1="${x}" y1="${grassY}" x2="${x + 3}" y2="${grassY - grassHeight}" stroke="${this.palette.accent}" stroke-width="2" opacity="0.6" />`
      );
    }

    // Foreground: Sandy beach
    const fgY = height * 0.85;
    layers.push(
      `<rect x="0" y="${fgY}" width="${width}" height="${height - fgY}" fill="${this.palette.foreground!.start}" />`
    );

    // Foreground vegetation
    for (let i = 0; i < 6; i++) {
      const x = (i * width / 6) + width * 0.08;
      const grassHeight = Math.min(width, height) * 0.05;
      layers.push(
        `<line x1="${x}" y1="${fgY + 10}" x2="${x}" y2="${fgY + 10 - grassHeight}" stroke="${this.palette.accent}" stroke-width="3" opacity="0.7" />`
      );
    }

    return layers;
  }
}

/**
 * Cliffside Coast Biome
 * Rocky cliffs meeting the ocean
 * States: ME, CA (Big Sur, Acadia)
 */
export class CliffsideCoastBiome extends Biome {
  constructor() {
    super({
      name: 'Cliffside Coast',
      type: 'coastal_cliffside',
      palette: {
        sky: { start: '#D0D8E0', end: '#B0B8C0' },
        background: { start: '#8898A8', end: '#708090' },
        midground: { start: '#606878', end: '#485060' },
        foreground: { start: '#384048', end: '#202830' },
        accent: '#F8F8F8', // Wave foam
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    const layers: string[] = [];

    // Background: Ocean
    const oceanY = height * 0.65;
    layers.push(
      `<rect x="0" y="${oceanY}" width="${width}" height="${height - oceanY}" fill="${this.palette.background!.start}" />`
    );

    // Ocean waves
    for (let i = 0; i < 6; i++) {
      const y = oceanY + (i * (height - oceanY) / 6);
      layers.push(
        `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${this.palette.background!.end}" stroke-width="2" opacity="0.4" />`
      );
    }

    // Midground: Dramatic cliff face (jagged polygons)
    const cliffPath = `M 0,${height * 0.7} L ${width * 0.3},${height * 0.55} L ${width * 0.35},${height * 0.6} L ${width * 0.6},${height * 0.5} L ${width * 0.65},${height * 0.58} L ${width},${height * 0.65} L ${width},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${cliffPath}" fill="${this.palette.midground!.start}" />`
    );

    // Cliff strata (horizontal lines for rock layers)
    const cliffTop = height * 0.5;
    const cliffBottom = height * 0.7;
    for (let i = 0; i < 5; i++) {
      const y = cliffTop + (i * (cliffBottom - cliffTop) / 5);
      const x1 = width * 0.2 + (i * 20);
      const x2 = width * 0.8 - (i * 15);
      layers.push(
        `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${this.palette.midground!.end}" stroke-width="3" opacity="0.6" />`
      );
    }

    // Wave foam at cliff base (white accents)
    const foamY = height * 0.68;
    for (let i = 0; i < 4; i++) {
      const x = width * 0.2 + (i * width * 0.15);
      const foamSize = Math.min(width, height) * 0.015;
      layers.push(
        `<ellipse cx="${x}" cy="${foamY}" rx="${foamSize * 2}" ry="${foamSize}" fill="${this.palette.accent}" opacity="0.7" />`
      );
    }

    // Foreground: Rocky outcrop
    const fgRockPath = `M 0,${height * 0.8} L ${width * 0.25},${height * 0.75} L ${width * 0.3},${height * 0.82} L ${width * 0.5},${height * 0.8} L ${width * 0.5},${height} L 0,${height} Z`;
    layers.push(
      `<path d="${fgRockPath}" fill="${this.palette.foreground!.start}" />`
    );

    return layers;
  }
}
