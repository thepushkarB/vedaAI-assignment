'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import QuestionList from '@/components/QuestionList';
import PdfViewer from '@/components/PdfViewer';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon } from '@hugeicons/core-free-icons';

export default function MappingPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [answerSheetUrl, setAnswerSheetUrl] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeHighlights, setActiveHighlights] = useState([]);

  // Load data from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('veda_result');
    const url = sessionStorage.getItem('veda_answer_url');

    if (!raw || !url) {
      // No data — redirect to upload
      router.replace('/');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setResult(parsed);
      setAnswerSheetUrl(url);

      // Auto-select first question
      if (parsed.questions?.length > 0) {
        selectQuestion(parsed.questions[0], parsed);
      }
    } catch (err) {
      console.error('[Mapping] Failed to parse result:', err);
      router.replace('/');
    }
  }, []);

  function selectQuestion(question, data) {
    const r = data ?? result;
    if (!r) return;

    setSelectedQuestion(question);

    // Find the mapping for this question
    const mapping = r.mappings.find((m) => m.questionId === question.id);

    if (!mapping || mapping.status !== 'matched') {
      setActiveHighlights([]);
      return;
    }

    // Find answer regions for this mapping
    const regions = r.answerRegions.filter((ar) =>
      mapping.answerRegionIds.includes(ar.id)
    );

    setActiveHighlights(regions);

    // Navigate to first page of the answer
    if (regions.length > 0) {
      setCurrentPage(regions[0].page);
    }
  }

  if (!result) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <TopBar breadcrumb="Exams / Mapping" onBack={() => router.push('/')} />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 14,
              gap: 12,
            }}
          >
            <HugeiconsIcon icon={SparklesIcon} size={28} style={{ color: 'var(--color-brand)' }} />
            <span>Loading mapping workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar breadcrumb="Exams / Mapping" onBack={() => router.push('/')} />

        <div className="mapping-screen">
          {/* Left: Question list */}
          <QuestionList
            questions={result.questions}
            mappings={result.mappings}
            selectedId={selectedQuestion?.id}
            onSelect={(q) => selectQuestion(q, result)}
            unmatchedRegions={result.unmatchedRegions}
          />

          {/* Right: PDF viewer */}
          <PdfViewer
            fileUrl={answerSheetUrl}
            highlights={activeHighlights}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
