'use client';

/**
 * TopBar — breadcrumb + user avatar area
 */
export default function TopBar({ breadcrumb = 'Exams' }) {
  return (
    <div className="top-bar">
      {/* Back arrow */}
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          fontSize: 16,
          padding: '2px 6px',
        }}
      >
        ←
      </button>

      {/* Breadcrumb */}
      <div className="top-bar-breadcrumb">
        <span>📋</span>
        <span>{breadcrumb}</span>
      </div>

      <div className="top-bar-spacer" />

      {/* Right actions */}
      <div className="top-bar-actions">
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: 16,
          }}
        >
          ?
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: 16,
          }}
        >
          🔔
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--color-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            M
          </div>
          Madhur Rastogi
        </div>
      </div>
    </div>
  );
}
