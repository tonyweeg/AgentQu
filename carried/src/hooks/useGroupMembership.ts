/**
 * Group Membership Hook
 * Carried - Motions carry, memory too
 *
 * Checks if the current user is a member of a group
 */

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { useAuth } from './useAuth';
import { GroupMember, Group } from '../types';

export interface MembershipInfo {
  isMember: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  role: 'owner' | 'admin' | 'member' | null;
  canAddMeetings: boolean;
  loading: boolean;
}

/**
 * Hook to check user's membership status in a group
 */
export function useGroupMembership(groupId: string | undefined): MembershipInfo {
  const { user } = useAuth();
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo>({
    isMember: false,
    isOwner: false,
    isAdmin: false,
    role: null,
    canAddMeetings: false,
    loading: true,
  });

  useEffect(() => {
    async function checkMembership() {
      if (!groupId || !user) {
        setMembershipInfo({
          isMember: false,
          isOwner: false,
          isAdmin: false,
          role: null,
          canAddMeetings: false,
          loading: false,
        });
        return;
      }

      try {
        // First check if user is the group creator (owner)
        const groupDoc = await getDoc(doc(db, COLLECTIONS.GROUPS, groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data() as Group;
          if (groupData.createdBy === user.uid) {
            setMembershipInfo({
              isMember: true,
              isOwner: true,
              isAdmin: true,
              role: 'owner',
              canAddMeetings: true,
              loading: false,
            });
            return;
          }
        }

        // Check groupMembers collection for membership
        const membersRef = collection(db, COLLECTIONS.GROUP_MEMBERS);
        const q = query(
          membersRef,
          where('groupId', '==', groupId),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const memberData = snapshot.docs[0].data() as GroupMember;
          const role = memberData.role;
          setMembershipInfo({
            isMember: true,
            isOwner: role === 'owner',
            isAdmin: role === 'owner' || role === 'admin',
            role,
            canAddMeetings: true, // All members can add meetings
            loading: false,
          });
        } else {
          setMembershipInfo({
            isMember: false,
            isOwner: false,
            isAdmin: false,
            role: null,
            canAddMeetings: false,
            loading: false,
          });
        }
      } catch (error) {
        console.error('CARRIED_DEBUG: Error checking membership:', error);
        setMembershipInfo({
          isMember: false,
          isOwner: false,
          isAdmin: false,
          role: null,
          canAddMeetings: false,
          loading: false,
        });
      }
    }

    checkMembership();
  }, [groupId, user]);

  return membershipInfo;
}
