/**
 * Embeddings Service
 * Carried - Motions carry, memory too
 *
 * Generate text embeddings using Gemini for semantic search
 */

import { genAI, isGeminiAvailable } from './gemini';

// Use embedding-001 as it's more widely available
// text-embedding-004 may not be available in all regions/API versions
const EMBEDDING_MODEL = 'embedding-001';

export interface EmbeddingResult {
  embedding: number[];
  error?: string;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!isGeminiAvailable() || !genAI) {
    return {
      embedding: [],
      error: 'Gemini AI not configured',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    return {
      embedding: embedding.values,
    };
  } catch (error: any) {
    console.error('CARRIED_DEBUG: Embedding generation error:', error);
    return {
      embedding: [],
      error: error.message || 'Failed to generate embedding',
    };
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  // Process in parallel with rate limiting
  const results: EmbeddingResult[] = [];

  for (const text of texts) {
    const result = await generateEmbedding(text);
    results.push(result);

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Find most similar embeddings from a list
 */
export function findSimilar(
  queryEmbedding: number[],
  candidates: { id: string; embedding: number[] }[],
  limit: number = 10
): { id: string; score: number }[] {
  const scored = candidates.map((candidate) => ({
    id: candidate.id,
    score: cosineSimilarity(queryEmbedding, candidate.embedding),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
