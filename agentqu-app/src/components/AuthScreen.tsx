import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      // Force account selection every time
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('Signed in as:', user.displayName);
      onSuccess();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-bright/10 to-seafoam/30 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Hero Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Left side - Logo and branding */}
            <div className="flex-shrink-0">
              <img
                src="/agentqu-logo.png"
                alt="AgentQu"
                className="h-32 md:h-40 w-auto"
              />
            </div>

            {/* Right side - Content */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-navy-text mb-3">AgentQu</h1>
              <p className="text-xl md:text-2xl text-ocean-bright font-semibold mb-4">
                Discover Amazing Activities Near You
              </p>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                Your personal AI-powered activity discovery assistant. Find the perfect things to do based on your location, interests, and preferences - from restaurants and events to outdoor adventures and hidden gems.
              </p>

              {/* Feature pills - horizontal */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/20 to-ocean-bright/10 px-4 py-2 rounded-full">
                  <span className="text-xl">📍</span>
                  <span className="text-sm font-semibold text-navy-text">Location-Based</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/20 to-ocean-bright/10 px-4 py-2 rounded-full">
                  <span className="text-xl">🎯</span>
                  <span className="text-sm font-semibold text-navy-text">Personalized</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/20 to-ocean-bright/10 px-4 py-2 rounded-full">
                  <span className="text-xl">✨</span>
                  <span className="text-sm font-semibold text-navy-text">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-navy-text mb-6 text-center">
            Get Started
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 hover:border-ocean-bright text-navy-text font-medium py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-ocean-bright border-t-transparent"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-ocean-bright hover:text-ocean-mid font-medium underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-ocean-bright hover:text-ocean-mid font-medium underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Corporate Links */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <a href="/privacy" className="text-gray-700 hover:text-ocean-bright transition-colors font-medium">
            Privacy Policy
          </a>
          <span className="text-gray-400">•</span>
          <a href="/terms" className="text-gray-700 hover:text-ocean-bright transition-colors font-medium">
            Terms of Service
          </a>
          <span className="text-gray-400">•</span>
          <a href="/contact" className="text-gray-700 hover:text-ocean-bright transition-colors font-medium">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
