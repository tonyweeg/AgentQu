/**
 * Gemini AI Service
 * PoliScai - Democracy V2.0
 *
 * Constitutional analysis using Google's Gemini 2.5 Pro
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.warn('POLISCAI_DEBUG: Gemini API key not configured');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// System prompt for constitutional analysis
const SYSTEM_PROMPT = `You are a constitutional scholar AI assistant for PoliScai, a platform dedicated to examining the U.S. Constitution through a critical lens that surfaces historical shadows and biases.

Your role is to:
1. Analyze questions about constitutionality with scholarly rigor
2. Consider both original intent (1787) and modern interpretations
3. Surface hidden assumptions, exclusions, and biases in constitutional language
4. Reference relevant amendments, court cases, and historical context
5. Acknowledge ambiguities and competing interpretations
6. Be balanced but honest about historical injustices encoded in the document

Format your responses with:
- **Verdict**: Constitutional / Partially Constitutional / Unconstitutional / Ambiguous
- **Analysis**: Clear explanation with references to specific clauses
- **Shadow Notes**: Any hidden assumptions or biases relevant to the query
- **Key References**: Relevant amendments, cases, or historical context

Be concise but thorough. Aim for scholarly accuracy while remaining accessible.`;

export interface QueryResponse {
  verdict: 'constitutional' | 'partial' | 'unconstitutional' | 'ambiguous';
  analysis: string;
  shadowNotes: string[];
  keyReferences: string[];
  rawResponse: string;
}

/**
 * Analyze a constitutional query using Gemini
 */
export async function analyzeConstitutionality(query: string): Promise<QueryResponse> {
  if (!genAI) {
    throw new Error('Gemini AI not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `${SYSTEM_PROMPT}

User Query: ${query}

Please analyze this query and provide your constitutional analysis.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const parsed = parseResponse(text);
    return parsed;
  } catch (error: any) {
    console.error('POLISCAI_DEBUG: Gemini API error:', error);
    throw new Error(error.message || 'Failed to analyze query');
  }
}

/**
 * Parse Gemini response into structured format
 */
function parseResponse(text: string): QueryResponse {
  // Extract verdict
  let verdict: QueryResponse['verdict'] = 'ambiguous';
  const verdictMatch = text.match(/\*\*Verdict\*\*:\s*([\w\s]+)/i);
  if (verdictMatch) {
    const v = verdictMatch[1].toLowerCase().trim();
    if (v.includes('unconstitutional')) verdict = 'unconstitutional';
    else if (v.includes('partial')) verdict = 'partial';
    else if (v.includes('constitutional')) verdict = 'constitutional';
    else verdict = 'ambiguous';
  }

  // Extract shadow notes
  const shadowNotes: string[] = [];
  const shadowSection = text.match(/\*\*Shadow Notes?\*\*:?([\s\S]*?)(?=\*\*|$)/i);
  if (shadowSection) {
    const notes = shadowSection[1].split(/[-•]\s+/).filter(n => n.trim().length > 10);
    shadowNotes.push(...notes.map(n => n.trim()));
  }

  // Extract key references
  const keyReferences: string[] = [];
  const refSection = text.match(/\*\*Key References?\*\*:?([\s\S]*?)(?=\*\*|$)/i);
  if (refSection) {
    const refs = refSection[1].split(/[-•]\s+/).filter(r => r.trim().length > 5);
    keyReferences.push(...refs.map(r => r.trim()));
  }

  // Extract analysis (everything between Verdict and Shadow Notes)
  let analysis = text;
  const analysisMatch = text.match(/\*\*Analysis\*\*:?([\s\S]*?)(?=\*\*Shadow|$)/i);
  if (analysisMatch) {
    analysis = analysisMatch[1].trim();
  }

  return {
    verdict,
    analysis,
    shadowNotes: shadowNotes.slice(0, 5), // Max 5 notes
    keyReferences: keyReferences.slice(0, 5), // Max 5 refs
    rawResponse: text,
  };
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
  return !!genAI;
}
