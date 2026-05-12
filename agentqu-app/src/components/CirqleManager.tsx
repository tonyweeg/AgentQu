import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Cirqle, CirqleMember } from '../lib/types';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import MemberAffinities from './MemberAffinities';

const CirqleManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [cirqle, setCirqle] = useState<Cirqle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [editingMember, setEditingMember] = useState<CirqleMember | null>(null);
  const [editingMemberAffinities, setEditingMemberAffinities] = useState<CirqleMember | null>(null);

  // Invite form state (for email invites)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNickname, setInviteNickname] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [inviting, setInviting] = useState(false);
  const [detectedUser, setDetectedUser] = useState<any>(null);

  // Family member form state (no email required)
  const [familyNickname, setFamilyNickname] = useState('');
  const [familyRelationship, setFamilyRelationship] = useState('');
  const [familyAge, setFamilyAge] = useState('');
  const [addingFamily, setAddingFamily] = useState(false);

  // Load user's Cirqle
  useEffect(() => {
    if (!user) return;

    const loadCirqle = async () => {
      try {
        const db = getFirestore();
        const cirqleRef = doc(db, 'cirqles', user.uid);
        const cirqleDoc = await getDoc(cirqleRef);

        if (cirqleDoc.exists()) {
          setCirqle(cirqleDoc.data() as Cirqle);
        } else {
          // Create new Cirqle for user
          const newCirqle: Cirqle = {
            cirqleId: user.uid,
            ownerId: user.uid,
            ownerName: profile?.displayName || 'My Cirqle',
            members: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await setDoc(cirqleRef, newCirqle);
          setCirqle(newCirqle);
        }
      } catch (error) {
        console.error('Error loading Cirqle:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCirqle();
  }, [user, profile]);

  const handleInvite = async () => {
    if (!user || !cirqle || !inviteEmail || !inviteNickname || !inviteRelationship) return;

    setInviting(true);
    try {
      const functions = getFunctions();
      const inviteToCirqle = httpsCallable(functions, 'inviteToCirqle');

      const result = await inviteToCirqle({
        email: inviteEmail,
        nickname: inviteNickname,
        relationship: inviteRelationship,
      });

      const data = result.data as {
        success: boolean;
        member?: CirqleMember;
        existingUser?: any;
        error?: string;
      };

      if (data.success) {
        // Check if user already exists in system
        if (data.existingUser) {
          console.log('🔍 DETECTED EXISTING USER:', data.existingUser);
          setDetectedUser(data.existingUser);
          // Don't reset form yet - show "Add to Cirqle" button
        } else if (data.member) {
          // Add member to local state (pending invite)
          setCirqle({
            ...cirqle,
            members: [...cirqle.members, data.member],
            updatedAt: Date.now(),
          });

          // Reset form
          setInviteEmail('');
          setInviteNickname('');
          setInviteRelationship('');
          setShowInviteForm(false);
          alert('Invite sent! They will appear in your Cirqle once they accept.');
        }
      }
    } catch (error) {
      console.error('Error inviting to Cirqle:', error);
      alert('Failed to send invite. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Add existing user directly to Cirqle
  const handleAddExistingUser = async () => {
    if (!user || !cirqle || !detectedUser) return;

    setInviting(true);
    try {
      const functions = getFunctions();
      const addExistingUserToCirqle = httpsCallable(functions, 'addExistingUserToCirqle');

      const result = await addExistingUserToCirqle({
        targetUserId: detectedUser.uid,
        nickname: inviteNickname,
        relationship: inviteRelationship,
      });

      const data = result.data as { success: boolean; member?: CirqleMember };

      if (data.success && data.member) {
        // Add member to local state
        setCirqle({
          ...cirqle,
          members: [...cirqle.members, data.member],
          updatedAt: Date.now(),
        });

        // Reset form
        setInviteEmail('');
        setInviteNickname('');
        setInviteRelationship('');
        setDetectedUser(null);
        setShowInviteForm(false);
        alert(`${inviteNickname} has been added to your Cirqle!`);
      }
    } catch (error) {
      console.error('Error adding existing user to Cirqle:', error);
      alert('Failed to add user. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Add family member directly (no email/invite required)
  const handleAddFamily = async () => {
    if (!user || !cirqle || !familyNickname || !familyRelationship) return;

    setAddingFamily(true);
    try {
      const db = getFirestore();
      const cirqleRef = doc(db, 'cirqles', user.uid);

      // Create new family member
      const newMember: CirqleMember = {
        memberId: `family_${Date.now()}`,
        ownerUserId: user.uid,
        nickname: familyNickname,
        relationship: familyRelationship,
        age: familyAge ? parseInt(familyAge) : undefined,
        memberType: 'family',
        status: 'active', // Family members are immediately active
        affinities: {}, // Will be set later through preferences
        invitedAt: Date.now(),
      };

      const updatedMembers = [...cirqle.members, newMember];

      await updateDoc(cirqleRef, {
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      // Update local state
      setCirqle({
        ...cirqle,
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      console.log(`✅ Added family member: ${familyNickname} (${familyAge || 'age not set'})`);

      // Reset form
      setFamilyNickname('');
      setFamilyRelationship('');
      setFamilyAge('');
      setShowFamilyForm(false);
      setShowAddOptions(false);
    } catch (error) {
      console.error('Error adding family member:', error);
      alert('Failed to add family member. Please try again.');
    } finally {
      setAddingFamily(false);
    }
  };

  // Remove member from Cirqle
  const handleRemoveMember = async (memberId: string) => {
    if (!user || !cirqle) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const db = getFirestore();
      const cirqleRef = doc(db, 'cirqles', user.uid);

      const updatedMembers = cirqle.members.filter((m) => m.memberId !== memberId);

      await updateDoc(cirqleRef, {
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      setCirqle({
        ...cirqle,
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      console.log('✅ Removed member from Cirqle');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  // Save member affinities
  const handleSaveMemberAffinities = async (memberId: string, affinities: Record<string, number>) => {
    if (!user || !cirqle) return;

    try {
      const db = getFirestore();
      const cirqleRef = doc(db, 'cirqles', user.uid);

      // Find member and update their affinities
      const updatedMembers = cirqle.members.map((m) =>
        m.memberId === memberId ? { ...m, affinities } : m
      );

      await updateDoc(cirqleRef, {
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      setCirqle({
        ...cirqle,
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      console.log(`✅ Saved affinities for member ${memberId}:`, affinities);
    } catch (error) {
      console.error('Error saving member affinities:', error);
      throw error;
    }
  };

  // Edit member details
  const handleEditMember = async () => {
    if (!user || !cirqle || !editingMember) return;

    try {
      const db = getFirestore();
      const cirqleRef = doc(db, 'cirqles', user.uid);

      // Update member with new values
      const updatedMembers = cirqle.members.map((m) =>
        m.memberId === editingMember.memberId
          ? {
              ...m,
              nickname: familyNickname || m.nickname,
              relationship: familyRelationship || m.relationship,
              age: familyAge ? parseInt(familyAge) : m.age,
            }
          : m
      );

      await updateDoc(cirqleRef, {
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      setCirqle({
        ...cirqle,
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      console.log(`✅ Updated member: ${familyNickname}`);

      // Reset form
      setEditingMember(null);
      setFamilyNickname('');
      setFamilyRelationship('');
      setFamilyAge('');
    } catch (error) {
      console.error('Error editing member:', error);
      alert('Failed to update member. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-bright border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-text mb-2">
          👥 My Cirqle
        </h1>
        <p className="text-gray-600">
          Invite family and friends to join your circle for collaborative trip planning
        </p>
      </div>

      {/* Cirqle Members */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy-text">Members ({cirqle?.members.length || 0})</h2>
          <div className="relative">
            <button
              onClick={() => setShowAddOptions(!showAddOptions)}
              className="bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              + Add Member
            </button>

            {/* Add Options Dropdown */}
            {showAddOptions && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-10">
                <button
                  onClick={() => {
                    setShowFamilyForm(true);
                    setShowAddOptions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-seafoam/20 transition-colors rounded-t-xl border-b border-gray-200"
                >
                  <p className="font-bold text-navy-text">👨‍👩‍👧‍👦 Add Family Member</p>
                  <p className="text-xs text-gray-600">No email needed (kids, pets, etc.)</p>
                </button>
                <button
                  onClick={() => {
                    setShowInviteForm(true);
                    setShowAddOptions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-ocean-bright/20 transition-colors rounded-b-xl"
                >
                  <p className="font-bold text-navy-text">✉️ Send Email Invite</p>
                  <p className="text-xs text-gray-600">For adults with their own account</p>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Owner Card */}
        <div className="mb-4 bg-gradient-to-r from-ocean-bright/10 to-seafoam/10 rounded-xl p-4 border-2 border-ocean-bright">
          <div className="flex items-center gap-3">
            {profile?.photoURL && (
              <img src={profile.photoURL} alt={profile.displayName || 'User'} className="w-12 h-12 rounded-full" />
            )}
            <div className="flex-1">
              <p className="font-bold text-navy-text">{profile?.displayName} (You)</p>
              <p className="text-sm text-gray-600">Circle Owner</p>
            </div>
            <div className="bg-ocean-bright text-white px-3 py-1 rounded-full text-xs font-bold">
              OWNER
            </div>
          </div>
        </div>

        {/* Member Cards */}
        <div className="space-y-3">
          {cirqle?.members.map((member) => (
            <div key={member.memberId} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-ocean-bright/50 transition-all">
              <div className="flex items-center gap-3">
                {member.photoURL ? (
                  <img src={member.photoURL} alt={member.displayName || member.nickname} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-ocean-bright/20 flex items-center justify-center text-ocean-bright font-bold text-xl">
                    {member.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy-text">
                      {member.displayName || member.nickname}
                    </p>
                    {member.age && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        Age {member.age}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                  {member.memberType === 'invited' && member.status === 'pending' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ✉️ Invite sent to {member.email}
                    </p>
                  )}
                  {member.memberType === 'family' && (
                    <p className="text-xs text-seafoam font-medium mt-1">
                      👨‍👩‍👧‍👦 Family Member (No OAuth needed)
                    </p>
                  )}
                  {member.affinities && Object.keys(member.affinities).length > 0 && (
                    <p className="text-xs text-green-600 font-bold mt-1">
                      ✓ Preferences Set
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingMemberAffinities(member)}
                    className="bg-ocean-bright/10 hover:bg-ocean-bright/20 text-ocean-bright px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    title="Set preferences"
                  >
                    {member.affinities && Object.keys(member.affinities).length > 0 ? 'Edit Preferences' : 'Set Preferences'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setFamilyNickname(member.nickname);
                      setFamilyRelationship(member.relationship);
                      setFamilyAge(member.age?.toString() || '');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-all"
                    title="Edit member"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    member.status === 'active' ? 'bg-green-100 text-green-800' :
                    member.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {member.status === 'active' ? 'ACTIVE' :
                     member.status === 'accepted' ? 'JOINED' : 'PENDING'}
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.memberId)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Remove member"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cirqle?.members.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500 mb-4">No members in your Cirqle yet</p>
            <button
              onClick={() => setShowAddOptions(true)}
              className="text-ocean-bright hover:text-ocean-mid font-medium"
            >
              Add your first member →
            </button>
          </div>
        )}
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-navy-text mb-6">Invite to Your Cirqle</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nickname</label>
                <input
                  type="text"
                  value={inviteNickname}
                  onChange={(e) => setInviteNickname(e.target.value)}
                  placeholder="Emma, Dad, Sarah..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Relationship</label>
                <select
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                >
                  <option value="">Select relationship...</option>
                  <option value="daughter">Daughter</option>
                  <option value="son">Son</option>
                  <option value="spouse">Spouse/Partner</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Show detected user message and "Add to Cirqle" button */}
            {detectedUser && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold mb-2">
                  ✅ User found in AgentQu!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  <strong>{detectedUser.displayName}</strong> ({detectedUser.email}) is already registered.
                  You can add them directly to your Cirqle!
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                  setInviteNickname('');
                  setInviteRelationship('');
                  setDetectedUser(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {detectedUser ? (
                <button
                  onClick={handleAddExistingUser}
                  disabled={inviting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {inviting ? 'Adding...' : '✅ Add to Cirqle'}
                </button>
              ) : (
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || !inviteNickname || !inviteRelationship || inviting}
                  className="flex-1 bg-ocean-bright hover:bg-ocean-mid disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Family Member Form Modal (No Email Required) */}
      {(showFamilyForm || editingMember) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-navy-text mb-2">
              {editingMember ? '✏️ Edit Member' : '👨‍👩‍👧‍👦 Add Family Member'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {editingMember ? 'Update member details' : 'No email needed - perfect for young kids!'}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nickname *</label>
                <input
                  type="text"
                  value={familyNickname}
                  onChange={(e) => setFamilyNickname(e.target.value)}
                  placeholder="Emma, Buddy, Little One..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Relationship *</label>
                <select
                  value={familyRelationship}
                  onChange={(e) => setFamilyRelationship(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                >
                  <option value="">Select relationship...</option>
                  <option value="daughter">Daughter</option>
                  <option value="son">Son</option>
                  <option value="spouse">Spouse/Partner</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="pet">Pet</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Age (Optional)</label>
                <input
                  type="number"
                  value={familyAge}
                  onChange={(e) => setFamilyAge(e.target.value)}
                  placeholder="7"
                  min="0"
                  max="120"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-ocean-bright focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Helps algorithm make age-appropriate recommendations</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFamilyForm(false);
                  setEditingMember(null);
                  setFamilyNickname('');
                  setFamilyRelationship('');
                  setFamilyAge('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingMember ? handleEditMember : handleAddFamily}
                disabled={!familyNickname || !familyRelationship || addingFamily}
                className="flex-1 bg-ocean-bright hover:bg-ocean-mid disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
              >
                {editingMember ? 'Update Member' : (addingFamily ? 'Adding...' : 'Add Member')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Affinities Modal (z-60 to layer above z-50) */}
      {editingMemberAffinities && (
        <MemberAffinities
          member={editingMemberAffinities}
          onClose={() => setEditingMemberAffinities(null)}
          onSave={handleSaveMemberAffinities}
        />
      )}
    </div>
  );
};

export default CirqleManager;
