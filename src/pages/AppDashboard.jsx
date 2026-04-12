import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Archive, FolderOpen, HelpCircle, Settings,
  ChevronRight, ChevronLeft, PenSquare, Tag, Folder,
  ChevronDown, ChevronUp, Moon, Sun, X, CheckSquare, Square
} from 'lucide-react';
import { fetchAllNotes, createNote } from '../api';
import { useTheme } from '../context/ThemeContext';
import './AppDashboard.css';

/* ── helpers ───────────────────────────────────────────── */
const CARD_COLORS = [
  { bg: '#EDE9FE', label: '#7C3AED' },  // purple
  { bg: '#FEE2E2', label: '#DC2626' },  // red/rose
  { bg: '#FEF9C3', label: '#CA8A04' },  // yellow
  { bg: '#F0FDF4', label: '#16A34A' },  // green (last card fades)
];

const FOLDER_COLORS = [
  '#F97316', '#FB923C', '#FDBA74', '#F59E0B', '#FCD34D',
];

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (str) =>
  str
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/* ── sub-components ─────────────────────────────────────── */
const NoteCard = ({ note, color, onClick }) => {
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
        <span className="dash-card-time">{formatTime(note.updatedAt)}</span>
      </div>
      <div className="dash-card-body">
        {lines.length > 0 ? (
          lines.map((l, i) => (
            <p key={i} className="dash-card-line">{l}</p>
          ))
        ) : (
          <p className="dash-card-empty">No content yet…</p>
        )}
      </div>
      <div className="dash-card-footer">
        <button className="dash-card-edit-btn" onClick={(e) => { e.stopPropagation(); onClick(note._id); }}>
          <PenSquare size={14} />
        </button>
      </div>
    </div>
  );
};

const FolderCard = ({ name, color, onClick }) => (
  <div className="dash-folder-card" onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className="dash-folder-icon" style={{ background: color }}>
      <FolderOpen size={22} color="#fff" />
      <span className="dash-folder-initials">{getInitials(name)}</span>
    </div>
    <span className="dash-folder-label">{name}</span>
  </div>
);

