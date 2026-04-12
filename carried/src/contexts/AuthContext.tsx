/**
 * Auth Context
 * Carried - Motions carry, memory too
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, COLLECTIONS } from '../config/firebase';
import { CarriedUser } from '../types';

interface AuthContextType {
  user: User | null;
  carriedUser: CarriedUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [carriedUser, setCarriedUser] = useState<CarriedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get or create Carried user profile
        const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Update last login
          await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          setCarriedUser(userDoc.data() as CarriedUser);
        } else {
          // Create new user profile
          const newUser: Omit<CarriedUser, 'createdAt' | 'lastLoginAt'> & {
            createdAt: ReturnType<typeof serverTimestamp>;
            lastLoginAt: ReturnType<typeof serverTimestamp>;
          } = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Anonymous',
            photoURL: firebaseUser.photoURL || undefined,
            groups: [],
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          await setDoc(userRef, newUser);
          setCarriedUser(newUser as unknown as CarriedUser);
        }
      } else {
        setCarriedUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('CARRIED_DEBUG: Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('CARRIED_DEBUG: Sign out error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    carriedUser,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
