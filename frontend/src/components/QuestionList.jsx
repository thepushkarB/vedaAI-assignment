'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert01Icon,
  CheckmarkCircle01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';

/**
 * QuestionList — displays extracted questions with mapping status matching Figma reference.
 * Selecting a question triggers onSelect(question).
 */
export default function QuestionList({
  questions = [],
  mappings = [],
  selectedId = null,
  onSelect,
  unmatchedRegions = [],
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

  function getStatusBadge(q, mapping) {
    if (q.status === 'matched') {
      const marksText = q.marks ? `${q.marks}/${q.marks}` : 'Matched';
      return (
        <span className="question-item-badge badge-matched">
          {marksText}
        </span>
      );
    }
    if (q.status === 'unanswered') {
      return (
        <span className="question-item-badge badge-unanswered">
          {q.marks ? `0/${q.marks}` : 'No Answer'}
        </span>
      );
    }
    return (
      <span className="question-item-badge badge-ambiguous">
        Ambiguous
      </span>
    );
  }

  return (
    <div className="question-panel">
      <div className="question-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="question-panel-title">Extracted Questions</div>
            <div className="question-panel-sub">(from question paper)</div>
          </div>
          {questions.length > 0 && (
            <button
              type="button"
              className="question-panel-expand-btn"
              onClick={handleToggleExpandAll}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '3px 8px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              {expandedAll ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>
        {questions.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
            {questions.filter((q) => q.status === 'matched').length} / {questions.length} answered
          </div>
        )}
      </div>

      {unmatchedRegions.length > 0 && (
        <div className="unmatched-banner" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <HugeiconsIcon icon={Alert01Icon} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            {unmatchedRegions.length} answer region{unmatchedRegions.length > 1 ? 's' : ''} could
            not be matched to any question
          </span>
        </div>
      )}

      <div className="question-list">
        {questions.length === 0 ? (
          <div
            style={{
              padding: '24px 12px',
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
                <div className="question-item-header">
                  <div className="question-item-num">{q.displayNumber}</div>
                  <div className="question-item-text">{q.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getStatusBadge(q, mapping)}
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(q.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label={isExpanded ? 'Collapse question' : 'Expand question'}
                    >
                      <HugeiconsIcon
                        icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                        size={14}
                      />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 10, marginLeft: 34 }}>
                    {mapping?.status === 'matched' ? (
                      <div
                        style={{
                          background: '#FFF8F5',
                          border: '1px solid #FFE2D6',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontWeight: 600,
                            color: 'var(--color-brand)',
                            marginBottom: 2,
                          }}
                        >
                          <HugeiconsIcon icon={SparklesIcon} size={14} />
                          <span>AI Assessment</span>
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          Answer identified on answer sheet. Click to jump to highlight.
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FEE2E2',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: 12,
                          color: '#DC2626',
                        }}
                      >
                        No corresponding answer detected for this question on the answer sheet.
                      </div>
                    )}
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
