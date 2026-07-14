/**
 * Breadcrumb Component
 * Carried - Motions carry, memory too
 *
 * Navigation breadcrumbs for page hierarchy
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

export function Breadcrumb({ items, className = '', showHomeIcon = true }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-sm ${className}`}
    >
      {showHomeIcon && (
        <>
          <Link
            to="/"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
          {items.length > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
          )}
        </>
      )}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors truncate max-w-[150px] sm:max-w-[200px]"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-1 text-gray-900 dark:text-gray-100 font-medium truncate max-w-[150px] sm:max-w-[250px]">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
            )}
            {!isLast && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

interface BreadcrumbsProps {
  children: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({ children, className = '' }: BreadcrumbsProps) {
  const items = React.Children.toArray(children);

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-sm ${className}`}
    >
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 && (
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
