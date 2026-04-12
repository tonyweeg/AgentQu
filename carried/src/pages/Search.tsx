/**
 * Search Page with AI Narrative Generation
 * Carried - Motions carry, memory too
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search as SearchIcon,
  Sparkles,
  Vote,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  MessageSquare,
  FileText,
  Megaphone,
  Users,
  CheckSquare,
  Award,
  Presentation,
  Gavel,
  MoreHorizontal,
  Filter,
  Bot,
  List,
  ShieldCheck,
  AlertTriangle,
  Info,
  Quote,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { SegmentMatch, SegmentType, MotionOutcome, SEGMENT_TYPE_INFO } from '../types';
import { searchSegments } from '../lib/ai/search';
import { generateNarrative, NarrativeResponse } from '../lib/ai/narrative';

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

const EXAMPLE_QUERIES = [
  'What decisions were made about parking?',
  'When did we approve the budget?',
  'What was discussed about landscaping?',
  'Any action items from last meeting?',
  'What reports were given this year?',
];

const SEGMENT_FILTERS: { type: SegmentType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'motion', label: 'Motions' },
  { type: 'discussion', label: 'Discussions' },
  { type: 'report', label: 'Reports' },
  { type: 'action_item', label: 'Action Items' },
  { type: 'announcement', label: 'Announcements' },
];

const CONFIDENCE_DISPLAY = {
  high: { label: 'High Confidence', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  medium: { label: 'Medium Confidence', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: Info },
  low: { label: 'Low Confidence', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle },
  none: { label: 'No Matching Records', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

type ViewMode = 'ai' | 'list';

export function Search() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SegmentMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [typeFilter, setTypeFilter] = useState<SegmentType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('ai');
  const [narrative, setNarrative] = useState<NarrativeResponse | null>(null);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setSearching(true);
    setHasSearched(true);
    setNarrative(null);

    try {
      const types = typeFilter === 'all' ? undefined : [typeFilter];
      const searchResult = await searchSegments(searchQuery, {
        groupId,
        limit: 20,
        minScore: 0.15, // Lower threshold to get more context for AI
        types,
      });

      setResults(searchResult.results);
      setSearchTime(searchResult.searchTime);

      // Auto-generate narrative if in AI mode and we have results
      if (viewMode === 'ai' && searchResult.results.length > 0) {
        setGeneratingNarrative(true);
        try {
          const segments = searchResult.results.map(r => r.segment);
          const meetingContext = searchResult.results.map(r => ({
            meetingId: r.meetingId,
            meetingTitle: r.meetingTitle,
            meetingDate: r.meetingDate?.toDate?.() || r.meetingDate || new Date(),
          }));

          const narrativeResult = await generateNarrative({
            question: searchQuery,
            segments,
            meetingContext,
          });
          setNarrative(narrativeResult);
        } catch (error) {
          console.error('CARRIED_DEBUG: Narrative generation error:', error);
        } finally {
          setGeneratingNarrative(false);
        }
      }
    } catch (error) {
      console.error('CARRIED_DEBUG: Search error:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleFilterChange = (filter: SegmentType | 'all') => {
    setTypeFilter(filter);
    if (hasSearched && query) {
      handleSearch(query);
    }
  };

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode);
    // If switching to AI mode and we have results but no narrative, generate it
    if (mode === 'ai' && results.length > 0 && !narrative && !generatingNarrative) {
      setGeneratingNarrative(true);
      try {
        const segments = results.map(r => r.segment);
        const meetingContext = results.map(r => ({
          meetingId: r.meetingId,
          meetingTitle: r.meetingTitle,
          meetingDate: r.meetingDate?.toDate?.() || r.meetingDate || new Date(),
        }));

        const narrativeResult = await generateNarrative({
          question: query,
          segments,
          meetingContext,
        });
        setNarrative(narrativeResult);
      } catch (error) {
        console.error('CARRIED_DEBUG: Narrative generation error:', error);
      } finally {
        setGeneratingNarrative(false);
      }
    }
  };

  const ConfidenceIcon = narrative ? CONFIDENCE_DISPLAY[narrative.confidence].icon : Info;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        {groupId && (
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Group
          </button>
        )}

        {/* Search Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Meeting History</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Ask questions in natural language. AI will answer based only on your meeting records.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about past decisions, discussions, reports..."
              className="w-full pl-12 pr-32 py-4 text-lg text-gray-900 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <Button
              type="submit"
              disabled={!query.trim() || searching}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {SEGMENT_FILTERS.map((filter) => (
              <button
                key={filter.type}
                onClick={() => handleFilterChange(filter.type)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  typeFilter === filter.type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Answer
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        {/* Example Queries */}
        {!hasSearched && (
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-3 text-center">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Trust Maxims */}
            <Card className="mt-8 p-4 bg-emerald-50 border-emerald-200">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-emerald-800 mb-2">AI Truth Guarantee</h3>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• AI only uses information from your meeting records</li>
                    <li>• All facts include source citations (meeting + date)</li>
                    <li>• If info isn't in the records, AI says "not found"</li>
                    <li>• No guessing, no hallucinations, no invented facts</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Results */}
        {searching ? (
          <div className="py-20">
            <Loading size="lg" text="Searching your meeting history..." />
          </div>
        ) : hasSearched ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {results.length} source{results.length !== 1 ? 's' : ''} found for "{query}"
              <span className="text-gray-400 ml-2">({searchTime}ms)</span>
            </p>

            {/* AI Answer View */}
            {viewMode === 'ai' && (
              <div className="mb-6">
                {generatingNarrative ? (
                  <Card className="p-6">
                    <Loading size="md" text="AI is analyzing your meeting records..." />
                  </Card>
                ) : narrative ? (
                  <Card className="p-6">
                    {/* Confidence Indicator */}
                    <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border ${CONFIDENCE_DISPLAY[narrative.confidence].bg}`}>
                      <ConfidenceIcon className={`w-4 h-4 ${CONFIDENCE_DISPLAY[narrative.confidence].color}`} />
                      <span className={`text-sm font-medium ${CONFIDENCE_DISPLAY[narrative.confidence].color}`}>
                        {CONFIDENCE_DISPLAY[narrative.confidence].label}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        Based on {narrative.sourcesUsed.length} source{narrative.sourcesUsed.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* AI Answer */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {narrative.answer}
                        </p>
                      </div>
                    </div>

                    {/* Sources */}
                    {narrative.sourcesUsed.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5" />
                          Sources Referenced
                        </h4>
                        <div className="space-y-2">
                          {narrative.sourcesUsed.map((source, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              {SEGMENT_ICONS[source.type as SegmentType]}
                              <span className="font-medium">{source.meetingTitle}</span>
                              <span className="text-gray-400">•</span>
                              <span>{source.meetingDate}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500 truncate">{source.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {narrative.error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {narrative.error}
                      </div>
                    )}
                  </Card>
                ) : results.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-700 mb-2">No matching records found</h3>
                    <p className="text-gray-500 text-sm">
                      Try rephrasing your question or searching for different terms.
                    </p>
                  </Card>
                ) : null}
              </div>
            )}

            {/* List View */}
            {(viewMode === 'list' || (viewMode === 'ai' && results.length > 0)) && (
              <div>
                {viewMode === 'ai' && results.length > 0 && (
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Source Documents</h3>
                )}
                {results.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-700 mb-2">No matches found</h3>
                    <p className="text-gray-500 text-sm">
                      Try rephrasing your question or searching for different terms.
                      {typeFilter !== 'all' && (
                        <span className="block mt-1">
                          You're filtering by "{SEGMENT_TYPE_INFO[typeFilter]?.label}". Try "All" to see more results.
                        </span>
                      )}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {results.map((result) => (
                      <Card key={result.segmentId} className="p-5">
                        <div className="flex items-start gap-4">
                          {result.segment.type === 'motion' && result.segment.outcome && result.segment.outcome in OUTCOME_ICONS
                            ? OUTCOME_ICONS[result.segment.outcome as MotionOutcome]
                            : SEGMENT_ICONS[result.segment.type]}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                result.segment.type === 'motion' ? 'bg-blue-100 text-blue-700' :
                                result.segment.type === 'discussion' ? 'bg-purple-100 text-purple-700' :
                                result.segment.type === 'report' ? 'bg-green-100 text-green-700' :
                                result.segment.type === 'action_item' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {SEGMENT_TYPE_INFO[result.segment.type]?.label || result.segment.type}
                              </span>
                              {result.segment.type === 'motion' && result.segment.outcome && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  result.segment.outcome === 'carried' ? 'bg-green-100 text-green-700' :
                                  result.segment.outcome === 'defeated' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {result.segment.outcome.charAt(0).toUpperCase() + result.segment.outcome.slice(1)}
                                </span>
                              )}
                              <span className="text-xs text-indigo-600 font-medium ml-auto">
                                {(result.score * 100).toFixed(0)}% match
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">{result.segment.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-3">{result.segment.content}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {result.meetingDate?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                              </div>
                              {result.meetingTitle && (
                                <span className="truncate">{result.meetingTitle}</span>
                              )}
                            </div>
                            {result.segment.tags && result.segment.tags.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {result.segment.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Search;
