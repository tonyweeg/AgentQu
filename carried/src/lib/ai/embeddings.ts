/**
 * Embeddings Service
 * Carried - Motions carry, memory too
 *
 * Generate text embeddings using Gemini for semantic search
 * Includes retry logic and model fallback for 429 errors
 */

import { genAI, isGeminiAvailable } from './gemini';

// Embedding model hierarchy for fallback
// Note: Old embedding models may be deprecated
const EMBEDDING_MODELS = [
  'text-embedding-005',    // Current recommended
  'text-embedding-004',    // Stable fallback
  'gemini-embedding-exp',  // Experimental option
];

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 4,
  baseDelayMs: 1000,
  maxDelayMs: 16000,
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

  console.log(`CARRIED_DEBUG: Embedding retry wait ${Math.round(delay)}ms...`);
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

export interface EmbeddingResult {
  embedding: number[];
  error?: string;
}

/**
 * Generate embedding for a single text with retry logic
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!isGeminiAvailable() || !genAI) {
    return {
      embedding: [],
      error: 'Gemini AI not configured',
    };
  }

  let lastError: Error | null = null;

  // Try each model in the hierarchy
  for (let modelIndex = 0; modelIndex < EMBEDDING_MODELS.length; modelIndex++) {
    const modelName = EMBEDDING_MODELS[modelIndex];

    // Try with retries for this model
    for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(text);
        const embedding = result.embedding;

        if (modelIndex > 0 || attempt > 0) {
          console.log(`CARRIED_DEBUG: Embedding success after fallback/retry - model: ${modelName}`);
        }

        return {
          embedding: embedding.values,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (isRateLimitError(error)) {
          console.warn(`CARRIED_DEBUG: Embedding rate limit on ${modelName} (attempt ${attempt + 1})`);

          if (attempt < RETRY_CONFIG.maxAttempts - 1) {
            await sleepWithJitter(attempt);
            continue;
          }

          if (modelIndex < EMBEDDING_MODELS.length - 1) {
            console.log(`CARRIED_DEBUG: Falling back to ${EMBEDDING_MODELS[modelIndex + 1]}`);
            break;
          }
        } else {
          console.error(`CARRIED_DEBUG: Non-retryable embedding error:`, error);
          return {
            embedding: [],
            error: lastError?.message || 'Failed to generate embedding',
          };
        }
      }
    }
  }

  return {
    embedding: [],
    error: `Embedding failed after retries: ${lastError?.message}`,
  };
}

/**
 * Generate embeddings for multiple texts with rate limiting
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  for (const text of texts) {
    const result = await generateEmbedding(text);
    results.push(result);

    // Small delay between requests to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
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
