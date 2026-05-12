/**
 * Settings Modal
 * PoliScai - Democracy V2.0
 *
 * User settings and profile information
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  X,
  User,
  Mail,
  Calendar,
  Award,
  FileText,
  ThumbsUp,
  Shield,
  Bell,
  Moon,
  LogOut,
  Loader2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, userProfile, signOut, updateUserSettings } = useAuth();
  const [savingSettings, setSavingSettings] = useState(false);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  // Toggle email notifications
  const handleToggleEmailNotifications = async () => {
    if (savingSettings) return;

    setSavingSettings(true);
    try {
      const currentValue = userProfile?.settings?.emailNotifications ?? false;
      await updateUserSettings({ emailNotifications: !currentValue });
      console.log('POLISCAI_DEBUG: Email notifications toggled to', !currentValue);
    } catch (err) {
      console.error('POLISCAI_DEBUG: Failed to update settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-poliscai-primary to-indigo-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-xl">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Profile Section */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Profile
            </h3>
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-16 h-16 rounded-full ring-4 ring-poliscai-primary/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-poliscai-primary to-indigo-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-lg text-gray-900">
                  {user?.displayName || 'Anonymous Citizen'}
                </p>
                <p className="text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Your Contributions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {userProfile?.submissionCount || 0}
                    </p>
                    <p className="text-sm text-gray-500">Flags Submitted</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {userProfile?.approvedSubmissionCount || 0}
                    </p>
                    <p className="text-sm text-gray-500">Approved</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {userProfile?.votesCast || 0}
                    </p>
                    <p className="text-sm text-gray-500">Votes Cast</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatDate(userProfile?.createdAt)}
                    </p>
                    <p className="text-sm text-gray-500">Member Since</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Status */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Account Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Role</span>
                </div>
                <span className="px-3 py-1 bg-poliscai-primary/10 text-poliscai-primary rounded-full text-sm font-medium capitalize">
                  {userProfile?.role || 'citizen'}
                </span>
              </div>

              {(userProfile?.approvedSubmissionCount || 0) >= 5 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700">Verified Contributor</span>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    Earned
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Preferences
            </h3>
            <div className="space-y-3">
              {/* Email Notifications - Functional */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-poliscai-primary" />
                  <div>
                    <span className="text-gray-700">Email Notifications</span>
                    <p className="text-xs text-gray-500">Get notified when your flags are voted on</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleEmailNotifications}
                  disabled={savingSettings}
                  className={`
                    w-12 h-7 rounded-full relative transition-colors duration-200
                    ${userProfile?.settings?.emailNotifications
                      ? 'bg-poliscai-primary'
                      : 'bg-gray-200'
                    }
                    ${savingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {savingSettings ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <div
                      className={`
                        w-5 h-5 bg-white rounded-full absolute top-1 shadow-md transition-transform duration-200
                        ${userProfile?.settings?.emailNotifications ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  )}
                </button>
              </div>

              {/* Dark Mode - Coming Soon */}
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-700">Dark Mode</span>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                </div>
                <div className="w-12 h-7 bg-gray-200 rounded-full relative cursor-not-allowed">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-1 top-1 shadow" />
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="p-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
