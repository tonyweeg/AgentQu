/**
 * Gemini AI Client
 * Carried - Motions carry, memory too
 *
 * Core Gemini client with retry logic, backoff, and model fallback
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.warn('CARRIED_DEBUG: Gemini API key not configured');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Model hierarchy for fallback (primary → fallbacks)
const MODEL_HIERARCHY = [
  'gemini-2.0-flash-001',    // Stable version (less busy)
  'gemini-2.0-flash',        // Latest flash
  'gemini-1.5-flash',        // Older but reliable
  'gemini-1.5-flash-001',    // Stable older version
];

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 32000,
  jitterFactor: 0.3, // 30% jitter
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

  console.log(`CARRIED_DEBUG: Waiting ${Math.round(delay)}ms before retry...`);
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

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
  return !!genAI;
}

/**
 * Get the Gemini generative model
 */
export function getGenerativeModel(modelName: string = MODEL_HIERARCHY[0]): GenerativeModel {
  if (!genAI) {
    throw new Error('Gemini AI not configured. Set VITE_GOOGLE_AI_API_KEY');
  }
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate text with retry logic and model fallback
 */
export async function generateText(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini AI not configured. Set VITE_GOOGLE_AI_API_KEY');
  }

  let lastError: Error | null = null;

  // Try each model in the hierarchy
  for (let modelIndex = 0; modelIndex < MODEL_HIERARCHY.length; modelIndex++) {
    const modelName = MODEL_HIERARCHY[modelIndex];

    // Try with retries for this model
    for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        console.log(`CARRIED_DEBUG: Generating with ${modelName} (attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts})`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (modelIndex > 0 || attempt > 0) {
          console.log(`CARRIED_DEBUG: Success after fallback/retry - model: ${modelName}, attempt: ${attempt + 1}`);
        }

        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (isRateLimitError(error)) {
          console.warn(`CARRIED_DEBUG: Rate limit hit on ${modelName} (attempt ${attempt + 1})`);

          // If we have more attempts for this model, wait and retry
          if (attempt < RETRY_CONFIG.maxAttempts - 1) {
            await sleepWithJitter(attempt);
            continue;
          }

          // If we have more models to try, move to next model
          if (modelIndex < MODEL_HIERARCHY.length - 1) {
            console.log(`CARRIED_DEBUG: Falling back to ${MODEL_HIERARCHY[modelIndex + 1]}`);
            break; // Exit retry loop, move to next model
          }
        } else {
          // Non-rate-limit error, don't retry
          console.error(`CARRIED_DEBUG: Non-retryable error on ${modelName}:`, error);
          throw error;
        }
      }
    }
  }

  // All models and retries exhausted
  throw new Error(`All Gemini models exhausted after retries. Last error: ${lastError?.message}`);
}

/**
 * Generate content with structured output (JSON mode)
 */
export async function generateStructuredContent<T>(
  prompt: string,
  parseResponse: (text: string) => T
): Promise<T> {
  const text = await generateText(prompt);
  return parseResponse(text);
}

/**
 * Get available models (for debugging)
 */
export function getModelHierarchy(): string[] {
  return [...MODEL_HIERARCHY];
}

export { genAI };
