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
    return { x: 0.05, y: 0.05, w: 0.9, h: 0.2 };
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

  // Default realistic marks if not provided in printed paper (e.g. 2 or 5)
  const defaultMarks = Number(number) >= 6 ? 5 : 2;
  const marks = raw.marks != null ? Number(raw.marks) : defaultMarks;

  return {
    id: uuidv4(),
    number: Number(number) || index + 1,
    part: part ? String(part).trim() : null,
    displayNumber,
    text: String(raw.text ?? raw.questionText ?? ''),
    marks,
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
    confidence: Number(raw.confidence ?? 0.85),
    questionLabel: raw.questionLabel ?? raw.questionNumber ?? null,
  };
}

/**
 * Normalize the full Gemini response into application data structures.
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
 * Build mappings from questions to answer regions with comprehensive label normalization.
 */
export function buildMappings(questions, answerRegions) {
  const mappings = [];
  const usedRegionIds = new Set();

  // Helper to normalize any label string: "Q1(a)" -> "1a", "Q. 5 (ii)" -> "5ii"
  const cleanLabel = (str) => {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/^q\./, '')
      .replace(/^q/, '')
      .replace(/[\(\)\[\]\.\-_ ]/g, '');
  };

  // Build a lookup: normalized label -> question
  const questionByLabel = new Map();
  for (const q of questions) {
    const numStr = String(q.number);
    const partStr = q.part ? String(q.part).toLowerCase() : '';

    const label1 = cleanLabel(numStr);
    const label2 = cleanLabel(`${numStr}${partStr}`);
    const label3 = cleanLabel(`${numStr}(${partStr})`);

    questionByLabel.set(label1, q);
    if (label2) questionByLabel.set(label2, q);
    if (label3) questionByLabel.set(label3, q);
  }

  // Match answer regions to questions
  const regionsByQuestion = new Map(); // questionId -> answerRegion[]

  for (const region of answerRegions) {
    let matched = null;

    if (region.questionLabel != null) {
      const rawLabel = String(region.questionLabel);
      const cleaned = cleanLabel(rawLabel);

      matched = questionByLabel.get(cleaned) ?? null;

      if (!matched) {
        // Try matching number-only
        const numOnly = cleaned.replace(/[^0-9]/g, '');
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
