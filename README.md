# VedaAI — AI Assessment Extraction & Answer Mapping

A web application for teachers to upload a question paper and a student's handwritten answer sheet, automatically extract questions using AI, and visually see exactly which part of the answer sheet corresponds to each question.

## Live Demo

> **Deployed on Netlify** — [Link added after deployment]

---

## Features

- **Upload** — Drag-and-drop or click to upload question paper + answer sheet (PDF or images)
- **AI Extraction** — Gemini 2.0 Flash multimodal model extracts all questions and finds answer regions
- **Answer Mapping** — Questions are automatically matched to answer regions using explicit question labels
- **Exact Highlighting** — Clicking a question scrolls to and highlights the exact handwritten answer region
- **Status Tracking** — Questions are shown as Answered, No Answer, or Ambiguous
- **Unmatched Answers** — Answer regions that don't match any question are flagged rather than silently discarded
- **Multi-Page Support** — Answers spanning multiple pages are supported
- **Responsive & Clean UI** — Designed according to the Figma specification with Hugeicons

---

## Architecture

```
vedaAI_Assignment/
├── frontend/               ← Next.js App Router application (JavaScript)
│   └── src/
│       ├── app/
│       │   ├── page.js          ← Upload screen
│       │   ├── mapping/
│       │   │   └── page.js      ← Question-Answer mapping screen
│       │   ├── api/
│       │   │   └── process/
│       │   │       └── route.js ← Server route: Gemini + normalization
│       │   ├── layout.js
│       │   └── globals.css
│       ├── components/
│       │   ├── Sidebar.jsx      ← App navigation sidebar
│       │   ├── TopBar.jsx       ← Breadcrumb top bar
│       │   ├── QuestionList.jsx ← Left panel question list
│       │   └── PdfViewer.jsx    ← Right panel PDF viewer + highlights
│       └── lib/
│           ├── gemini.js        ← Gemini API client (server-only)
│           └── normalizer.js    ← AI response normalization + mapping logic
├── backend/                ← Empty (Next.js API routes handle backend operations)
└── README.md
```

The application is a **monorepo** where Next.js API routes serve as the backend. No separate server is needed.

---

## AI Model & API

**Model:** `gemini-2.0-flash`

**SDK:** `@google/generative-ai` (official Google Generative AI SDK for Node.js)

**How it works:**
1. Both PDFs are converted to base64 and sent as inline data in a single Gemini API call
2. The model is prompted to extract questions from Document 1 and find answer regions in Document 2
3. Response is requested as `application/json` (structured output)
4. The model returns bounding boxes in `[y1, x1, y2, x2]` format on a 0–1000 scale

---

## Mapping Strategy

Answers are mapped to questions using a **strongest-evidence-first** strategy:

| Priority | Evidence Type | Example |
|----------|--------------|---------|
| 1 (strongest) | Explicit question label visible in answer | "Q1", "1", "11(a)" |
| 2 | Label with prefix stripping | "Q2" -> "2" |
| 3 | Number-only fallback | "2a" -> question "2" |
| 4 (weakest) | Unmatched — flagged as unmatched | shown in warning banner |

- Sub-parts (11a, 11b) are treated as separate questions
- Unmatched answer regions are never silently discarded
- Questions with no matching answer region are shown as "No Answer"

---

## Coordinate Strategy

- Gemini returns bounding boxes as `[y1, x1, y2, x2]` on a 0–1000 scale
- These are **immediately normalized** at the AI boundary into `{ x, y, w, h }` on a 0–1 scale
- The PDF viewer renders highlights using **CSS percentage positioning** (`left: x*100%`, `top: y*100%`, etc.)
- This means highlights **remain correct at any zoom level** — they are always relative to the rendered page dimensions

---

## Setup

### Prerequisites
- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### Running locally

```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

The API key is **only used server-side** and never exposed to the browser.

---

## Deployment

### Netlify

1. Connect the `vedaAI_Assignment` repository to Netlify
2. Set **Base directory** to `frontend`
3. Set **Build command** to `npm run build`
4. Set **Publish directory** to `frontend/.next`
5. Add environment variable: `GEMINI_API_KEY`
6. Install the **Netlify Next.js plugin** (usually auto-detected)

Or deploy via Netlify CLI:
```bash
cd frontend
npm install -g netlify-cli
netlify init
netlify env:set GEMINI_API_KEY your_key_here
netlify deploy --prod
```

---

## Assumptions & Limitations

### Assumptions
- The question paper has printed, numbered questions in standard format
- The student has written question labels (e.g., "Q1", "1.", "11a") next to their answers
- PDFs are text-based or contain clear enough images for Gemini to process
- Files are under 20MB (Gemini inline data limit)

### Limitations
- **Bounding box accuracy** depends on Gemini's visual understanding of the document layout. Complex or cluttered answer sheets may produce imprecise boxes.
- **No grading** — this MVP focuses on extraction and mapping, not scoring
- **Single student** — one answer sheet per session
- **Session-based state** — results are stored in `sessionStorage` and lost on refresh; no persistence layer
- **File size** — very large PDFs (>20MB) may fail; multi-page PDFs may take 10–30 seconds to process
- **Gemini rate limits** — subject to standard API quota limits

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (no TypeScript) |
| AI | Gemini 2.0 Flash (multimodal) |
| Icons | @hugeicons/react & @hugeicons/core-free-icons |
| PDF Rendering | pdfjs-dist (client-side) |
| Styling | Vanilla CSS + CSS custom properties |
| Deployment | Netlify |
