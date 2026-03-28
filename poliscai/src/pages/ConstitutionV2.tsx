/**
 * Constitution V2 Page - Side by Side Viewer
 * PoliScai - Democracy V2.0
 *
 * Main constitution viewing page with V1.0/V2.0 side-by-side display
 */

import React, { useState, useMemo } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { ClauseSelector } from '../components/constitution/ClauseSelector';
import { Legend } from '../components/constitution/Legend';
import { SideBySideViewer } from '../components/constitution/SideBySideViewer';
import { ALL_ARTICLES, ALL_AMENDMENTS } from '../data';
import { ChevronDown, CheckCircle, X } from 'lucide-react';

// Combine all clauses for lookup
const ALL_CLAUSES = [...ALL_ARTICLES, ...ALL_AMENDMENTS];

// Example shadow annotations for demo (Article I, Section 2)
const DEMO_SHADOWS: Record<string, any[]> = {
  'article-1-section-2': [
    {
      id: 'shadow-1',
      text: 'Members',
      startIndex: 47,
      endIndex: 54,
      description: '"Members" in 1787 implicitly excluded women, enslaved persons, Indigenous peoples, and those without property.',
      type: 'gender_assumption',
    },
    {
      id: 'shadow-2',
      text: 'People',
      startIndex: 93,
      endIndex: 99,
      description: '"People" was operationally defined to exclude the majority of the population.',
      type: 'racial_exclusion',
    },
    {
      id: 'shadow-3',
      text: 'Electors',
      startIndex: 128,
      endIndex: 136,
      description: '"Electors" referred only to propertied white males in most states.',
      type: 'economic_exclusion',
    },
  ],
};

// Example V2.0 revisions for demo
const DEMO_REVISIONS: Record<string, string> = {
  'article-1-section-2': `The House of Representatives shall be composed of Representatives chosen every second Year by the eligible persons of the several States. Eligibility is defined without distinction of gender, race, origin, economic standing, or any characteristic unrelated to citizenship status as defined in Article I, Section 1.`,
};

export function ConstitutionV2() {
  const [selectedClauseId, setSelectedClauseId] = useState('article-1-section-2');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Get selected clause data
  const selectedClause = useMemo(() => {
    return ALL_CLAUSES.find((c) => c.id === selectedClauseId);
  }, [selectedClauseId]);

  // Handle successful flag submission
  const handleSubmissionSuccess = () => {
    console.log('POLISCAI_DEBUG: Flag submission successful');
    setShowSuccessToast(true);
    // Auto-hide toast after 5 seconds
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  if (!selectedClause) {
    return (
      <div className="min-h-screen bg-poliscai-light">
        <AppHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-gray-500">Clause not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-poliscai-light">
      <AppHeader />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Clause Selector */}
            <ClauseSelector
              selectedId={selectedClauseId}
              onSelect={setSelectedClauseId}
            />

            {/* Legend */}
            <Legend />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <SideBySideViewer
          clauseId={selectedClause.id}
          articleSection={selectedClause.articleSection}
          title={selectedClause.title}
          originalText={selectedClause.originalText}
          revisedText={DEMO_REVISIONS[selectedClauseId]}
          shadowAnnotations={DEMO_SHADOWS[selectedClauseId] || []}
          onSubmissionSuccess={handleSubmissionSuccess}
        />

        {/* Scroll indicator */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </button>
        </div>

        {/* Additional info section */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {/* About this clause */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-poliscai-dark mb-4">
              About {selectedClause.articleSection}
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Title</dt>
                <dd className="font-medium text-poliscai-dark">{selectedClause.title}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Shadow Notes</dt>
                <dd className="font-medium text-poliscai-dark">
                  {DEMO_SHADOWS[selectedClauseId]?.length || 0} approved
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">V2.0 Status</dt>
                <dd className="font-medium">
                  {DEMO_REVISIONS[selectedClauseId] ? (
                    <span className="text-green-600">Draft Available</span>
                  ) : (
                    <span className="text-gray-400">Not yet proposed</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* How to contribute */}
          <div className="bg-poliscai-primary/5 rounded-xl border border-poliscai-primary/20 p-6">
            <h3 className="text-lg font-semibold text-poliscai-dark mb-4">
              How to Contribute
            </h3>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-poliscai-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Select any text in the V1.0 panel that contains hidden assumptions or bias</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-poliscai-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Click "Flag as ambiguity" and describe the shadow you've surfaced</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-poliscai-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>The community reviews and votes — 75% approval adds it to the canon</span>
              </li>
            </ol>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-4">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Flag Submitted!</p>
              <p className="text-sm text-green-100">
                Your submission is now in community review.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConstitutionV2;
