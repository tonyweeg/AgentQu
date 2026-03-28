/**
 * AuthGuard Component
 * Protects routes that require authentication
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, Shield } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireVerified?: boolean;
}

export function AuthGuard({ children, fallback, requireVerified = false }: AuthGuardProps) {
  const { isAuthenticated, isVerifiedContributor, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poliscai-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <Shield className="w-16 h-16 text-poliscai-primary mb-4" />
        <h2 className="text-2xl font-serif text-poliscai-dark mb-2">
          Authentication Required
        </h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Sign in with your Google account to participate in constitutional scholarship.
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-2 px-6 py-3 bg-poliscai-primary text-white rounded-lg hover:bg-poliscai-primary/90 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    );
  }

  if (requireVerified && !isVerifiedContributor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <Shield className="w-16 h-16 text-poliscai-secondary mb-4" />
        <h2 className="text-2xl font-serif text-poliscai-dark mb-2">
          Verified Contributor Required
        </h2>
        <p className="text-gray-600 mb-4 text-center max-w-md">
          This feature requires Verified Contributor status.
        </p>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Submit and have 5 shadow notes approved by the community to earn this status.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
