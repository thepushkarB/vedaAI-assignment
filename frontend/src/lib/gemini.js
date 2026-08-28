/**
 * Gemini API client — server-side only.
 * Uses @google/generative-ai SDK with gemini-2.0-flash model.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[gemini] GEMINI_API_KEY not set — API calls will fail.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

export function getModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
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
