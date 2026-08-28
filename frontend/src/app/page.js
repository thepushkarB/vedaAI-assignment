'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 20;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadZone({ label, file, onFile, onClear, accept }) {
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
      onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
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
            className="upload-zone-clear"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            title="Remove file"
          >
            ×
          </button>
          <div className="upload-zone-file">
            <div className="upload-zone-file-icon">PDF</div>
            <div className="upload-zone-file-info">
              <div className="upload-zone-file-name">{file.name}</div>
              <div className="upload-zone-file-meta">{formatSize(file.size)}</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="upload-zone-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
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
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z"/>
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: -12 }}>
                <path d="M19 3l0.75 2.75L22.5 6.5l-2.75.75L19 10l-.75-2.75L15.5 6.5l2.75-.75z"/>
              </svg>
            </div>

            <div className="processing-title">Extracting...</div>
            <div className="processing-sub">This may take a while</div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                    {step}
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
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
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
              className="btn btn-primary"
              disabled={!canStart}
              onClick={handleStartMapping}
            >
              Start Mapping →
            </button>
            <p className="upload-footer-note">
              Once both files are uploaded, you&apos;ll be able to map answers with questions
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-message">
              ⚠ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
