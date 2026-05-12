/**
 * Text-Based Search Service
 * Carried - Motions carry, memory too
 *
 * Search segments using text matching (no embeddings needed)
 */

import { collection, query, where, getDocs, doc, getDoc, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { Segment, SegmentMatch, SegmentType, Meeting } from '../../types';

export interface SearchOptions {
  groupId?: string;
  limit?: number;
  minScore?: number;
  types?: SegmentType[];  // Filter by segment types
}

export interface SegmentSearchResult {
  query: string;
  results: SegmentMatch[];
  totalMatches: number;
  searchTime: number;
}

/**
 * Detect if query is asking about a specific meeting time
 */
function detectTemporalQuery(queryText: string): { type: 'last' | 'recent' | 'first' | null; meetingCount: number } {
  const lower = queryText.toLowerCase();

  if (lower.includes('last meeting') || lower.includes('previous meeting') || lower.includes('most recent meeting')) {
    return { type: 'last', meetingCount: 1 };
  }
  if (lower.includes('last two meetings') || lower.includes('last 2 meetings')) {
    return { type: 'recent', meetingCount: 2 };
  }
  if (lower.includes('last three meetings') || lower.includes('last 3 meetings')) {
    return { type: 'recent', meetingCount: 3 };
  }
  if (lower.includes('recent meetings') || lower.includes('latest meetings')) {
    return { type: 'recent', meetingCount: 3 };
  }
  if (lower.includes('first meeting') || lower.includes('earliest meeting')) {
    return { type: 'first', meetingCount: 1 };
  }

  return { type: null, meetingCount: 0 };
}

/**
 * Get the most recent meetings for a group
 */
async function getRecentMeetings(groupId: string | undefined, count: number): Promise<Meeting[]> {
  try {
    const meetingsRef = collection(db, COLLECTIONS.MEETINGS);
    let meetingsQuery;

    if (groupId) {
      meetingsQuery = query(
        meetingsRef,
        where('groupId', '==', groupId),
        orderBy('meetingDate', 'desc'),
        firestoreLimit(count)
      );
    } else {
      meetingsQuery = query(
        meetingsRef,
        orderBy('meetingDate', 'desc'),
        firestoreLimit(count)
      );
    }

    const snapshot = await getDocs(meetingsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Meeting[];
  } catch (error) {
    console.error('CARRIED_DEBUG: Error fetching recent meetings:', error);
    return [];
  }
}

/**
 * Calculate text match score with stricter relevance requirements
 */
function calculateTextScore(searchText: string, queryWords: string[], originalQuery: string): number {
  if (!searchText || queryWords.length === 0) return 0;

  const text = searchText.toLowerCase();
  let matchedWords = 0;
  let totalWeight = 0;

  // Check for exact phrase match (big bonus)
  const queryPhrase = originalQuery.toLowerCase().trim();
  if (text.includes(queryPhrase)) {
    return 1.0; // Perfect match for exact phrase
  }

  // Check for key content words (not common words like "month", "day", "awareness")
  const genericWords = ['month', 'day', 'week', 'year', 'awareness', 'recognition', 'celebration', 'proclamation', 'national', 'world', 'international'];
  const contentWords = queryWords.filter(w => !genericWords.includes(w));
  const genericQueryWords = queryWords.filter(w => genericWords.includes(w));

  // If query has specific content words, they MUST be present
  if (contentWords.length > 0) {
    let contentMatches = 0;
    for (const word of contentWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(text)) {
        contentMatches++;
        totalWeight += 3; // Heavy weight for content words
      }
    }
    // If no content words match, score is 0 (e.g., "autism" must be present)
    if (contentMatches === 0) {
      return 0;
    }
    matchedWords += contentMatches;
  }

  // Check generic words (smaller bonus)
  for (const word of genericQueryWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) {
      matchedWords++;
      totalWeight += 0.5;
    }
  }

  // Calculate final score
  const matchRatio = matchedWords / queryWords.length;
  const maxPossibleWeight = (contentWords.length * 3) + (genericQueryWords.length * 0.5);
  const weightedScore = maxPossibleWeight > 0 ? totalWeight / maxPossibleWeight : 0;

  // Require at least 50% of words to match
  if (matchRatio < 0.5) {
    return 0;
  }

  return (matchRatio + weightedScore) / 2;
}

/**
 * Search segments using text matching
 */
