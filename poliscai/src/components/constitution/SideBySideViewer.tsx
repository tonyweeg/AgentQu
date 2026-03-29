/**
 * SideBySideViewer Component - Enhanced Edition
 * PoliScai - Democracy V2.0
 *
 * Beautiful side-by-side display of Shadow (V1.0) and Revised (V2.0) text
 * with interactive highlights, tooltips, voting, and visual connections
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FlagSubmissionModal } from './FlagSubmissionModal';
import {
  voteOnAnnotation,
  subscribeToAnnotationVotes,
  calculateApproval,
  MIN_VOTES_FOR_CANON,
} from '../../lib/firestore/annotationVotes';
import {
  Flag,
  Sparkles,
  Info,
  ArrowRight,
  FileText,
  Edit3,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Users,
  Loader2,
  Crown,
  PartyPopper,
} from 'lucide-react';

// Types for shadow annotations
interface ShadowAnnotation {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  description: string;
  proposedRevision?: string;
  type: string;
  // Metadata from real submissions
  submittedBy?: string;
  status?: string;
  isCanon?: boolean;
}

interface AnnotationVoteData {
  upVotes: number;
  downVotes: number;
  voters: Record<string, 'up' | 'down'>;
  isCanon?: boolean;
}

// Type badge configurations
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  gender_assumption: {
    label: 'Gender',
    color: 'text-pink-700',
    bg: 'bg-pink-100',
  },
  racial_exclusion: {
    label: 'Race',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
  },
  economic_exclusion: {
    label: 'Economic',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
  },
  age_assumption: {
    label: 'Age',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
  },
  default: {
    label: 'Bias',
    color: 'text-red-700',
    bg: 'bg-red-100',
  },
};

interface SideBySideViewerProps {
  clauseId: string;
  articleSection: string;
  title: string;
  originalText: string;
  revisedText?: string;
  shadowAnnotations?: ShadowAnnotation[];
  onSubmissionSuccess?: () => void;
}

// ProposalCard component for individual proposal voting
function ProposalCard({
  annotation,
  isAuthenticated,
  userId,
}: {
  annotation: ShadowAnnotation;
  isAuthenticated: boolean;
  userId?: string;
}) {
  const [votes, setVotes] = useState<AnnotationVoteData | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Subscribe to votes for this proposal
  useEffect(() => {
    if (!annotation.proposedRevision) return;

    const proposalId = `proposal_${annotation.id}`;
    const unsubscribe = subscribeToAnnotationVotes(proposalId, (voteData) => {
      setVotes(voteData);
    });

    return () => unsubscribe();
  }, [annotation.id, annotation.proposedRevision]);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated || !userId || isVoting) return;

    setIsVoting(true);
    try {
      const proposalId = `proposal_${annotation.id}`;
      await voteOnAnnotation(proposalId, userId, voteType);
    } catch (error) {
      console.error('POLISCAI_DEBUG: Error voting on proposal:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = (votes?.upVotes || 0) + (votes?.downVotes || 0);
  const approvalPercent = totalVotes > 0 ? Math.round((votes?.upVotes || 0) / totalVotes * 100) : 0;
  const userVote = userId && votes?.voters?.[userId];
  const isApproved = votes?.isCanon || (totalVotes >= 3 && approvalPercent >= 75);

  return (
    <div className={`p-4 rounded-xl border ${
      isApproved
        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
    }`}>
      {/* Approved badge */}
      {isApproved && (
        <div className="flex items-center gap-2 mb-3 text-yellow-700">
          <Crown className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Community Approved</span>
        </div>
      )}

      {/* Submitter */}
      {annotation.submittedBy && (
        <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs">
          <Users className="w-3 h-3" />
          <span>Proposed by <strong className="text-gray-700">{annotation.submittedBy}</strong></span>
        </div>
      )}

      {/* Replace text */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500">Replace:</span>
        <span className="text-red-700 font-medium text-sm line-through">"{annotation.text}"</span>
      </div>

      {/* With text */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-500">With:</span>
        <span className="text-green-800 font-serif italic">"{annotation.proposedRevision}"</span>
      </div>

      {/* Voting section */}
      <div className="pt-3 border-t border-green-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className={`font-medium ${approvalPercent >= 75 ? 'text-green-600' : ''}`}>
              {approvalPercent}% Approval
            </span>
            <span className="text-gray-400">·</span>
            <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          {totalVotes < 3 && (
            <span className="text-xs text-blue-500">{3 - totalVotes} more needed</span>
          )}
        </div>

        {/* Vote buttons */}
        {isAuthenticated ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                userVote === 'up'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className="w-4 h-4" />
              Approve ({votes?.upVotes || 0})
            </button>
            <button
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                userVote === 'down'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown className="w-4 h-4" />
              Reject ({votes?.downVotes || 0})
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-2">
            Sign in to vote on proposals
          </p>
        )}
      </div>
    </div>
  );
}

