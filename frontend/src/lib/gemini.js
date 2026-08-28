/**
 * Gemini API client — server-side only.
 * Uses @google/generative-ai SDK with deterministic low temperature for consistent extraction.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[gemini] GEMINI_API_KEY not set — API calls will fail.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

export function getModel(modelName = MODEL_NAME) {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      // Low temperature is CRITICAL for deterministic and consistent extraction
      temperature: 0.1,
      topP: 0.8,
      topK: 20,
    },
  });
}

/**
 * Convert a Buffer/Uint8Array to base64 string.
 */
export function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}
