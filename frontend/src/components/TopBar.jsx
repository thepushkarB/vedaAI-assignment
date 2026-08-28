'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ClipboardCheckIcon,
  CircleQuestionMarkIcon,
  BellIcon,
  SparklesIcon,
  ArrowDown01Icon,
  Menu01Icon,
} from '@hugeicons/core-free-icons';

/**
 * TopBar — responsive top bar matching Figma desktop and mobile specifications
 */
export default function TopBar({ breadcrumb = 'Exams', onBack }) {
  return (
    <header className="top-bar">
      {/* Left side */}
      <div className="top-bar-left">
        <button
          type="button"
          onClick={onBack}
          className="top-bar-back-btn"
          aria-label="Go back"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </button>

        {/* Desktop breadcrumb */}
        <div className="top-bar-breadcrumb desktop-only">
          <HugeiconsIcon icon={ClipboardCheckIcon} size={16} />
          <span>{breadcrumb}</span>
        </div>

        {/* Mobile brand title */}
        <div className="top-bar-mobile-brand mobile-only">
          <div className="top-bar-logo-icon">V</div>
          <span className="top-bar-logo-text">VedaAI</span>
        </div>
      </div>

      <div className="top-bar-spacer" />

      {/* Right side actions */}
      <div className="top-bar-actions">
        {/* Desktop help & AI icons */}
        <button
          type="button"
          className="top-bar-icon-btn desktop-only"
          aria-label="Help"
        >
          <HugeiconsIcon icon={CircleQuestionMarkIcon} size={18} />
        </button>

        {/* Notification with badge dot */}
        <button
          type="button"
          className="top-bar-icon-btn top-bar-notif-btn"
          aria-label="Notifications"
        >
          <HugeiconsIcon icon={BellIcon} size={18} />
          <span className="notif-dot" />
        </button>

        {/* Desktop AI Feature icon */}
        <button
          type="button"
          className="top-bar-icon-btn desktop-only"
          style={{ color: 'var(--color-brand)' }}
          aria-label="AI Features"
        >
          <HugeiconsIcon icon={SparklesIcon} size={18} />
        </button>

        {/* User profile avatar */}
        <div className="top-bar-profile">
          <div className="top-bar-avatar">PB</div>
          <span className="top-bar-user-name desktop-only">Pushkar Bankar</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            className="desktop-only"
            style={{ color: 'var(--color-text-secondary)' }}
          />
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="top-bar-icon-btn mobile-only"
          aria-label="Menu"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} />
        </button>
      </div>
    </header>
  );
}
