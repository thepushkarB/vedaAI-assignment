'use client';

/**
 * QuestionList — displays extracted questions with mapping status.
 * Selecting a question triggers onSelect(question).
 */
export default function QuestionList({
  questions = [],
  mappings = [],
  selectedId = null,
  onSelect,
  unmatchedRegions = [],
}) {
  // Build a quick lookup: questionId → mapping
  const mappingByQuestionId = Object.fromEntries(
    mappings.map((m) => [m.questionId, m])
  );

  function getStatusBadge(status) {
    switch (status) {
      case 'matched':
        return <span className="question-item-badge badge-matched">Answered</span>;
      case 'unanswered':
        return <span className="question-item-badge badge-unanswered">No Answer</span>;
      case 'ambiguous':
        return <span className="question-item-badge badge-ambiguous">Ambiguous</span>;
      default:
        return null;
    }
  }

  return (
    <div className="question-panel">
      <div className="question-panel-header">
        <div className="question-panel-title">Extracted Questions</div>
        <div className="question-panel-sub">from question paper</div>
        {questions.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {questions.filter((q) => q.status === 'matched').length} / {questions.length} answered
          </div>
        )}
      </div>

      {unmatchedRegions.length > 0 && (
        <div className="unmatched-banner">
          ⚠ {unmatchedRegions.length} answer region{unmatchedRegions.length > 1 ? 's' : ''} could
          not be matched to any question
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
                  {getStatusBadge(q.status)}
                </div>

                {q.marks != null && (
                  <div className="question-item-marks">{q.marks} marks</div>
                )}

                {isSelected && mapping?.status === 'matched' && (
                  <div
                    style={{
                      marginTop: 8,
                      marginLeft: 34,
                      fontSize: 12,
                      color: 'var(--color-matched)',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Answer located on page{' '}
                    {/* Show page numbers */}
                    {[...new Set(
                      mapping.answerRegionIds.length > 0 ? ['see highlight'] : []
                    )].join(', ')}
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
