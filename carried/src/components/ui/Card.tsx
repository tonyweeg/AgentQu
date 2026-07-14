/**
 * Card Component
 * Carried - Motions carry, memory too
 */

import React, { forwardRef } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  hoverable?: boolean;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

const ELEVATIONS = {
  0: 'shadow-none',
  1: 'shadow-sm',
  2: 'shadow',
  3: 'shadow-md',
  4: 'shadow-lg',
  5: 'shadow-xl',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', onClick, hoverable = false, elevation = 4 }, ref) => {
    const baseStyles = 'bg-white dark:bg-slate-800 rounded-2xl overflow-hidden transition-all';
    const shadowStyle = ELEVATIONS[elevation];
    const hoverStyles = hoverable ? 'cursor-pointer duration-300 hover:shadow-xl hover:-translate-y-1' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${shadowStyle} ${hoverStyles} ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>;
}
