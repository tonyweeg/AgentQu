/**
 * Legend Component
 * PoliScai - Democracy V2.0
 *
 * Color legend for shadow notes and V2.0 text
 */

import React from 'react';

interface LegendItem {
  color: string;
  label: string;
  description?: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  {
    color: 'bg-shadow-approved',
    label: 'flagged bias',
    description: 'Ambiguity identified in Shadow text',
  },
  {
    color: 'bg-shadow-compliant',
    label: 'revised',
    description: 'Shadow text updated in V2.0',
  },
  {
    color: 'bg-shadow-revised',
    label: 'new in V2.0',
    description: 'New language added to Revised',
  },
];

export function Legend() {
  return (
    <div className="flex items-center gap-6">
      {LEGEND_ITEMS.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
          <span className="text-sm text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default Legend;
