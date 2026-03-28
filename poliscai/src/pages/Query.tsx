/**
 * Query Page - AI Constitutional Analysis
 * PoliScai - Democracy V2.0
 *
 * Ask questions about constitutionality and get AI-powered analysis
 */

import React, { useState, useEffect } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { analyzeConstitutionality, QueryResponse, isGeminiAvailable } from '../lib/ai/gemini';
import { saveQuery, getRecentQueries, ConstitutionalQuery } from '../lib/firestore/queries';
import {
  Search,
  Loader2,
  Scale,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  History,
  Sparkles,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

const VERDICT_CONFIG = {
  constitutional: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Constitutional',
  },
  partial: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Partially Constitutional',
  },
  unconstitutional: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Unconstitutional',
  },
  ambiguous: {
    icon: HelpCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Ambiguous',
  },
};

const EXAMPLE_QUERIES = [
  'Is a federal ban on assault weapons constitutional?',
  'Can states restrict voting rights for felons?',
  'Is the Electoral College constitutional?',
  'Can the President declare war without Congress?',
];

export function Query() {
  const { user } = useAuth();
  const [queryText, setQueryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [recentQueries, setRecentQueries] = useState<ConstitutionalQuery[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load recent queries on mount
  useEffect(() => {
    async function loadRecent() {
      try {
        const recent = await getRecentQueries(5);
        setRecentQueries(recent);
      } catch (err) {
        console.error('POLISCAI_DEBUG: Error loading recent queries:', err);
      }
    }
    loadRecent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!queryText.trim()) return;
    if (!isGeminiAvailable()) {
      setError('AI service not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await analyzeConstitutionality(queryText);
      setResponse(result);

      // Save to Firestore
      await saveQuery({
        queryText,
        response: result,
        userId: user?.uid,
        userDisplayName: user?.displayName || undefined,
        isPublic: true,
      });

      // Refresh recent queries
      const recent = await getRecentQueries(5);
      setRecentQueries(recent);
    } catch (err: any) {
      console.error('POLISCAI_DEBUG: Query error:', err);
      setError(err.message || 'Failed to analyze query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQueryText(example);
    setResponse(null);
    setError(null);
  };

  const verdictConfig = response ? VERDICT_CONFIG[response.verdict] : null;
  const VerdictIcon = verdictConfig?.icon || HelpCircle;

  return (
    <div className="min-h-screen bg-poliscai-light">
      <AppHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-poliscai-primary to-poliscai-primary/90 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="w-8 h-8" />
            <h1 className="text-3xl font-serif font-bold">Constitutional Query</h1>
          </div>
          <p className="text-white/80 max-w-2xl mx-auto">
            Ask any question about constitutionality and receive AI-powered analysis
            with references to relevant amendments, cases, and historical context.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-white/60">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Gemini 2.5 Pro</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Query Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Constitutional Question
              </label>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Is [specific law, action, or policy] constitutional?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-poliscai-primary focus:border-transparent resize-none text-lg"
              />
            </div>

            {/* Example Queries */}
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-poliscai-primary/10 hover:text-poliscai-primary transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-poliscai-primary transition-colors"
              >
                <History className="w-4 h-4" />
                Recent Queries
              </button>
              <button
                type="submit"
                disabled={isLoading || !queryText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-poliscai-primary text-white rounded-lg hover:bg-poliscai-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Recent Queries Dropdown */}
        {showHistory && recentQueries.length > 0 && (
          <div className="mb-8 bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Public Queries
            </h3>
            <div className="space-y-2">
              {recentQueries.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleExampleClick(q.queryText)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-poliscai-primary/5 transition-colors"
                >
                  <p className="text-sm text-gray-800 line-clamp-1">{q.queryText}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Verdict: {VERDICT_CONFIG[q.verdict].label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Response */}
        {response && verdictConfig && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Verdict Banner */}
            <div className={`px-6 py-4 ${verdictConfig.bg} ${verdictConfig.border} border-b`}>
              <div className="flex items-center gap-3">
                <VerdictIcon className={`w-8 h-8 ${verdictConfig.color}`} />
                <div>
                  <p className="text-sm text-gray-600">Verdict</p>
                  <p className={`text-xl font-bold ${verdictConfig.color}`}>
                    {verdictConfig.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-poliscai-dark mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Analysis
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {response.analysis.split('\n').map((para, i) => (
                  <p key={i} className="mb-3">{para}</p>
                ))}
              </div>
            </div>

            {/* Shadow Notes */}
            {response.shadowNotes.length > 0 && (
              <div className="px-6 py-4 bg-red-50/50 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Shadow Notes
                </h4>
                <ul className="space-y-1">
                  {response.shadowNotes.map((note, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key References */}
            {response.keyReferences.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Key References
                </h4>
                <ul className="space-y-1">
                  {response.keyReferences.map((ref, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="px-6 py-3 bg-poliscai-primary/5 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                This analysis is AI-generated for educational purposes and should not be considered legal advice.
                Consult a constitutional law expert for authoritative interpretations.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!response && !isLoading && !error && (
          <div className="text-center py-12">
            <Scale className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">
              Enter a question above to receive constitutional analysis
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Query;
