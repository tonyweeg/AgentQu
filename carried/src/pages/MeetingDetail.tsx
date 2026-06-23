/**
 * Meeting Detail Page
 * Carried - Motions carry, memory too
 *
 * View meeting details, segments, and manage meeting data
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft,
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
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { FinancialContent } from '../components/ui/FinancialContent';
import { FinancialAnalytics } from '../components/ui/FinancialAnalytics';
import { CheckRunSummary } from '../components/ui/CheckRunSummary';
import { DisbursementSummary } from '../components/ui/DisbursementSummary';
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

export function MeetingDetail() {
  const { groupId, meetingId } = useParams<{ groupId: string; meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      } catch (error) {
        console.error('CARRIED_DEBUG: Error fetching meeting:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [meetingId, groupId, navigate]);

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
        {/* Back button */}
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Group
        </button>

        {/* Meeting Header - Tufte style: data first, chrome minimal */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          {/* Title row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 leading-snug">{meeting.title}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Vote className="w-3 h-3" />
                  {segments.length}
                </span>
                <span className={`px-1.5 py-0.5 rounded ${
                  meeting.processingStatus === 'completed' ? 'bg-green-50 text-green-600' :
                  meeting.processingStatus === 'failed' ? 'bg-red-50 text-red-600' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {meeting.processingStatus === 'completed' ? '✓' : meeting.processingStatus}
                </span>
                {/* Video link */}
                {meeting.videoUrl && (
                  <a
                    href={meeting.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
                  >
                    <Video className="w-3 h-3" />
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

        {/* Raw Minutes (collapsible) */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <button
            onClick={() => setShowRawMinutes(!showRawMinutes)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Original Minutes</span>
              <span className="text-sm text-gray-500">
                ({meeting.rawMinutes.length.toLocaleString()} characters)
              </span>
            </div>
            {showRawMinutes ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {showRawMinutes && (
            <div className="px-6 pb-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto font-mono">
                {meeting.rawMinutes}
              </pre>
            </div>
          )}
        </div>

        {/* Segments */}
        {segments.length === 0 ? (
          <Card className="p-8 text-center">
            <Vote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-700 mb-2">No segments extracted yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Click "Re-extract" to process the meeting minutes with AI
            </p>
            <Button onClick={handleReprocess} disabled={reprocessing}>
              {reprocessing ? 'Processing...' : 'Extract Content'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Extracted Content</h2>

            {/* Segment summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(segmentsByType).map(([type, segs]) => (
                <div key={type} className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    {SEGMENT_ICONS[type as SegmentType]}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {SEGMENT_TYPE_INFO[type as SegmentType]?.label || type}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{segs.length}</span>
                </div>
              ))}
            </div>

            {/* Financial Analytics Dashboard */}
            <FinancialAnalytics segments={segments} />

            {/* All segments in order */}
            <div className="space-y-3">
              {segments.map((segment, index) => {
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
                  <Card
                    key={segment.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${isExpanded ? 'ring-2 ring-indigo-200' : ''}`}
                    onClick={toggleExpand}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400 w-6 shrink-0">
                        {index + 1}
                      </div>
                      {segment.type === 'motion' && segment.outcome && segment.outcome in OUTCOME_ICONS
                        ? OUTCOME_ICONS[segment.outcome as MotionOutcome]
                        : SEGMENT_ICONS[segment.type]}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            segment.type === 'motion' ? 'bg-blue-100 text-blue-700' :
                            segment.type === 'discussion' ? 'bg-purple-100 text-purple-700' :
                            segment.type === 'report' ? 'bg-green-100 text-green-700' :
                            segment.type === 'action_item' ? 'bg-red-100 text-red-700' :
                            segment.type === 'announcement' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {SEGMENT_TYPE_INFO[segment.type]?.label || segment.type}
                          </span>
                          {segment.type === 'motion' && segment.outcome && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              segment.outcome === 'carried' ? 'bg-green-100 text-green-700' :
                              segment.outcome === 'defeated' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {segment.outcome.charAt(0).toUpperCase() + segment.outcome.slice(1)}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{segment.title}</h3>

                        {/* Collapsed: show truncated content */}
                        {!isExpanded && (
                          <p className="text-sm text-gray-600 line-clamp-2">{segment.content}</p>
                        )}

                        {/* Expanded: show full content and all details */}
                        {isExpanded && (
                          <div className="space-y-3">
                            {/* Try check run summary first (spending by category, top vendors) */}
                            <CheckRunSummary content={segment.content} />

                            {/* Try credit card visualization */}
                            <FinancialContent content={segment.content} />

                            {/* Try disbursement summary visualization */}
                            <DisbursementSummary content={segment.content} rawMinutes={meeting?.rawMinutes} />

                            {/* Show raw text only if no visualizations rendered */}
                            {!segment.content.includes('Spending by Category') &&
                             !segment.content.toLowerCase().includes('previous balance') &&
                             !segment.content.toLowerCase().includes('new balance') &&
                             !segment.content.toLowerCase().includes('credit limit') &&
                             !segment.content.toLowerCase().includes('disbursement') &&
                             !segment.content.toLowerCase().includes('disbursed') && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{segment.content}</p>
                            )}

                            {/* Collapsible raw text for visualized content */}
                            {(segment.content.includes('Spending by Category') ||
                              segment.content.toLowerCase().includes('previous balance') ||
                              segment.content.toLowerCase().includes('new balance') ||
                              segment.content.toLowerCase().includes('credit limit') ||
                              segment.content.toLowerCase().includes('disbursement') ||
                              segment.content.toLowerCase().includes('disbursed')) && (
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
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Meeting</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete <strong>"{meeting.title}"</strong> and all its extracted
              segments. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete Meeting'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingDetail;
