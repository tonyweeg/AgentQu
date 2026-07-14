/**
 * Meeting Detail Page
 * Carried - Motions carry, memory too
 *
 * View meeting details, segments, and manage meeting data
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Vote,
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
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Video,
  Link,
  Check,
  X,
} from 'lucide-react';
import { db, COLLECTIONS } from '../config/firebase';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { FinancialContent } from '../components/ui/FinancialContent';
import { FinancialAnalytics } from '../components/ui/FinancialAnalytics';
import { CheckRunSummary } from '../components/ui/CheckRunSummary';
import { DisbursementSummary } from '../components/ui/DisbursementSummary';
import { PDFCheckRunSummary } from '../components/ui/PDFCheckRunSummary';
import { Meeting, Segment, SegmentType, MotionOutcome, SEGMENT_TYPE_INFO } from '../types';
import { getSegmentsByMeeting, deleteSegmentsByMeeting, saveSegments } from '../lib/firestore/segments';
import { extractSegments } from '../lib/ai/extraction';
import { useAuth } from '../hooks/useAuth';
import { Group } from '../types';

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

/**
 * Format meeting title with readable date
 * Converts "Berlin Mayor and Council Meeting 2026-02-09 + Topics"
 * to "Berlin Mayor and Council Meeting Monday, February 9th, 2026 + Topics"
 */
function formatMeetingTitle(title: string): string {
  // Match YYYY-MM-DD pattern
  const datePattern = /(\d{4})-(\d{2})-(\d{2})/;
  const match = title.match(datePattern);

  if (!match) return title;

  const [fullMatch, year, month, day] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  // Get day suffix (1st, 2nd, 3rd, 4th, etc.)
  const dayNum = parseInt(day);
  const suffix = dayNum === 1 || dayNum === 21 || dayNum === 31 ? 'st'
    : dayNum === 2 || dayNum === 22 ? 'nd'
    : dayNum === 3 || dayNum === 23 ? 'rd'
    : 'th';

  // Format: "Monday, February 9th, 2026"
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).replace(/(\d+)/, `$1${suffix}`);

  return title.replace(fullMatch, formattedDate);
}

