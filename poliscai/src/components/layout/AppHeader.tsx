/**
 * AppHeader Component
 * PoliScAI - Democracy V2.0
 *
 * Main navigation header with tabs, profile dropdown, and AI indicator
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SettingsModal } from '../profile/SettingsModal';
import {
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Settings,
  Award,
  FileText,
  Menu,
  X,
} from 'lucide-react';

interface NavTab {
  label: string;
  path: string;
}

const NAV_TABS: NavTab[] = [
  { label: 'Constitution', path: '/constitution' },
  { label: 'Review', path: '/review' },
  { label: 'Query', path: '/query' },
];

export function AppHeader() {
  const location = useLocation();
  const { isAuthenticated, user, userProfile, signInWithGoogle, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSettings = () => {
    setShowProfileMenu(false);
    setShowSettings(true);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <span className="text-2xl font-serif font-bold text-poliscai-dark">
                PoliSc<span className="text-poliscai-primary">AI</span>
              </span>
              <span className="hidden sm:block text-sm text-gray-500">Democracy V2.0</span>
              <span className="px-2 py-0.5 bg-poliscai-secondary/20 text-poliscai-secondary text-xs font-semibold rounded">
                Beta
              </span>
            </Link>

            {/* Navigation Tabs - Desktop */}
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
                        ? 'bg-poliscai-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* AI Indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-indigo-700">Gemini 2.5</span>
              </div>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative" ref={profileMenuRef}>
                  {/* Profile Button */}
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full ring-2 ring-poliscai-primary/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-poliscai-primary to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user?.displayName?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user?.displayName?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-4 bg-gradient-to-r from-poliscai-primary to-indigo-800">
                        <div className="flex items-center gap-3">
                          {user?.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'User'}
                              className="w-12 h-12 rounded-full ring-2 ring-white/30"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                              {user?.displayName || 'Citizen'}
                            </p>
                            <p className="text-white/70 text-sm truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-center">
                            <p className="font-bold text-poliscai-dark">{userProfile?.submissionCount || 0}</p>
                            <p className="text-gray-500 text-xs">Flags</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-poliscai-dark">{userProfile?.votesCast || 0}</p>
                            <p className="text-gray-500 text-xs">Votes</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-green-600">{userProfile?.approvedSubmissionCount || 0}</p>
                            <p className="text-gray-500 text-xs">Approved</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">My Submissions</span>
                          <span className="ml-auto px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                            Soon
                          </span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Award className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Achievements</span>
                          <span className="ml-auto px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                            Soon
                          </span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={handleOpenSettings}
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Settings</span>
                        </button>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={() => {
                            signOut();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-poliscai-primary to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
              <nav className="flex flex-col gap-1">
                {NAV_TABS.map((tab) => {
                  const isActive = location.pathname.startsWith(tab.path);
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={`
                        px-4 py-3 rounded-lg font-medium transition-colors
                        ${isActive
                          ? 'bg-poliscai-primary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

export default AppHeader;
