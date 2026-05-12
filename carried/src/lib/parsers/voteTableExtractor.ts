/**
 * Vote Table Extractor
 * Carried - Motions carry, memory too
 *
 * Uses Gemini Vision to extract voting tables from PDF images
 * Only processes regions containing "Counted toward Quorum" tables
 */

import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

// Vision model hierarchy for fallback
// Note: Gemini 1.5 models were shutdown April 2025
// Gemini 2.0 models shutting down June 2026
const VISION_MODELS = [
  'gemini-2.5-flash',        // Current recommended
  'gemini-2.5-flash-lite',   // Cost-efficient fallback
  'gemini-2.0-flash',        // Legacy fallback (until June 2026)
];

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 4,
  baseDelayMs: 1500,
  maxDelayMs: 24000,
  jitterFactor: 0.3,
};

/**
 * Sleep with jitter for exponential backoff
 */
function sleepWithJitter(attemptNumber: number): Promise<void> {
  const baseDelay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attemptNumber),
    RETRY_CONFIG.maxDelayMs
  );
  const jitter = baseDelay * RETRY_CONFIG.jitterFactor * Math.random();
  const delay = baseDelay + jitter;

  console.log(`CARRIED_DEBUG: Vision retry wait ${Math.round(delay)}ms...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Check if error is a 429 rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('429') ||
           error.message.includes('Resource exhausted') ||
           error.message.includes('rate limit');
  }
  return false;
}

export interface VoteRecord {
  name: string;
  vote: 'Aye' | 'No' | 'Abstain' | 'Recused' | 'Absent' | 'Unknown';
}

export interface VoteTableResult {
  pageNumber: number;
  motionContext: string; // Text before the table describing what's being voted on
  votes: VoteRecord[];
  tally: {
    aye: number;
    no: number;
    abstain: number;
    recused: number;
    absent: number;
  };
  outcome: 'carried' | 'defeated' | 'unknown';
}

/**
 * Find pages that contain voting tables by searching for the marker text
 */
export async function findVotingTablePages(pdf: pdfjsLib.PDFDocumentProxy): Promise<number[]> {
  const pagesWithTables: number[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');

    // Look for the voting table marker
    if (pageText.includes('Counted toward') && pageText.includes('Quorum')) {
      pagesWithTables.push(pageNum);
      console.log(`CARRIED_DEBUG: Found voting table on page ${pageNum}`);
    }
  }

  return pagesWithTables;
}

/**
 * Render a PDF page to a base64 image
 * Uses higher resolution for accurate table reading
 */
async function renderPageToImage(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);

  // Scale 2.0 for clear table reading - higher quality for vote accuracy
  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render page to canvas (pdf.js 5.x requires canvas in params)
  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  } as any).promise;

  // Convert to base64 JPEG (smaller than PNG)
  const base64 = canvas.toDataURL('image/jpeg', 0.85);

  // Clean up
  canvas.remove();

  // Return just the base64 data without the prefix
  return base64.split(',')[1];
}

/**
 * Extract voting table data from page images using Gemini Vision
 * Accepts multiple images to handle tables that split across pages
 * Includes retry logic and model fallback for 429 errors
 */
async function extractVotesFromImages(imageBase64Array: string[]): Promise<VoteTableResult[]> {
  const imageCount = imageBase64Array.length;
  const prompt = `You are analyzing voting tables from municipal meeting minutes. Your job is to PRECISELY identify which column each X mark is in.

## TABLE STRUCTURE (VERY IMPORTANT)
The voting table has these EXACT columns in this LEFT-TO-RIGHT order:
1. Name (council member name)
2. "Counted toward Quorum" header spanning sub-columns:
   - Aye (column 2) - voting YES
   - No (column 3) - voting NO
   - Abstain (column 4)
3. Recused (column 5)
4. Absent (column 6) - NOT PRESENT at meeting

## CRITICAL RULES
- An X in column 2 (under "Aye") = voted YES
- An X in column 3 (under "No") = voted NO
- An X in column 6 (far right, under "Absent") = was ABSENT (did NOT vote)
- The "Voting Tally" row at bottom shows totals: first number is Aye count, last number is Absent count
- If someone is ABSENT, they did NOT vote - do not count them as Aye or No!

## EXAMPLES
- "4" in Aye column and "1" in Absent column = 4 people voted Aye, 1 person was Absent
- NOT "4 yea 1 nay" - that's wrong if the 1 is in the Absent column!

${imageCount > 1 ? 'Tables may SPLIT ACROSS PAGES - combine partial tables into one complete record.' : ''}

## OUTPUT FORMAT
Return JSON array:
[
  {
    "motionContext": "Motion 2025-XX: Brief description",
    "votes": [
      {"name": "Dean Burrell", "vote": "Aye"},
      {"name": "Shaneka Nichols", "vote": "Absent"}
    ],
    "tally": {"aye": 4, "no": 0, "abstain": 0, "recused": 0, "absent": 1},
    "outcome": "carried"
  }
]

DOUBLE-CHECK: Count the X positions carefully. An X in the rightmost column means ABSENT, not a No vote!

Return ONLY valid JSON, no explanations.`;

  // Build content array with prompt + all images
  const content: any[] = [{ text: prompt }];
  for (const imageBase64 of imageBase64Array) {
    content.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  let lastError: Error | null = null;

  // Try each model in the hierarchy
  for (let modelIndex = 0; modelIndex < VISION_MODELS.length; modelIndex++) {
    const modelName = VISION_MODELS[modelIndex];

    // Try with retries for this model
    for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        console.log(`CARRIED_DEBUG: Vision extraction with ${modelName} (attempt ${attempt + 1})`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(content);
        const response = result.response.text();

        if (modelIndex > 0 || attempt > 0) {
          console.log(`CARRIED_DEBUG: Vision success after fallback/retry - model: ${modelName}`);
        }

        console.log('CARRIED_DEBUG: Gemini Vision response:', response);

        // Parse JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.warn('CARRIED_DEBUG: No JSON array found in response');
          return [];
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and normalize each vote record
        const validatedVotes: VoteTableResult[] = [];
        for (const vote of parsed) {
          if (!vote || !Array.isArray(vote.votes)) {
            console.warn('CARRIED_DEBUG: Skipping malformed vote record:', vote);
            continue;
          }

          // Calculate tally from votes if not provided
          const ayes = vote.votes.filter((v: any) => v.vote === 'Aye').length;
          const noes = vote.votes.filter((v: any) => v.vote === 'No').length;
          const abstains = vote.votes.filter((v: any) => v.vote === 'Abstain').length;
          const recusedCount = vote.votes.filter((v: any) => v.vote === 'Recused').length;
          const absentCount = vote.votes.filter((v: any) => v.vote === 'Absent').length;

          validatedVotes.push({
            pageNumber: 0,
            motionContext: vote.motionContext || 'Unknown Motion',
            votes: vote.votes,
            tally: vote.tally || {
              aye: ayes,
              no: noes,
              abstain: abstains,
              recused: recusedCount,
              absent: absentCount,
            },
            outcome: vote.outcome || (ayes > noes ? 'carried' : 'defeated'),
          });
        }

        return validatedVotes;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (isRateLimitError(error)) {
          console.warn(`CARRIED_DEBUG: Vision rate limit on ${modelName} (attempt ${attempt + 1})`);

          if (attempt < RETRY_CONFIG.maxAttempts - 1) {
            await sleepWithJitter(attempt);
            continue;
          }

          if (modelIndex < VISION_MODELS.length - 1) {
            console.log(`CARRIED_DEBUG: Falling back to ${VISION_MODELS[modelIndex + 1]}`);
            break;
          }
        } else {
          console.error('CARRIED_DEBUG: Non-retryable vision error:', error);
          return [];
        }
      }
    }
  }

  console.error(`CARRIED_DEBUG: All vision models exhausted. Last error: ${lastError?.message}`);
  return [];
}

/**
 * Extract all voting tables from a PDF using vision
 * Sends consecutive pages together to handle tables that split across pages
 */
export async function extractVotingTables(pdfData: ArrayBuffer): Promise<VoteTableResult[]> {
  console.log('CARRIED_DEBUG: Starting voting table extraction with vision...');

  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

  // Find pages with voting tables
  const votingPages = await findVotingTablePages(pdf);
  console.log(`CARRIED_DEBUG: Found ${votingPages.length} pages with voting tables`);

  if (votingPages.length === 0) {
    return [];
  }

  const allVotes: VoteTableResult[] = [];
  const processedPages = new Set<number>();

  // Process pages in groups - send consecutive pages together
  for (let i = 0; i < votingPages.length; i++) {
    const pageNum = votingPages[i];

    // Skip if already processed as part of a previous group
    if (processedPages.has(pageNum)) {
      continue;
    }

    // Determine which pages to send together
    // Always include current page + next page (to catch split tables)
    const pagesToProcess: number[] = [pageNum];

    // If next page exists, include it (tables often split)
    if (pageNum + 1 <= pdf.numPages) {
      pagesToProcess.push(pageNum + 1);
    }

    console.log(`CARRIED_DEBUG: Rendering pages ${pagesToProcess.join(', ')} for vision analysis...`);

    // Render all pages to images
    const images: string[] = [];
    for (const pNum of pagesToProcess) {
      const imageBase64 = await renderPageToImage(pdf, pNum);
      images.push(imageBase64);
      processedPages.add(pNum);
      console.log(`CARRIED_DEBUG: Page ${pNum} rendered, image size: ~${Math.round(imageBase64.length / 1024)}KB`);
    }

    // Extract votes using Gemini Vision with all images
    const pageVotes = await extractVotesFromImages(images);

    // Add page number to each result
    for (const vote of pageVotes) {
      allVotes.push({
        ...vote,
        pageNumber: pageNum,
      });
    }

    // Small delay between API calls to avoid rate limiting
    if (i < votingPages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Deduplicate votes by motion context (in case same table was seen twice)
  const uniqueVotes = deduplicateVotes(allVotes);

  console.log(`CARRIED_DEBUG: Extracted ${uniqueVotes.length} unique voting records total`);
  return uniqueVotes;
}

/**
 * Remove duplicate vote records based on motion context similarity
 */
function deduplicateVotes(votes: VoteTableResult[]): VoteTableResult[] {
  const seen = new Map<string, VoteTableResult>();

  for (const vote of votes) {
    // Create a key from the motion context (normalized)
    const key = vote.motionContext
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);

    // Keep the one with more votes (more complete)
    const existing = seen.get(key);
    if (!existing || vote.votes.length > existing.votes.length) {
      seen.set(key, vote);
    }
  }

  return Array.from(seen.values());
}

/**
 * Format vote results as text to inject into the extracted minutes
 * This is placed at the START of the text so AI sees it first
 */
export function formatVotesAsText(votes: VoteTableResult[]): string {
  if (votes.length === 0) return '';

  let text = `
================================================================================
AUTHORITATIVE VOTING RECORDS - USE THESE EXACT VOTE COUNTS
(These were extracted from the PDF images and are 100% accurate)
================================================================================

`;

  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i];

    // Skip malformed vote records
    if (!vote || !vote.votes) continue;

    text += `VOTE #${i + 1}: ${vote.motionContext || 'Unknown Motion'}\n`;
    text += `─────────────────────────────────────────\n`;

    const ayes = vote.votes.filter(v => v.vote === 'Aye').map(v => v.name);
    const noes = vote.votes.filter(v => v.vote === 'No').map(v => v.name);
    const abstains = vote.votes.filter(v => v.vote === 'Abstain').map(v => v.name);
    const recused = vote.votes.filter(v => v.vote === 'Recused').map(v => v.name);
    const absent = vote.votes.filter(v => v.vote === 'Absent').map(v => v.name);

    if (ayes.length > 0) text += `VOTED AYE (${ayes.length}): ${ayes.join(', ')}\n`;
    if (noes.length > 0) text += `VOTED NO (${noes.length}): ${noes.join(', ')}\n`;
    if (abstains.length > 0) text += `ABSTAINED (${abstains.length}): ${abstains.join(', ')}\n`;
    if (recused.length > 0) text += `RECUSED (${recused.length}): ${recused.join(', ')}\n`;
    if (absent.length > 0) text += `ABSENT (${absent.length}): ${absent.join(', ')}\n`;

    // Use tally if available, otherwise calculate from votes
    const tally = vote.tally || { aye: ayes.length, no: noes.length, abstain: abstains.length, recused: recused.length, absent: absent.length };
    const ayeCount = tally?.aye ?? ayes.length;
    const noCount = tally?.no ?? noes.length;
    const absentCount = tally?.absent ?? absent.length;
    const outcome = vote.outcome || (ayeCount > noCount ? 'carried' : 'defeated');

    text += `FINAL TALLY: ${ayeCount}-${noCount} (${ayeCount} Aye, ${noCount} No, ${absentCount} Absent)\n`;
    text += `OUTCOME: ${String(outcome).toUpperCase()}\n\n`;
  }

  text += `================================================================================
END OF AUTHORITATIVE VOTING RECORDS
================================================================================

`;

  return text;
}
