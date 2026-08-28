'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  Grid2X2Icon,
  Presentation01Icon,
  AssignmentsIcon,
  ClipboardCheckIcon,
  Book02Icon,
  Settings02Icon,
  SparklesIcon,
  SchoolIcon,
} from '@hugeicons/core-free-icons';

const navItems = [
  { label: 'Home', icon: Grid2X2Icon },
  { label: 'My Classroom', icon: Presentation01Icon },
  { label: 'Assignments', icon: AssignmentsIcon },
  { label: 'Exams', icon: ClipboardCheckIcon, active: true },
  { label: 'My Library', icon: Book02Icon },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">V</div>
        <span className="sidebar-logo-text">VedaAI</span>
      </div>

      {/* Toolkit button */}
      <div className="sidebar-toolkit">
        <HugeiconsIcon icon={SparklesIcon} size={16} />
        AI Teacher&apos;s Toolkit
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
          >
            <HugeiconsIcon icon={item.icon} size={18} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div style={{ padding: '8px 16px' }}>
        <div className="sidebar-nav-item">
          <HugeiconsIcon icon={Settings02Icon} size={18} />
          <span>Settings</span>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">
          <HugeiconsIcon icon={SchoolIcon} size={18} />
        </div>
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-name">Delhi Public School</div>
          <div className="sidebar-footer-sub">Bokaro Steel City</div>
        </div>
      </div>
    </aside>
  );
}
