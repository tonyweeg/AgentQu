/**
 * Authentication Context
 * PoliScai - Democracy V2.0
 *
 * Provides Google SSO authentication via Firebase
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, COLLECTIONS } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isVerifiedContributor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch or create user profile in Firestore
  const fetchOrCreateUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Update last login
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        });
        return userSnap.data() as UserProfile;
      } else {
        // Create new user profile
        const newProfile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & {
          createdAt: ReturnType<typeof serverTimestamp>;
          lastLoginAt: ReturnType<typeof serverTimestamp>;
        } = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Anonymous Citizen',
          photoURL: firebaseUser.photoURL || undefined,
          role: 'citizen' as UserRole,
          submissionCount: 0,
          approvedSubmissionCount: 0,
          votesCast: 0,
          disputesSubmitted: 0,
          queriesRun: 0,
          isSuspended: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };

        await setDoc(userRef, newProfile);

        // Fetch the created profile to get server timestamps resolved
        const createdSnap = await getDoc(userRef);
        return createdSnap.data() as UserProfile;
      }
    } catch (err) {
      console.error('POLISCAI_AUTH: Error fetching/creating user profile:', err);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('POLISCAI_AUTH: Auth state changed:', firebaseUser?.email || 'signed out');

      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchOrCreateUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    try {
      console.log('POLISCAI_AUTH: Initiating Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('POLISCAI_AUTH: Sign-in successful:', result.user.email);
    } catch (err: any) {
      console.error('POLISCAI_AUTH: Sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      console.log('POLISCAI_AUTH: Signing out...');
      await firebaseSignOut(auth);
      console.log('POLISCAI_AUTH: Sign-out successful');
    } catch (err: any) {
      console.error('POLISCAI_AUTH: Sign-out error:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isVerifiedContributor: (userProfile?.approvedSubmissionCount || 0) >= 5,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
