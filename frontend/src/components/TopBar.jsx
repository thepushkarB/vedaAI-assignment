'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ClipboardCheckIcon,
  CircleQuestionMarkIcon,
  BellIcon,
  SparklesIcon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';

/**
 * TopBar — breadcrumb + user avatar area matching Figma design
 */
export default function TopBar({ breadcrumb = 'Exams', onBack }) {
  return (
    <div className="top-bar">
      {/* Back arrow */}
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
        }}
        aria-label="Go back"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="top-bar-breadcrumb">
        <HugeiconsIcon icon={ClipboardCheckIcon} size={16} />
        <span>{breadcrumb}</span>
      </div>

      <div className="top-bar-spacer" />

      {/* Right actions */}
      <div className="top-bar-actions">
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}
          aria-label="Help"
        >
          <HugeiconsIcon icon={CircleQuestionMarkIcon} size={18} />
        </button>

        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}
          aria-label="Notifications"
        >
          <HugeiconsIcon icon={BellIcon} size={18} />
        </button>

        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}
          aria-label="AI Features"
        >
          <HugeiconsIcon icon={SparklesIcon} size={18} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--color-text-primary)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#F97316',
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
          <span>Madhur Rastogi</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      </div>
    </div>
  );
}
