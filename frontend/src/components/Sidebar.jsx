'use client';

const navItems = [
  { label: 'Home', icon: '⊞' },
  { label: 'My Classroom', icon: '◱' },
  { label: 'Assignments', icon: '☰' },
  { label: 'Exams', icon: '📋', active: true },
  { label: 'My Library', icon: '⊙' },
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
        <span>✦</span>
        AI Teacher's Toolkit
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div style={{ padding: '8px 16px' }}>
        <div className="sidebar-nav-item">
          <span style={{ fontSize: 15 }}>⚙</span>
          Settings
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">🏫</div>
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-name">Delhi Public School</div>
          <div className="sidebar-footer-sub">Bokaro Steel City</div>
        </div>
      </div>
    </aside>
  );
}
