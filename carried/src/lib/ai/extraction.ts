/**
 * Meeting Segment Extraction Service
 * Carried - Motions carry, memory too
 *
 * Uses Gemini to extract all content segments from meeting minutes:
 * motions, discussions, reports, announcements, action items, etc.
 */

import { getGenerativeModel, isGeminiAvailable } from './gemini';
import { ExtractedSegment, SegmentType } from '../../types/segment';
import { MotionOutcome } from '../../types/group';

const EXTRACTION_PROMPT = `You are analyzing meeting minutes to extract ALL content - capture WHAT WAS SAID, not just summaries.

## HIGHEST PRIORITY: Authoritative Voting Records

If the text starts with "AUTHORITATIVE VOTING RECORDS", those vote counts are 100% ACCURATE and extracted from PDF images.
- USE THESE EXACT vote counts for matching motions
- The "VOTED AYE", "VOTED NO", "ABSENT" lists are CORRECT
- Match votes to motions by the motion context/description
- IGNORE any garbled vote text later in the document that conflicts with these records

## CRITICAL: Capture What Was Actually Said

For each segment, the "content" field must include:
- ACTUAL QUOTES when available (use quotation marks)
- SPECIFIC DETAILS mentioned (numbers, names, dates, amounts)
- KEY POINTS from discussions (who said what, if mentioned)
- The FULL context of what happened, not just a brief summary

DO NOT just summarize - PRESERVE the details from the original minutes.

## Segment Types

1. **motion** - Any formal proposal, motion, resolution, or item requiring a vote
   - CAPTURE: Full motion text, who moved/seconded, vote result, how each person voted if listed
   - Common vote formats to recognize:
     - "Motion carried" or "Motion passed" = outcome: "carried"
     - "Motion failed" or "Motion defeated" = outcome: "defeated"
     - "Unanimously approved" or "All in favor" = outcome: "carried" (all members voted yea)
     - "Approved by consent" or "Consent agenda" = outcome: "carried"
     - "Tabled" or "Postponed" = outcome: "tabled"
     - "Withdrawn" = outcome: "withdrawn"
     - "5-2" or "5 to 2" = 5 yea, 2 nay
     - "6-0" or "Unanimous" with 6 members = 6 yea, 0 nay

2. **discussion** - Debate, questions, deliberation, comments
   - CAPTURE: Who spoke and what they said, concerns raised, questions asked, answers given

3. **report** - Committee reports, treasurer reports, staff reports, updates, presentations
   - CAPTURE: Who gave the report, specific numbers/data shared, key findings, recommendations

4. **announcement** - Upcoming events, deadlines, news items
   - CAPTURE: What was announced, dates, locations, details

5. **public_comment** - Citizen input, public testimony, audience questions
   - CAPTURE: Who spoke (by name if given), what they said, any responses

6. **action_item** - Tasks assigned, follow-up items, directives
   - CAPTURE: What needs to be done, who is responsible, deadline

7. **election** - Officer elections, appointments, nominations
   - CAPTURE: Position, candidates, vote results, who won

8. **presentation** - Guest speakers, informational presentations
   - CAPTURE: Presenter name, topic, key points made

9. **procedural** - Call to order, roll call, approval of agenda, adjournment
   - CAPTURE: Time, who was present/absent

10. **other** - Content that doesn't fit other categories

## Output Format

{
  "type": "motion|discussion|report|announcement|public_comment|action_item|election|presentation|procedural|other",
  "title": "Brief 5-10 word title",
  "content": "DETAILED content - include quotes, specifics, what was actually said. This should be comprehensive.",
  "context": "Background or related discussion (optional)",
  "tags": ["topic1", "topic2"],
  "confidence": 0.95,
  "order": 1,

  // For motions - ALWAYS try to fill these:
  "outcome": "carried|defeated|tabled|withdrawn|unknown",
  "movedBy": "Person name or 'Unknown' if not stated",
  "secondedBy": "Person name or 'Unknown' if not stated",
  "voteCount": { "yea": 5, "nay": 2, "abstain": 0 },
  "yeaVoters": ["Name1", "Name2"],
  "nayVoters": ["Name3"],
  "abstainVoters": ["Name4"],

  // For action items:
  "assignedTo": "Person or committee name",
  "dueDate": "Date if specified"
}

## Vote Parsing Rules - CRITICAL: PARSE EVERY VOTE

1. **"On the motion of [Name], second by [Name]"** → movedBy = first name, secondedBy = second name
2. **"Voting Tally X Y"** or **"Voting Tally X. Y."** → yea=X (first number), nay=Y (second number)
3. **"was adopted"** or **"was approved"** → outcome = "carried"
4. **"was denied"** or **"failed"** → outcome = "defeated"

5. **ROLL CALL TABLE FORMAT** - This is VERY common. When you see a table like:

   Name          Aye  No  Abstain
   Dean Burrell   X
   Steve Green    X
   Jay Knerr          X

   Parse it as:
   - yeaVoters: ["Dean Burrell", "Steve Green"] (X in Aye column)
   - nayVoters: ["Jay Knerr"] (X in No column)
   - voteCount: { yea: 2, nay: 1, abstain: 0 }

6. **Position-based vote parsing:**
   - First column = Name (include title like "VP", "President" if present)
   - Look for "X" marks to determine which column they voted in
   - Column order is usually: Aye/Yes, No/Nay, Abstain

7. **Voting Tally at bottom:**
   - "Voting Tally 4 1" → 4 yea, 1 nay
   - "Voting Tally 4. 1." → 4 yea, 1 nay (ignore periods)

8. **"unanimous" or "all in favor"** → all members voted yea
9. **"5-2" or "5 to 2"** → 5 yea, 2 nay

10. **Name extraction rules:**
    - "Councilmember Orris" → use "Jack Orris" if full name appears elsewhere, or "Councilmember Orris"
    - "Dean Burrell, VP" → "Dean Burrell" (strip title suffixes)
    - Always include the actual person's name, not just title

## JSON Requirements

- Return ONLY a valid JSON array - no markdown, no explanations
- Do NOT use trailing commas
- Escape quotes within strings with backslash
- No comments in the JSON
- Single-line string values (no unescaped newlines)

## Example 1 - Standard Format

Input: "Councilwoman Davis moved to approve the $50,000 park renovation budget. Councilman Brown seconded. Vote: Davis-Aye, Brown-Aye, Smith-Aye, Jones-Nay, Miller-Aye. Motion carried 4-1."

Output:
[
  {
    "type": "motion",
    "title": "Motion to approve park renovation budget",
    "content": "Councilwoman Davis moved to approve the $50,000 park renovation budget. The motion passed 4-1.",
    "outcome": "carried",
    "movedBy": "Councilwoman Davis",
    "secondedBy": "Councilman Brown",
    "voteCount": { "yea": 4, "nay": 1, "abstain": 0 },
    "yeaVoters": ["Davis", "Brown", "Smith", "Miller"],
    "nayVoters": ["Jones"],
    "tags": ["parks", "budget"],
    "confidence": 0.98,
    "order": 1
  }
]

## Example 2 - Roll Call Vote Format (Common in Municipal Minutes)

Input: "On the motion of Councilmember Orris, second by Councilmember Nichols, Motion 2026-07: Alcohol Permit Request was adopted by the following vote:
Name Aye No Abstain
Dean Burrell, VP X
Steve Green X
Jay Knerr X
Shaneka Nichols X
Jack Orris X
Voting Tally 4 1"

**PARSING EXPLANATION:**
- "On the motion of Councilmember Orris" → movedBy = "Jack Orris" (we see full name in table)
- "second by Councilmember Nichols" → secondedBy = "Shaneka Nichols"
- "was adopted" → outcome = "carried"
- Roll call table shows X marks:
  - Dean Burrell has X in first column (Aye) → yeaVoters
  - Steve Green has X in first column (Aye) → yeaVoters
  - Jay Knerr has X in first column (Aye) → yeaVoters
  - Shaneka Nichols has X in first column (Aye) → yeaVoters
  - Jack Orris has X in second column (No) → nayVoters
- "Voting Tally 4 1" confirms 4 yea, 1 nay

Output:
[
  {
    "type": "motion",
    "title": "Motion 2026-07: Alcohol Permit Request",
    "content": "Motion 2026-07: Alcohol Permit Request was adopted. Councilmember Orris moved the motion, seconded by Councilmember Nichols. The council voted 4-1 in favor.",
    "outcome": "carried",
    "movedBy": "Jack Orris",
    "secondedBy": "Shaneka Nichols",
    "voteCount": { "yea": 4, "nay": 1, "abstain": 0 },
    "yeaVoters": ["Dean Burrell", "Steve Green", "Jay Knerr", "Shaneka Nichols"],
    "nayVoters": ["Jack Orris"],
    "abstainVoters": [],
    "tags": ["alcohol permit", "special event"],
    "confidence": 0.95,
    "order": 1
  }
]

## Example 3 - Simple Vote Format

Input: "Motion by Smith, seconded by Johnson, to approve the budget. Motion carried unanimously."

Output:
[
  {
    "type": "motion",
    "title": "Motion to approve the budget",
    "content": "Motion to approve the budget. Moved by Smith, seconded by Johnson. Motion carried unanimously.",
    "outcome": "carried",
    "movedBy": "Smith",
    "secondedBy": "Johnson",
    "voteCount": { "yea": 0, "nay": 0, "abstain": 0 },
    "yeaVoters": [],
    "nayVoters": [],
    "abstainVoters": [],
    "tags": ["budget"],
    "confidence": 0.9,
    "order": 1
  }
]

Now extract all segments from the following meeting minutes:

---
`;

