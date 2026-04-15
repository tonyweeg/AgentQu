/**
 * Group Home Page
 * Carried - Motions carry, memory too
 *
 * View meetings and segments for a single group
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Plus,
  FileText,
  Vote,
  Search,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  MessageSquare,
  Megaphone,
  Users,
  CheckSquare,
  Award,
  Presentation,
  Gavel,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Link,
  Globe,
  Settings,
  Copy,
  Check,
  Edit3,
  Video,
  X,
} from 'lucide-react';
import { db, COLLECTIONS } from '../config/firebase';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Group, Meeting, Segment, SegmentType, MotionOutcome, GroupVisibility, SEGMENT_TYPE_INFO, VISIBILITY_INFO } from '../types';
import { clearGroupData, deleteGroupCompletely } from '../lib/firestore/groups';
import { deleteOrphanedSegments, deleteSegmentsByGroup } from '../lib/firestore/segments';
import { useAuth } from '../hooks/useAuth';
import { useFileDrop } from '../contexts/FileDropContext';
import { validateFile, getFileType } from '../lib/parsers/fileParser';
import { useGroupMembership } from '../hooks/useGroupMembership';

const OUTCOME_ICONS: Record<MotionOutcome, React.ReactNode> = {
  carried: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  defeated: <XCircle className="w-4 h-4 text-red-600" />,
  tabled: <Clock className="w-4 h-4 text-yellow-600" />,
  withdrawn: <XCircle className="w-4 h-4 text-gray-400" />,
  unknown: <HelpCircle className="w-4 h-4 text-gray-400" />,
};

const SEGMENT_ICONS: Record<SegmentType, React.ReactNode> = {
  motion: <Vote className="w-4 h-4 text-blue-600" />,
  discussion: <MessageSquare className="w-4 h-4 text-purple-600" />,
  report: <FileText className="w-4 h-4 text-green-600" />,
  announcement: <Megaphone className="w-4 h-4 text-orange-600" />,
  public_comment: <Users className="w-4 h-4 text-cyan-600" />,
  action_item: <CheckSquare className="w-4 h-4 text-red-600" />,
  election: <Award className="w-4 h-4 text-amber-600" />,
  presentation: <Presentation className="w-4 h-4 text-indigo-600" />,
  procedural: <Gavel className="w-4 h-4 text-gray-600" />,
  other: <MoreHorizontal className="w-4 h-4 text-slate-600" />,
};

export function GroupHome() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { canAddMeetings } = useGroupMembership(groupId);
  const { setPendingFile } = useFileDrop();
  const [group, setGroup] = useState<Group | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [recentSegments, setRecentSegments] = useState<Segment[]>([]);
  const [meetingStats, setMeetingStats] = useState<Record<string, Record<SegmentType, number>>>({});
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [successToast, setSuccessToast] = useState<{ meeting: string; file: string | null } | null>(null);

  // Handle success toast from upload redirect
  useEffect(() => {
    const state = location.state as { uploadedMeeting?: string; uploadedFile?: string } | null;
    if (state?.uploadedMeeting) {
      setSuccessToast({
        meeting: state.uploadedMeeting,
        file: state.uploadedFile || null
      });
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle drag events for PDF drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!canAddMeetings) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileType = getFileType(file);
      if (fileType === 'pdf' || fileType === 'docx' || fileType === 'txt') {
        const validation = validateFile(file);
        if (validation.valid) {
          console.log('CARRIED_DEBUG: File dropped on GroupHome, navigating to upload:', file.name);
          setPendingFile(file);
          navigate(`/groups/${groupId}/upload`);
        }
      }
    }
  };

  // Generate a random share code
  const generateShareCode = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Update visibility
  const handleVisibilityChange = async (newVisibility: GroupVisibility) => {
    if (!groupId || !group) return;

    try {
      const updateData: Record<string, any> = {
        visibility: newVisibility,
        'settings.allowPublicView': newVisibility === 'public',
        updatedAt: serverTimestamp(),
      };

      // Generate share code if changing to 'link' and doesn't have one
      if (newVisibility === 'link' && !group.shareCode) {
        updateData.shareCode = generateShareCode();
      }

      await updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), updateData);

      // Update local state
      setGroup({
        ...group,
        visibility: newVisibility,
        shareCode: newVisibility === 'link' && !group.shareCode ? updateData.shareCode : group.shareCode,
        settings: {
          ...group.settings,
          allowPublicView: newVisibility === 'public',
        },
      });

      setShowVisibilityModal(false);
    } catch (error) {
      console.error('CARRIED_DEBUG: Error updating visibility:', error);
    }
  };

  // Copy share link
  const copyShareLink = async () => {
    if (!group?.shareCode) return;
    const link = `${window.location.origin}/share/${group.shareCode}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Open edit modal
  const openEditModal = () => {
    if (group) {
      setEditName(group.name);
      setEditDescription(group.description || '');
      setShowEditModal(true);
    }
  };

  // Save group edits
  const handleSaveEdit = async () => {
    if (!groupId || !group || !editName.trim()) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), {
        name: editName.trim(),
        description: editDescription.trim() || null,
        updatedAt: serverTimestamp(),
      });

      setGroup({
        ...group,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      setShowEditModal(false);
    } catch (error) {
      console.error('CARRIED_DEBUG: Error updating group:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!groupId) return;

      try {
        // Fetch group
        const groupDoc = await getDoc(doc(db, COLLECTIONS.GROUPS, groupId));
        if (!groupDoc.exists()) {
          navigate('/');
          return;
        }
        setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);

        // Fetch meetings
        const meetingsRef = collection(db, COLLECTIONS.MEETINGS);
        const meetingsQuery = query(
          meetingsRef,
          where('groupId', '==', groupId)
        );
        const meetingsSnapshot = await getDocs(meetingsQuery);
        const fetchedMeetings = meetingsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Meeting[];
        // Sort by date client-side to avoid needing composite index
        fetchedMeetings.sort((a, b) => {
          const dateA = a.meetingDate?.toDate?.() || a.date?.toDate?.() || new Date(0);
          const dateB = b.meetingDate?.toDate?.() || b.date?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        setMeetings(fetchedMeetings);

        // Only expand current year by default
        const currentYear = new Date().getFullYear();
        setExpandedYears(new Set([currentYear]));

        // Fetch all segments for stats - but only if we have meetings
        if (fetchedMeetings.length > 0) {
          const meetingIds = new Set(fetchedMeetings.map(m => m.id));
          const segmentsRef = collection(db, COLLECTIONS.SEGMENTS);
          const segmentsQuery = query(
            segmentsRef,
            where('groupId', '==', groupId)
          );
          const segmentsSnapshot = await getDocs(segmentsQuery);
          const fetchedSegments = segmentsSnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Segment[];

          // Filter out orphaned segments (segments whose meeting was deleted)
          const validSegments = fetchedSegments.filter(s => meetingIds.has(s.meetingId));
          const orphanCount = fetchedSegments.length - validSegments.length;

          // Auto-cleanup orphans in the background
          if (orphanCount > 0) {
            console.log(`CARRIED_DEBUG: Found ${orphanCount} orphaned segments, cleaning up...`);
            deleteOrphanedSegments(groupId, Array.from(meetingIds)).catch(err => {
              console.error('CARRIED_DEBUG: Orphan cleanup error:', err);
            });
          }

          // Calculate stats per meeting
          const stats: Record<string, Record<SegmentType, number>> = {};
          for (const segment of validSegments) {
            if (!stats[segment.meetingId]) {
              stats[segment.meetingId] = {} as Record<SegmentType, number>;
            }
            stats[segment.meetingId][segment.type] = (stats[segment.meetingId][segment.type] || 0) + 1;
          }
          setMeetingStats(stats);

          // Sort by createdAt client-side
          validSegments.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          setRecentSegments(validSegments.slice(0, 10));
        } else {
          // No meetings = delete all orphaned segments for this group
          console.log('CARRIED_DEBUG: No meetings, cleaning up all orphaned segments...');
          deleteSegmentsByGroup(groupId).catch(err => {
            console.error('CARRIED_DEBUG: Cleanup error:', err);
          });
          setRecentSegments([]);
        }
      } catch (error) {
        console.error('CARRIED_DEBUG: Error fetching group data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [groupId, navigate]);

  const handleClearGroup = async () => {
    if (!groupId) return;
    setClearing(true);
    try {
      await clearGroupData(groupId);
      // Refresh the page data
      setMeetings([]);
      setRecentSegments([]);
      setShowClearModal(false);
    } catch (error) {
      console.error('CARRIED_DEBUG: Error clearing group:', error);
      alert('Failed to clear group data. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    setClearing(true);
    try {
      await deleteGroupCompletely(groupId);
      navigate('/');
    } catch (error) {
      console.error('CARRIED_DEBUG: Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loading size="lg" text="Loading group..." />
        </div>
      </div>
    );
  }

  if (!group) return null;

  // Calculate segment count
  const segmentCount = meetings.reduce((sum, m) => sum + (m.segmentCount || m.motionCount || 0), 0);

  return (
    <div
      className={`min-h-screen bg-gray-50 transition-colors ${dragActive ? 'bg-blue-50' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <AppHeader />

      {/* Success toast */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium">Meeting uploaded successfully</p>
              <p className="text-sm text-green-700">{successToast.meeting}</p>
              {successToast.file && (
                <p className="text-xs text-green-600 mt-0.5">from {successToast.file}</p>
              )}
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="ml-2 p-1 hover:bg-green-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {dragActive && canAddMeetings && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900">Drop PDF to upload</p>
            <p className="text-gray-500">Release to add meeting minutes</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>

        {/* Group Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.description && (
                <p className="text-gray-500 mt-1">{group.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {meetings.length} meetings
                </div>
                {/* Segments stat - only show to owner */}
                {user && group && user.uid === group.createdBy && (
                  <div className="flex items-center gap-1.5">
                    <Vote className="w-4 h-4" />
                    {segmentCount} segments
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Menu dropdown - only show for owner */}
              {user && group && user.uid === group.createdBy && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          openEditModal();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Group
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowVisibilityModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Visibility Settings
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowClearModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Clear All Data
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Group
                      </button>
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Search bar + Add Meeting - discrete, above content */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/groups/${groupId}/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="Search meetings..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white/80"
            />
          </div>
          {canAddMeetings && (
            <button
              onClick={() => navigate(`/groups/${groupId}/upload`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Meeting
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Meetings */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Meetings</h2>
            {meetings.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No meetings yet</p>
                <Button size="sm" onClick={() => navigate(`/groups/${groupId}/upload`)}>
                  <Plus className="w-4 h-4" />
                  Add First Meeting
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {(() => {
                  // Group meetings by year
                  const meetingsByYear: Record<number, Meeting[]> = {};
                  meetings.forEach(meeting => {
                    const date = meeting.meetingDate?.toDate?.() || meeting.date?.toDate?.() || new Date();
                    const year = date.getFullYear();
                    if (!meetingsByYear[year]) meetingsByYear[year] = [];
                    meetingsByYear[year].push(meeting);
                  });

                  // Sort years descending
                  const years = Object.keys(meetingsByYear).map(Number).sort((a, b) => b - a);

                  // Sort meetings within each year by date (newest first)
                  years.forEach(year => {
                    meetingsByYear[year].sort((a, b) => {
                      const dateA = a.meetingDate?.toDate?.() || a.date?.toDate?.() || new Date(0);
                      const dateB = b.meetingDate?.toDate?.() || b.date?.toDate?.() || new Date(0);
                      return dateB.getTime() - dateA.getTime();
                    });
                  });

                  const toggleYear = (year: number) => {
                    setExpandedYears(prev => {
                      const next = new Set(prev);
                      if (next.has(year)) {
                        next.delete(year);
                      } else {
                        next.add(year);
                      }
                      return next;
                    });
                  };

                  return years.map(year => {
                    const isExpanded = expandedYears.has(year);
                    const yearMeetings = meetingsByYear[year];

                    return (
                      <div key={year}>
                        {/* Year Header */}
                        <button
                          onClick={() => toggleYear(year)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                          {year}
                          <span className="text-xs font-normal text-gray-400">({yearMeetings.length})</span>
                        </button>

                        {/* Meetings for this year */}
                        {isExpanded && (
                          <div className="ml-2 border-l border-gray-200 pl-2 space-y-0.5">
                            {yearMeetings.map((meeting) => {
                              const meetingDate = meeting.meetingDate?.toDate?.() || meeting.date?.toDate?.() || new Date();
                              const stats = meetingStats[meeting.id] || {};
                              const totalSegments = Object.values(stats).reduce((sum, count) => sum + count, 0);

                              return (
                                <div
                                  key={meeting.id}
                                  onClick={() => navigate(`/groups/${groupId}/meetings/${meeting.id}`)}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer transition-colors group"
                                >
                                  {/* Date (no year since grouped) */}
                                  <div className="w-14 text-xs text-gray-500 shrink-0">
                                    {meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>

                                  {/* Title */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">{meeting.title}</p>
                                  </div>

                                  {/* Stats pills */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {stats.motion > 0 && (
                                      <span className="flex items-center gap-0.5 text-xs px-1 py-0.5 bg-blue-50 text-blue-700 rounded">
                                        <Vote className="w-2.5 h-2.5" />
                                        {stats.motion}
                                      </span>
                                    )}
                                    {stats.discussion > 0 && (
                                      <span className="flex items-center gap-0.5 text-xs px-1 py-0.5 bg-purple-50 text-purple-700 rounded">
                                        <MessageSquare className="w-2.5 h-2.5" />
                                        {stats.discussion}
                                      </span>
                                    )}
                                    {stats.report > 0 && (
                                      <span className="flex items-center gap-0.5 text-xs px-1 py-0.5 bg-green-50 text-green-700 rounded">
                                        <FileText className="w-2.5 h-2.5" />
                                        {stats.report}
                                      </span>
                                    )}
                                    {stats.action_item > 0 && (
                                      <span className="flex items-center gap-0.5 text-xs px-1 py-0.5 bg-red-50 text-red-700 rounded">
                                        <CheckSquare className="w-2.5 h-2.5" />
                                        {stats.action_item}
                                      </span>
                                    )}
                                    {totalSegments === 0 && (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </div>

                                  {/* Video link */}
                                  {meeting.videoUrl && (
                                    <a
                                      href={meeting.videoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors shrink-0"
                                      title="Watch video"
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                    </a>
                                  )}

                                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Recent Segments */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Recent Content</h2>
            {recentSegments.length === 0 ? (
              <Card className="p-8 text-center">
                <Vote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Content will appear here after you upload meeting minutes
                </p>
              </Card>
            ) : (
              <div className="space-y-1">
                {recentSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      {segment.type === 'motion' && segment.outcome && segment.outcome in OUTCOME_ICONS
                        ? OUTCOME_ICONS[segment.outcome as MotionOutcome]
                        : SEGMENT_ICONS[segment.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {segment.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          segment.type === 'motion' ? 'bg-blue-50 text-blue-700' :
                          segment.type === 'discussion' ? 'bg-purple-50 text-purple-700' :
                          segment.type === 'report' ? 'bg-green-50 text-green-700' :
                          segment.type === 'action_item' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {SEGMENT_TYPE_INFO[segment.type]?.label || segment.type}
                        </span>
                        {segment.type === 'motion' && segment.outcome && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            segment.outcome === 'carried' ? 'bg-green-50 text-green-700' :
                            segment.outcome === 'defeated' ? 'bg-red-50 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {segment.outcome.charAt(0).toUpperCase() + segment.outcome.slice(1)}
                          </span>
                        )}
                        {segment.tags.slice(0, 1).map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded hidden sm:inline">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Clear All Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete all meetings and extracted content from this group.
              The group itself will remain intact. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearGroup}
                disabled={clearing}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {clearing ? 'Clearing...' : 'Clear All Data'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Edit Group</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Brief description..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Modal */}
      {showVisibilityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Visibility Settings</h3>
            </div>

            <div className="space-y-3 mb-6">
              {(Object.keys(VISIBILITY_INFO) as GroupVisibility[]).map((v) => {
                const info = VISIBILITY_INFO[v];
                const isSelected = (group?.visibility || 'private') === v;
                return (
                  <button
                    key={v}
                    onClick={() => handleVisibilityChange(v)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isSelected ? 'text-indigo-600' : 'text-gray-500'}>
                        {v === 'private' && <Lock className="w-5 h-5" />}
                        {v === 'link' && <Link className="w-5 h-5" />}
                        {v === 'public' && <Globe className="w-5 h-5" />}
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

            {/* Share link for 'link' visibility */}
            {group?.visibility === 'link' && group?.shareCode && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Share Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-white px-3 py-2 rounded border truncate">
                    {window.location.origin}/share/{group.shareCode}
                  </code>
                  <button
                    onClick={copyShareLink}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Copy link"
                  >
                    {copiedLink ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowVisibilityModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Group</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete the group <strong>"{group?.name}"</strong> and all its
              meetings and content. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={clearing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteGroup}
                disabled={clearing}
                className="bg-red-600 hover:bg-red-700"
              >
                {clearing ? 'Deleting...' : 'Delete Group'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupHome;
