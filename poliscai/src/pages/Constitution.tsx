/**
 * Constitution Viewer Page
 * PoliScai - Democracy V2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui';
import {
  ALL_ARTICLES,
  ARTICLE_METADATA,
  ALL_AMENDMENTS,
  AMENDMENT_METADATA
} from '../data';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  FileText,
  Scale,
  ArrowLeft,
  X,
} from 'lucide-react';

// Types for our data
interface ClauseData {
  id: string;
  articleSection: string;
  title: string;
  order: number;
  originalText: string;
  ratifiedYear?: number;
}

export function Constitution() {
  const [activeTab, setActiveTab] = useState<'articles' | 'amendments'>('articles');
  const [selectedClause, setSelectedClause] = useState<ClauseData | null>(null);

  // Get clauses for current tab
  const getCurrentClauses = (): ClauseData[] => {
    if (activeTab === 'articles') {
      return ALL_ARTICLES as ClauseData[];
    }
    return ALL_AMENDMENTS as ClauseData[];
  };

  // Navigate to next/prev clause
  const navigateClause = (direction: 'prev' | 'next') => {
    if (!selectedClause) return;
    const clauses = getCurrentClauses();
    const currentIndex = clauses.findIndex(c => c.id === selectedClause.id);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < clauses.length) {
      setSelectedClause(clauses[newIndex]);
    }
  };

  // Detail view for a clause
  if (selectedClause) {
    const clauses = getCurrentClauses();
    const currentIndex = clauses.findIndex(c => c.id === selectedClause.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < clauses.length - 1;

    return (
      <div className="min-h-screen bg-poliscai-light">
        {/* Header */}
        <header className="bg-poliscai-primary text-white py-4 px-4 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSelectedClause(null)}
              className="flex items-center gap-2 text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to List
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateClause('prev')}
                disabled={!hasPrev}
                className={`p-2 rounded ${hasPrev ? 'hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-white/60">
                {currentIndex + 1} / {clauses.length}
              </span>
              <button
                onClick={() => navigateClause('next')}
                disabled={!hasNext}
                className={`p-2 rounded ${hasNext ? 'hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Clause Header */}
            <div className="bg-poliscai-primary/5 border-b border-gray-200 p-6">
              <p className="text-poliscai-secondary font-semibold text-sm uppercase tracking-wide mb-1">
                {selectedClause.articleSection}
                {(selectedClause as any).ratifiedYear && (
                  <span className="text-gray-500 ml-2">
                    (Ratified {(selectedClause as any).ratifiedYear})
                  </span>
                )}
              </p>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-poliscai-dark">
                {selectedClause.title}
              </h1>
            </div>

            {/* Original Text */}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-poliscai-primary/10 text-poliscai-primary text-xs font-semibold rounded">
                  V1.0 ORIGINAL
                </span>
              </div>
              <div className="prose prose-lg max-w-none">
                {selectedClause.originalText.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-800 leading-relaxed mb-4 font-serif">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* V2.0 Placeholder */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-gray-300 text-gray-600 text-xs font-semibold rounded">
                  V2.0 REVISION
                </span>
                <span className="text-sm text-gray-500">Coming Soon</span>
              </div>
              <p className="text-gray-500 text-sm">
                Community-authored revisions will appear here once approved.
              </p>
            </div>

            {/* Shadow Notes Placeholder */}
            <div className="border-t border-gray-200 p-6">
              <h3 className="font-semibold text-poliscai-dark mb-2">Shadow Notes</h3>
              <p className="text-gray-500 text-sm">
                No shadow notes have been submitted for this clause yet.
                Sign in to flag ambiguities in the original text.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-poliscai-light">
      {/* Header */}
      <header className="bg-poliscai-primary text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            The Constitution
          </h1>
          <p className="text-white/80 mt-2">
            V1.0 Original Text (1787) — Click any section to read
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'articles'
                  ? 'border-poliscai-primary text-poliscai-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Articles (I-VII)
            </button>
            <button
              onClick={() => setActiveTab('amendments')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'amendments'
                  ? 'border-poliscai-primary text-poliscai-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scale className="w-4 h-4 inline mr-2" />
              Amendments (1-27)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'articles' ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-poliscai-dark mb-6">
              The Seven Articles
            </h2>
            {ARTICLE_METADATA.map((article) => {
              // Get all sections for this article
              const sections = ALL_ARTICLES.filter(s =>
                s.id.startsWith(`article-${article.number}-`) || s.id === `article-${article.number}`
              ) as ClauseData[];

              return (
                <div key={article.number} className="mb-8">
                  <h3 className="text-lg font-semibold text-poliscai-primary mb-3">
                    Article {toRoman(article.number)}: {article.title}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {sections.map((section) => (
                      <Card
                        key={section.id}
                        variant="bordered"
                        className="hover:shadow-md hover:border-poliscai-primary/30 transition-all cursor-pointer"
                        onClick={() => setSelectedClause(section)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-poliscai-secondary font-medium">
                                {section.articleSection}
                              </p>
                              <h4 className="text-base font-semibold text-poliscai-dark">
                                {section.title}
                              </h4>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-poliscai-dark mb-6">
              The 27 Amendments
            </h2>

            {/* Bill of Rights */}
            <div>
              <h3 className="text-lg font-semibold text-poliscai-primary mb-4">
                Bill of Rights (1791)
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {ALL_AMENDMENTS.slice(0, 10).map((amendment) => (
                  <AmendmentCard
                    key={amendment.id}
                    amendment={amendment as ClauseData}
                    onClick={() => setSelectedClause(amendment as ClauseData)}
                  />
                ))}
              </div>
            </div>

            {/* Post-Founding */}
            <div>
              <h3 className="text-lg font-semibold text-poliscai-primary mb-4">
                Post-Founding (1795-1804)
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {ALL_AMENDMENTS.slice(10, 12).map((amendment) => (
                  <AmendmentCard
                    key={amendment.id}
                    amendment={amendment as ClauseData}
                    onClick={() => setSelectedClause(amendment as ClauseData)}
                  />
                ))}
              </div>
            </div>

            {/* Reconstruction */}
            <div>
              <h3 className="text-lg font-semibold text-poliscai-primary mb-4">
                Reconstruction (1865-1870)
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {ALL_AMENDMENTS.slice(12, 15).map((amendment) => (
                  <AmendmentCard
                    key={amendment.id}
                    amendment={amendment as ClauseData}
                    onClick={() => setSelectedClause(amendment as ClauseData)}
                  />
                ))}
              </div>
            </div>

            {/* Progressive Era */}
            <div>
              <h3 className="text-lg font-semibold text-poliscai-primary mb-4">
                Progressive Era (1913-1920)
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {ALL_AMENDMENTS.slice(15, 19).map((amendment) => (
                  <AmendmentCard
                    key={amendment.id}
                    amendment={amendment as ClauseData}
                    onClick={() => setSelectedClause(amendment as ClauseData)}
                  />
                ))}
              </div>
            </div>

            {/* Modern */}
            <div>
              <h3 className="text-lg font-semibold text-poliscai-primary mb-4">
                Modern (1933-1992)
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {ALL_AMENDMENTS.slice(19).map((amendment) => (
                  <AmendmentCard
                    key={amendment.id}
                    amendment={amendment as ClauseData}
                    onClick={() => setSelectedClause(amendment as ClauseData)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Amendment card component
function AmendmentCard({ amendment, onClick }: { amendment: ClauseData; onClick: () => void }) {
  const meta = AMENDMENT_METADATA.find(m => amendment.id === `amendment-${m.number}`);

  return (
    <Card
      variant="bordered"
      className="hover:shadow-md hover:border-poliscai-primary/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-poliscai-secondary font-medium">
              {amendment.articleSection}
              {amendment.ratifiedYear && (
                <span className="text-gray-400 ml-1">({amendment.ratifiedYear})</span>
              )}
            </p>
            <h4 className="text-base font-semibold text-poliscai-dark">
              {amendment.title}
            </h4>
            {(meta as any)?.repealed && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                Repealed
              </span>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

// Roman numeral converter
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [27, 'XXVII'], [26, 'XXVI'], [25, 'XXV'], [24, 'XXIV'], [23, 'XXIII'],
    [22, 'XXII'], [21, 'XXI'], [20, 'XX'], [19, 'XIX'], [18, 'XVIII'],
    [17, 'XVII'], [16, 'XVI'], [15, 'XV'], [14, 'XIV'], [13, 'XIII'],
    [12, 'XII'], [11, 'XI'], [10, 'X'], [9, 'IX'], [8, 'VIII'],
    [7, 'VII'], [6, 'VI'], [5, 'V'], [4, 'IV'], [3, 'III'],
    [2, 'II'], [1, 'I'],
  ];

  for (const [value, numeral] of romanNumerals) {
    if (num === value) return numeral;
  }
  return String(num);
}

export default Constitution;
