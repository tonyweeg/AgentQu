/**
 * Narrative Generation Service
 * Carried - Motions carry, memory too
 *
 * Generate truthful narratives from meeting segments using Gemini
 *
 * MAXIMS FOR TRUTHFUL AI RESPONSES:
 * 1. ONLY cite information explicitly present in provided segments
 * 2. QUOTE directly from source material when possible
 * 3. ALWAYS include source attribution (meeting title, date)
 * 4. SAY "not found in the records" if information is not present
 * 5. NEVER extrapolate, infer, or assume beyond stated facts
 * 6. NEVER invent names, dates, numbers, or outcomes
 * 7. USE hedging language ("according to the minutes", "the record states")
 * 8. DISTINGUISH between what was proposed vs. what was decided
 * 9. IF uncertain, state the uncertainty explicitly
 * 10. PREFER "I don't have that information" over guessing
 */

import { generateText, isGeminiAvailable } from './gemini';
import { Segment } from '../../types';

const NARRATIVE_PROMPT = `You are a precise, factual assistant that ONLY reports information from official meeting records.

## ABSOLUTE RULES - NEVER VIOLATE THESE

1. **ONLY use information from the PROVIDED SEGMENTS below** - nothing else
2. **NEVER invent or guess** names, dates, numbers, votes, or outcomes
3. **QUOTE directly** when citing specific decisions or statements
4. **ALWAYS cite the source** - include meeting title and date for every fact
5. **If information is NOT in the segments, say "This information is not in the available records"**
6. **Use hedging language**: "According to the minutes...", "The record shows...", "As documented..."
7. **Distinguish clearly** between:
   - What was PROPOSED vs what was DECIDED
   - What was DISCUSSED vs what was APPROVED
   - Motions that CARRIED vs were DEFEATED vs were TABLED
8. **For vote counts**, only state numbers if explicitly recorded
9. **For names**, only mention people explicitly named in the records
10. **If asked about something not covered**, respond: "I don't have information about [topic] in the meeting records provided."

## RESPONSE FORMAT

Start with a direct answer, then provide supporting details with citations.

Example good response:
"According to the January 15, 2025 Board Meeting minutes, the fence budget was approved. The motion to approve $2,000 for fence repairs was moved by John Smith and seconded by Mary Jones. The record shows it passed with 5 votes in favor and 2 opposed."

Example when info is missing:
"I don't have information about parking fees in the meeting records provided. The available records cover [list topics that ARE covered]."

## MEETING SEGMENTS TO USE

The following are the ONLY source materials you may reference:

`;

export interface NarrativeRequest {
  question: string;
  segments: Segment[];
  meetingContext: {
    meetingId: string;
    meetingTitle: string;
    meetingDate: Date | string;
  }[];
}

export interface NarrativeResponse {
  answer: string;
  sourcesUsed: {
    segmentId: string;
    meetingTitle: string;
    meetingDate: string;
    type: string;
    title: string;
  }[];
  confidence: 'high' | 'medium' | 'low' | 'none';
  error?: string;
}

/**
 * Format segment for the prompt
 */
function formatSegmentForPrompt(segment: Segment, meetingTitle: string, meetingDate: string): string {
  let text = `\n---\n`;
  text += `**Source**: ${meetingTitle} (${meetingDate})\n`;
  text += `**Type**: ${segment.type}\n`;
  text += `**Title**: ${segment.title}\n`;
  text += `**Content**: ${segment.content}\n`;

  if (segment.type === 'motion') {
    if (segment.outcome) text += `**Outcome**: ${segment.outcome}\n`;
    if (segment.movedBy) text += `**Moved by**: ${segment.movedBy}\n`;
    if (segment.secondedBy) text += `**Seconded by**: ${segment.secondedBy}\n`;
    if (segment.voteCount) {
      text += `**Vote**: ${segment.voteCount.yea} yea, ${segment.voteCount.nay} nay`;
      if (segment.voteCount.abstain) text += `, ${segment.voteCount.abstain} abstain`;
      text += `\n`;
    }
  }

  if (segment.type === 'action_item') {
    if (segment.assignedTo) text += `**Assigned to**: ${segment.assignedTo}\n`;
    if (segment.dueDate) text += `**Due date**: ${segment.dueDate}\n`;
  }

  if (segment.context) text += `**Context**: ${segment.context}\n`;

  return text;
}

/**
 * Determine confidence based on segment matches
 */
function determineConfidence(segments: Segment[], question: string): 'high' | 'medium' | 'low' | 'none' {
  if (segments.length === 0) return 'none';

  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Count how many segments have strong keyword matches
  let strongMatches = 0;
  for (const segment of segments) {
    const text = `${segment.title} ${segment.content}`.toLowerCase();
    const matchCount = questionWords.filter(word => text.includes(word)).length;
    if (matchCount >= 2 || matchCount / questionWords.length > 0.5) {
      strongMatches++;
    }
  }

  if (strongMatches >= 3) return 'high';
  if (strongMatches >= 1) return 'medium';
  if (segments.length > 0) return 'low';
  return 'none';
}

/**
 * Generate a truthful narrative answer based on meeting segments
 */
export async function generateNarrative(request: NarrativeRequest): Promise<NarrativeResponse> {
  const { question, segments, meetingContext } = request;

  // No segments = no information
  if (segments.length === 0) {
    return {
      answer: "I don't have any meeting records that match your question. Please try a different search term or check that meetings have been uploaded.",
      sourcesUsed: [],
      confidence: 'none',
    };
  }

  if (!isGeminiAvailable()) {
    return {
      answer: '',
      sourcesUsed: [],
      confidence: 'none',
      error: 'AI service not configured',
    };
  }

  try {
    // Build the prompt with all segments
    let fullPrompt = NARRATIVE_PROMPT;

    const sourcesUsed: NarrativeResponse['sourcesUsed'] = [];

    for (const segment of segments) {
      // Find meeting context for this segment
      const meeting = meetingContext.find(m => m.meetingId === segment.meetingId);
      const meetingTitle = meeting?.meetingTitle || 'Meeting';
      const meetingDate = meeting?.meetingDate
        ? (typeof meeting.meetingDate === 'string'
            ? meeting.meetingDate
            : new Date(meeting.meetingDate).toLocaleDateString())
        : 'Date unknown';

      fullPrompt += formatSegmentForPrompt(segment, meetingTitle, meetingDate);

      sourcesUsed.push({
        segmentId: segment.id,
        meetingTitle,
        meetingDate,
        type: segment.type,
        title: segment.title,
      });
    }

    fullPrompt += `\n---\n\n## USER QUESTION\n\n${question}\n\n## YOUR RESPONSE (following all rules above):\n`;

    // Generate response using generateText (has retry logic and model fallback)
    const answer = await generateText(fullPrompt);

    // Determine confidence
    const confidence = determineConfidence(segments, question);

    return {
      answer,
      sourcesUsed,
      confidence,
    };
  } catch (error: any) {
    console.error('CARRIED_DEBUG: Narrative generation error:', error);
    return {
      answer: '',
      sourcesUsed: [],
      confidence: 'none',
      error: error.message || 'Failed to generate narrative',
    };
  }
}

/**
 * Quick answer with automatic segment search
 */
export async function askAboutMeetings(
  question: string,
  segments: Segment[],
  meetingContext: NarrativeRequest['meetingContext']
): Promise<NarrativeResponse> {
  return generateNarrative({
    question,
    segments,
    meetingContext,
  });
}
