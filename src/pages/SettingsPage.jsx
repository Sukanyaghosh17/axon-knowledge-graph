import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Plus, Search, Archive, Folder, HelpCircle,
  ChevronDown, ChevronUp, Moon, Sun, Download, Upload,
  LogOut, User, Lightbulb, CheckCircle2, BookOpen,
  Monitor, Palette, Info, ExternalLink
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './SettingsPage.css';

/* ── Sidebar (shared) ─────────────────────────────────────── */
const Sidebar = ({ navigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [foldersExpanded, setFoldersExpanded] = useState(true);

  const DEFAULT_FOLDERS = [
    { name: 'Ideas', color: '#FEF08A', icon: 'bulb', iconColor: '#ca8a04' },
  ];

  return (
    <aside className="settings-sidebar">
      {/* Brand */}
      <div className="settings-brand">
        <div className="settings-brand-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/Logo.png" alt="Axon" className="settings-brand-logo-img" />
        </div>
        <div className="settings-brand-info" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="settings-brand-name">Axon</span>
          <span className="settings-brand-sub">Your workspace</span>
        </div>
        <button className="settings-brand-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Primary Actions */}
      <div className="settings-sidebar-actions">
        <button className="settings-action-btn settings-action-primary" onClick={() => navigate('/app/edit')}>
          <Plus size={15} /><span>Create Note</span><span className="settings-shortcut">⌘N</span>
        </button>
        <button className="settings-action-btn" onClick={() => navigate('/app')}>
          <Search size={15} /><span>Search</span><span className="settings-shortcut">⌘S</span>
        </button>
        <button className="settings-action-btn" onClick={() => navigate('/app')}>
          <Archive size={15} /><span>Archives</span><span className="settings-shortcut">⌘R</span>
        </button>
      </div>

      <div className="settings-divider" />

      {/* Folders */}
      <div className="settings-sidebar-folders">
        <div className="settings-folders-header">
          <div className="settings-folders-title">
            <Folder size={13} /><span>Folders</span>
          </div>
          <button className="settings-icon-btn" onClick={() => setFoldersExpanded(f => !f)}>
            {foldersExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        {foldersExpanded && (
          <ul className="settings-folder-list">
            {DEFAULT_FOLDERS.map(f => (
              <li key={f.name} className="settings-folder-item">
                <div className="settings-folder-icon-wrapper" style={{ background: f.color }}>
                  {f.icon === 'bulb'  && <Lightbulb    size={12} color={f.iconColor} />}
                  {f.icon === 'check' && <CheckCircle2 size={12} color={f.iconColor} />}
                  {f.icon === 'book'  && <BookOpen     size={12} color={f.iconColor} />}
                </div>
                <span>{f.name}</span>
              </li>
            ))}
            <li className="settings-folder-item new-folder" onClick={() => navigate('/app')}>
              <Plus size={13} /><span>New Folder</span>
            </li>
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="settings-sidebar-footer">
        <button className="settings-footer-btn" onClick={() => navigate('/contact')}>
          <HelpCircle size={15} /><span>Help</span>
        </button>
        <button className="settings-footer-btn active">
          <Settings size={15} /><span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

/* ── General Tab ─────────────────────────────────────────── */
const GeneralTab = () => {
  const [workspaceName, setWorkspaceName] = useState('Axon');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = { workspace: workspaceName, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'axon-notes-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-tab-content">
      {/* Workspace Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Workspace</h2>
        <div className="settings-field">
          <label className="settings-label">Workspace Name</label>
          <input
            className="settings-input"
            value={workspaceName}
            onChange={e => setWorkspaceName(e.target.value)}
          />
        </div>
        <button className="settings-btn-outline" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>

        <div className="settings-field-gap" />

        <div className="settings-field">
          <label className="settings-label">Export Notes</label>
          <p className="settings-field-desc">Export and backup all your notes.</p>
          <button className="settings-btn-outline" onClick={handleExport}>
            <Download size={14} /> Export Notes
          </button>
        </div>
      </section>

      {/* Account Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Account</h2>

        <div className="settings-profile-row">
          <div className="settings-avatar">
            <img src="/Logo.png" alt="Profile" className="settings-avatar-img" />
          </div>
          <div className="settings-profile-actions">
            <p className="settings-label">Profile Picture</p>
            <button className="settings-btn-outline small">
              <Upload size={13} /> Upload New Picture
            </button>
            <button className="settings-link-btn">Remove</button>
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-label">Email</label>
          <input
            className="settings-input"
            defaultValue="axon@example.com"
            type="email"
          />
        </div>

        <div className="settings-actions-row">
          <button className="settings-btn-outline">
            <User size={14} /> Account Settings
          </button>
          <button className="settings-btn-danger">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </section>
    </div>
  );
};

/* ── Appearance Tab ──────────────────────────────────────── */
const AppearanceTab = () => {
  const { theme, toggleTheme } = useTheme();
  const [accent, setAccent] = useState('#bc6c25');
  const [fontSize, setFontSize] = useState('medium');

  const ACCENTS = [
    { label: 'Copper', value: '#bc6c25' },
    { label: 'Olive',  value: '#606c38' },
    { label: 'Forest', value: '#283618' },
    { label: 'Indigo', value: '#4338ca' },
    { label: 'Rose',   value: '#e11d48' },
    { label: 'Teal',   value: '#0d9488' },
  ];

  return (
    <div className="settings-tab-content">
      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>

        {/* Theme */}
        <div className="settings-field">
          <label className="settings-label">Color Mode</label>
          <div className="settings-theme-row">
            <button
              className={`settings-theme-card ${theme === 'light' ? 'active' : ''}`}
              onClick={() => theme === 'dark' && toggleTheme()}
            >
              <Monitor size={20} />
              <span>Light</span>
            </button>
            <button
              className={`settings-theme-card ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => theme === 'light' && toggleTheme()}
            >
              <Moon size={20} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Accent */}
        <div className="settings-field">
          <label className="settings-label">Accent Color</label>
          <div className="settings-accent-row">
            {ACCENTS.map(a => (
              <button
                key={a.value}
                className={`settings-accent-dot ${accent === a.value ? 'active' : ''}`}
                style={{ background: a.value }}
                title={a.label}
                onClick={() => setAccent(a.value)}
              />
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="settings-field">
          <label className="settings-label">Editor Font Size</label>
          <div className="settings-font-row">
            {['small', 'medium', 'large'].map(s => (
              <button
                key={s}
                className={`settings-font-btn ${fontSize === s ? 'active' : ''}`}
                onClick={() => setFontSize(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

/* ── About Tab ───────────────────────────────────────────── */
const AboutTab = () => (
  <div className="settings-tab-content">
    <section className="settings-section">
      <h2 className="settings-section-title">About Axon</h2>
      <div className="settings-about-logo-row">
        <img src="/Logo.png" alt="Axon" className="settings-about-logo" />
        <div>
          <p className="settings-about-name">Axon</p>
          <p className="settings-about-version">Version 1.0.0</p>
        </div>
      </div>
      <p className="settings-about-desc">
        Axon is a premium knowledge-graph note-taking application designed to help
        you capture, connect, and discover your ideas — all in one beautiful workspace.
      </p>
      <div className="settings-about-links">
        <a href="#" className="settings-link-item">
          <ExternalLink size={13} /> Privacy Policy
        </a>
        <a href="#" className="settings-link-item">
          <ExternalLink size={13} /> Terms of Service
        </a>
        <a href="#" className="settings-link-item">
          <ExternalLink size={13} /> Open Source Licenses
        </a>
      </div>
    </section>
  </div>
);

/* ── SettingsPage ─────────────────────────────────────────── */
const TABS = [
  { id: 'general',    label: 'General',    Icon: Settings },
  { id: 'appearance', label: 'Appearance', Icon: Palette  },
  { id: 'about',      label: 'About',      Icon: Info     },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="settings-root">
      <Sidebar navigate={navigate} />

      <main className="settings-main">
        {/* Header */}
        <div className="settings-header">
          <Settings size={22} className="settings-header-icon" />
          <h1 className="settings-header-title">Settings</h1>
        </div>

        <div className="settings-body">
          {/* Sub-nav */}
          <nav className="settings-subnav">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`settings-subnav-item ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}

            {/* Footer info */}
            <div className="settings-subnav-footer">
              <span className="settings-subnav-version">
                <strong>Axon</strong> 1.0.0
              </span>
              <a href="#" className="settings-subnav-link">Privacy Policy</a>
              <a href="#" className="settings-subnav-link">Terms of Service</a>
            </div>
          </nav>

          {/* Content */}
          <div className="settings-content">
            {activeTab === 'general'    && <GeneralTab />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'about'      && <AboutTab />}

            {/* Decorative illustration */}
            <div className="settings-illustration">
              <img src="/Book.png" alt="" className="settings-illus-img" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