export async function searchSegments(
  queryText: string,
  options: SearchOptions = {}
): Promise<SegmentSearchResult> {
  const startTime = Date.now();
  const { groupId, limit = 10, minScore = 0.4, types } = options;

  try {
    // Check for temporal queries (e.g., "last meeting", "recent meetings")
    const temporalQuery = detectTemporalQuery(queryText);
    let meetingIds: string[] = [];

    if (temporalQuery.type) {
      const recentMeetings = await getRecentMeetings(groupId, temporalQuery.meetingCount);
      meetingIds = recentMeetings.map(m => m.id);
      console.log('CARRIED_DEBUG: Temporal query detected, filtering to meetings:', meetingIds);
    }

    // Prepare query words (lowercase, remove common words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'was', 'were', 'be', 'been', 'last', 'meeting', 'meetings', 'recent', 'previous', 'first'];
    const queryWords = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    // For temporal queries with no other keywords, return all segments from those meetings
    const isTemporalOnlyQuery = temporalQuery.type && queryWords.length === 0;

    // Fetch segments from Firestore
    const segmentsRef = collection(db, COLLECTIONS.SEGMENTS);
    const segmentsQuery = groupId
      ? query(segmentsRef, where('groupId', '==', groupId))
      : segmentsRef;

    const snapshot = await getDocs(segmentsQuery);
    let segments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Segment[];

    // Filter by meeting IDs if temporal query
    if (meetingIds.length > 0) {
      segments = segments.filter(s => meetingIds.includes(s.meetingId));
    }

    // Filter by segment types if specified
    if (types && types.length > 0) {
      segments = segments.filter((s) => types.includes(s.type));
    }

    // Score each segment
    const scoredSegments = segments.map((segment) => {
      // For temporal-only queries, give all segments from matching meetings a score of 1
      if (isTemporalOnlyQuery) {
        return { segment, score: 1 };
      }

      // Use searchText field if available, otherwise combine title + content
      const searchText = (segment as any).searchText ||
        `${segment.title} ${segment.content} ${(segment.tags || []).join(' ')}`.toLowerCase();

      const score = calculateTextScore(searchText, queryWords, queryText);
      return { segment, score };
    });

    // Sort by score (or by order for temporal queries) and filter by minScore
    let topMatches;
    if (isTemporalOnlyQuery) {
      // For temporal queries, sort by meeting order
      topMatches = scoredSegments
        .sort((a, b) => a.segment.order - b.segment.order)
        .slice(0, limit);
    } else {
      topMatches = scoredSegments
        .filter(({ score }) => score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    // Build results with meeting and group info
    const results: SegmentMatch[] = [];
    const meetingCache: Record<string, { title: string; date: any }> = {};
    const groupCache: Record<string, string> = {};

    for (const { segment, score } of topMatches) {
      // Fetch meeting details if not cached
      let meetingTitle = 'Meeting';
      let meetingDate = segment.createdAt;
      if (!meetingCache[segment.meetingId]) {
        try {
          const meetingDoc = await getDoc(doc(db, COLLECTIONS.MEETINGS, segment.meetingId));
          if (meetingDoc.exists()) {
            const meetingData = meetingDoc.data();
            meetingCache[segment.meetingId] = {
              title: meetingData.title || 'Meeting',
              date: meetingData.meetingDate || segment.createdAt,
            };
          }
        } catch {
          // Use defaults if fetch fails
        }
      }
      if (meetingCache[segment.meetingId]) {
        meetingTitle = meetingCache[segment.meetingId].title;
        meetingDate = meetingCache[segment.meetingId].date;
      }

      // Fetch group name if not cached
      let groupName = '';
      if (!groupCache[segment.groupId]) {
        try {
          const groupDoc = await getDoc(doc(db, COLLECTIONS.GROUPS, segment.groupId));
          if (groupDoc.exists()) {
            groupCache[segment.groupId] = groupDoc.data().name || '';
          }
        } catch {
          // Use empty string if fetch fails
        }
      }
      groupName = groupCache[segment.groupId] || '';

      results.push({
        segmentId: segment.id,
        meetingId: segment.meetingId,
        meetingTitle,
        meetingDate,
        groupId: segment.groupId,
        groupName,
        score,
        segment,
      });
    }

    return {
      query: queryText,
      results,
      totalMatches: results.length,
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('CARRIED_DEBUG: Segment search error:', error);
    return {
      query: queryText,
      results: [],
      totalMatches: 0,
      searchTime: Date.now() - startTime,
    };
  }
}
