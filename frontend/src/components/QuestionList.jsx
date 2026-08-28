'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';

/**
 * QuestionList — displays extracted questions with mapping status matching Figma reference.
 * Supports active selection, expandable AI feedback, and responsive layout.
 */
export default function QuestionList({
  questions = [],
  mappings = [],
  selectedId = null,
  onSelect,
  unmatchedRegions = [],
  className = '',
}) {
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedMap, setExpandedMap] = useState({});

  // Build a quick lookup: questionId → mapping
  const mappingByQuestionId = Object.fromEntries(
    mappings.map((m) => [m.questionId, m])
  );

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleExpandAll = () => {
    const next = !expandedAll;
    setExpandedAll(next);
    const newMap = {};
    questions.forEach((q) => {
      newMap[q.id] = next;
    });
    setExpandedMap(newMap);
  };

  function getScoreBadge(q) {
    if (q.status === 'matched') {
      const marks = q.marks || 2;
      return (
        <span className="question-item-badge badge-matched">
          {marks}/{marks}
        </span>
      );
    }
    if (q.status === 'unanswered') {
      const marks = q.marks || 2;
      return (
        <span className="question-item-badge badge-unanswered">
          0/{marks}
        </span>
      );
    }
    return (
      <span className="question-item-badge badge-ambiguous">
        1/3
      </span>
    );
  }

  return (
    <div className={`question-panel ${className}`}>
      <div className="question-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="question-panel-title">Extracted Questions (from question paper)</div>
            {questions.length > 0 && (
              <div className="question-panel-sub" style={{ marginTop: 2 }}>
                {questions.filter((q) => q.status === 'matched').length} of {questions.length} questions answered
              </div>
            )}
          </div>

          {questions.length > 0 && (
            <button
              type="button"
              onClick={handleToggleExpandAll}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {expandedAll ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>
      </div>

      <div className="question-list">
        {unmatchedRegions.length > 0 && (
          <div className="unmatched-banner" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <HugeiconsIcon icon={Alert01Icon} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {unmatchedRegions.length} answer region{unmatchedRegions.length > 1 ? 's' : ''} detected without matching questions.
            </span>
          </div>
        )}

        {questions.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 13,
            }}
          >
            No questions extracted yet
          </div>
        ) : (
          questions.map((q) => {
            const isSelected = q.id === selectedId;
            const isExpanded = expandedMap[q.id] || isSelected;
            const mapping = mappingByQuestionId[q.id];

            return (
              <div
                key={q.id}
                className={`question-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect?.(q)}
              >
                {/* Top row: Number circle, Score badge, Chevron */}
                <div className="question-item-top">
                  <div className="question-item-num">
                    {q.part ? `${q.number} ${q.part}.` : q.displayNumber}
                  </div>

                  <div className="question-item-right-actions">
                    {getScoreBadge(q)}
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(q.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        padding: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <HugeiconsIcon
                        icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                        size={15}
                      />
                    </button>
                  </div>
                </div>

                {/* Question body text */}
                <div className="question-item-text">{q.text}</div>

                {/* Expanded AI feedback block */}
                {isExpanded && (
                  <div className="question-feedback-box">
                    <div className="question-feedback-title">
                      AI Feedback
                    </div>
                    <div className="question-feedback-body">
                      {mapping?.status === 'matched' ? (
                        <>
                          Excellent work! Corresponding answer region identified and highlighted on the answer sheet.
                        </>
                      ) : (
                        <>
                          No corresponding answer detected on the student answer sheet.
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