export function MeetingDetail() {
  const { groupId, meetingId } = useParams<{ groupId: string; meetingId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showRawMinutes, setShowRawMinutes] = useState(false);
  const [reprocessStep, setReprocessStep] = useState<string>('');
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [editingVideoUrl, setEditingVideoUrl] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [savingVideoUrl, setSavingVideoUrl] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SegmentType | null>(null);

  // Navigation state
  const [prevMeeting, setPrevMeeting] = useState<{ id: string; title: string; date: Date } | null>(null);
  const [nextMeeting, setNextMeeting] = useState<{ id: string; title: string; date: Date } | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalMeetings, setTotalMeetings] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      if (!meetingId || !groupId) return;

      try {
        // Fetch group (for ownership check)
        const groupDoc = await getDoc(doc(db, COLLECTIONS.GROUPS, groupId));
        if (groupDoc.exists()) {
          setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
        }

        // Fetch meeting
        const meetingDoc = await getDoc(doc(db, COLLECTIONS.MEETINGS, meetingId));
        if (!meetingDoc.exists()) {
          navigate(`/groups/${groupId}`);
          return;
        }
        setMeeting({ id: meetingDoc.id, ...meetingDoc.data() } as Meeting);

        // Fetch segments
        const fetchedSegments = await getSegmentsByMeeting(meetingId);
        setSegments(fetchedSegments);

        // Fetch all meetings for navigation (sorted by date descending - newest first)
        const meetingsQuery = query(
          collection(db, COLLECTIONS.MEETINGS),
          where('groupId', '==', groupId),
          orderBy('meetingDate', 'desc')
        );
        const meetingsSnapshot = await getDocs(meetingsQuery);
        const allMeetings = meetingsSnapshot.docs.map(d => ({
          id: d.id,
          title: d.data().title as string,
          date: d.data().meetingDate?.toDate() || d.data().date?.toDate() || new Date()
        }));

        setTotalMeetings(allMeetings.length);

        // Find current meeting index and set prev/next
        const currentIdx = allMeetings.findIndex(m => m.id === meetingId);
        if (currentIdx !== -1) {
          setCurrentIndex(currentIdx + 1); // 1-based for display
          // Previous meeting (newer - lower index)
          if (currentIdx > 0) {
            setPrevMeeting(allMeetings[currentIdx - 1]);
          } else {
            setPrevMeeting(null);
          }
          // Next meeting (older - higher index)
          if (currentIdx < allMeetings.length - 1) {
            setNextMeeting(allMeetings[currentIdx + 1]);
          } else {
            setNextMeeting(null);
          }
        }
      } catch (error) {
        console.error('CARRIED_DEBUG: Error fetching meeting:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [meetingId, groupId, navigate]);

  // Handle URL segment param - auto-expand and scroll to linked segment
  useEffect(() => {
    const segmentId = searchParams.get('segment');
    if (segmentId && segments.length > 0 && !loading) {
      // Auto-expand the segment
      setExpandedSegments(prev => new Set([...prev, segmentId]));
      setHighlightedSegment(segmentId);

      // Scroll to the segment after a brief delay for DOM to update
      setTimeout(() => {
        const el = segmentRefs.current[segmentId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Remove highlight after animation
      setTimeout(() => {
        setHighlightedSegment(null);
      }, 3000);
    }
  }, [searchParams, segments, loading]);

  const handleDelete = async () => {
    if (!meetingId || !groupId) return;
    setDeleting(true);

    try {
      // Delete all segments for this meeting
      await deleteSegmentsByMeeting(meetingId);

      // Delete the meeting
      await deleteDoc(doc(db, COLLECTIONS.MEETINGS, meetingId));

      console.log('CARRIED_DEBUG: Deleted meeting and segments');
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('CARRIED_DEBUG: Error deleting meeting:', error);
      alert('Failed to delete meeting. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveVideoUrl = async () => {
    if (!meetingId) return;
    setSavingVideoUrl(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.MEETINGS, meetingId), {
        videoUrl: videoUrlInput.trim() || null,
        updatedAt: serverTimestamp(),
      });
      setMeeting(prev => prev ? { ...prev, videoUrl: videoUrlInput.trim() || undefined } : null);
      setEditingVideoUrl(false);
    } catch (error) {
      console.error('CARRIED_DEBUG: Error saving video URL:', error);
    } finally {
      setSavingVideoUrl(false);
    }
  };

  const handleReprocess = async () => {
    if (!meeting || !meetingId || !groupId) return;
    setReprocessing(true);

    try {
      // Step 1: Delete existing segments
      setReprocessStep('Clearing old segments...');
      await deleteSegmentsByMeeting(meetingId);

      // Step 2: Extract new segments
      setReprocessStep('AI extracting content...');
      const { segments: extractedSegments, error } = await extractSegments(meeting.rawMinutes);

      if (error) {
        console.warn('CARRIED_DEBUG: Extraction warning:', error);
      }

      console.log(`CARRIED_DEBUG: Extracted ${extractedSegments.length} segments`);

      // Step 3: Save new segments with embeddings
      setReprocessStep('Generating embeddings...');
      const { saved, segmentIds } = await saveSegments(groupId, meetingId, extractedSegments);

      // Step 4: Update meeting
      setReprocessStep('Updating meeting...');
      const motionCount = extractedSegments.filter((s) => s.type === 'motion').length;
      await updateDoc(doc(db, COLLECTIONS.MEETINGS, meetingId), {
        processingStatus: 'completed',
        segmentCount: saved,
        motionCount,
        segmentIds,
        updatedAt: serverTimestamp(),
      });

      // Refresh segments
      const newSegments = await getSegmentsByMeeting(meetingId);
      setSegments(newSegments);

      // Update local meeting state
      setMeeting({
        ...meeting,
        segmentCount: saved,
        motionCount,
        processingStatus: 'completed' as const,
      });

      setReprocessStep('');
    } catch (error) {
      console.error('CARRIED_DEBUG: Error reprocessing meeting:', error);
      alert('Failed to reprocess meeting. Please try again.');
    } finally {
      setReprocessing(false);
      setReprocessStep('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loading size="lg" text="Loading meeting..." />
        </div>
      </div>
    );
  }

  if (!meeting) return null;

  const meetingDate = meeting.meetingDate?.toDate?.() || meeting.date?.toDate?.() || new Date();

  // Group segments by type
  const segmentsByType = segments.reduce((acc, segment) => {
    if (!acc[segment.type]) acc[segment.type] = [];
    acc[segment.type].push(segment);
    return acc;
  }, {} as Record<SegmentType, Segment[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          {/* Back to group */}
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="ds-btn ds-btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Group</span>
          </button>

          {/* Meeting counter */}
          {totalMeetings > 0 && (
            <span className="ds-caption hidden sm:block">
              Meeting {currentIndex} of {totalMeetings}
            </span>
          )}

          {/* Prev/Next navigation */}
          <div className="flex items-center gap-1">
            {/* Previous (newer) */}
            <button
              onClick={() => prevMeeting && navigate(`/groups/${groupId}/meetings/${prevMeeting.id}`)}
              disabled={!prevMeeting}
              className="ds-btn ds-btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              title={prevMeeting ? `Newer: ${prevMeeting.title}` : 'No newer meetings'}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Newer</span>
            </button>

            {/* Next (older) */}
            <button
              onClick={() => nextMeeting && navigate(`/groups/${groupId}/meetings/${nextMeeting.id}`)}
              disabled={!nextMeeting}
              className="ds-btn ds-btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              title={nextMeeting ? `Older: ${nextMeeting.title}` : 'No older meetings'}
            >
              <span className="hidden md:inline text-sm">Older</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meeting Header - Design System Card */}
        <div className="ds-card-elevated p-5 mb-6">
          {/* Title row */}
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="ds-headline-sm">{formatMeetingTitle(meeting.title)}</h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="ds-chip">
                  <Calendar className="w-3.5 h-3.5" />
                  {meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="ds-chip ds-chip-blue">
                  <Vote className="w-3.5 h-3.5" />
                  {segments.length} segments
                </span>
                <span className={`ds-chip ${
                  meeting.processingStatus === 'completed' ? 'ds-chip-green' :
                  meeting.processingStatus === 'failed' ? 'ds-chip-red' :
                  ''
                }`}>
                  {meeting.processingStatus === 'completed' ? '✓ Processed' : meeting.processingStatus}
                </span>
                {/* Video link */}
                {meeting.videoUrl && (
                  <a
                    href={meeting.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ds-chip ds-chip-teal hover:opacity-80 transition-opacity"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Watch
                  </a>
                )}
              </div>

              {/* Video URL editor - owner only */}
              {user && group && user.uid === group.createdBy && (
                <div className="mt-2">
                  {editingVideoUrl ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        onClick={handleSaveVideoUrl}
                        disabled={savingVideoUrl}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingVideoUrl(false)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setVideoUrlInput(meeting.videoUrl || '');
                        setEditingVideoUrl(true);
                      }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-teal-600"
                    >
                      <Link className="w-3 h-3" />
                      {meeting.videoUrl ? 'Edit video link' : 'Add video link'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Minimal action buttons - owner only */}
            {user && group && user.uid === group.createdBy && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleReprocess}
                  disabled={reprocessing}
                  className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors disabled:opacity-50"
                  title="Re-extract segments"
                >
                  {reprocessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 text-gray-400 hover:text-coral-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Reprocessing status */}
          {reprocessing && reprocessStep && (
            <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {reprocessStep}
            </div>
          )}
        </div>

        {/* Raw Minutes (collapsible) - Design System */}
        <div className="ds-card overflow-hidden mb-6">
          <button
            onClick={() => setShowRawMinutes(!showRawMinutes)}
            className={`ds-accordion-header ${showRawMinutes ? 'ds-accordion-header-expanded' : ''}`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 ds-section-icon" />
              <span className="ds-title-md">Original Minutes</span>
              <span className="ds-badge">
                {meeting.rawMinutes.length.toLocaleString()} chars
              </span>
            </div>
            {showRawMinutes ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {showRawMinutes && (
            <div className="p-5 border-t border-[var(--border-subtle)]">
              <pre className="whitespace-pre-wrap ds-body-sm bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-[var(--text-secondary)]">
                {meeting.rawMinutes}
              </pre>
            </div>
          )}
        </div>

        {/* Segments */}
        {segments.length === 0 ? (
          <div className="ds-card ds-empty-state">
            <Vote className="ds-empty-state-icon" />
            <h3 className="ds-empty-state-title">No segments extracted yet</h3>
            <p className="ds-empty-state-description">
              Click "Re-extract" to process the meeting minutes with AI
            </p>
            <Button onClick={handleReprocess} disabled={reprocessing} className="ds-btn ds-btn-primary">
              {reprocessing ? 'Processing...' : 'Extract Content'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="ds-card overflow-hidden">
              <div className="ds-section-header">
                <div className="ds-section-title">
                  <Vote className="w-5 h-5 ds-section-icon" />
                  <span>Extracted Content</span>
                </div>
                <span className="ds-badge ds-badge-primary">{segments.length}</span>
              </div>

              {/* Filter instruction + clear button */}
              <div className="flex items-center justify-between px-5 py-3 bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
                <p className="ds-caption">
                  Click a category to filter:
                </p>
                {typeFilter && (
                  <button
                    onClick={() => setTypeFilter(null)}
                    className="ds-btn-text ds-text-sm flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear filter
                  </button>
                )}
              </div>
              {/* Stat Cards Grid */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(segmentsByType).map(([type, segs]) => {
                  const isSelected = typeFilter === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(isSelected ? null : type as SegmentType)}
                      className={`ds-stat-card ${isSelected ? 'ds-stat-card-selected' : ''}`}
                    >
                      <div className="ds-stat-card-label">
                        {SEGMENT_ICONS[type as SegmentType]}
                        <span>{SEGMENT_TYPE_INFO[type as SegmentType]?.label || type}</span>
                      </div>
                      <span className="ds-stat-card-value">{segs.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Financial Analytics Dashboard */}
            <FinancialAnalytics segments={segments} />

            {/* Filter indicator */}
            {typeFilter && (
              <div className="ds-chip ds-chip-blue px-4 py-2">
                Showing {segmentsByType[typeFilter]?.length || 0} {SEGMENT_TYPE_INFO[typeFilter]?.label || typeFilter} items
              </div>
            )}

            {/* All segments in order (filtered if type selected) */}
            <div className="space-y-3">
              {segments
                .filter(seg => !typeFilter || seg.type === typeFilter)
                .map((segment, index) => {
                const isExpanded = expandedSegments.has(segment.id);
                const toggleExpand = () => {
                  setExpandedSegments(prev => {
                    const next = new Set(prev);
                    if (next.has(segment.id)) {
                      next.delete(segment.id);
                    } else {
                      next.add(segment.id);
                    }
                    return next;
                  });
                };

                return (
                  <div
                    key={segment.id}
                    ref={(el: HTMLDivElement | null) => { segmentRefs.current[segment.id] = el; }}
                    className={`ds-card p-5 cursor-pointer ds-card-interactive ${isExpanded ? 'ring-2 ring-[var(--gcp-blue-300)] dark:ring-[var(--gcp-blue-500)]' : ''} ${highlightedSegment === segment.id ? 'segment-highlight ring-2 ring-[var(--accent-500)]' : ''}`}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      // Don't toggle if clicking inside details, pre, or other interactive elements
                      const target = e.target as HTMLElement;
                      if (target.closest('details') || target.closest('pre') || target.closest('summary') || target.closest('button')) {
                        return;
                      }
                      toggleExpand();
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Row number */}
                      <div className="ds-badge w-8 h-8 shrink-0">
                        {index + 1}
                      </div>
                      {/* Icon */}
                      <div className="shrink-0 mt-0.5">
                        {segment.type === 'motion' && segment.outcome && segment.outcome in OUTCOME_ICONS
                          ? OUTCOME_ICONS[segment.outcome as MotionOutcome]
                          : SEGMENT_ICONS[segment.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`ds-chip ${
                            segment.type === 'motion' ? 'ds-chip-blue' :
                            segment.type === 'discussion' ? 'ds-chip-purple' :
                            segment.type === 'report' ? 'ds-chip-green' :
                            segment.type === 'action_item' ? 'ds-chip-red' :
                            segment.type === 'announcement' ? 'ds-chip-orange' :
                            ''
                          }`}>
                            {SEGMENT_TYPE_INFO[segment.type]?.label || segment.type}
                          </span>
                          {segment.type === 'motion' && segment.outcome && (
                            <span className={`ds-chip ${
                              segment.outcome === 'carried' ? 'ds-chip-green' :
                              segment.outcome === 'defeated' ? 'ds-chip-red' :
                              ''
                            }`}>
                              {segment.outcome.charAt(0).toUpperCase() + segment.outcome.slice(1)}
                            </span>
                          )}
                          <span className="ds-caption ml-auto flex items-center gap-1">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </span>
                        </div>
                        {/* Title */}
                        <h3 className="ds-title-md mb-2">{segment.title}</h3>

                        {/* Collapsed: show truncated content */}
                        {!isExpanded && (
                          <p className="ds-body-sm ds-line-clamp-2">{segment.content}</p>
                        )}

                        {/* Expanded: show full content and all details */}
                        {isExpanded && (
                          <div className="space-y-3">
                            {/* Try check run summary first (spending by category, top vendors) */}
                            <CheckRunSummary content={segment.content} rawMinutes={meeting?.rawMinutes} />

                            {/* Try PDF check run visualization (for raw PDF uploads) */}
                            <PDFCheckRunSummary content={segment.content} rawMinutes={meeting?.rawMinutes} />

                            {/* Try credit card visualization */}
                            <FinancialContent content={segment.content} rawMinutes={meeting?.rawMinutes} />

                            {/* Try disbursement summary visualization */}
                            <DisbursementSummary content={segment.content} rawMinutes={meeting?.rawMinutes} />

                            {/* Show raw text only if no visualizations rendered */}
                            {!segment.content.includes('Spending by Category') &&
                             !segment.content.toLowerCase().includes('previous balance') &&
                             !segment.content.toLowerCase().includes('new balance') &&
                             !segment.content.toLowerCase().includes('credit limit') &&
                             !segment.content.toLowerCase().includes('disbursement') &&
                             !segment.content.toLowerCase().includes('disbursed') &&
                             !segment.content.toLowerCase().includes('check run') &&
                             !segment.content.toLowerCase().includes('ap vendor') &&
                             !segment.content.toLowerCase().includes('vendor payments') && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{segment.content}</p>
                            )}

                            {/* Collapsible raw text for visualized content */}
                            {(segment.content.includes('Spending by Category') ||
                              segment.content.toLowerCase().includes('previous balance') ||
                              segment.content.toLowerCase().includes('new balance') ||
                              segment.content.toLowerCase().includes('credit limit') ||
                              segment.content.toLowerCase().includes('disbursement') ||
                              segment.content.toLowerCase().includes('disbursed') ||
                              segment.content.toLowerCase().includes('check run') ||
                              segment.content.toLowerCase().includes('ap vendor') ||
                              segment.content.toLowerCase().includes('vendor payments')) && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
                                  View raw text
                                </summary>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-slate-700 p-3 rounded-lg font-mono text-xs">
                                  {segment.content}
                                </p>
                              </details>
                            )}

                            {/* Context if available */}
                            {segment.context && (
                              <div className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                                Context: {segment.context}
                              </div>
                            )}

                            {/* Motion details */}
                            {segment.type === 'motion' && (
                              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                                <h4 className="text-xs font-semibold text-blue-800 uppercase">Motion Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {segment.movedBy && (
                                    <div><span className="text-gray-500">Moved by:</span> <span className="font-medium">{segment.movedBy}</span></div>
                                  )}
                                  {segment.secondedBy && (
                                    <div><span className="text-gray-500">Seconded by:</span> <span className="font-medium">{segment.secondedBy}</span></div>
                                  )}
                                </div>
                                {segment.voteCount && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Vote:</span>{' '}
                                    <span className="font-medium text-green-700">{segment.voteCount.yea} yea</span>,{' '}
                                    <span className="font-medium text-red-700">{segment.voteCount.nay} nay</span>
                                    {segment.voteCount.abstain > 0 && (
                                      <>, <span className="font-medium text-gray-600">{segment.voteCount.abstain} abstain</span></>
                                    )}
                                  </div>
                                )}
                                {/* Individual voter names if available */}
                                {segment.yeaVoters && segment.yeaVoters.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Voted Yes:</span>{' '}
                                    <span className="text-green-700">{segment.yeaVoters.join(', ')}</span>
                                  </div>
                                )}
                                {segment.nayVoters && segment.nayVoters.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Voted No:</span>{' '}
                                    <span className="text-red-700">{segment.nayVoters.join(', ')}</span>
                                  </div>
                                )}
                                {segment.abstainVoters && segment.abstainVoters.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Abstained:</span>{' '}
                                    <span className="text-gray-600">{segment.abstainVoters.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action item details */}
                            {segment.type === 'action_item' && (segment.assignedTo || segment.dueDate) && (
                              <div className="bg-red-50 rounded-lg p-3 space-y-1">
                                <h4 className="text-xs font-semibold text-red-800 uppercase">Action Item Details</h4>
                                {segment.assignedTo && (
                                  <div className="text-sm"><span className="text-gray-500">Assigned to:</span> <span className="font-medium">{segment.assignedTo}</span></div>
                                )}
                                {segment.dueDate && (
                                  <div className="text-sm"><span className="text-gray-500">Due:</span> <span className="font-medium">{segment.dueDate}</span></div>
                                )}
                                {segment.status && (
                                  <div className="text-sm"><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{segment.status}</span></div>
                                )}
                              </div>
                            )}

                            {/* Tags */}
                            {segment.tags && segment.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {segment.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Confidence */}
                            <div className="text-xs text-gray-400">
                              AI Confidence: {Math.round(segment.confidence * 100)}%
                            </div>
                          </div>
                        )}

                        {/* Collapsed: show basic motion info */}
                        {!isExpanded && segment.type === 'motion' && segment.voteCount && (
                          <div className="mt-1 text-xs text-gray-500">
                            Vote: {segment.voteCount.yea}-{segment.voteCount.nay}
                            {segment.movedBy && ` • Moved by ${segment.movedBy}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal - Design System */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="ds-card-elevated max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="ds-headline-sm">Delete Meeting</h3>
            </div>
            <p className="ds-body-md text-[var(--text-secondary)] mb-6">
              This will permanently delete <strong className="text-[var(--text-primary)]">"{meeting.title}"</strong> and all its extracted
              segments. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="ds-btn ds-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="ds-btn ds-btn-danger"
              >
                {deleting ? 'Deleting...' : 'Delete Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingDetail;
