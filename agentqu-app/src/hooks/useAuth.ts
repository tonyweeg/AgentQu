import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getDefaultAffinities } from '../lib/affinityCategories';

export interface VisitedPlace {
  activityId: string;
  name: string;
  city?: string;
  state?: string;
  category: string;
  visitedAt: number;
  lat: number;
  lng: number;
  images?: string[];
  rating?: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  affinities: Record<string, number>;
  musicGenreAffinities?: Record<string, number>; // Music genre preferences (0-100)
  restaurantGenreAffinities?: Record<string, number>; // Restaurant genre preferences (0-100)
  isEV?: boolean; // Electric vehicle owner (unlocks eco-friendly visuals + supercharger locations)
  languageCode?: string; // Preferred language for affinity categories (en, es, zh, etc.)
  visitedPlaces?: VisitedPlace[]; // Places the user has been to
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
        const existingProfile = profileSnap.data() as UserProfile;
        setProfile(existingProfile);

        // Auto-detect and set language if not already set
        if (!existingProfile.languageCode) {
          const browserLang = navigator.language || navigator.languages?.[0] || 'en';
          const primaryLangCode = browserLang.split('-')[0].toLowerCase();
          console.log('🌍 Auto-detecting language for existing user:', primaryLangCode);

          // Update profile with detected language (will still go through onboarding)
          await setDoc(
            profileRef,
            { lastActive: Date.now() },
            { merge: true }
          );
        } else {
          // Update last active
          await setDoc(
            profileRef,
            { lastActive: Date.now() },
            { merge: true }
          );
        }
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

      // Update local state (use functional form to avoid race conditions)
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          affinities,
          onboarded: true,
        };
      });
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

      // Update local state (use functional form to avoid race conditions)
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          musicGenreAffinities,
        };
      });
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

      // Update local state (use functional form to avoid race conditions)
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          restaurantGenreAffinities,
        };
      });
    } catch (error) {
      console.error('Error updating restaurant genre affinities:', error);
      throw error;
    }
  };

  const updateEVStatus = async (isEV: boolean) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(
        profileRef,
        {
          isEV,
          lastActive: Date.now(),
        },
        { merge: true }
      );

      // Update local state (use functional form to avoid race conditions)
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          isEV,
        };
      });
    } catch (error) {
      console.error('Error updating EV status:', error);
      throw error;
    }
  };

  const updateLanguageCode = async (languageCode: string) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(
        profileRef,
        {
          languageCode,
          lastActive: Date.now(),
        },
        { merge: true }
      );

      // Update local state (use functional form to avoid race conditions)
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          languageCode,
        };
      });
    } catch (error) {
      console.error('Error updating language preference:', error);
      throw error;
    }
  };

  const markAsVisited = async (place: VisitedPlace) => {
    if (!user || !profile) return;

    try {
      const existingPlaces = profile.visitedPlaces || [];

      // Check if already visited (don't duplicate)
      const alreadyVisited = existingPlaces.some(
        p => p.activityId === place.activityId
      );

      if (alreadyVisited) {
        console.log('🗺️ Already marked as visited:', place.name);
        return;
      }

      const updatedPlaces = [...existingPlaces, place];

      const profileRef = doc(db, 'users', user.uid);
      await setDoc(
        profileRef,
        {
          visitedPlaces: updatedPlaces,
          lastActive: Date.now(),
        },
        { merge: true }
      );

      // Update local state (use functional form to avoid race conditions)
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          visitedPlaces: updatedPlaces,
        };
      });

      console.log('✅ Marked as visited:', place.name);
    } catch (error) {
      console.error('Error marking place as visited:', error);
      throw error;
    }
  };

  const removeVisitedPlace = async (activityId: string) => {
    if (!user || !profile) return;

    try {
      const existingPlaces = profile.visitedPlaces || [];
      const updatedPlaces = existingPlaces.filter(p => p.activityId !== activityId);

      const profileRef = doc(db, 'users', user.uid);
      await setDoc(
        profileRef,
        {
          visitedPlaces: updatedPlaces,
          lastActive: Date.now(),
        },
        { merge: true }
      );

      // Update local state (use functional form to avoid race conditions)
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          visitedPlaces: updatedPlaces,
        };
      });

      console.log('🗑️ Removed from visited places');
    } catch (error) {
      console.error('Error removing visited place:', error);
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
    updateEVStatus,
    updateLanguageCode,
    markAsVisited,
    removeVisitedPlace,
    signOut: () => auth.signOut(),
  };
}
