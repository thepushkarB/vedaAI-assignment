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
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'answerSheet'

  // Load data from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('veda_result');
    const url = sessionStorage.getItem('veda_answer_url');

    if (!raw || !url) {
      router.replace('/');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setResult(parsed);
      setAnswerSheetUrl(url);

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

    const mapping = r.mappings?.find((m) => m.questionId === question.id);

    if (!mapping || mapping.status !== 'matched') {
      setActiveHighlights([]);
      return;
    }

    const regions = r.answerRegions?.filter((ar) =>
      mapping.answerRegionIds?.includes(ar.id)
    ) || [];

    setActiveHighlights(regions);

    if (regions.length > 0) {
      setCurrentPage(regions[0].page);
    }
  }

  const handleSelectAndSwitchTab = (question) => {
    selectQuestion(question);
    // On small screens, smoothly switch to answer sheet to show the highlight
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setActiveTab('answerSheet');
    }
  };

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
            <HugeiconsIcon icon={SparklesIcon} size={32} style={{ color: 'var(--color-brand)' }} />
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

        {/* Mobile / Tablet Segmented Pill Tab Switcher */}
        <div className="mobile-tab-container">
          <div className="mobile-tab-switcher">
            <button
              type="button"
              className={`mobile-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </button>
            <button
              type="button"
              className={`mobile-tab-btn ${activeTab === 'answerSheet' ? 'active' : ''}`}
              onClick={() => setActiveTab('answerSheet')}
            >
              Answer Sheet
            </button>
          </div>
        </div>

        <div className="mapping-screen">
          {/* Left panel: Question list */}
          <QuestionList
            questions={result.questions || []}
            mappings={result.mappings || []}
            selectedId={selectedQuestion?.id}
            onSelect={handleSelectAndSwitchTab}
            unmatchedRegions={result.unmatchedRegions || []}
            className={activeTab !== 'questions' ? 'mobile-hidden' : ''}
          />

          {/* Right panel: PDF viewer */}
          <PdfViewer
            fileUrl={answerSheetUrl}
            highlights={activeHighlights}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            className={activeTab !== 'answerSheet' ? 'mobile-hidden' : ''}
          />
        </div>
      </div>
    </div>
  );
}