export interface ExtractionResult {
  segments: ExtractedSegment[];
  rawResponse: string;
  error?: string;
}

/**
 * Extract all segments from meeting minutes text
 */
export async function extractSegments(minutesText: string): Promise<ExtractionResult> {
  if (!isGeminiAvailable()) {
    return {
      segments: [],
      rawResponse: '',
      error: 'Gemini AI not configured',
    };
  }

  try {
    const model = getGenerativeModel();
    const prompt = EXTRACTION_PROMPT + minutesText;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const segments = parseSegmentsResponse(text);

    return {
      segments,
      rawResponse: text,
    };
  } catch (error: any) {
    console.error('CARRIED_DEBUG: Segment extraction error:', error);
    return {
      segments: [],
      rawResponse: '',
      error: error.message || 'Failed to extract segments',
    };
  }
}

/**
 * Clean and fix common JSON issues from LLM responses
 */
function cleanJsonString(jsonStr: string): string {
  let cleaned = jsonStr;

  // Remove any markdown code block markers
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

  // Fix trailing commas before ] or }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // Fix missing commas between objects
  cleaned = cleaned.replace(/}(\s*){/g, '},$1{');

  // Remove control characters except newlines and tabs
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // Fix unescaped quotes within strings (basic attempt)
  // This is tricky - only do it if we detect issues

  return cleaned;
}

