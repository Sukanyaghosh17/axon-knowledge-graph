import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Plus, Search, Archive, Folder, HelpCircle,
  ChevronDown, ChevronUp, Moon, Sun, Download, Upload,
  LogOut, User, Lightbulb, CheckCircle2, BookOpen,
  Monitor, Palette, Info, ExternalLink, Save
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

      <div className="settings-sidebar-actions">
        <button className="settings-action-btn settings-action-primary" onClick={() => navigate('/app/edit')}>
          <Plus size={15} /><span>Create Note</span>
        </button>
        <button className="settings-action-btn" onClick={() => navigate('/app')}>
          <Search size={15} /><span>Search</span>
        </button>
        <button className="settings-action-btn" onClick={() => navigate('/app')}>
          <Archive size={15} /><span>Archives</span>
        </button>
      </div>

      <div className="settings-divider" />

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
const GeneralTab = ({ settings, setSettings }) => {
  const fileInputRef = useRef(null);

  const getAvatarUrl = () => {
    if (settings.customAvatar) return settings.customAvatar;
    if (settings.gender === 'Male') return '/avtar_Male.png';
    if (settings.gender === 'Female') return '/avtar_Female.png';
    return '/avtar_others.png';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSettings({ ...settings, customAvatar: url });
    }
  };

  const handleRemoveAvatar = () => {
    setSettings({ ...settings, customAvatar: null, gender: 'Other' });
  };

  const handleExport = () => {
    const data = { workspace: settings.workspaceName, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'axon-notes-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-tab-content">
      <section className="settings-section">
        <h2 className="settings-section-title">Workspace</h2>
        <div className="settings-field">
          <label className="settings-label">Workspace Name</label>
          <input
            className="settings-input"
            value={settings.workspaceName}
            onChange={e => setSettings({ ...settings, workspaceName: e.target.value })}
          />
        </div>
        <div className="settings-field">
          <label className="settings-label">Export Notes</label>
          <p className="settings-field-desc">Export and backup all your notes.</p>
          <button className="settings-btn-outline" onClick={handleExport}>
            <Download size={14} /> Export Notes
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Account</h2>
        <div className="settings-profile-row">
          <div className="settings-avatar">
            <img src={getAvatarUrl()} alt="Profile" className="settings-avatar-img" />
          </div>
          <div className="settings-profile-actions">
            <p className="settings-label">Profile Picture</p>
            <div className="settings-gender-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {['Male', 'Female', 'Other'].map(g => (
                <button
                  key={g}
                  className={`settings-font-btn ${settings.gender === g && !settings.customAvatar ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, gender: g, customAvatar: null })}
                  style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                >
                  {g}
                </button>
              ))}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept="image/*"
            />
            <button className="settings-btn-outline small" onClick={() => fileInputRef.current.click()}>
              <Upload size={13} /> Upload New Picture
            </button>
            <button className="settings-link-btn" onClick={handleRemoveAvatar}>Remove</button>
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-label">Email</label>
          <input
            className="settings-input"
            value={settings.email}
            type="email"
            readOnly
            style={{ opacity: 0.7, cursor: 'not-allowed' }}
          />
        </div>

        <div className="settings-actions-row">
          <button className="settings-btn-danger">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </section>
    </div>
  );
};

/* ── Appearance Tab ──────────────────────────────────────── */
const AppearanceTab = ({ settings, setSettings }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-tab-content">
      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>
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

const DEFAULT_SETTINGS = {
  workspaceName: 'Axon',
  gender: 'Other',
  customAvatar: null,
  email: 'axon@example.com',
  accent: '#bc6c25',
  fontSize: 'medium'
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  // Load from localStorage or use defaults
  const [initialSettings, setInitialSettings] = useState(() => {
    const saved = localStorage.getItem('axon-user-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [currentSettings, setCurrentSettings] = useState(initialSettings);

  const isDirty = useMemo(() => {
    return JSON.stringify(initialSettings) !== JSON.stringify(currentSettings);
  }, [initialSettings, currentSettings]);

  const handleSave = () => {
    localStorage.setItem('axon-user-settings', JSON.stringify(currentSettings));
    setInitialSettings(currentSettings);
    // Optionally navigate away or show toast
  };

  const handleCancel = () => {
    setCurrentSettings(initialSettings);
    navigate('/app');
  };

  return (
    <div className="settings-root">
      <Sidebar navigate={navigate} />

      <main className="settings-main">
        <div className="settings-header">
          <Settings size={22} className="settings-header-icon" />
          <h1 className="settings-header-title">Settings</h1>
        </div>

        <div className="settings-body">
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

            <div className="settings-subnav-footer">
              <span className="settings-subnav-version">
                <strong>Axon</strong> 1.0.0
              </span>
              <a href="#" className="settings-subnav-link">Privacy Policy</a>
              <a href="#" className="settings-subnav-link">Terms of Service</a>
            </div>
          </nav>

          <div className="settings-content">
            {activeTab === 'general'    && <GeneralTab settings={currentSettings} setSettings={setCurrentSettings} />}
            {activeTab === 'appearance' && <AppearanceTab settings={currentSettings} setSettings={setCurrentSettings} />}
            {activeTab === 'about'      && <AboutTab />}

            {activeTab === 'general' && (
              <div className="settings-footer-actions" style={{ 
                marginTop: '40px', 
                paddingTop: '20px', 
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-start'
              }}>
                <button 
                  disabled={!isDirty}
                  style={{ 
                    padding: '6px 14px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    background: isDirty ? '#f1f1f1' : '#f9f9f9', 
                    border: '1px solid #d1d1d1',
                    color: isDirty ? '#444' : '#bbb',
                    cursor: isDirty ? 'pointer' : 'not-allowed',
                    fontWeight: 500,
                    opacity: isDirty ? 1 : 0.6
                  }} 
                  onClick={handleSave}
                >
                  Save Changes
                </button>
                <button 
                  style={{ 
                    padding: '6px 14px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    background: '#f1f1f1', 
                    border: '1px solid #d1d1d1',
                    color: '#444',
                    cursor: 'pointer',
                    fontWeight: 500
                  }} 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            )}

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
