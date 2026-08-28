/**
 * Normalize and validate raw Gemini AI responses into
 * application-owned data structures.
 *
 * Gemini bounding boxes are in [y1, x1, y2, x2] format on a 0-1000 scale.
 * We convert to normalized { x, y, w, h } on a 0-1 scale.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Convert Gemini [y1,x1,y2,x2] (0–1000) to { x, y, w, h } (0–1).
 */
export function normalizeGeminiBbox(raw) {
  if (!raw || !Array.isArray(raw) || raw.length < 4) {
    return { x: 0, y: 0, w: 1, h: 0.1 };
  }
  const [y1, x1, y2, x2] = raw;
  const x = x1 / 1000;
  const y = y1 / 1000;
  const w = (x2 - x1) / 1000;
  const h = (y2 - y1) / 1000;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    w: Math.max(0.01, Math.min(1, w)),
    h: Math.max(0.01, Math.min(1, h)),
  };
}

/**
 * Normalize a single question from raw AI output.
 */
function normalizeQuestion(raw, index) {
  const number = raw.number ?? raw.questionNumber ?? index + 1;
  const part = raw.part ?? raw.subPart ?? null;
  const displayNumber = part
    ? `${number}${part}`
    : `${number}`;

  return {
    id: uuidv4(),
    number: Number(number),
    part: part ? String(part) : null,
    displayNumber,
    text: String(raw.text ?? raw.questionText ?? ''),
    marks: raw.marks != null ? Number(raw.marks) : null,
    status: 'unanswered', // default; mapping step will update
  };
}

/**
 * Normalize a single answer region from raw AI output.
 */
function normalizeAnswerRegion(raw) {
  return {
    id: uuidv4(),
    page: Number(raw.page ?? 1),
    text: String(raw.text ?? raw.answerText ?? ''),
    bbox: normalizeGeminiBbox(raw.bbox ?? raw.boundingBox ?? null),
    confidence: Number(raw.confidence ?? 0.8),
    questionLabel: raw.questionLabel ?? raw.questionNumber ?? null,
  };
}

/**
 * Normalize the full Gemini response into application data structures.
 *
 * Expected raw shape:
 * {
 *   questions: [...],
 *   answerRegions: [...],
 * }
 */
export function normalizeExtractionResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid AI response: expected object');
  }

  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
  const rawAnswerRegions = Array.isArray(raw.answerRegions) ? raw.answerRegions : [];

  const questions = rawQuestions.map(normalizeQuestion);
  const answerRegions = rawAnswerRegions.map(normalizeAnswerRegion);

  return { questions, answerRegions };
}

/**
 * Build mappings from questions to answer regions.
 * Uses strongest-evidence-first strategy:
 *  1. Explicit question label match (e.g., "Q1", "1", "11a")
 *  2. Semantic/position fallback
 *  3. Unmatched
 *
 * Returns { questions (with status), answerRegions, mappings }
 */
export function buildMappings(questions, answerRegions) {
  const mappings = [];
  const usedRegionIds = new Set();

  // Build a lookup: normalized label → question
  const questionByLabel = new Map();
  for (const q of questions) {
    // Register "1", "1a", "11", "11a", "11b" etc.
    const label1 = String(q.number);
    const label2 = q.part ? `${q.number}${q.part}` : null;
    const label3 = q.part ? `${q.number}(${q.part})` : null;

    questionByLabel.set(label1.toLowerCase(), q);
    if (label2) questionByLabel.set(label2.toLowerCase(), q);
    if (label3) questionByLabel.set(label3.toLowerCase(), q);
  }

  // Match answer regions to questions
  const regionsByQuestion = new Map(); // questionId → answerRegion[]

  for (const region of answerRegions) {
    let matched = null;

    if (region.questionLabel != null) {
      const label = String(region.questionLabel).toLowerCase().trim();
      // Try exact match
      matched = questionByLabel.get(label) ?? null;

      if (!matched) {
        // Try stripping "q" prefix: "q1" → "1"
        const stripped = label.replace(/^q/, '');
        matched = questionByLabel.get(stripped) ?? null;
      }

      if (!matched) {
        // Try just the number part for sub-parts: "1a" matches "1" if no "1a" exists
        const numOnly = label.replace(/[^0-9]/g, '');
        matched = questionByLabel.get(numOnly) ?? null;
      }
    }

    if (matched) {
      usedRegionIds.add(region.id);
      if (!regionsByQuestion.has(matched.id)) {
        regionsByQuestion.set(matched.id, []);
      }
      regionsByQuestion.get(matched.id).push(region);
    }
  }

  // Build mapping entries
  const updatedQuestions = questions.map((q) => {
    const regions = regionsByQuestion.get(q.id) ?? [];

    let status;
    if (regions.length > 0) {
      status = 'matched';
    } else {
      status = 'unanswered';
    }

    const mapping = {
      questionId: q.id,
      status,
      answerRegionIds: regions.map((r) => r.id),
      confidence: regions.length > 0 ? Math.max(...regions.map((r) => r.confidence)) : 0,
    };

    mappings.push(mapping);

    return { ...q, status };
  });

  // Collect unmatched regions
  const unmatchedRegions = answerRegions.filter((r) => !usedRegionIds.has(r.id));

  return {
    questions: updatedQuestions,
    answerRegions,
    mappings,
    unmatchedRegions,
  };
}
