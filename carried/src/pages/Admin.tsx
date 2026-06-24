/**
 * Admin Page - Subscription Management
 * Carried - Motions carry, memory too
 *
 * CRUD interface for managing subscribers and freeProAccess
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AppHeader } from '../components/layout/AppHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import {
  Users,
  Crown,
  CreditCard,
  Gift,
  Search,
  XCircle,
  RefreshCw,
  Shield,
  Calendar,
  Mail,
} from 'lucide-react';

// Admin emails and UIDs who can access this page
const ADMIN_EMAILS = [
  'tonyweeg@gmail.com',
];

const ADMIN_UIDS: string[] = [
  '4LsDOrZa6JYWRvwh6umFNmuuaMz2', // Tony Weeg
];

interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  freeProAccess?: boolean;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
}

interface SubscriptionRecord {
  id: string;
  oderId: string;
  status: string;
  created: Timestamp;
  current_period_end: Timestamp;
  cancel_at_period_end: boolean;
  productName?: string;
}

interface SubscriberData {
  user: UserRecord;
  subscription: SubscriptionRecord | null;
  accessType: 'paid' | 'free' | 'comped';
}

export function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'comped' | 'free'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [addingSelf, setAddingSelf] = useState(false);

  // Check if current user is in the subscribers list
  const currentUserInList = subscribers.some(s => s.user.uid === user?.uid);

  // Add current admin to users collection with freeProAccess
  const addSelfAsAdmin = async () => {
    if (!user) return;

    setAddingSelf(true);
    try {
      // Use merge: true to preserve existing data like groups array
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        freeProAccess: true,
        lastLoginAt: serverTimestamp(),
      }, { merge: true });

      console.log('CARRIED_DEBUG: Added self as admin with freeProAccess');
      loadData(); // Refresh the list
    } catch (error) {
      console.error('CARRIED_DEBUG: Error adding self:', error);
      alert('Failed to add user. Check console for details.');
    } finally {
      setAddingSelf(false);
    }
  };

  // Check if current user is admin (has freeProAccess or is in ADMIN_UIDS)
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!user) {
        console.log('CARRIED_DEBUG: No user, redirecting to home');
        navigate('/');
        return;
      }

      console.log('CARRIED_DEBUG: Checking admin for:', user.email);

      // Check if user has admin access via email first (fastest check)
      if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        console.log('CARRIED_DEBUG: Admin access via email:', user.email);
        setIsAdmin(true);
        loadData();
        return;
      }

      // Check if user has admin access via UID
      if (ADMIN_UIDS.includes(user.uid)) {
        console.log('CARRIED_DEBUG: Admin access via UID:', user.uid);
        setIsAdmin(true);
        loadData();
        return;
      }

      // Check if user has freeProAccess in Firestore
      try {
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', user.uid))
        );

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          if (userData.freeProAccess === true) {
            console.log('CARRIED_DEBUG: Admin access via freeProAccess');
            setIsAdmin(true);
            loadData();
            return;
          }
        }

        // Not admin, redirect
        console.log('CARRIED_DEBUG: User is not admin, redirecting');
        navigate('/');
      } catch (error) {
        console.error('CARRIED_DEBUG: Error checking admin status:', error);
        navigate('/');
      }
    }

    checkAdmin();
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const users: UserRecord[] = usersSnap.docs.map(d => ({
        uid: d.id,
        ...d.data(),
      })) as UserRecord[];

      // Load all subscribers (users with active subscriptions or freeProAccess)
      const subscriberData: SubscriberData[] = [];

      for (const userRec of users) {
        // Check for Stripe subscription
        let subscription: SubscriptionRecord | null = null;
        try {
          const subsSnap = await getDocs(
            query(
              collection(db, 'customers', userRec.uid, 'subscriptions'),
              where('status', 'in', ['active', 'trialing']),
              orderBy('created', 'desc')
            )
          );

          if (!subsSnap.empty) {
            const subDoc = subsSnap.docs[0];
            subscription = {
              id: subDoc.id,
              oderId: userRec.uid,
              ...subDoc.data(),
            } as SubscriptionRecord;
          }
        } catch (e) {
          // No subscriptions collection for this user
        }

        // Determine access type
        let accessType: 'paid' | 'free' | 'comped' = 'free';
        if (userRec.freeProAccess) {
          accessType = 'comped';
        } else if (subscription) {
          accessType = 'paid';
        }

        subscriberData.push({
          user: userRec,
          subscription,
          accessType,
        });
      }

      // Sort: comped first, then paid, then free
      subscriberData.sort((a, b) => {
        const order = { comped: 0, paid: 1, free: 2 };
        return order[a.accessType] - order[b.accessType];
      });

      setSubscribers(subscriberData);
    } catch (error) {
      console.error('CARRIED_DEBUG: Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFreeAccess = async (uid: string, currentValue: boolean) => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        freeProAccess: !currentValue,
      });

      // Update local state
      setSubscribers(prev =>
        prev.map(s =>
          s.user.uid === uid
            ? {
                ...s,
                user: { ...s.user, freeProAccess: !currentValue },
                accessType: !currentValue ? 'comped' : (s.subscription ? 'paid' : 'free'),
              }
            : s
        )
      );

      console.log(`CARRIED_DEBUG: Set freeProAccess=${!currentValue} for ${uid}`);
    } catch (error) {
      console.error('CARRIED_DEBUG: Error updating freeProAccess:', error);
      alert('Failed to update user access');
    } finally {
      setUpdating(null);
    }
  };

  // Filter and search
  const filteredSubscribers = subscribers.filter(s => {
    // Filter by type
    if (filter !== 'all' && s.accessType !== filter) return false;

    // Search by email or name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchEmail = s.user.email?.toLowerCase().includes(term);
      const matchName = s.user.displayName?.toLowerCase().includes(term);
      const matchUid = s.user.uid.toLowerCase().includes(term);
      if (!matchEmail && !matchName && !matchUid) return false;
    }

    return true;
  });

  // Stats
  const stats = {
    total: subscribers.length,
    paid: subscribers.filter(s => s.accessType === 'paid').length,
    comped: subscribers.filter(s => s.accessType === 'comped').length,
    free: subscribers.filter(s => s.accessType === 'free').length,
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Loading size="lg" text={authLoading ? "Loading..." : "Checking admin access..."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage subscribers and access
              </p>
            </div>
          </div>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.paid}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paid Subscribers</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.comped}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Comped (Free Pro)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.free}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Free Tier</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-white dark:bg-slate-800">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email, name, or UID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(['all', 'paid', 'comped', 'free'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && ` (${stats[f]})`}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Users Table */}
        {loading ? (
          <div className="py-20">
            <Loading size="lg" text="Loading users..." />
          </div>
        ) : (
          <Card className="overflow-hidden bg-white dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Access
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub) => (
                      <tr key={sub.user.uid} className="transition-colors hover:bg-black/5 dark:hover:bg-white/10">
                        {/* User Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                              {sub.user.email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {sub.user.displayName || sub.user.email?.split('@')[0] || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {sub.user.email || 'No email'}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                {sub.user.uid.substring(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Access Type */}
                        <td className="px-4 py-4">
                          {sub.accessType === 'paid' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                              <CreditCard className="w-3 h-3" />
                              Paid
                            </span>
                          )}
                          {sub.accessType === 'comped' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              <Gift className="w-3 h-3" />
                              Comped
                            </span>
                          )}
                          {sub.accessType === 'free' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              Free
                            </span>
                          )}
                        </td>

                        {/* Subscription Details */}
                        <td className="px-4 py-4">
                          {sub.subscription ? (
                            <div className="text-sm">
                              <p className="text-gray-900 dark:text-gray-100">
                                {sub.subscription.status}
                                {sub.subscription.cancel_at_period_end && (
                                  <span className="text-orange-500 ml-1">(canceling)</span>
                                )}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Expires: {sub.subscription.current_period_end?.toDate?.()?.toLocaleDateString() || 'N/A'}
                              </p>
                            </div>
                          ) : sub.user.freeProAccess ? (
                            <span className="text-sm text-purple-600 dark:text-purple-400">
                              Free Pro Access (no expiry)
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No subscription</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleFreeAccess(sub.user.uid, !!sub.user.freeProAccess)}
                            disabled={updating === sub.user.uid}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              sub.user.freeProAccess
                                ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900'
                                : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900'
                            } disabled:opacity-50`}
                          >
                            {updating === sub.user.uid ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : sub.user.freeProAccess ? (
                              <>
                                <XCircle className="w-3 h-3" />
                                Revoke
                              </>
                            ) : (
                              <>
                                <Crown className="w-3 h-3" />
                                Grant Pro
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add Self Button - shown when admin is not in users list */}
        {!currentUserInList && user && (
          <Card className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-1">
                    You're not in the users list
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    Add yourself with Pro access to manage subscriptions
                  </p>
                </div>
              </div>
              <button
                onClick={addSelfAsAdmin}
                disabled={addingSelf}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              >
                {addingSelf ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Add Myself as Pro
                  </>
                )}
              </button>
            </div>
          </Card>
        )}

        {/* Your UID Helper */}
        <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Your User ID</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 font-mono">
                {user?.uid || 'Not logged in'}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                {currentUserInList
                  ? 'You are in the users list with Pro access'
                  : 'Click "Add Myself as Pro" above to add yourself'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Admin;
