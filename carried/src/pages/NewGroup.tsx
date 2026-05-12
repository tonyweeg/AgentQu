/**
 * New Group Page
 * Carried - Motions carry, memory too
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import {
  // Government & Civic
  Landmark,
  MapPin,
  GraduationCap,
  Map,
  Trees,
  BookOpen,
  Flame,
  Droplets,
  // Community & Residential
  Building2,
  Home,
  Users,
  // Organizations
  Heart,
  Church,
  School,
  Handshake,
  PartyPopper,
  // Business & Professional
  Briefcase,
  UserCheck,
  Layers,
  // Other
  Folder,
  ArrowLeft,
  Check,
  // Visibility
  Lock,
  Link,
  Globe,
} from 'lucide-react';
import { db, COLLECTIONS } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { GroupType, GroupVisibility, GROUP_TYPE_INFO, GROUP_TYPE_CATEGORIES, VISIBILITY_INFO } from '../types';

// Icon mapping for all group types
const TYPE_ICONS: Record<GroupType, React.ReactNode> = {
  // Government & Civic
  city_council: <Landmark className="w-5 h-5" />,
  town_council: <Landmark className="w-5 h-5" />,
  county_board: <MapPin className="w-5 h-5" />,
  school_board: <GraduationCap className="w-5 h-5" />,
  planning_commission: <Map className="w-5 h-5" />,
  historic_district: <Landmark className="w-5 h-5" />,
  parks_rec: <Trees className="w-5 h-5" />,
  library_board: <BookOpen className="w-5 h-5" />,
  fire_district: <Flame className="w-5 h-5" />,
  water_district: <Droplets className="w-5 h-5" />,
  // Community & Residential
  hoa: <Building2 className="w-5 h-5" />,
  coop: <Home className="w-5 h-5" />,
  neighborhood: <Users className="w-5 h-5" />,
  // Organizations
  nonprofit: <Heart className="w-5 h-5" />,
  church: <Church className="w-5 h-5" />,
  pta: <School className="w-5 h-5" />,
  union: <Handshake className="w-5 h-5" />,
  club: <PartyPopper className="w-5 h-5" />,
  // Business & Professional
  corporate_board: <Briefcase className="w-5 h-5" />,
  committee: <UserCheck className="w-5 h-5" />,
  team: <Layers className="w-5 h-5" />,
  // Personal
  family: <Heart className="w-5 h-5" />,
  other: <Folder className="w-5 h-5" />,
};

// Color mapping for selected state
const TYPE_COLORS: Record<string, string> = {
  blue: 'border-blue-500 bg-blue-50 text-blue-700',
  indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700',
  yellow: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  teal: 'border-teal-500 bg-teal-50 text-teal-700',
  green: 'border-green-500 bg-green-50 text-green-700',
  amber: 'border-amber-500 bg-amber-50 text-amber-700',
  red: 'border-red-500 bg-red-50 text-red-700',
  cyan: 'border-cyan-500 bg-cyan-50 text-cyan-700',
  slate: 'border-slate-500 bg-slate-50 text-slate-700',
  stone: 'border-stone-500 bg-stone-50 text-stone-700',
  emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  pink: 'border-pink-500 bg-pink-50 text-pink-700',
  purple: 'border-purple-500 bg-purple-50 text-purple-700',
  orange: 'border-orange-500 bg-orange-50 text-orange-700',
  rose: 'border-rose-500 bg-rose-50 text-rose-700',
  fuchsia: 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700',
  zinc: 'border-zinc-500 bg-zinc-50 text-zinc-700',
  violet: 'border-violet-500 bg-violet-50 text-violet-700',
  sky: 'border-sky-500 bg-sky-50 text-sky-700',
  gray: 'border-gray-500 bg-gray-50 text-gray-700',
};

// Generate a random share code
function generateShareCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Visibility icons
const VISIBILITY_ICONS: Record<GroupVisibility, React.ReactNode> = {
  private: <Lock className="w-5 h-5" />,
  link: <Link className="w-5 h-5" />,
  public: <Globe className="w-5 h-5" />,
};

export function NewGroup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GroupType>('city_council');
  const [visibility, setVisibility] = useState<GroupVisibility>('public');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSaving(true);
    setError('');

    try {
      const groupData: Record<string, any> = {
        name: name.trim(),
        type,
        description: description.trim() || null,
        visibility,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberCount: 1,
        meetingCount: 0,
        motionCount: 0,
        settings: {
          allowPublicView: visibility === 'public',
          requireApproval: true,
          defaultMotionOutcome: 'unknown',
        },
      };

      // Generate share code for link visibility
      if (visibility === 'link') {
        groupData.shareCode = generateShareCode();
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.GROUPS), groupData);

      await addDoc(collection(db, COLLECTIONS.GROUP_MEMBERS), {
        userId: user.uid,
        groupId: docRef.id,
        role: 'owner',
        joinedAt: serverTimestamp(),
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
      });

      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        groups: arrayUnion(docRef.id),
      });

      navigate(`/groups/${docRef.id}`);
    } catch (err) {
      console.error('CARRIED_DEBUG: Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getColorClass = (t: GroupType) => {
    const color = GROUP_TYPE_INFO[t].color;
    return TYPE_COLORS[color] || TYPE_COLORS.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Group</h1>
          <p className="text-gray-500 mb-6">
            Add an organization to start tracking meeting decisions
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Group Type - Categorized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Group Type
              </label>

              {Object.entries(GROUP_TYPE_CATEGORIES).map(([category, types]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {types.map((t) => {
                      const groupType = t as GroupType;
                      const info = GROUP_TYPE_INFO[groupType];
                      const isSelected = type === groupType;

                      return (
                        <button
                          key={groupType}
                          type="button"
                          onClick={() => setType(groupType)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? getColorClass(groupType)
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={isSelected ? '' : 'text-gray-500'}>
                              {TYPE_ICONS[groupType]}
                            </span>
                            <span className="text-xs font-medium truncate flex-1">
                              {info.label}
                            </span>
                            {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Group Name */}
            <Input
              label="Group Name"
              placeholder={`e.g., ${
                type === 'city_council' ? 'Springfield City Council' :
                type === 'town_council' ? 'Riverdale Town Council' :
                type === 'school_board' ? 'Lincoln County School Board' :
                type === 'hoa' ? 'Sunset Ridge HOA' :
                type === 'church' ? 'First Baptist Church' :
                type === 'pta' ? 'Jefferson Elementary PTA' :
                'Organization Name'
              }`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Description */}
            <Textarea
              label="Description (optional)"
              placeholder="Brief description of this group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Visibility
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(VISIBILITY_INFO) as GroupVisibility[]).map((v) => {
                  const info = VISIBILITY_INFO[v];
                  const isSelected = visibility === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isSelected ? 'text-indigo-600' : 'text-gray-500'}>
                          {VISIBILITY_ICONS[v]}
                        </span>
                        <div className="flex-1">
                          <p className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {info.label}
                          </p>
                          <p className="text-xs text-gray-500">{info.description}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-indigo-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || saving}>
                {saving ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewGroup;