/**
 * Try to extract valid JSON objects from potentially malformed response
 */
function extractJsonObjects(text: string): any[] {
  const objects: any[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const objStr = text.substring(start, i + 1);
        try {
          const obj = JSON.parse(cleanJsonString(objStr));
          if (obj.type && obj.content) {
            objects.push(obj);
          }
        } catch {
          // Skip malformed object
          console.warn('CARRIED_DEBUG: Skipping malformed JSON object');
        }
        start = -1;
      }
    }
  }

  return objects;
}

/**
 * Parse Gemini response into structured segments
 */
function parseSegmentsResponse(text: string): ExtractedSegment[] {
  console.log('CARRIED_DEBUG: Parsing response, length:', text.length);

  try {
    // First, try to find and parse a complete JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const cleanedJson = cleanJsonString(jsonMatch[0]);
      try {
        const parsed = JSON.parse(cleanedJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('CARRIED_DEBUG: Successfully parsed JSON array with', parsed.length, 'items');
          return normalizeSegments(parsed);
        }
      } catch (parseError) {
        console.warn('CARRIED_DEBUG: Array parse failed, trying object extraction:', parseError);
      }
    }

    // Fallback: Extract individual JSON objects
    console.log('CARRIED_DEBUG: Falling back to individual object extraction');
    const objects = extractJsonObjects(text);
    if (objects.length > 0) {
      console.log('CARRIED_DEBUG: Extracted', objects.length, 'individual objects');
      return normalizeSegments(objects);
    }

    console.warn('CARRIED_DEBUG: No valid JSON found in response');
    return [];
  } catch (error) {
    console.error('CARRIED_DEBUG: Failed to parse segments response:', error);
    return [];
  }
}

/**
 * Normalize and validate extracted segments
 */
function normalizeSegments(parsed: any[]): ExtractedSegment[] {
  return parsed.map((item: any, index: number) => ({
    type: validateSegmentType(item.type),
    title: String(item.title || '').slice(0, 200),
    content: String(item.content || ''),
    context: item.context ? String(item.context) : undefined,
    // Motion-specific
    outcome: item.outcome ? validateOutcome(item.outcome) : undefined,
    voteCount: item.voteCount ? {
      yea: Number(item.voteCount.yea) || 0,
      nay: Number(item.voteCount.nay) || 0,
      abstain: Number(item.voteCount.abstain) || 0,
    } : undefined,
    movedBy: item.movedBy ? String(item.movedBy) : undefined,
    secondedBy: item.secondedBy ? String(item.secondedBy) : undefined,
    yeaVoters: Array.isArray(item.yeaVoters) ? item.yeaVoters.map(String) : undefined,
    nayVoters: Array.isArray(item.nayVoters) ? item.nayVoters.map(String) : undefined,
    abstainVoters: Array.isArray(item.abstainVoters) ? item.abstainVoters.map(String) : undefined,
    // Action item specific
    assignedTo: item.assignedTo ? String(item.assignedTo) : undefined,
    dueDate: item.dueDate ? String(item.dueDate) : undefined,
    // Common
    tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 10) : [],
    confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
    order: Number(item.order) || index + 1,
  })).filter((s: ExtractedSegment) => s.content.length > 0);
}