export function SideBySideViewer({
  clauseId,
  articleSection,
  title,
  originalText,
  revisedText,
  shadowAnnotations = [],
  onSubmissionSuccess,
}: SideBySideViewerProps) {
  const { isAuthenticated, user } = useAuth();
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState({ start: 0, end: 0 });
  const [showFlagTooltip, setShowFlagTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [showAnnotationDetails, setShowAnnotationDetails] = useState<ShadowAnnotation | null>(null);

  // Voting state
  const [voteData, setVoteData] = useState<AnnotationVoteData | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);
  const [showCanonCelebration, setShowCanonCelebration] = useState(false);

  // Subscribe to real-time vote updates when modal is open
  useEffect(() => {
    if (!showAnnotationDetails) {
      setVoteData(null);
      return;
    }

    const unsubscribe = subscribeToAnnotationVotes(showAnnotationDetails.id, (votes) => {
      if (votes) {
        setVoteData({
          upVotes: votes.upVotes || 0,
          downVotes: votes.downVotes || 0,
          voters: votes.voters || {},
          isCanon: votes.isCanon || false,
        });
      } else {
        setVoteData({ upVotes: 0, downVotes: 0, voters: {}, isCanon: false });
      }
    });

    return () => unsubscribe();
  }, [showAnnotationDetails]);

  // Handle voting
  const handleVote = async (value: 'up' | 'down') => {
    if (!user || !showAnnotationDetails) return;

    setIsVoting(true);
    const result = await voteOnAnnotation(showAnnotationDetails.id, user.uid, value);

    if (result.success) {
      setVoteSuccess(value);
      setTimeout(() => setVoteSuccess(null), 1500);

      // Show celebration if this vote made it canon!
      if (result.becameCanon) {
        setShowCanonCelebration(true);
        setTimeout(() => setShowCanonCelebration(false), 4000);
      }
    }
    setIsVoting(false);
  };

  // Get user's current vote
  const userVote = user && voteData?.voters?.[user.uid];

  // Handle text selection in Shadow panel
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowFlagTooltip(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setShowFlagTooltip(false);
      return;
    }

    const startIndex = originalText.indexOf(text);
    const endIndex = startIndex !== -1 ? startIndex + text.length : text.length;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(text);
    setSelectedIndices({ start: startIndex !== -1 ? startIndex : 0, end: endIndex });
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowFlagTooltip(true);
  }, [originalText]);

  const handleOpenFlagModal = () => {
    setShowFlagTooltip(false);
    setShowFlagModal(true);
    window.getSelection()?.removeAllRanges();
  };

  const handleModalClose = () => {
    setShowFlagModal(false);
    setSelectedText(null);
  };

  const handleSubmissionSuccess = () => {
    onSubmissionSuccess?.();
  };

  // Get type config for annotation
  const getTypeConfig = (type: string) => {
    return TYPE_CONFIG[type] || TYPE_CONFIG.default;
  };

  // Render Shadow text with beautiful highlights
  const renderOriginalText = () => {
    if (shadowAnnotations.length === 0) {
      return (
        <p className="text-gray-800 leading-relaxed font-serif text-lg">
          {originalText}
        </p>
      );
    }

    const sorted = [...shadowAnnotations].sort((a, b) => a.startIndex - b.startIndex);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((annotation, i) => {
      if (annotation.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {originalText.slice(lastIndex, annotation.startIndex)}
          </span>
        );
      }

      const typeConfig = getTypeConfig(annotation.type);
      const isHovered = hoveredAnnotation === annotation.id;

      parts.push(
        <span
          key={`shadow-${i}`}
          className={`
            relative inline-block cursor-pointer transition-all duration-200
            ${isHovered ? 'scale-105' : ''}
          `}
          onMouseEnter={() => setHoveredAnnotation(annotation.id)}
          onMouseLeave={() => setHoveredAnnotation(null)}
          onClick={() => setShowAnnotationDetails(annotation)}
        >
          <span
            className={`
              relative z-10 px-1.5 py-0.5 rounded-md font-medium
              bg-gradient-to-r from-red-100 to-red-50
              text-red-900 border-b-2 border-red-400
              hover:from-red-200 hover:to-red-100
              hover:border-red-500
              transition-all duration-200
            `}
          >
            {annotation.text}
          </span>

          {/* Animated underline */}
          <span className={`
            absolute bottom-0 left-0 right-0 h-0.5 bg-red-500
            transform origin-left transition-transform duration-300
            ${isHovered ? 'scale-x-100' : 'scale-x-0'}
          `} />

          {/* Hover tooltip */}
          {isHovered && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in">
              <span className="block px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs whitespace-normal">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${typeConfig.bg} ${typeConfig.color} mb-1`}>
                  {typeConfig.label}
                </span>
                <span className="block mt-1">{annotation.description}</span>
                {annotation.proposedRevision && (
                  <span className="block mt-2 pt-2 border-t border-white/20">
                    <span className="text-green-400 font-semibold text-[10px]">V2.0 PROPOSAL:</span>
                    <span className="block mt-0.5 text-green-200 italic">"{annotation.proposedRevision}"</span>
                  </span>
                )}
                <span className="block mt-2 text-white/60 text-[10px]">Click to vote</span>
              </span>
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </span>
          )}
        </span>
      );

      lastIndex = annotation.endIndex;
    });

    if (lastIndex < originalText.length) {
      parts.push(<span key="text-end">{originalText.slice(lastIndex)}</span>);
    }

    return (
      <p className="text-gray-800 leading-relaxed font-serif text-lg">
        {parts}
      </p>
    );
  };

  // Render Revised text with beautiful highlights showing improvements
  const renderRevisedText = () => {
    if (!revisedText) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
            <Edit3 className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No revision yet</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Flag biases in the Shadow text to start the community revision process
          </p>
        </div>
      );
    }

    // Highlight new inclusive language in green
    const inclusiveTerms = [
      'eligible persons',
      'without distinction',
      'citizenship status',
    ];

    // Build highlighted segments
    const segments: React.ReactNode[] = [];
    let remainingText = revisedText;
    let keyIndex = 0;

    inclusiveTerms.forEach(term => {
      const parts = remainingText.split(term);
      if (parts.length > 1) {
        segments.push(<span key={`seg-${keyIndex++}`}>{parts[0]}</span>);
        segments.push(
          <span
            key={`term-${keyIndex++}`}
            className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 font-medium border-b-2 border-emerald-400"
          >
            {term}
          </span>
        );
        remainingText = parts.slice(1).join(term);
      }
    });

    if (remainingText) {
      segments.push(<span key={`seg-${keyIndex}`}>{remainingText}</span>);
    }

    return (
      <p className="text-gray-800 leading-relaxed font-serif text-lg">
        {segments.length > 0 ? segments : revisedText}
      </p>
    );
  };

  // Calculate revision progress
  const progressPercent = revisedText ? 100 : Math.min(shadowAnnotations.length * 33, 99);

  // Calculate approval for current annotation
  const approvalPercent = voteData ? calculateApproval(voteData.upVotes, voteData.downVotes) : 0;
  const totalVotes = voteData ? voteData.upVotes + voteData.downVotes : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-poliscai-primary via-poliscai-primary to-indigo-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-serif text-xl font-bold">{articleSection}</h2>
            <p className="text-white/70 text-sm">{title}</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-wide">Revision Progress</p>
              <p className="text-white font-bold">{progressPercent}%</p>
            </div>
            <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inline Legend */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-b-2 border-red-400 text-xs font-medium">
              flagged bias
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-b-2 border-emerald-400 text-xs font-medium">
              inclusive revision
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="w-4 h-4" />
            <span className="text-xs">Click highlighted text to vote</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2">
        {/* Shadow (V1.0) Panel */}
        <div className="p-6 md:p-8 border-r border-gray-100 relative">
          {/* Panel Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Shadow
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  V1.0
                </span>
              </h3>
              <p className="text-gray-500 text-sm">
                Original {articleSection.includes('Amendment') ? '(Ratified)' : '(1787)'}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          {shadowAnnotations.length > 0 && (
            <div className="flex items-center gap-4 mb-6 p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 font-medium text-sm">
                  {shadowAnnotations.length} bias{shadowAnnotations.length !== 1 ? 'es' : ''} flagged
                </span>
              </div>
              <div className="flex -space-x-1">
                {shadowAnnotations.slice(0, 3).map((ann, i) => {
                  const config = getTypeConfig(ann.type);
                  return (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center text-[10px] font-bold ${config.color} border-2 border-white`}
                    >
                      {config.label[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <div
            onMouseUp={handleMouseUp}
            className="select-text cursor-text relative"
          >
            {renderOriginalText()}
          </div>

          {/* Instruction for flagging */}
          {isAuthenticated && shadowAnnotations.length === 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-poliscai-secondary/10 to-amber-50 rounded-xl border border-poliscai-secondary/20">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-poliscai-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-poliscai-dark text-sm">Surface the shadow</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Select any text that contains implicit bias or exclusion to flag it for review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revised (V2.0) Panel */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-emerald-50/30">
          {/* Panel Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Revised
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                  V2.0
                </span>
              </h3>
              <p className="text-gray-500 text-sm">Community Draft</p>
            </div>
          </div>

          {/* Status Bar */}
          {revisedText ? (
            <div className="flex items-center gap-4 mb-6 p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-800 font-medium text-sm">Draft approved</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-6 p-3 bg-gray-100 rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 font-medium text-sm">Awaiting revision</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            {renderRevisedText()}
          </div>

          {/* Community Proposals Section */}
          {shadowAnnotations.some(a => a.proposedRevision) && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-sm">Community Proposals</span>
                <span className="text-xs text-gray-400 ml-2">Vote to add to V2.0</span>
              </div>
              {shadowAnnotations
                .filter(a => a.proposedRevision)
                .map(a => (
                  <ProposalCard
                    key={a.id}
                    annotation={a}
                    isAuthenticated={isAuthenticated}
                    userId={user?.uid}
                  />
                ))}
            </div>
          )}

          {/* Arrow indicator when both panels have content */}
          {revisedText && (
            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-3">
                <ArrowRight className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-800 text-sm">
                  <span className="font-medium">This revision addresses:</span> {shadowAnnotations.map(a => `"${a.text}"`).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text selection tooltip */}
      {showFlagTooltip && isAuthenticated && selectedText && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full animate-bounce-in"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="bg-gradient-to-r from-poliscai-primary to-indigo-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <Flag className="w-4 h-4 text-poliscai-secondary" />
            <button
              onClick={handleOpenFlagModal}
              className="text-sm font-semibold hover:text-poliscai-secondary transition-colors"
            >
              Flag as bias
            </button>
            <span className="text-white/30">|</span>
            <button
              onClick={() => setShowFlagTooltip(false)}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-poliscai-primary" />
          </div>
        </div>
      )}

      {/* Annotation Details Modal with Voting */}
      {showAnnotationDetails && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAnnotationDetails(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 ${
              voteData?.isCanon
                ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600'
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {voteData?.isCanon && <Crown className="w-5 h-5" />}
                    {voteData?.isCanon ? 'Canon' : 'Flagged Bias'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {voteData?.isCanon
                      ? 'Community approved - part of the official record'
                      : 'Vote to approve or reject this flag'}
                  </p>
                </div>
                {voteData?.isCanon && (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-serif font-bold text-red-800 bg-red-100 px-3 py-1 rounded-lg">
                  "{showAnnotationDetails.text}"
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeConfig(showAnnotationDetails.type).bg} ${getTypeConfig(showAnnotationDetails.type).color}`}>
                  {getTypeConfig(showAnnotationDetails.type).label}
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                {showAnnotationDetails.description}
              </p>

              {/* Proposed Revision */}
              {showAnnotationDetails.proposedRevision && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm">Proposed V2.0 Language</span>
                  </div>
                  <p className="text-green-900 font-serif italic">
                    "{showAnnotationDetails.proposedRevision}"
                  </p>
                </div>
              )}

              {/* Voting Section */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Community Vote</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Canon Status Badge */}
                {voteData?.isCanon && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-600" />
                      <span className="font-bold text-yellow-800">Part of Canon</span>
                      <span className="ml-auto text-sm text-yellow-600">Official Record</span>
                    </div>
                  </div>
                )}

                {/* Approval Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${voteData?.isCanon ? 'text-yellow-600' : approvalPercent >= 75 ? 'text-green-600' : 'text-gray-600'}`}>
                      {approvalPercent}% Approval
                    </span>
                    {totalVotes < MIN_VOTES_FOR_CANON ? (
                      <span className="text-blue-500 text-xs font-medium">
                        {MIN_VOTES_FOR_CANON - totalVotes} more vote{MIN_VOTES_FOR_CANON - totalVotes !== 1 ? 's' : ''} needed
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        75% needed for canon
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        voteData?.isCanon
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          : approvalPercent >= 75
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : approvalPercent >= 50
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          : 'bg-gradient-to-r from-red-500 to-rose-500'
                      }`}
                      style={{ width: `${approvalPercent}%` }}
                    />
                  </div>
                </div>

                {/* Vote Buttons */}
                {isAuthenticated ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote('up')}
                      disabled={isVoting}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                        userVote === 'up'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600'
                      } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isVoting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp className={`w-5 h-5 ${userVote === 'up' ? 'fill-current' : ''}`} />
                          <span>Approve</span>
                          {voteData && <span className="text-sm opacity-75">({voteData.upVotes})</span>}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleVote('down')}
                      disabled={isVoting}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                        userVote === 'down'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-600'
                      } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isVoting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ThumbsDown className={`w-5 h-5 ${userVote === 'down' ? 'fill-current' : ''}`} />
                          <span>Reject</span>
                          {voteData && <span className="text-sm opacity-75">({voteData.downVotes})</span>}
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    <a href="#" className="text-poliscai-primary font-medium hover:underline">
                      Sign in
                    </a>{' '}
                    to vote on this flag
                  </div>
                )}

                {/* Vote Success Indicator */}
                {voteSuccess && (
                  <div className="mt-3 text-center animate-fade-in">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      voteSuccess === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                      Vote recorded!
                    </span>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowAnnotationDetails(null)}
                className="w-full py-3 bg-gradient-to-r from-poliscai-primary to-indigo-800 text-white font-medium rounded-xl hover:shadow-lg transition-shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canon Celebration Overlay */}
      {showCanonCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="animate-scale-in">
            <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white px-8 py-6 rounded-3xl shadow-2xl text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                  <Crown className="w-10 h-10" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Promoted to Canon!</h2>
                <PartyPopper className="w-6 h-6 scale-x-[-1]" />
              </div>
              <p className="text-white/80">
                This flag is now part of the official record
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flag Submission Modal */}
      <FlagSubmissionModal
        isOpen={showFlagModal}
        onClose={handleModalClose}
        clauseId={clauseId}
        clauseRef={articleSection}
        flaggedText={selectedText || ''}
        flaggedTextStart={selectedIndices.start}
        flaggedTextEnd={selectedIndices.end}
        onSubmitSuccess={handleSubmissionSuccess}
      />
    </div>
  );
}

export default SideBySideViewer;
