/**
 * BiomeRenderer - Simple wrapper that renders the beautiful WavyMountainBackground
 * Used everywhere in the app now!
 */

import React from 'react';
import { Location } from '../../lib/types';
import WavyMountainBackground from '../../components/WavyMountainBackground';

interface BiomeRendererProps {
  location: Location | null;
  state?: string | null;
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  width?: number;
  height?: number;
  className?: string;
}

const BiomeRenderer: React.FC<BiomeRendererProps> = ({ className = '' }) => {
  return <WavyMountainBackground className={className} />;
};

export default BiomeRenderer;
