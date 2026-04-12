/**
 * Home Page
 * Carried - Motions carry, memory too
 *
 * Dashboard with group cards
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Vote,
  Plus,
  FileText,
  ChevronRight,
  Sparkles,
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
  Home as HomeIcon,
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
} from 'lucide-react';
import { db, COLLECTIONS } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AppHeader } from '../components/layout/AppHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { Group, GroupType, GROUP_TYPE_INFO } from '../types';

// Icon mapping for all group types
const TYPE_ICONS: Record<GroupType, React.ReactNode> = {
  // Government & Civic
  city_council: <Landmark className="w-6 h-6" />,
  town_council: <Landmark className="w-6 h-6" />,
  county_board: <MapPin className="w-6 h-6" />,
  school_board: <GraduationCap className="w-6 h-6" />,
  planning_commission: <Map className="w-6 h-6" />,
  parks_rec: <Trees className="w-6 h-6" />,
  library_board: <BookOpen className="w-6 h-6" />,
  fire_district: <Flame className="w-6 h-6" />,
  water_district: <Droplets className="w-6 h-6" />,
  // Community & Residential
  hoa: <Building2 className="w-6 h-6" />,
  coop: <HomeIcon className="w-6 h-6" />,
  neighborhood: <Users className="w-6 h-6" />,
  // Organizations
  nonprofit: <Heart className="w-6 h-6" />,
  church: <Church className="w-6 h-6" />,
  pta: <School className="w-6 h-6" />,
  union: <Handshake className="w-6 h-6" />,
  club: <PartyPopper className="w-6 h-6" />,
  // Business & Professional
  corporate_board: <Briefcase className="w-6 h-6" />,
  committee: <UserCheck className="w-6 h-6" />,
  team: <Layers className="w-6 h-6" />,
  // Personal
  family: <Heart className="w-6 h-6" />,
  other: <Folder className="w-6 h-6" />,
};

// Color mapping for card gradients
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'from-blue-600 to-blue-700', text: 'text-blue-600', border: 'border-blue-200' },
  indigo: { bg: 'from-indigo-600 to-indigo-700', text: 'text-indigo-600', border: 'border-indigo-200' },
  yellow: { bg: 'from-yellow-500 to-amber-600', text: 'text-yellow-600', border: 'border-yellow-200' },
  teal: { bg: 'from-teal-600 to-teal-700', text: 'text-teal-600', border: 'border-teal-200' },
  green: { bg: 'from-green-600 to-green-700', text: 'text-green-600', border: 'border-green-200' },
  amber: { bg: 'from-amber-600 to-amber-700', text: 'text-amber-600', border: 'border-amber-200' },
  red: { bg: 'from-red-600 to-red-700', text: 'text-red-600', border: 'border-red-200' },
  cyan: { bg: 'from-cyan-600 to-cyan-700', text: 'text-cyan-600', border: 'border-cyan-200' },
  slate: { bg: 'from-slate-600 to-slate-700', text: 'text-slate-600', border: 'border-slate-200' },
  stone: { bg: 'from-stone-600 to-stone-700', text: 'text-stone-600', border: 'border-stone-200' },
  emerald: { bg: 'from-emerald-600 to-emerald-700', text: 'text-emerald-600', border: 'border-emerald-200' },
  pink: { bg: 'from-pink-600 to-pink-700', text: 'text-pink-600', border: 'border-pink-200' },
  purple: { bg: 'from-purple-600 to-purple-700', text: 'text-purple-600', border: 'border-purple-200' },
  orange: { bg: 'from-orange-600 to-orange-700', text: 'text-orange-600', border: 'border-orange-200' },
  rose: { bg: 'from-rose-600 to-rose-700', text: 'text-rose-600', border: 'border-rose-200' },
  fuchsia: { bg: 'from-fuchsia-600 to-fuchsia-700', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
  zinc: { bg: 'from-zinc-600 to-zinc-700', text: 'text-zinc-600', border: 'border-zinc-200' },
  violet: { bg: 'from-violet-600 to-violet-700', text: 'text-violet-600', border: 'border-violet-200' },
  sky: { bg: 'from-sky-600 to-sky-700', text: 'text-sky-600', border: 'border-sky-200' },
  gray: { bg: 'from-gray-600 to-gray-700', text: 'text-gray-600', border: 'border-gray-200' },
};

function getColors(type: GroupType) {
  const colorName = GROUP_TYPE_INFO[type]?.color || 'gray';
  return TYPE_COLORS[colorName] || TYPE_COLORS.gray;
}

function GroupCard({ group }: { group: Group }) {
  const navigate = useNavigate();
  const colors = getColors(group.type);
  const info = GROUP_TYPE_INFO[group.type];

  return (
    <Card
      hoverable
      onClick={() => navigate(`/groups/${group.id}`)}
      className={`border ${colors.border}`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.bg} p-5 text-white`}>
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            {TYPE_ICONS[group.type] || <Folder className="w-6 h-6" />}
          </div>
          <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium uppercase tracking-wide">
            {info?.label || 'Group'}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-bold leading-tight">{group.name}</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        {group.description && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
            {group.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Vote className="w-4 h-4" />
            <span>{group.motionCount} motions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{group.meetingCount} meetings</span>
          </div>
        </div>

        {/* Action */}
        <div className="mt-4 flex items-center justify-between">
          <button className={`flex items-center gap-2 ${colors.text} font-medium text-sm`}>
            Open
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export function Home() {
  const { user, carriedUser, loading: authLoading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroups() {
      if (!carriedUser || !carriedUser.groups?.length) {
        setGroups([]);
        setLoading(false);
        return;
      }

      try {
        const groupsRef = collection(db, COLLECTIONS.GROUPS);
        const q = query(groupsRef, where('__name__', 'in', carriedUser.groups));
        const snapshot = await getDocs(q);
        const fetchedGroups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Group[];
        setGroups(fetchedGroups);
      } catch (error) {
        console.error('CARRIED_DEBUG: Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchGroups();
    }
  }, [carriedUser, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loading size="lg" text="Loading..." />
        </div>
      </div>
    );
  }

  // Not signed in - show landing
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <AppHeader />

        {/* Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Vote className="w-12 h-12 text-indigo-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Carried
            </h1>
            <p className="text-xl text-indigo-200 mb-4">
              Motions carry, memory too
            </p>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              A semantic memory bank for organizational decisions. Upload meeting minutes,
              extract motions automatically, and search across your entire decision history.
            </p>
            <Button size="lg" onClick={signInWithGoogle}>
              <Sparkles className="w-5 h-5" />
              Get Started with Google
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Upload Minutes</h3>
              <p className="text-gray-600 text-sm">
                Paste or upload meeting minutes from any source. We handle the rest.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Vote className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Extract Motions</h3>
              <p className="text-gray-600 text-sm">
                AI automatically identifies motions, votes, and outcomes from your minutes.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Semantic Search</h3>
              <p className="text-gray-600 text-sm">
                Ask questions in natural language and find relevant decisions instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signed in - show dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Groups</h1>
            <p className="text-gray-500 mt-1">
              Select a group to view meetings and search decisions
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {groups.length} group{groups.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loading text="Loading groups..." />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}

            {/* Create New Group Card */}
            <Card
              hoverable
              onClick={() => navigate('/groups/new')}
              className="border-2 border-dashed border-gray-200 bg-gray-50/50"
            >
              <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
                <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
                  <Plus className="w-7 h-7 text-gray-500" />
                </div>
                <h3 className="font-medium text-gray-700 mb-2">Create New Group</h3>
                <p className="text-gray-500 text-sm">
                  Add an organization to start tracking decisions
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
