'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from '@hugeicons/core-free-icons';

/**
 * QuestionList — renders question cards matching Figma spec (img-2)
 */
export default function QuestionList({
  questions = [],
  mappings = [],
  selectedId = null,
  onSelect,
  unmatchedRegions = [],
  className = '',
}) {
  const [expandedMap, setExpandedMap] = useState({});

  const mappingByQuestionId = Object.fromEntries(
    mappings.map((m) => [m.questionId, m])
  );

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function getScoreBadge(q) {
    const marks = q.marks || 2;
    if (q.status === 'matched') {
      return (
        <span className="question-item-badge badge-matched">
          {marks}/{marks}
        </span>
      );
    }
    if (q.status === 'unanswered') {
      return (
        <span className="question-item-badge badge-unanswered">
          0/{marks}
        </span>
      );
    }
    return (
      <span className="question-item-badge badge-ambiguous">
        1/{marks}
      </span>
    );
  }

  return (
    <div className={`question-panel ${className}`}>
      <div className="question-panel-header">
        <div className="question-panel-title">Extracted Questions (from question paper)</div>
      </div>

      <div className="question-list">
        {unmatchedRegions.length > 0 && (
          <div className="unmatched-banner" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <HugeiconsIcon icon={Alert01Icon} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {unmatchedRegions.length} answer region{unmatchedRegions.length > 1 ? 's' : ''} could not be matched to any question
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
                {/* Top Row: Left circle number, Right score badge + Chevron */}
                <div className="question-item-top">
                  <div className="question-item-num">
                    {q.part ? `${q.number}${q.part}` : q.displayNumber}
                  </div>

                  <div className="question-item-right-actions">
                    {getScoreBadge(q)}
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(q.id, e)}
                      className="question-chevron-btn"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <HugeiconsIcon
                        icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                        size={16}
                      />
                    </button>
                  </div>
                </div>

                {/* Question text below */}
                <div className="question-item-text">{q.text}</div>

                {/* AI Feedback card when expanded */}
                {isExpanded && (
                  <div className="question-feedback-box">
                    <div className="question-feedback-title">AI Feedback</div>
                    <div className="question-feedback-body">
                      {mapping?.status === 'matched' ? (
                        <>
                          Excellent work! Corresponding answer identified and highlighted on the answer sheet.
                        </>
                      ) : (
                        <>
                          No corresponding answer detected for this question on the answer sheet.
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