/**
 * Validate segment type
 */
function validateSegmentType(type: any): SegmentType {
  const validTypes: SegmentType[] = [
    'motion', 'discussion', 'report', 'announcement', 'public_comment',
    'action_item', 'election', 'presentation', 'procedural', 'other'
  ];
  const normalized = String(type || '').toLowerCase();
  return validTypes.includes(normalized as SegmentType)
    ? (normalized as SegmentType)
    : 'other';
}

/**
 * Validate motion outcome
 */
function validateOutcome(outcome: any): MotionOutcome {
  const validOutcomes: MotionOutcome[] = ['carried', 'defeated', 'tabled', 'withdrawn', 'unknown'];
  const normalized = String(outcome || '').toLowerCase();
  return validOutcomes.includes(normalized as MotionOutcome)
    ? (normalized as MotionOutcome)
    : 'unknown';
}

// Legacy export for backwards compatibility
export const extractMotions = extractSegments;

/**
 * Extract meeting metadata (title, date) from raw minutes text
 */
export interface MeetingMetadata {
  title: string | null;
  date: string | null; // ISO format YYYY-MM-DD
  confidence: number;
}

const METADATA_PROMPT = `Extract the meeting title and date from these meeting minutes.

## Rules for TITLE - CRITICAL: Include the organization name!
1. Create a DESCRIPTIVE title in this format: "[Organization/Town/City Name] [Body Type] Meeting [Date] + [Topics]"
2. FIRST, find the organization name by looking for:
   - "Town of [Name]" or "[Name] Town"
   - "City of [Name]" or "[Name] City"
   - "[Name] County" or "County of [Name]"
   - "[Name] HOA" or "[Name] Association"
   - Company names, church names, school names, etc.
3. THEN identify the body type: Town Council, City Council, Board of Directors, HOA Board, School Board, etc.
4. Examples of GOOD titles (always include organization name!):
   - "Berlin Town Council Meeting 02/09/2026"
   - "Town of Ocean City Council Meeting 01/15/2026 + Budget Discussion"
   - "Riverdale HOA Board Meeting 03/22/2026 + Pool Renovation Vote"
   - "First Baptist Church Board Meeting 04/10/2026"
5. Examples of BAD titles (missing organization name):
   - "Town Council Meeting 02/09/2026" ❌ (which town?)
   - "Meeting 01/15/2026" ❌ (no organization!)
   - "Board Meeting 03/22/2026" ❌ (which board?)
6. Include 1-3 notable agenda topics after the date with "+"

## Rules for DATE:
1. Look for dates in any format - convert to YYYY-MM-DD
2. Common date patterns: "January 15, 2026", "01/15/2026", "1-15-2026", "01.15.26", "02.09.26", "10.27.2025"
3. If the year is two digits like "02.09.26", interpret it as 2026
4. Look for patterns like "Regular Session 02.09.26" to extract the date

## Output Format (JSON only, no markdown):
{
  "title": "[Organization Name] [Body] Meeting [Date] + [Topics]",
  "date": "YYYY-MM-DD format or null if not found",
  "confidence": 0.95
}

Meeting minutes:
---
`;

export async function extractMeetingMetadata(minutesText: string): Promise<MeetingMetadata> {
  if (!isGeminiAvailable()) {
    return { title: null, date: null, confidence: 0 };
  }

  try {
    const model = getGenerativeModel();

    // Skip authoritative voting records section if present (prepended by vision extraction)
    let textForMetadata = minutesText;
    const endMarker = 'END OF AUTHORITATIVE VOTING RECORDS';
    const endIndex = minutesText.indexOf(endMarker);
    if (endIndex !== -1) {
      // Skip past the voting records section
      textForMetadata = minutesText.slice(endIndex + endMarker.length).trim();
    }

    // Only send first 2000 chars - metadata is usually at the top
    const truncatedText = textForMetadata.slice(0, 2000);
    const prompt = METADATA_PROMPT + truncatedText;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || null,
        date: parsed.date || null,
        confidence: parsed.confidence || 0.5,
      };
    }

    return { title: null, date: null, confidence: 0 };
  } catch (error) {
    console.error('CARRIED_DEBUG: Metadata extraction error:', error);
    return { title: null, date: null, confidence: 0 };
  }
}
