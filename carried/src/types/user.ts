/**
 * User Types
 * Carried - Motions carry, memory too
 */

import { Timestamp } from 'firebase/firestore';

export interface CarriedUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  groups: string[];             // Group IDs the user belongs to
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
