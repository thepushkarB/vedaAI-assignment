'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Upload01Icon,
  Pdf01Icon,
  Cancel01Icon,
  SparklesIcon,
  TeacherIcon,
  ArrowRight01Icon,
  Alert01Icon,
} from '@hugeicons/core-free-icons';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 20;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadZone({ label, file, onFile, onClear }) {
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragover(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) validateAndSet(dropped, onFile);
    },
    [onFile]
  );

  function validateAndSet(f, setter) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      alert('Only PDF and image files (JPG, PNG, WEBP) are supported.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setter(f);
  }

  return (
    <div
      className={`upload-zone ${dragover ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragover(true);
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSet(f, onFile);
          e.target.value = '';
        }}
      />

      {file ? (
        <>
          <button
            type="button"
            className="upload-zone-clear"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Remove file"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
          <div className="upload-zone-file">
            <div className="upload-zone-file-icon">
              <HugeiconsIcon icon={Pdf01Icon} size={20} />
            </div>
            <div className="upload-zone-file-info">
              <div className="upload-zone-file-name">{file.name}</div>
              <div className="upload-zone-file-meta">{formatSize(file.size)}</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="upload-zone-icon">
            <HugeiconsIcon icon={Upload01Icon} size={32} />
          </div>
          <div className="upload-zone-label">
            Upload <span>{label}</span>
          </div>
          <div className="upload-zone-hint">Max {MAX_SIZE_MB}MB • PDF or Image</div>
        </>
      )}
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState(null);

  const canStart = questionPaper && answerSheet && !isProcessing;

  async function handleStartMapping() {
    if (!canStart) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStep('Extracting questions...');

    try {
      const formData = new FormData();
      formData.append('questionPaper', questionPaper);
      formData.append('answerSheet', answerSheet);

      setProcessingStep('Analysing with Gemini AI...');

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setProcessingStep('Mapping answers...');

      // Store result in sessionStorage so mapping page can access it
      sessionStorage.setItem('veda_result', JSON.stringify(data));

      // Also store the file as object URL for PDF viewer
      const answerSheetUrl = URL.createObjectURL(answerSheet);
      sessionStorage.setItem('veda_answer_url', answerSheetUrl);

      router.push('/mapping');
    } catch (err) {
      console.error('[Upload] Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsProcessing(false);
      setProcessingStep('');
    }
  }

  // Show processing screen
  if (isProcessing) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <TopBar />
          <div className="processing-screen">
            {/* Sparkle animation */}
            <div className="processing-sparkle">
              <HugeiconsIcon
                icon={SparklesIcon}
                size={48}
                style={{ color: 'var(--color-brand)' }}
              />
            </div>

            <div className="processing-title">Extracting...</div>
            <div className="processing-sub">This may take a while</div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Extracting questions from question paper',
                'Analysing answer sheet regions',
                'Mapping answers to questions',
              ].map((step, i) => {
                const isCurrent = processingStep
                  .toLowerCase()
                  .includes(['extract', 'analys', 'mapping'][i]);
                return (
                  <div key={i} className={`processing-step ${isCurrent ? 'active' : ''}`}>
                    <div className="processing-step-dot" />
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar />

        <div className="upload-screen">
          {/* Avatar / hero */}
          <div className="upload-hero">
            <div className="upload-avatar">
              <div className="upload-avatar-ring">
                <HugeiconsIcon
                  icon={TeacherIcon}
                  size={36}
                  style={{ color: 'var(--color-brand)' }}
                />
              </div>
            </div>
            <h1>
              Upload <span>Question Paper & Answer Sheets</span>
            </h1>
            <p>Upload both files to get started</p>
          </div>

          {/* Upload zones */}
          <div className="upload-zones">
            <UploadZone
              label="Question Paper"
              file={questionPaper}
              onFile={setQuestionPaper}
              onClear={() => setQuestionPaper(null)}
            />
            <UploadZone
              label="Answer Sheet"
              file={answerSheet}
              onFile={setAnswerSheet}
              onClear={() => setAnswerSheet(null)}
            />
          </div>

          {/* CTA */}
          <div className="upload-cta">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canStart}
              onClick={handleStartMapping}
            >
              <span>Start Mapping</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
            <p className="upload-footer-note">
              Once both files are uploaded, you&apos;ll be able to map answers with questions
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <HugeiconsIcon icon={Alert01Icon} size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
