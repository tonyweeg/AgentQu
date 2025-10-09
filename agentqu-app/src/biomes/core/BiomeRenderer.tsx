/**
 * BiomeRenderer - React component that renders dynamic biome backgrounds
 * Integrates with location and automatically selects appropriate biome
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Location } from '../../lib/types';
import { BiomeDetector } from './BiomeDetector';
import { BiomeFactory } from './BiomeFactory';
import { Biome } from '../types/Biome';

interface BiomeRendererProps {
  location: Location | null;
  state?: string | null;
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  width?: number;
  height?: number;
  className?: string;
}

const BiomeRenderer: React.FC<BiomeRendererProps> = ({
  location,
  state,
  timeOfDay = 'day',
  width = window.innerWidth,
  height = window.innerHeight,
  className = '',
}) => {
  const [biome, setBiome] = useState<Biome | null>(null);
  const [loading, setLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>('');

  const factory = useMemo(() => BiomeFactory.getInstance(), []);

  /**
   * Detect and set biome when location changes
   */
  useEffect(() => {
    const detectAndSetBiome = async () => {
      if (!location) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Detect biome type
        const detection = await BiomeDetector.detectBiome(location, state);
        console.log('🌍 Biome detected:', detection);

        // Create biome instance
        const biomeInstance = factory.createBiome(detection.biomeType);
        setBiome(biomeInstance);

        // Generate SVG
        const svg = biomeInstance.render(width, height, timeOfDay);
        setSvgContent(svg);
      } catch (error) {
        console.error('Error detecting biome:', error);
        // Fallback to default biome
        const defaultBiome = factory.createBiome('coastal_sandy');
        setBiome(defaultBiome);
        setSvgContent(defaultBiome.render(width, height, timeOfDay));
      } finally {
        setLoading(false);
      }
    };

    detectAndSetBiome();
  }, [location, state, factory, width, height, timeOfDay]);

  /**
   * Re-render when time of day changes
   */
  useEffect(() => {
    if (biome) {
      const svg = biome.render(width, height, timeOfDay);
      setSvgContent(svg);
    }
  }, [timeOfDay, biome, width, height]);

  if (loading || !svgContent) {
    return (
      <div className={`fixed inset-0 bg-gradient-to-br from-seafoam to-white ${className}`}>
        {/* Fallback gradient while loading */}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 transition-opacity duration-1000 ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default BiomeRenderer;
