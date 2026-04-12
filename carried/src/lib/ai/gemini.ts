/**
 * Gemini AI Client
 * Carried - Motions carry, memory too
 *
 * Core Gemini client for text generation and embeddings
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.warn('CARRIED_DEBUG: Gemini API key not configured');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
  return !!genAI;
}

/**
 * Get the Gemini generative model
 */
export function getGenerativeModel(modelName: string = 'gemini-2.0-flash') {
  if (!genAI) {
    throw new Error('Gemini AI not configured. Set VITE_GOOGLE_AI_API_KEY');
  }
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate text using Gemini
 */
export async function generateText(prompt: string): Promise<string> {
  const model = getGenerativeModel();
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export { genAI };
