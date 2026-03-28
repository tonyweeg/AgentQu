/**
 * SubmissionCard Component
 * PoliScai - Democracy V2.0
 *
 * Displays a submission with voting controls and progress
 */

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { castVote, getUserVote, APPROVAL_THRESHOLD, MIN_VOTES_FOR_APPROVAL } from '../../lib/firestore/votes';
import { AmbiguitySubmission, AmbiguityType } from '../../types/submission';

interface SubmissionCardProps {
  submission: AmbiguitySubmission;
  onVoteSuccess?: () => void;
}

const AMBIGUITY_TYPE_LABELS: Record<AmbiguityType, string> = {
  gender_assumption: 'Gender Assumption',
  racial_exclusion: 'Racial Exclusion',
  economic_exclusion: 'Economic Exclusion',
  citizenship_definition: 'Citizenship Definition',
  deferred_to_state: 'Deferred to States',
  pronoun_language_bias: 'Pronoun/Language Bias',
  corporate_personhood: 'Corporate Personhood',
  religious_assumption: 'Religious Assumption',
  age_exclusion: 'Age Exclusion',
  other: 'Other',
};

const STATUS_CONFIG = {
  submitted: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending Review' },
  in_review: { icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-50', label: 'In Review' },
  approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
  draft: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Draft' },
  disputed: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Disputed' },
  dispute_resolved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Resolved' },
};

export function SubmissionCard({ submission, onVoteSuccess }: SubmissionCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState(submission.votes);

  // Load user's existing vote
  useEffect(() => {
    async function loadUserVote() {
      if (!user) return;
      const vote = await getUserVote(user.uid, submission.id);
      if (vote) {
        setUserVote(vote.value);
      }
    }
    loadUserVote();
  }, [user, submission.id]);

  const handleVote = async (value: 'up' | 'down') => {
    if (!user || !isAuthenticated) {
      setVoteError('Please sign in to vote');
      return;
    }

    if (user.uid === submission.submittedBy) {
      setVoteError('You cannot vote on your own submission');
      return;
    }

    setIsVoting(true);
    setVoteError(null);

    const result = await castVote(user.uid, submission.id, value);

    if (result.success) {
      // Optimistic update
      const isNewVote = userVote === null;

      let newUp = localVotes.up;
      let newDown = localVotes.down;

      if (isNewVote) {
        if (value === 'up') newUp++;
        else newDown++;
      } else if (value !== userVote) {
        // Switching vote
        if (value === 'up') {
          newUp++;
          newDown--;
        } else {
          newUp--;
          newDown++;
        }
      }

      const newTotal = newUp + newDown;
      setLocalVotes({
        up: newUp,
        down: newDown,
        total: newTotal,
        ratio: newTotal > 0 ? newUp / newTotal : 0,
        voterIds: [...localVotes.voterIds, user.uid],
      });

      setUserVote(value);
      onVoteSuccess?.();
    } else {
      setVoteError(result.error || 'Failed to cast vote');
    }

    setIsVoting(false);
  };

  const statusConfig = STATUS_CONFIG[submission.status] || STATUS_CONFIG.submitted;
  const StatusIcon = statusConfig.icon;

  const approvalProgress = (localVotes.ratio * 100).toFixed(0);
  const votesNeeded = Math.max(0, MIN_VOTES_FOR_APPROVAL - localVotes.total);
  const isApproved = submission.status === 'approved';
  const canVote = isAuthenticated && user?.uid !== submission.submittedBy && !isApproved;

  // Format date
  const submittedDate = submission.submittedAt?.toDate?.()
    ? submission.submittedAt.toDate().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            <span className="text-xs text-gray-400">{submittedDate}</span>
          </div>
          <p className="text-sm text-gray-600">{submission.clauseRef}</p>
        </div>
        <span className="px-2 py-1 bg-poliscai-primary/10 text-poliscai-primary text-xs font-medium rounded">
          {AMBIGUITY_TYPE_LABELS[submission.type]}
        </span>
      </div>

      {/* Flagged Text */}
      <div className="p-4 bg-red-50 border-b border-red-100">
        <p className="text-sm text-gray-500 mb-1">Flagged Text:</p>
        <p className="text-red-900 font-serif italic">"{submission.flaggedText}"</p>
      </div>

      {/* Shadow Description */}
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">Shadow Surfaced:</p>
        <p className="text-gray-800 leading-relaxed">{submission.shadowDescription}</p>

        {submission.citation && (
          <p className="mt-3 text-sm text-gray-500">
            <span className="font-medium">Citation:</span> {submission.citation}
          </p>
        )}

        {submission.eraOperative && (
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium">Era:</span> {submission.eraOperative}
          </p>
        )}
      </div>

      {/* Submitter */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
        <User className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">
          Submitted by {submission.submittedByDisplayName}
        </span>
      </div>

      {/* Voting Section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Approval Progress</span>
            <span className={`font-medium ${localVotes.ratio >= APPROVAL_THRESHOLD ? 'text-green-600' : 'text-gray-600'}`}>
              {approvalProgress}% ({localVotes.total} votes)
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                localVotes.ratio >= APPROVAL_THRESHOLD ? 'bg-green-500' : 'bg-poliscai-primary'
              }`}
              style={{ width: `${Math.min(100, localVotes.ratio * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{localVotes.up} up / {localVotes.down} down</span>
            {votesNeeded > 0 && !isApproved && (
              <span>{votesNeeded} more votes needed</span>
            )}
            {isApproved && (
              <span className="text-green-600 font-medium">Approved!</span>
            )}
          </div>
        </div>

        {/* Vote Buttons */}
        {canVote && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                userVote === 'up'
                  ? 'bg-green-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-200'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                userVote === 'down'
                  ? 'bg-red-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {!isAuthenticated && (
          <p className="text-center text-sm text-gray-500">
            Sign in to vote on this submission
          </p>
        )}

        {user?.uid === submission.submittedBy && !isApproved && (
          <p className="text-center text-sm text-gray-500">
            You cannot vote on your own submission
          </p>
        )}

        {voteError && (
          <p className="mt-2 text-center text-sm text-red-600">{voteError}</p>
        )}
      </div>
    </div>
  );
}

export default SubmissionCard;
