/**
 * POST /api/process
 *
 * Accepts multipart/form-data with:
 *   - questionPaper: File (PDF or image)
 *   - answerSheet: File (PDF or image)
 *
 * Returns JSON:
 *   { questions, answerRegions, mappings, unmatchedRegions }
 */

import { NextResponse } from 'next/server';
import { getModel } from '@/lib/gemini';
import { normalizeExtractionResponse, buildMappings } from '@/lib/normalizer';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60s for Gemini processing

const EXTRACTION_PROMPT = `
You are an AI assistant helping a teacher understand a student's handwritten exam answers.

You will be given TWO documents:
1. First document: The QUESTION PAPER (printed text with numbered questions)
2. Second document: The ANSWER SHEET (handwritten student answers)

Your tasks:

TASK 1 — Extract all questions from the question paper:
- Preserve the original printed question numbering EXACTLY
- Treat labeled sub-parts as separate questions (e.g., 11a, 11b, 11(a), 11(b))
- Include marks if shown (e.g., "[2 marks]")

TASK 2 — Find all answer regions in the answer sheet:
- For each answer region, identify which question label it belongs to (if visible)
- Provide the page number (1-indexed)
- Provide bounding box coordinates in [y1, x1, y2, x2] format on a 0-1000 scale
  where (0,0) is top-left and (1000,1000) is bottom-right of that page
- Extract the text content of the answer
- If the answer label is not clearly visible, set questionLabel to null

Return ONLY valid JSON with this exact structure:
{
  "questions": [
    {
      "number": 1,
      "part": null,
      "text": "Which blood vessel carries blood away from the heart?",
      "marks": 2
    },
    {
      "number": 11,
      "part": "a",
      "text": "A diagram shows two potted plants...",
      "marks": 2
    },
    {
      "number": 11,
      "part": "b",
      "text": "Suggest one practical measure to help Plant B recover.",
      "marks": 1
    }
  ],
  "answerRegions": [
    {
      "questionLabel": "1",
      "page": 1,
      "text": "Aorta",
      "bbox": [120, 50, 180, 950],
      "confidence": 0.95
    },
    {
      "questionLabel": "11a",
      "page": 3,
      "text": "Plant A has broad green leaves...",
      "bbox": [300, 100, 450, 900],
      "confidence": 0.9
    }
  ]
}

Important rules:
- questions must be in original printed order
- Each sub-part (11a, 11b) is a separate entry in questions array
- part should be a lowercase letter string like "a", "b" or null
- questionLabel in answerRegions should match the label written by the student (e.g., "Q1", "1", "11a", "11(a)")
- If a student answer spans multiple answer regions across pages, include all regions
- If a question has no answer in the answer sheet, still include it in questions but omit from answerRegions
- Return only the JSON object, no markdown
`;

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
].filter(Boolean);

async function generateWithFallback(parts) {
  let lastError = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent(parts);
      return result;
    } catch (err) {
      console.warn(`[gemini] Model ${modelName} failed:`, err.message);
      lastError = err;
      // If error is 404/not available, try next model
      if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('no longer available')) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const questionPaperFile = formData.get('questionPaper');
    const answerSheetFile = formData.get('answerSheet');

    if (!questionPaperFile || !answerSheetFile) {
      return NextResponse.json(
        { error: 'Both questionPaper and answerSheet files are required' },
        { status: 400 }
      );
    }

    // Convert files to base64 for Gemini
    const questionPaperBuffer = await questionPaperFile.arrayBuffer();
    const answerSheetBuffer = await answerSheetFile.arrayBuffer();

    const questionPaperBase64 = Buffer.from(questionPaperBuffer).toString('base64');
    const answerSheetBase64 = Buffer.from(answerSheetBuffer).toString('base64');

    const questionPaperMime = questionPaperFile.type || 'application/pdf';
    const answerSheetMime = answerSheetFile.type || 'application/pdf';

    // Call Gemini with fallback support
    const result = await generateWithFallback([
      {
        inlineData: {
          mimeType: questionPaperMime,
          data: questionPaperBase64,
        },
      },
      {
        text: '[DOCUMENT 1 ABOVE: Question Paper]',
      },
      {
        inlineData: {
          mimeType: answerSheetMime,
          data: answerSheetBase64,
        },
      },
      {
        text: '[DOCUMENT 2 ABOVE: Answer Sheet]',
      },
      {
        text: EXTRACTION_PROMPT,
      },
    ]);

    const rawText = result.response.text();

    let rawData;
    try {
      rawData = JSON.parse(rawText);
    } catch (parseError) {
      // Try to extract JSON from response if wrapped in markdown
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('[process] Failed to parse Gemini response:', rawText.slice(0, 500));
        return NextResponse.json(
          { error: 'AI returned malformed response. Please try again.' },
          { status: 502 }
        );
      }
    }

    // Normalize AI response into application data structures
    const { questions, answerRegions } = normalizeExtractionResponse(rawData);

    // Build mappings
    const { questions: mappedQuestions, mappings, unmatchedRegions } = buildMappings(
      questions,
      answerRegions
    );

    return NextResponse.json({
      questions: mappedQuestions,
      answerRegions,
      mappings,
      unmatchedRegions,
    });
  } catch (error) {
    console.error('[process] Error:', error);

    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Processing failed. Please try again.' },
      { status: 500 }
    );
  }
}
