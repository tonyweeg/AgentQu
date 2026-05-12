import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('📈 STOCKS_AUTH: Auth state changed', user?.email);
      setState({
        user,
        loading: false,
        error: null,
      });
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    userId: state.user?.uid || null,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };
}
