import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getDefaultAffinities } from '../lib/affinityCategories';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  affinities: Record<string, number>;
  musicGenreAffinities?: Record<string, number>; // Music genre preferences (0-100)
  restaurantGenreAffinities?: Record<string, number>; // Restaurant genre preferences (0-100)
  onboarded: boolean;
  createdAt: number;
  lastActive: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load or create user profile
        await loadOrCreateProfile(firebaseUser);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadOrCreateProfile = async (firebaseUser: User) => {
    try {
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        // Profile exists
        setProfile(profileSnap.data() as UserProfile);

        // Update last active
        await setDoc(
          profileRef,
          { lastActive: Date.now() },
          { merge: true }
        );
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          affinities: getDefaultAffinities(),
          onboarded: false,
          createdAt: Date.now(),
          lastActive: Date.now(),
        };

        await setDoc(profileRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateAffinities = async (affinities: Record<string, number>) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(
        profileRef,
        {
          affinities,
          onboarded: true,
          lastActive: Date.now(),
        },
        { merge: true }
      );

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          affinities,
          onboarded: true,
        });
      }
    } catch (error) {
      console.error('Error updating affinities:', error);
      throw error;
    }
  };

  const updateMusicGenreAffinities = async (musicGenreAffinities: Record<string, number>) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(
        profileRef,
        {
          musicGenreAffinities,
          lastActive: Date.now(),
        },
        { merge: true }
      );

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          musicGenreAffinities,
        });
      }
    } catch (error) {
      console.error('Error updating music genre affinities:', error);
      throw error;
    }
  };

  const updateRestaurantGenreAffinities = async (restaurantGenreAffinities: Record<string, number>) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(
        profileRef,
        {
          restaurantGenreAffinities,
          lastActive: Date.now(),
        },
        { merge: true }
      );

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          restaurantGenreAffinities,
        });
      }
    } catch (error) {
      console.error('Error updating restaurant genre affinities:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    updateAffinities,
    updateMusicGenreAffinities,
    updateRestaurantGenreAffinities,
    signOut: () => auth.signOut(),
  };
}
