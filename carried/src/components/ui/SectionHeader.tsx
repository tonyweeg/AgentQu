/**
 * SectionHeader Component
 * Carried - Motions carry, memory too
 *
 * MUI-like section header with icon, title, count badge, and optional action
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ icon: Icon, title, count, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <span className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-slate-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
            {count.toLocaleString()}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}
