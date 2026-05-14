import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Archive, FolderOpen, HelpCircle, Settings,
  ChevronRight, ChevronLeft, PenSquare, Tag, Folder,
  ChevronDown, ChevronUp, Moon, Sun, X, CheckSquare, Square,
  Lightbulb, CheckCircle2, BookOpen, Star, Lock, ArrowDown, UserCog, MoreHorizontal, Trash2
} from 'lucide-react';
import { fetchAllNotes, createNote, deleteNote } from '../api';
import { useTheme } from '../context/ThemeContext';
import './AppDashboard.css';

/* ── helpers ───────────────────────────────────────────────── */
const CARD_COLORS = [
  { bg: '#EDE9FE', label: '#7C3AED' },  /* purple */
  { bg: '#FEE2E2', label: '#DC2626' },  /* red/rose */
  { bg: '#FEF9C3', label: '#CA8A04' },  /* yellow */
  { bg: '#F0FDF4', label: '#16A34A' },  /* green */
];

const DEFAULT_FOLDERS = [
  { name: 'Ideas',   color: '#FEF08A', icon: 'bulb',  iconColor: '#ca8a04' },
];

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)    return 'Just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ── NoteCard ───────────────────────────────────────────────── */
const NoteCard = ({ note, color, onClick, onDelete }) => {
  const lines = (note.content || '')
    .replace(/[#*`_~\[\]]/g, '')
    .split('\n')
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="dash-note-card" onClick={() => onClick(note._id)}>
      <div className="dash-card-header" style={{ background: color.bg }}>
        <span className="dash-card-title" style={{ color: color.label }}>
          {note.title || 'Untitled'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="dash-card-time">{formatTime(note.updatedAt)}</span>
          <button
            className="dash-card-delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(note._id); }}
            title="Delete note"
            style={{
              background: 'transparent',
              border: 'none',
              color: color.label,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.6,
              transition: 'opacity 0.2s',
              padding: '2px'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="dash-card-body">
        {lines.length > 0 ? (
          lines.map((l, i) => <p key={i} className="dash-card-line">{l}</p>)
        ) : (
          <p className="dash-card-empty">No content yet…</p>
        )}
      </div>
      <div className="dash-card-footer">
        <button
          className="dash-card-edit-btn"
          onClick={(e) => { e.stopPropagation(); onClick(note._id); }}
          title="Edit note"
        >
          <PenSquare size={14} />
        </button>
      </div>
    </div>
  );
};

/* ── FolderCard ─────────────────────────────────────────────── */
const FolderCard = ({ name, color, iconType, iconColor, noteCount = 0, onClick }) => {
  const Icon =
    iconType === 'bulb'  ? Lightbulb  :
    iconType === 'check' ? CheckCircle2 :
    iconType === 'book'  ? BookOpen   : FolderOpen;

  return (
    <div className="dash-folder-card" onClick={onClick}>
      {/* Top row: icon + star */}
      <div className="dash-folder-card-top">
        <div className="dash-folder-icon" style={{ background: color }}>
          <Icon size={22} style={{ color: iconColor }} />
        </div>
        <Star size={16} fill="transparent" strokeWidth={2.5} className="dash-folder-star" />
      </div>

      {/* Title + subtitle */}
      <div className="dash-folder-title">{name}</div>
      <div className="dash-folder-subtitle">{noteCount} notes · 13</div>

      {/* Divider */}
      <div className="dash-folder-divider" />

      {/* Footer */}
      <div className="dash-folder-footer">
        <Lock size={12} />
        <span>{noteCount} notes · Created just now</span>
      </div>
    </div>
  );
};

/* ── AppDashboard ───────────────────────────────────────────── */
const AppDashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [notes,            setNotes]            = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [creating,         setCreating]         = useState(false);
  const [noteFilter,       setNoteFilter]       = useState('today');
  const [noteOffset,       setNoteOffset]       = useState(0);
  const [folderOffset,     setFolderOffset]     = useState(0);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [foldersExpanded,  setFoldersExpanded]  = useState(true);
  const [showSearch,       setShowSearch]       = useState(false);

  /* folder modal */
  const [isFolderModalOpen,    setIsFolderModalOpen]    = useState(false);
  const [newFolderName,        setNewFolderName]        = useState('');
  const [newFolderVisibility,  setNewFolderVisibility]  = useState('private');

  const loadNotes = useCallback(async () => {
    try {
      const res = await fetchAllNotes();
      setNotes(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleCreateNote = () => {
    navigate('/app/edit');
  };

  const handleOpenNote = (id) => navigate(`/app/edit?note=${id}`);

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  /* derive folders from tags */
  const allFolders = [...new Set(notes.flatMap((n) => n.tags || []))].sort();

  /* filter notes */
  const now = new Date();
  const filteredNotes = notes.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    const d = new Date(n.updatedAt);
    if (noteFilter === 'today') return d.toDateString() === now.toDateString();
    if (noteFilter === 'week')  return now - d < 7 * 86400000;
    return true; /* all / month — show all */
  });

  const NOTES_PER_PAGE   = 4;
  const FOLDERS_PER_PAGE = 5;
  const visibleNotes   = filteredNotes.slice(noteOffset, noteOffset + NOTES_PER_PAGE);
  const visibleFolders = allFolders.slice(folderOffset, folderOffset + FOLDERS_PER_PAGE);

  /* ── render ── */
  return (
    <div className="dash-root">

      {/* ════════════════════ LEFT SIDEBAR ════════════════════ */}
      <aside className="dash-sidebar">

        {/* Brand */}
        <div className="dash-brand">
          <div
            className="dash-brand-logo"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <img src="/Logo.png" alt="Axon" className="dash-brand-logo-img" />
          </div>
          <div
            className="dash-brand-info"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <span className="dash-brand-name">Axon</span>
            <span className="dash-brand-sub">Your workspace</span>
          </div>
          <button className="dash-brand-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Primary Actions */}
        <div className="dash-sidebar-actions">
          <button
            id="dash-create-btn"
            className="dash-action-btn dash-action-primary"
            onClick={handleCreateNote}
            disabled={creating}
          >
            <Plus size={15} />
            <span>Create Note</span>
          </button>

          <button
            className="dash-action-btn"
            onClick={() => setShowSearch((s) => !s)}
          >
            <Search size={15} />
            <span>Search</span>
          </button>

          {showSearch && (
            <input
              className="dash-search-input"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          )}

          <button
            className="dash-action-btn"
            onClick={() => { setNoteFilter('month'); setSearchQuery(''); setShowSearch(false); }}
          >
            <Archive size={15} />
            <span>Archives</span>
          </button>
        </div>

        <div className="dash-divider" />

        {/* Folders */}
        <div className="dash-sidebar-folders">
          <div className="dash-folders-header">
            <div className="dash-folders-title">
              <Folder size={13} />
              <span>Folders</span>
            </div>
            <div className="dash-folders-controls">
              <button
                className="dash-icon-btn"
                title="New folder"
                onClick={() => setIsFolderModalOpen(true)}
              >
                <Plus size={13} />
              </button>
              <button
                className="dash-icon-btn"
                onClick={() => setFoldersExpanded((f) => !f)}
              >
                {foldersExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {foldersExpanded && (
            <ul className="dash-folder-list">
              {DEFAULT_FOLDERS.map((f) => (
                <li
                  key={f.name}
                  className="dash-folder-item"
                  onClick={() => setSearchQuery(f.name)}
                >
                  <div className="dash-folder-icon-wrapper" style={{ background: f.color }}>
                    {f.icon === 'bulb'  && <Lightbulb   size={12} color={f.iconColor} />}
                    {f.icon === 'check' && <CheckCircle2 size={12} color={f.iconColor} />}
                    {f.icon === 'book'  && <BookOpen     size={12} color={f.iconColor} />}
                  </div>
                  <span>{f.name}</span>
                </li>
              ))}
              <li className="dash-folder-item new-folder" onClick={() => setIsFolderModalOpen(true)}>
                <Plus size={13} />
                <span>New Folder</span>
              </li>
            </ul>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="dash-sidebar-footer">
          <button className="dash-footer-btn" onClick={() => navigate('/contact')}>
            <HelpCircle size={15} />
            <span>Help</span>
          </button>
          <button
            className="dash-footer-btn"
            onClick={() => navigate('/app/settings')}
            title="Settings"
          >
            <Settings size={15} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* ════════════════════ MAIN CONTENT ════════════════════ */}
      <main className="dash-main">

        {/* ── My Notes ── */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">My Notes</h2>

            <div className="dash-filter-tabs">
              {[
                { key: 'today', label: 'Today'      },
                { key: 'week',  label: 'This Week'  },
                { key: 'month', label: 'This Month' },
                { key: 'all',   label: 'All'        },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`dash-filter-tab${noteFilter === key ? ' active' : ''}`}
                  onClick={() => { setNoteFilter(key); setNoteOffset(0); }}
                >
                  {label}
                </button>
              ))}
              <div className="dash-filter-icon" title="Manage workspace">
                <UserCog size={15} />
              </div>
            </div>
          </div>

          {/* Note cards */}
          <div className="dash-cards-row">
            <div className="dash-cards-grid">
              {loading && (
                <div className="dash-loading">
                  <div className="dash-spinner" />
                </div>
              )}

              {!loading && (
                <div className="dash-create-card" onClick={handleCreateNote}>
                  <img
                    src="/planner-card.png"
                    alt="Notebook illustration"
                    className="dash-create-card-img"
                  />
                  <div className="dash-create-card-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <h3 className="dash-create-card-title">
                      {visibleNotes.length === 0 ? "No notes for this period" : "Create a new note"}
                    </h3>
                    <button className="dash-create-card-btn">
                      <Plus size={14} />
                      Create Note
                    </button>
                  </div>
                </div>
              )}

              {!loading && visibleNotes.map((note, i) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  color={CARD_COLORS[i % CARD_COLORS.length]}
                  onClick={handleOpenNote}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>

            {filteredNotes.length > NOTES_PER_PAGE && (
              <div className="dash-carousel-btns">
                <button
                  className="dash-carousel-btn"
                  disabled={noteOffset === 0}
                  onClick={() => setNoteOffset((o) => Math.max(0, o - NOTES_PER_PAGE))}
                  title="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="dash-carousel-btn"
                  disabled={noteOffset + NOTES_PER_PAGE >= filteredNotes.length}
                  onClick={() => setNoteOffset((o) => o + NOTES_PER_PAGE)}
                  title="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="dash-section-divider" />

        {/* ── Recent Folders ── */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title" style={{ fontSize: '1.15rem' }}>
              Recent Folders
            </h2>
            <button
              className="dash-icon-btn"
              onClick={() => setIsFolderModalOpen(true)}
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              New Folder
              <ChevronUp size={13} />
            </button>
          </div>

          <div className="dash-cards-row">
            <div className="dash-folders-grid">
              {DEFAULT_FOLDERS.map((f) => (
                <FolderCard
                  key={f.name}
                  name={f.name}
                  color={f.color}
                  iconType={f.icon}
                  iconColor={f.iconColor}
                  noteCount={notes.filter(n => (n.tags || []).includes(f.name)).length}
                  onClick={() => setSearchQuery(f.name)}
                />
              ))}
            </div>

            {allFolders.length > FOLDERS_PER_PAGE && (
              <div className="dash-carousel-btns dash-carousel-btns--folders">
                <button
                  className="dash-carousel-btn"
                  disabled={folderOffset === 0}
                  onClick={() => setFolderOffset((o) => Math.max(0, o - FOLDERS_PER_PAGE))}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="dash-carousel-btn"
                  disabled={folderOffset + FOLDERS_PER_PAGE >= allFolders.length}
                  onClick={() => setFolderOffset((o) => o + FOLDERS_PER_PAGE)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {allFolders.length === 0 && (
            <p className="dash-folders-empty-hint">
              No folders yet. Add tags to your notes to create folders.
            </p>
          )}
        </section>
      </main>

      {/* ════════════════════ FOLDER MODAL ════════════════════ */}
      {isFolderModalOpen && (
        <div className="dash-modal-overlay" onClick={() => setIsFolderModalOpen(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>

            <div className="dash-modal-header">
              <h3>Create new folder</h3>
              <button className="dash-modal-close" onClick={() => setIsFolderModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="dash-modal-body">
              <input
                className="dash-modal-input"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />

              <label className="dash-modal-label">Set visibility to</label>

              <div className="dash-modal-visibility">
                {[
                  {
                    key: 'private',
                    title: 'Private',
                    desc: 'Only you can access this folder',
                  },
                  {
                    key: 'public',
                    title: 'Public',
                    desc: 'Everyone can have access to it',
                  },
                ].map(({ key, title, desc }) => (
                  <div
                    key={key}
                    className={`dash-visibility-option${newFolderVisibility === key ? ' selected' : ''}`}
                    onClick={() => setNewFolderVisibility(key)}
                  >
                    <div className="dash-visibility-check">
                      {newFolderVisibility === key
                        ? <CheckSquare size={16} className="checked-icon" />
                        : <Square size={16} />
                      }
                    </div>
                    <div className="dash-visibility-text">
                      <span className="dash-visibility-title">{title}</span>
                      <span className="dash-visibility-desc">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-modal-footer">
              <button
                className="dash-modal-cancel"
                onClick={() => setIsFolderModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="dash-modal-create"
                onClick={() => {
                  /* future folder creation logic */
                  setIsFolderModalOpen(false);
                  setNewFolderName('');
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppDashboard;
