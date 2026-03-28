/**
 * AppHeader Component
 * PoliScai - Democracy V2.0
 *
 * Main navigation header with tabs and AI indicator
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, LogOut, User } from 'lucide-react';

interface NavTab {
  label: string;
  path: string;
}

const NAV_TABS: NavTab[] = [
  { label: 'Constitution', path: '/constitution' },
  { label: 'Review', path: '/review' },
  { label: 'Query', path: '/query' },
  { label: 'Analysis', path: '/analysis' },
];

export function AppHeader() {
  const location = useLocation();
  const { isAuthenticated, user, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <span className="text-2xl font-serif font-bold text-poliscai-dark">
              PoliScai
            </span>
            <span className="text-sm text-gray-500">Democracy V2.0</span>
            <span className="px-2 py-0.5 bg-poliscai-secondary/20 text-poliscai-secondary text-xs font-semibold rounded">
              Beta
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_TABS.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${isActive
                      ? 'bg-poliscai-dark text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: AI indicator + Auth */}
          <div className="flex items-center gap-4">
            {/* AI Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span className="text-xs">AI:</span>
              <span className="font-medium text-poliscai-dark">Gemini 2.5 Pro</span>
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-poliscai-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-poliscai-primary" />
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {user?.displayName?.split(' ')[0]}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-poliscai-primary text-white rounded-lg hover:bg-poliscai-primary/90 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
