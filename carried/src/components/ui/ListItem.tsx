/**
 * ListItem Component
 * Carried - Motions carry, memory too
 *
 * MUI-like clickable list item with consistent styling
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  dense?: boolean;
  disabled?: boolean;
  selected?: boolean;
  showChevron?: boolean;
  className?: string;
}

export function ListItem({
  children,
  onClick,
  icon,
  secondaryAction,
  dense = false,
  disabled = false,
  selected = false,
  showChevron = true,
  className = '',
}: ListItemProps) {
  const baseStyles = 'flex items-center gap-3 rounded-lg transition-all';
  const paddingStyles = dense ? 'px-2 py-1.5' : 'px-3 py-2.5';
  const interactiveStyles = onClick && !disabled
    ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15'
    : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const selectedStyles = selected ? 'bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-200 dark:ring-teal-700' : '';

  return (
    <div
      className={`${baseStyles} ${paddingStyles} ${interactiveStyles} ${disabledStyles} ${selectedStyles} ${className}`}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {icon && (
        <div className="shrink-0 text-gray-500 dark:text-gray-400">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {secondaryAction && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {secondaryAction}
        </div>
      )}
      {onClick && showChevron && !secondaryAction && (
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
      )}
    </div>
  );
}

interface ListItemTextProps {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  dense?: boolean;
}

export function ListItemText({ primary, secondary, dense = false }: ListItemTextProps) {
  return (
    <div className="min-w-0">
      <p className={`text-gray-900 dark:text-gray-100 truncate ${dense ? 'text-sm' : 'text-base'}`}>
        {primary}
      </p>
      {secondary && (
        <p className={`text-gray-500 dark:text-gray-400 truncate ${dense ? 'text-xs' : 'text-sm'}`}>
          {secondary}
        </p>
      )}
    </div>
  );
}

interface ListProps {
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}

export function List({ children, className = '', dense = false }: ListProps) {
  return (
    <div className={`space-y-${dense ? '0.5' : '1'} ${className}`}>
      {children}
    </div>
  );
}
