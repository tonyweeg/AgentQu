/**
 * App Header
 * Carried - Motions carry, memory too
 */

import { Link, useNavigate } from 'react-router-dom';
import { Vote, LogOut, User, Plus, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';

export function AppHeader() {
  const { user, carriedUser, signInWithGoogle, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-gray-900 hover:text-indigo-600 transition-colors">
            <Vote className="w-7 h-7 text-indigo-600" />
            <span className="font-bold text-xl">Carried</span>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Groups
              </Link>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle - always visible */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                <Button size="sm" onClick={() => navigate('/groups/new')}>
                  <Plus className="w-4 h-4" />
                  New Group
                </Button>
                <div className="flex items-center gap-2">
                  {carriedUser?.photoURL ? (
                    <img
                      src={carriedUser.photoURL}
                      alt={carriedUser.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Button onClick={signInWithGoogle}>Sign in with Google</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
