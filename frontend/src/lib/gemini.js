/**
 * Gemini API client — server-side only.
 * Uses @google/generative-ai SDK with the latest Gemini model.
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
    },
  });
}

/**
 * Convert a Buffer/Uint8Array to base64 string.
 */
export function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}
