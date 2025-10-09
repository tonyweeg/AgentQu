import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const JoinCirqle: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cirqleName, setCirqleName] = useState('');

  // Get invite token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('token');

  const handleJoin = useCallback(async () => {
    if (!user || !inviteToken) return;

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const joinCirqle = httpsCallable(functions, 'joinCirqle');

      const result = await joinCirqle({ inviteToken });
      const data = result.data as { success: boolean; cirqle?: any; error?: string };

      if (data.success && data.cirqle) {
        setCirqleName(data.cirqle.ownerName);
        setSuccess(true);

        // Redirect to main app after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(data.error || 'Failed to join Cirqle');
      }
    } catch (err: any) {
      console.error('Error joining Cirqle:', err);
      setError('Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  }, [user, inviteToken]);

  useEffect(() => {
    if (user && inviteToken && !success) {
      handleJoin();
    }
  }, [user, inviteToken, success, handleJoin]);

  if (!inviteToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-navy-text mb-4">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">This invite link is not valid.</p>
          <a href="/" className="text-ocean-bright hover:text-ocean-mid font-medium">
            Go to Home →
          </a>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-navy-text mb-4">
            👥 Join a Cirqle
          </h1>
          <p className="text-gray-600 mb-6">
            You've been invited to join a Cirqle! Sign in with Google to accept the invitation.
          </p>
          <div className="bg-ocean-bright/10 border-2 border-ocean-bright rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700">
              After signing in, you'll automatically join the Cirqle and can start planning trips together!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-navy-text mb-2">
              Welcome to the Cirqle!
            </h1>
            <p className="text-gray-600">
              You've successfully joined <span className="font-bold text-ocean-bright">{cirqleName}</span>
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Redirecting you to the app...
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ocean-bright border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Joining Cirqle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-navy-text mb-2">
              Oops!
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a href="/" className="text-ocean-bright hover:text-ocean-mid font-medium">
              Go to Home →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinCirqle;
