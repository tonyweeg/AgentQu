/**
 * Constitution V2 Page - Side by Side Viewer
 * PoliScai - Democracy V2.0
 *
 * Main constitution viewing page with V1.0/V2.0 side-by-side display
 * Supports deep linking: /constitution/article-1-section-2
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader';
import { ClauseSelector } from '../components/constitution/ClauseSelector';
import { SideBySideViewer } from '../components/constitution/SideBySideViewer';
import { ALL_ARTICLES, ALL_AMENDMENTS } from '../data';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  BookOpen,
  Users,
  Sparkles,
  Share2,
  Check,
  Link2,
} from 'lucide-react';

// Combine all clauses for lookup
const ALL_CLAUSES = [...ALL_ARTICLES, ...ALL_AMENDMENTS];

// Default clause if none specified
const DEFAULT_CLAUSE_ID = 'article-1-section-2';

// Create short navigation label from clause
const getShortLabel = (clause: typeof ALL_CLAUSES[0]): string => {
  if (clause.articleSection.includes('Amendment')) {
    return clause.articleSection.replace('Amendment ', 'Amend. ');
  }
  const match = clause.articleSection.match(/Article (\w+), Section (\d+)/);
  if (match) {
    return `Art. ${match[1]}, §${match[2]}`;
  }
  return clause.articleSection;
};

// Shadow annotations with correct indices
const DEMO_SHADOWS: Record<string, any[]> = {
  'article-1-section-2': [
    {
      id: 'shadow-1',
      text: 'Members',
      startIndex: 50,
      endIndex: 57,
      description: '"Members" in 1787 implicitly excluded women, enslaved persons, Indigenous peoples, and those without property from holding office.',
      type: 'gender_assumption',
    },
    {
      id: 'shadow-2',
      text: 'People',
      startIndex: 90,
      endIndex: 96,
      description: '"People" was operationally defined to exclude the majority of the population from political participation.',
      type: 'racial_exclusion',
    },
    {
      id: 'shadow-3',
      text: 'Electors',
      startIndex: 128,
      endIndex: 136,
      description: '"Electors" referred only to propertied white males in most states, excluding most adults.',
      type: 'economic_exclusion',
    },
  ],
};

// V2.0 revisions
const DEMO_REVISIONS: Record<string, string> = {
  'article-1-section-2': `The House of Representatives shall be composed of Representatives chosen every second Year by the eligible persons of the several States. Eligibility is defined without distinction of gender, race, origin, economic standing, or any characteristic unrelated to citizenship status as defined in Article I, Section 1.`,
};

export function ConstitutionV2() {
  const { clauseId: urlClauseId } = useParams<{ clauseId?: string }>();
  const navigate = useNavigate();

  // Determine initial clause from URL or default
  const initialClauseId = useMemo(() => {
    if (urlClauseId && ALL_CLAUSES.find(c => c.id === urlClauseId)) {
      return urlClauseId;
    }
    return DEFAULT_CLAUSE_ID;
  }, [urlClauseId]);

  const [selectedClauseId, setSelectedClauseId] = useState(initialClauseId);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Sync URL with selected clause
  useEffect(() => {
    // Only update URL if it differs from current selection
    if (urlClauseId !== selectedClauseId) {
      navigate(`/constitution/${selectedClauseId}`, { replace: true });
    }
  }, [selectedClauseId, urlClauseId, navigate]);

  // Update state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (urlClauseId && urlClauseId !== selectedClauseId) {
      const clause = ALL_CLAUSES.find(c => c.id === urlClauseId);
      if (clause) {
        setSelectedClauseId(urlClauseId);
      }
    }
  }, [urlClauseId, selectedClauseId]);

  const selectedClause = useMemo(() => {
    return ALL_CLAUSES.find((c) => c.id === selectedClauseId);
  }, [selectedClauseId]);

  const currentIndex = useMemo(() => {
    return ALL_CLAUSES.findIndex((c) => c.id === selectedClauseId);
  }, [selectedClauseId]);

  const prevClause = currentIndex > 0 ? ALL_CLAUSES[currentIndex - 1] : null;
  const nextClause = currentIndex < ALL_CLAUSES.length - 1 ? ALL_CLAUSES[currentIndex + 1] : null;

  const navigateTo = (clauseId: string) => {
    setSelectedClauseId(clauseId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmissionSuccess = () => {
    console.log('POLISCAI_DEBUG: Flag submission successful');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  // Copy shareable link to clipboard
  const handleShare = async () => {
    const url = `${window.location.origin}/constitution/${selectedClauseId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (!selectedClause) {
    return (
      <div className="min-h-screen bg-poliscai-light">
        <AppHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Clause not found</p>
            <button
              onClick={() => navigate('/constitution/' + DEFAULT_CLAUSE_ID)}
              className="px-4 py-2 bg-poliscai-primary text-white rounded-lg hover:bg-poliscai-primary/90"
            >
              Go to Article I, Section 2
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-poliscai-light to-white">
      <AppHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-poliscai-primary via-poliscai-primary to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-poliscai-secondary" />
                  Constitution V2.0
                </h1>
                <p className="text-white/70 mt-1">
                  Community-driven constitutional scholarship
                </p>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20"
                title="Copy link to this clause"
              >
                {showCopiedToast ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </>
                )}
              </button>
            </div>

            {/* Clause Selector */}
            <ClauseSelector
              selectedId={selectedClauseId}
              onSelect={setSelectedClauseId}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="w-1/3">
            {prevClause ? (
              <button
                onClick={() => navigateTo(prevClause.id)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-poliscai-primary/5 transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-poliscai-primary" />
                <div className="text-left hidden sm:block">
                  <p className="text-xs text-gray-500">Previous</p>
                  <p className="text-sm font-medium text-poliscai-dark">{getShortLabel(prevClause)}</p>
                </div>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="w-1/3 text-center">
            <div className="inline-block">
              <p className="text-lg font-serif font-bold text-poliscai-dark">{selectedClause.articleSection}</p>
              <p className="text-sm text-gray-500">{selectedClause.title}</p>
            </div>
          </div>

          <div className="w-1/3 flex justify-end">
            {nextClause ? (
              <button
                onClick={() => navigateTo(nextClause.id)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-poliscai-primary/5 transition-all"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500">Next</p>
                  <p className="text-sm font-medium text-poliscai-dark">{getShortLabel(nextClause)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-poliscai-primary" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </nav>

        <SideBySideViewer
          clauseId={selectedClause.id}
          articleSection={selectedClause.articleSection}
          title={selectedClause.title}
          originalText={selectedClause.originalText}
          revisedText={DEMO_REVISIONS[selectedClauseId]}
          shadowAnnotations={DEMO_SHADOWS[selectedClauseId] || []}
          onSubmissionSuccess={handleSubmissionSuccess}
        />

        {/* Navigation */}
        <nav className="flex items-center justify-between mt-8 py-6 border-t border-gray-200">
          <div className="w-1/3">
            {prevClause && (
              <button
                onClick={() => navigateTo(prevClause.id)}
                className="group flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-poliscai-primary/5 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-poliscai-primary/10 flex items-center justify-center group-hover:bg-poliscai-primary group-hover:text-white transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Previous</p>
                  <p className="text-sm font-medium text-poliscai-dark">{getShortLabel(prevClause)}</p>
                </div>
              </button>
            )}
          </div>

          <div className="w-1/3 text-center flex justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-sm font-medium text-gray-700">
                {currentIndex + 1}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-500">
                {ALL_CLAUSES.length}
              </span>
            </div>

            {/* Mobile share button */}
            <button
              onClick={handleShare}
              className="md:hidden flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-poliscai-primary/10 transition-colors"
              title="Copy link to this clause"
            >
              {showCopiedToast ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Link2 className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          <div className="w-1/3 flex justify-end">
            {nextClause && (
              <button
                onClick={() => navigateTo(nextClause.id)}
                className="group flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-poliscai-primary/5 transition-all"
              >
                <div className="text-right">
                  <p className="text-xs text-gray-500">Next</p>
                  <p className="text-sm font-medium text-poliscai-dark">{getShortLabel(nextClause)}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-poliscai-primary/10 flex items-center justify-center group-hover:bg-poliscai-primary group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>
        </nav>

        {/* Info Cards */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {/* About this clause */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-poliscai-primary to-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">About This Clause</h3>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Section</dt>
                <dd className="font-medium text-poliscai-dark">{selectedClause.articleSection}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Title</dt>
                <dd className="font-medium text-poliscai-dark">{selectedClause.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Direct Link</dt>
                <dd className="text-xs text-poliscai-primary break-all">
                  /constitution/{selectedClauseId}
                </dd>
              </div>
            </dl>
          </div>

          {/* Community Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Community Input</h3>
            </div>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500">Flagged Biases</dt>
                <dd className="font-bold text-red-600">{DEMO_SHADOWS[selectedClauseId]?.length || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500">V2.0 Status</dt>
                <dd>
                  {DEMO_REVISIONS[selectedClauseId] ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Draft Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Awaiting
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* How to contribute */}
          <div className="bg-gradient-to-br from-poliscai-secondary/10 to-amber-50 rounded-2xl border border-poliscai-secondary/20 p-6 shadow-sm card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-poliscai-secondary to-amber-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">How to Contribute</h3>
            </div>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-poliscai-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Select biased text in Shadow panel</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-poliscai-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Click "Flag as bias" to submit</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-poliscai-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>75% community approval adds to canon</span>
              </li>
            </ol>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Flag Submitted!</p>
              <p className="text-sm text-green-100">
                Now in community review
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Copied Toast (centered bottom) */}
      {showCopiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm">Link copied to clipboard!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConstitutionV2;