/* ── main component ─────────────────────────────────────── */
const AppDashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [noteFilter, setNoteFilter] = useState('today');
  const [folderFilter, setFolderFilter] = useState('all');
  const [noteOffset, setNoteOffset] = useState(0);
  const [folderOffset, setFolderOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  // Folder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderVisibility, setNewFolderVisibility] = useState('private');

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

  const handleCreateNote = async () => {
    setCreating(true);
    try {
      const res = await createNote({ title: 'Untitled Note', content: '', tags: [] });
      navigate(`/app/edit?note=${res.data.data._id}`);
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenNote = (id) => navigate(`/app/edit?note=${id}`);

  /* derive folders from tags */
  const allFolders = [...new Set(notes.flatMap((n) => n.tags || []))].sort();

  /* filter notes */
  const now = new Date();
  const filteredNotes = notes.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) ||
             (n.content || '').toLowerCase().includes(q) ||
             (n.tags || []).some(t => t.toLowerCase().includes(q));
    }
    const d = new Date(n.updatedAt);
    if (noteFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (noteFilter === 'week') {
      return now - d < 7 * 86400000;
    }
    return true; // month — show all for demo
  });

  /* pagination */
  const NOTES_PER_PAGE = 4;
  const FOLDERS_PER_PAGE = 5;
  const visibleNotes = filteredNotes.slice(noteOffset, noteOffset + NOTES_PER_PAGE);
  const visibleFolders = allFolders.slice(folderOffset, folderOffset + FOLDERS_PER_PAGE);

  return (
    <div className="dash-root">
      {/* ── Left Sidebar ── */}
      <aside className="dash-sidebar">
        {/* Brand */}
        <div className="dash-brand">
          <div className="dash-brand-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src="/Logo.png" alt="Axon" className="dash-brand-logo-img" />
          </div>
          <div className="dash-brand-info" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="dash-brand-name">Axon</span>
            <span className="dash-brand-sub">Knowledge Graph</span>
          </div>
          <button className="dash-brand-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
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
            <span className="dash-shortcut">⌘N</span>
          </button>
          <button
            className="dash-action-btn"
            onClick={() => setShowSearch((s) => !s)}
          >
            <Search size={15} />
            <span>Search</span>
            <span className="dash-shortcut">⌘S</span>
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
          <button className="dash-action-btn" onClick={() => { setNoteFilter('month'); setSearchQuery(''); setShowSearch(false); }}>
            <Archive size={15} />
            <span>Archives</span>
            <span className="dash-shortcut">⌘R</span>
          </button>
        </div>

        <div className="dash-divider" />

        {/* Folders */}
        <div className="dash-sidebar-folders">
          <div className="dash-folders-header">
            <div className="dash-folders-title">
              <Folder size={14} />
              <span>Folders</span>
            </div>
            <div className="dash-folders-controls">
              <button 
                className="dash-icon-btn" 
                title="New folder (add a tag)"
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
              {allFolders.length === 0 && (
                <li className="dash-folder-item dash-folder-empty">No folders yet</li>
              )}
              {allFolders.map((folder) => (
                <li
                  key={folder}
                  className="dash-folder-item"
                  onClick={() => setSearchQuery(folder)}
                >
                  <Tag size={12} />
                  {folder}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="dash-sidebar-footer">
          <button className="dash-footer-btn" onClick={() => navigate('/contact')}>
            <HelpCircle size={15} />
            Help
          </button>
          <button className="dash-footer-btn" title="Settings — coming soon" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <Settings size={15} />
            Settings
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="dash-main">
        {/* ── My Notes ── */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">My Notes</h2>
            <div className="dash-filter-tabs">
              {['today', 'week', 'month'].map((f) => (
                <button
                  key={f}
                  className={`dash-filter-tab ${noteFilter === f ? 'active' : ''}`}
                  onClick={() => { setNoteFilter(f); setNoteOffset(0); }}
                >
                  {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-cards-row">
            <div className="dash-cards-grid">
              {loading && (
                <div className="dash-loading">
                  <div className="dash-spinner" />
                </div>
              )}
              {!loading && visibleNotes.length === 0 && (
                <div className="dash-empty">
                  <span>No notes for this period.</span>
                  <button className="dash-empty-create" onClick={handleCreateNote}>
                    <Plus size={14} /> Create one
                  </button>
                </div>
              )}
              {!loading && visibleNotes.map((note, i) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  color={CARD_COLORS[i % CARD_COLORS.length]}
                  onClick={handleOpenNote}
                />
              ))}
            </div>

            {filteredNotes.length > NOTES_PER_PAGE && (
              <div className="dash-carousel-btns">
                <button
                  className="dash-carousel-btn"
                  disabled={noteOffset === 0}
                  onClick={() => setNoteOffset((o) => Math.max(0, o - NOTES_PER_PAGE))}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="dash-carousel-btn"
                  disabled={noteOffset + NOTES_PER_PAGE >= filteredNotes.length}
                  onClick={() => setNoteOffset((o) => o + NOTES_PER_PAGE)}
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
            <h2 className="dash-section-title">Recent Folders</h2>
            <div className="dash-filter-tabs">
              {['all', 'recent', 'modified'].map((f) => (
                <button
                  key={f}
                  className={`dash-filter-tab ${folderFilter === f ? 'active' : ''}`}
                  onClick={() => { setFolderFilter(f); setFolderOffset(0); }}
                >
                  {f === 'all' ? 'All' : f === 'recent' ? 'Recent' : 'Last modified'}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-cards-row">
            <div className="dash-folders-grid">
              {allFolders.length === 0 ? (
                <div className="dash-empty">
                  <span>No folders. Add tags to your notes to create folders.</span>
                </div>
              ) : (
                visibleFolders.map((folder, i) => (
                  <FolderCard
                    key={folder}
                    name={folder}
                    color={FOLDER_COLORS[i % FOLDER_COLORS.length]}
                    onClick={() => setSearchQuery(folder)}
                  />
                ))
              )}
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
        </section>
      </main>

      {/* ── Folder Modal ── */}
      {isFolderModalOpen && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            <div className="dash-modal-header">
              <h3>Create new folder</h3>
              <button className="dash-modal-close" onClick={() => setIsFolderModalOpen(false)}>
                <X size={18} />
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
              
              <div className="dash-modal-visibility">
                <label className="dash-modal-label">Set visibility to</label>
                
                <div 
                  className={`dash-visibility-option ${newFolderVisibility === 'private' ? 'selected' : ''}`}
                  onClick={() => setNewFolderVisibility('private')}
                >
                  <div className="dash-visibility-check">
                    {newFolderVisibility === 'private' ? <CheckSquare size={16} className="checked-icon" /> : <Square size={16} />}
                  </div>
                  <div className="dash-visibility-text">
                    <span className="dash-visibility-title">Private</span>
                    <span className="dash-visibility-desc">Only you can access this folder</span>
                  </div>
                </div>
                
                <div 
                  className={`dash-visibility-option ${newFolderVisibility === 'public' ? 'selected' : ''}`}
                  onClick={() => setNewFolderVisibility('public')}
                >
                  <div className="dash-visibility-check">
                    {newFolderVisibility === 'public' ? <CheckSquare size={16} className="checked-icon" /> : <Square size={16} />}
                  </div>
                  <div className="dash-visibility-text">
                    <span className="dash-visibility-title">Public</span>
                    <span className="dash-visibility-desc">Everyone can have access to it</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="dash-modal-footer">
              <button className="dash-modal-cancel" onClick={() => setIsFolderModalOpen(false)}>Cancel</button>
              <button className="dash-modal-create" onClick={() => {
                // Future folder creation logic goes here
                setIsFolderModalOpen(false);
                setNewFolderName('');
              }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppDashboard;
