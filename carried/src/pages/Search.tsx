/**
 * Search Page with AI Narrative Generation
 * Carried - Motions carry, memory too
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ArrowLeft,
  Search as SearchIcon,
  Vote,
  Calendar,
  CheckCircle2,
  XCircle,
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
  ChevronDown,
  ExternalLink,
  Sun,
  Moon,
  Database,
  Hash,
  SortDesc,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { SegmentMatch, SegmentType, SEGMENT_TYPE_INFO } from '../types';
import { searchSegments } from '../lib/ai/search';
import { generateNarrative, NarrativeResponse } from '../lib/ai/narrative';
import { useTheme } from '../contexts/ThemeContext';

const SEGMENT_ICONS: Record<SegmentType, React.ReactNode> = {
  motion: <Vote className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
  discussion: <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
  report: <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />,
  announcement: <Megaphone className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
  public_comment: <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
  action_item: <CheckSquare className="w-4 h-4 text-red-600 dark:text-red-400" />,
  election: <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  presentation: <Presentation className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
  procedural: <Gavel className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  other: <MoreHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
};

const EXAMPLE_QUERIES = [
  'What decisions were made about parking?',
  'When did we approve the budget?',
  'What was discussed about landscaping?',
  'Any action items from last meeting?',
];

const SEGMENT_FILTERS: { type: SegmentType | 'all'; label: string }[] = [
  { type: 'all', label: 'All Types' },
  { type: 'motion', label: 'Motions' },
  { type: 'discussion', label: 'Discussions' },
  { type: 'report', label: 'Reports' },
  { type: 'action_item', label: 'Action Items' },
  { type: 'announcement', label: 'Announcements' },
];

const CONFIDENCE_DISPLAY = {
  high: { label: 'High Confidence', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800', icon: CheckCircle2 },
  medium: { label: 'Medium Confidence', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800', icon: Info },
  low: { label: 'Low Confidence', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800', icon: AlertTriangle },
  none: { label: 'No Matching Records', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800', icon: XCircle },
};

type ViewMode = 'ai' | 'list';
type SortMode = 'relevance' | 'date';

export function Search() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [groupName, setGroupName] = useState<string>('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SegmentMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [typeFilter, setTypeFilter] = useState<SegmentType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('ai');
  const [sortMode, setSortMode] = useState<SortMode>('relevance');
  const [narrative, setNarrative] = useState<NarrativeResponse | null>(null);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch group name
  useEffect(() => {
    async function fetchGroupName() {
      if (!groupId) {
        setGroupName('All Groups');
        return;
      }
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          setGroupName(groupDoc.data().name || 'Unknown Group');
        }
      } catch (error) {
        console.error('CARRIED_DEBUG: Error fetching group:', error);
      }
    }
    fetchGroupName();
  }, [groupId]);

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (sortMode === 'date') {
      const dateA = a.meetingDate?.toDate?.() || new Date(0);
      const dateB = b.meetingDate?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    }
    return b.score - a.score; // Highest relevance first
  });

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setSearching(true);
    setHasSearched(true);
    setNarrative(null);
    setExpandedId(null);

    try {
      const types = typeFilter === 'all' ? undefined : [typeFilter];
      const searchResult = await searchSegments(searchQuery, {
        groupId,
        limit: 20,
        minScore: 0.15,
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Top Bar: Back + Theme Toggle */}
        <div className="flex items-center justify-between mb-6">
          {groupId ? (
            <button
              onClick={() => navigate(`/groups/${groupId}`)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Group
            </button>
          ) : (
            <div />
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Light</span>
              </>
            )}
          </button>
        </div>

        {/* Search Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Search {groupName && groupName !== 'All Groups' ? `${groupName}'s` : 'Meeting'} Records
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
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
              className="w-full pl-12 pr-32 py-4 text-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
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

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {SEGMENT_FILTERS.map((filter) => (
              <button
                key={filter.type}
                onClick={() => handleFilterChange(filter.type)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  typeFilter === filter.type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* View Mode & Sort */}
          <div className="flex items-center gap-2">
            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-1">
              <button
                onClick={() => setSortMode('relevance')}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                  sortMode === 'relevance' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                title="Sort by relevance"
              >
                <SortDesc className="w-3 h-3" />
                Relevance
              </button>
              <button
                onClick={() => setSortMode('date')}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                  sortMode === 'date' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                title="Sort by date"
              >
                <Calendar className="w-3 h-3" />
                Date
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('ai')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <Bot className="w-4 h-4" />
                AI Answer
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Example Queries */}
        {!hasSearched && (
          <div className="mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Trust Maxims */}
            <Card className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-emerald-800 dark:text-emerald-300 mb-2">AI Truth Guarantee</h3>
                  <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                    <li>1. AI only uses information from your meeting records</li>
                    <li>2. All facts include source citations (meeting + date)</li>
                    <li>3. If info isn't in the records, AI says "not found"</li>
                    <li>4. No guessing, no hallucinations, no invented facts</li>
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
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">{results.length}</span> source{results.length !== 1 ? 's' : ''} found for "{query}"
                <span className="text-gray-400 dark:text-gray-500 ml-2">({searchTime}ms)</span>
              </p>
              {results.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Sorted by {sortMode === 'relevance' ? 'relevance score' : 'date (newest first)'}
                </p>
              )}
            </div>

            {/* AI Answer View */}
            {viewMode === 'ai' && (
              <div className="mb-6">
                {generatingNarrative ? (
                  <Card className="p-6 bg-white dark:bg-slate-800">
                    <Loading size="md" text="AI is analyzing your meeting records..." />
                  </Card>
                ) : narrative ? (
                  <Card className="p-6 bg-white dark:bg-slate-800">
                    {/* Confidence Indicator */}
                    <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border ${CONFIDENCE_DISPLAY[narrative.confidence].bg}`}>
                      <ConfidenceIcon className={`w-4 h-4 ${CONFIDENCE_DISPLAY[narrative.confidence].color}`} />
                      <span className={`text-sm font-medium ${CONFIDENCE_DISPLAY[narrative.confidence].color}`}>
                        {CONFIDENCE_DISPLAY[narrative.confidence].label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        Based on {narrative.sourcesUsed.length} source{narrative.sourcesUsed.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* AI Answer */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {narrative.answer}
                        </p>
                      </div>
                    </div>

                    {/* Sources */}
                    {narrative.sourcesUsed.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5" />
                          Sources Referenced
                          <span className="text-gray-400 dark:text-gray-500 font-normal normal-case ml-1">(click to expand)</span>
                        </h4>
                        <div className="space-y-2">
                          {narrative.sourcesUsed.map((source, idx) => {
                            const matchingResult = results.find(r => r.segmentId === source.segmentId);
                            const isSourceExpanded = expandedId === source.segmentId;

                            return (
                              <div key={idx}>
                                <button
                                  onClick={() => setExpandedId(isSourceExpanded ? null : source.segmentId)}
                                  className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1.5 -mx-2 rounded-lg transition-colors w-full text-left group ${isSourceExpanded ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''}`}
                                >
                                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="font-medium">{idx + 1}.</span>
                                  {SEGMENT_ICONS[source.type as SegmentType]}
                                  <span className="font-medium truncate">{source.meetingTitle}</span>
                                  <span className="text-gray-400 dark:text-gray-500">•</span>
                                  <span className="text-gray-500 dark:text-gray-400">{source.meetingDate}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 flex-shrink-0 transition-transform ml-auto ${isSourceExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                                </button>

                                {isSourceExpanded && matchingResult && (
                                  <div className="mt-2 ml-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                                    <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{source.title}</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-3">
                                      {matchingResult.segment.content}
                                    </p>
                                    {matchingResult.segment.context && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">{matchingResult.segment.context}</p>
                                    )}
                                    <Link
                                      to={`/groups/${groupId}/meetings/${source.meetingId}`}
                                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View full meeting
                                    </Link>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {narrative.error && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                        {narrative.error}
                      </div>
                    )}
                  </Card>
                ) : results.length === 0 ? (
                  <Card className="p-8 text-center bg-white dark:bg-slate-800">
                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">No matching records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
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
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Source Documents ({sortedResults.length})
                  </h3>
                )}
                {results.length === 0 ? (
                  <Card className="p-8 text-center bg-white dark:bg-slate-800">
                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">No matches found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Try rephrasing your question or searching for different terms.
                      {typeFilter !== 'all' && (
                        <span className="block mt-1">
                          You're filtering by "{SEGMENT_TYPE_INFO[typeFilter]?.label}". Try "All Types" to see more results.
                        </span>
                      )}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {sortedResults.map((result, index) => {
                      const isExpanded = expandedId === result.segmentId;
                      return (
                        <Card
                          key={result.segmentId}
                          className={`cursor-pointer transition-all bg-white dark:bg-slate-800 ${isExpanded ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-600'}`}
                          onClick={() => setExpandedId(isExpanded ? null : result.segmentId)}
                        >
                          {/* Header */}
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Number Badge */}
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {index + 1}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {/* Type Badge */}
                                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                    result.segment.type === 'motion' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                                    result.segment.type === 'discussion' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' :
                                    result.segment.type === 'report' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                                    result.segment.type === 'action_item' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {SEGMENT_ICONS[result.segment.type]}
                                    {SEGMENT_TYPE_INFO[result.segment.type]?.label || result.segment.type}
                                  </span>

                                  {/* Outcome for motions */}
                                  {result.segment.type === 'motion' && result.segment.outcome && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      result.segment.outcome === 'carried' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                                      result.segment.outcome === 'defeated' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                      {result.segment.outcome.charAt(0).toUpperCase() + result.segment.outcome.slice(1)}
                                    </span>
                                  )}

                                  {/* Match Score */}
                                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium ml-auto">
                                    {(result.score * 100).toFixed(0)}% match
                                  </span>
                                </div>

                                {/* Title */}
                                <h3 className={`font-medium mb-1 transition-colors ${isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {result.segment.title}
                                </h3>

                                {/* Preview (collapsed) */}
                                {!isExpanded && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{result.segment.content}</p>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {result.meetingDate?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                                  </div>
                                  {result.meetingTitle && (
                                    <>
                                      <span className="text-gray-300 dark:text-gray-600">|</span>
                                      <span className="truncate">{result.meetingTitle}</span>
                                    </>
                                  )}
                                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30 p-4">
                              {/* Full Content */}
                              <div className="mb-4">
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Full Content</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {result.segment.content}
                                </p>
                              </div>

                              {/* Context */}
                              {result.segment.context && (
                                <div className="mb-4">
                                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Context</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">{result.segment.context}</p>
                                </div>
                              )}

                              {/* Motion Details */}
                              {result.segment.type === 'motion' && (
                                <div className="mb-4 grid grid-cols-2 gap-4">
                                  {result.segment.movedBy && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Moved by:</span>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.segment.movedBy}</p>
                                    </div>
                                  )}
                                  {result.segment.secondedBy && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Seconded by:</span>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.segment.secondedBy}</p>
                                    </div>
                                  )}
                                  {result.segment.voteCount && (
                                    <div className="col-span-2">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vote Count:</span>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {result.segment.voteCount.yea} Yea, {result.segment.voteCount.nay} Nay
                                        {result.segment.voteCount.abstain ? `, ${result.segment.voteCount.abstain} Abstain` : ''}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Item Details */}
                              {result.segment.type === 'action_item' && (
                                <div className="mb-4 grid grid-cols-2 gap-4">
                                  {result.segment.assignedTo && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Assigned to:</span>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.segment.assignedTo}</p>
                                    </div>
                                  )}
                                  {result.segment.dueDate && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Due date:</span>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.segment.dueDate}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tags */}
                              {result.segment.tags && result.segment.tags.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tags</h4>
                                  <div className="flex gap-2 flex-wrap">
                                    {result.segment.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-xs px-2 py-1 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-600 dark:text-gray-300 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Link to Meeting */}
                              <div className="pt-3 border-t border-gray-200 dark:border-slate-600">
                                <Link
                                  to={`/groups/${groupId}/meetings/${result.meetingId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View full meeting minutes
                                </Link>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
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
