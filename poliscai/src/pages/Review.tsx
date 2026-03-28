/**
 * Review Page - Community Voting
 * PoliScai - Democracy V2.0
 *
 * Shows pending submissions for community review and voting
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { SubmissionCard } from '../components/community/SubmissionCard';
import { getPendingSubmissions, getUserSubmissions } from '../lib/firestore/submissions';
import { useAuth } from '../hooks/useAuth';
import { AmbiguitySubmission } from '../types/submission';
import { Filter, Search, Loader2, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

type FilterStatus = 'all' | 'in_review' | 'approved' | 'mine';

export function Review() {
  const { user, isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState<AmbiguitySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('in_review');
  const [searchTerm, setSearchTerm] = useState('');

  // Load submissions
  const loadSubmissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: AmbiguitySubmission[] = [];

      if (filterStatus === 'mine' && user) {
        data = await getUserSubmissions(user.uid);
      } else {
        data = await getPendingSubmissions();
        // Also get approved ones for the "all" view
        // For now, we'll just use pending - can expand later
      }

      setSubmissions(data);
    } catch (err) {
      console.error('POLISCAI_DEBUG: Error loading submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, user?.uid]);

  // Filter submissions by search term
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;

    const term = searchTerm.toLowerCase();
    return submissions.filter(
      (s) =>
        s.flaggedText.toLowerCase().includes(term) ||
        s.shadowDescription.toLowerCase().includes(term) ||
        s.clauseRef.toLowerCase().includes(term) ||
        s.submittedByDisplayName.toLowerCase().includes(term)
    );
  }, [submissions, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const inReview = submissions.filter((s) => s.status === 'in_review' || s.status === 'submitted').length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const total = submissions.length;
    return { inReview, approved, total };
  }, [submissions]);

  return (
    <div className="min-h-screen bg-poliscai-light">
      <AppHeader />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-serif font-bold text-poliscai-dark mb-2">
            Community Review
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Review and vote on submitted shadow flags. When a submission reaches 75% approval
            with at least 10 votes, it becomes part of the canon.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-poliscai-dark">{stats.inReview}</span> pending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-poliscai-dark">{stats.approved}</span> approved
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-poliscai-dark">{stats.total}</span> total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterStatus('in_review')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filterStatus === 'in_review'
                      ? 'bg-white text-poliscai-dark shadow-sm'
                      : 'text-gray-600 hover:text-poliscai-dark'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filterStatus === 'approved'
                      ? 'bg-white text-poliscai-dark shadow-sm'
                      : 'text-gray-600 hover:text-poliscai-dark'
                  }`}
                >
                  Approved
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => setFilterStatus('mine')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      filterStatus === 'mine'
                        ? 'bg-white text-poliscai-dark shadow-sm'
                        : 'text-gray-600 hover:text-poliscai-dark'
                    }`}
                  >
                    My Submissions
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-poliscai-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-poliscai-primary animate-spin mb-4" />
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadSubmissions}
              className="px-4 py-2 bg-poliscai-primary text-white rounded-lg hover:bg-poliscai-primary/90"
            >
              Try Again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No submissions found</p>
            <p className="text-gray-400 text-sm">
              {filterStatus === 'mine'
                ? "You haven't submitted any flags yet"
                : searchTerm
                ? 'Try a different search term'
                : 'Be the first to flag an ambiguity!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onVoteSuccess={loadSubmissions}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Review;
