import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Cirqle, CirqleMember } from '../lib/types';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const CirqleManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [cirqle, setCirqle] = useState<Cirqle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNickname, setInviteNickname] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [inviting, setInviting] = useState(false);

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

      const data = result.data as { success: boolean; member?: CirqleMember; error?: string };

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
        setShowInviteForm(false);
      }
    } catch (error) {
      console.error('Error inviting to Cirqle:', error);
      alert('Failed to send invite. Please try again.');
    } finally {
      setInviting(false);
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
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            + Invite
          </button>
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
            <div key={member.memberId} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                {member.photoURL ? (
                  <img src={member.photoURL} alt={member.displayName || member.nickname} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-ocean-bright/20 flex items-center justify-center text-ocean-bright font-bold text-xl">
                    {member.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-navy-text">
                    {member.displayName || member.nickname}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                  {member.status === 'pending' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ✉️ Invite sent to {member.email}
                    </p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' :
                  member.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {member.status === 'active' ? 'ACTIVE' :
                   member.status === 'accepted' ? 'JOINED' : 'PENDING'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {cirqle?.members.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500 mb-4">No members in your Cirqle yet</p>
            <button
              onClick={() => setShowInviteForm(true)}
              className="text-ocean-bright hover:text-ocean-mid font-medium"
            >
              Send your first invite →
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

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                  setInviteNickname('');
                  setInviteRelationship('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail || !inviteNickname || !inviteRelationship || inviting}
                className="flex-1 bg-ocean-bright hover:bg-ocean-mid disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CirqleManager;
