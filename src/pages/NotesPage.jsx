import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus, Search, FileText, Trash2, Clock, ArrowLeft,
  Save, Eye, Edit3, Tag, X, Link2, RotateCcw, History,
  ChevronRight, ChevronsLeft, Bell
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchAllNotes, createNote, deleteNote,
  fetchNote, updateNote, fetchLinks, fetchBacklinks,
  fetchVersions, restoreVersion,
} from '../api';
import './NotesPage.css';

/* ── helpers ─────────────────────────────────────────────── */
const formatRelTime = (dateStr) => {
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatEditedTime = (dateStr) => {
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  if (diff < 60000) return 'Edited just now';
  if (diff < 3600000) return `Edited ${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `Edited ${Math.floor(diff / 3600000)}h ago`;
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  return `Edited ${d.toLocaleDateString('en-US', opts)}`;
};

const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const stripMarkdown = (text) =>
  (text || '').replace(/[#*`_~\[\]>]/g, '').replace(/\n+/g, ' ').trim();

/* ── NotesPage ───────────────────────────────────────────── */
const NotesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Note list state ──
  const [notes, setNotes]               = useState([]);
  const [listLoading, setListLoading]   = useState(true);
  const [creating, setCreating]         = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [listSearch, setListSearch]     = useState('');

  // ── Editor state ──
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeNote, setActiveNote]     = useState(null);
  const [title, setTitle]               = useState('');
  const [content, setContent]           = useState('');
  const [tags, setTags]                 = useState([]);
  const [tagInput, setTagInput]         = useState('');
  const [preview, setPreview]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [dirty, setDirty]               = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);

  // ── Right panel ──
  const [links, setLinks]               = useState([]);
  const [backlinks, setBacklinks]       = useState([]);
  const [versions, setVersions]         = useState([]);
  const [restoringIdx, setRestoringIdx] = useState(null);

  const saveTimeout = useRef(null);

  /* ─── load note list ───────────────────────────────────── */
  const loadNotes = useCallback(async () => {
    try {
      const res = await fetchAllNotes();
      setNotes(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Sync from URL ?note=
  useEffect(() => {
    const id = searchParams.get('note');
    if (id && id !== activeNoteId) openNote(id);
  }, [searchParams]);

  /* ─── open / load a note ───────────────────────────────── */
  const openNote = async (id) => {
    setActiveNoteId(id);
    setSearchParams({ note: id });
    setEditorLoading(true);
    setPreview(false);
    try {
      const [noteRes, linksRes, backRes, versRes] = await Promise.all([
        fetchNote(id),
        fetchLinks(id),
        fetchBacklinks(id),
        fetchVersions(id),
      ]);
      const n = noteRes.data.data;
      setActiveNote(n);
      setTitle(n.title);
      setContent(n.content);
      setTags(n.tags || []);
      setLinks(linksRes.data.data || []);
      setBacklinks(backRes.data.data || []);
      setVersions(versRes.data.data || []);
      setDirty(false);
    } catch (err) {
      console.error('Failed to load note:', err);
    } finally {
      setEditorLoading(false);
    }
  };

  /* ─── auto-save ────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!activeNoteId || !dirty) return;
    setSaving(true);
    try {
      await updateNote(activeNoteId, { title, content, tags });
      setDirty(false);
      loadNotes();
      const [linksRes, backRes, versRes] = await Promise.all([
        fetchLinks(activeNoteId),
        fetchBacklinks(activeNoteId),
        fetchVersions(activeNoteId),
      ]);
      setLinks(linksRes.data.data || []);
      setBacklinks(backRes.data.data || []);
      setVersions(versRes.data.data || []);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [activeNoteId, dirty, title, content, tags]);

  useEffect(() => {
    if (!dirty || !activeNoteId) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(handleSave, 1500);
    return () => clearTimeout(saveTimeout.current);
  }, [title, content, tags, dirty]);

  const change = (fn) => { fn(); setDirty(true); };

  /* ─── create note ──────────────────────────────────────── */
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createNote({ title: 'Untitled', content: '', tags: [] });
      const id = res.data.data._id;
      await loadNotes();
      openNote(id);
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setCreating(false);
    }
  };

  /* ─── delete note ──────────────────────────────────────── */
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    setDeletingId(id);
    try {
      await deleteNote(id);
      await loadNotes();
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setActiveNote(null);
        setSearchParams({});
        setTitle(''); setContent(''); setTags([]);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  /* ─── tags ─────────────────────────────────────────────── */
  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (t && !tags.includes(t)) change(() => setTags((p) => [...p, t]));
      setTagInput('');
    }
  };

  /* ─── restore version ──────────────────────────────────── */
  const handleRestore = async (idx) => {
    if (!window.confirm('Restore this version?')) return;
    setRestoringIdx(idx);
    try {
      await restoreVersion(activeNoteId, idx);
      await openNote(activeNoteId);
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setRestoringIdx(null);
    }
  };

  /* ─── filtered notes ───────────────────────────────────── */
  const filteredNotes = listSearch
    ? notes.filter((n) => {
      const q = listSearch.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) ||
             (n.content || '').toLowerCase().includes(q);
    })
    : notes;

  /* ─── render ───────────────────────────────────────────── */
  return (
    <div className="notes-page">

      {/* ══ LEFT PANEL: Note list ══ */}
      <aside className="notes-list-panel">
        {/* Header */}
        <div className="notes-list-header">
          <div className="notes-list-header-left">
            <button
              className="notes-back-btn"
              onClick={() => navigate('/app')}
              title="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="notes-list-title">Notes</span>
            <span className="notes-count-badge">{filteredNotes.length}</span>
          </div>
          <div className="notes-list-actions">
            <button
              className="notes-new-btn"
              onClick={handleCreate}
              disabled={creating}
              title="New note"
            >
              {creating
                ? <div className="dash-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                : <Plus size={14} />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="notes-list-search">
          <div className="notes-list-search-wrap">
            <Search size={12} />
            <input
              className="notes-list-search-input"
              placeholder="Search notes…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Notes list */}
        <div className="notes-list-scroll">
          {listLoading && (
            <div className="notes-list-empty">
              <div className="dash-spinner" />
            </div>
          )}
          {!listLoading && filteredNotes.length === 0 && (
            <div className="notes-list-empty">
              <FileText size={28} />
              <p>{listSearch ? 'No matching notes.' : 'No notes yet.\nClick + to create one!'}</p>
            </div>
          )}
          {!listLoading && filteredNotes.map((note) => (
            <button
              key={note._id}
              className={`note-list-item ${activeNoteId === note._id ? 'active' : ''}`}
              onClick={() => openNote(note._id)}
            >
              <span className="note-list-item-title">{note.title || 'Untitled'}</span>
              <span className="note-list-item-preview">{stripMarkdown(note.content) || 'No content'}</span>
              <div className="note-list-item-meta">
                <Clock size={10} />
                <span className="note-list-item-time">{formatRelTime(note.updatedAt)}</span>
                {note.tags?.slice(0, 1).map((t) => (
                  <span key={t} className="note-list-item-tag">{t}</span>
                ))}
              </div>
              <button
                className="note-list-item-delete"
                onClick={(e) => handleDelete(e, note._id)}
                disabled={deletingId === note._id}
                title="Delete"
              >
                {deletingId === note._id
                  ? <div className="dash-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                  : <Trash2 size={12} />}
              </button>
            </button>
          ))}
        </div>

        <div className="notes-list-footer">
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
        </div>
      </aside>

      {/* ══ CENTER PANEL: Editor ══ */}
      <div className="notes-editor-panel">

        {!activeNoteId ? (
          /* ── Empty / landing state ── */
          <div className="editor-no-note">
            <div className="editor-no-note-icon">
              <FileText size={32} color="var(--accent)" />
            </div>
            <h3>Select or create a note</h3>
            <p>Choose a note from the list, or start a fresh one.</p>
            <button className="editor-no-note-cta" onClick={handleCreate} disabled={creating}>
              <Plus size={15} />
              {creating ? 'Creating…' : 'Create Note'}
            </button>
          </div>

        ) : editorLoading ? (
          <div className="editor-no-note">
            <div className="dash-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>

        ) : (
          <>
            {/* ── Top bar: breadcrumb + actions ── */}
            <div className="editor-topbar">
              <div className="editor-topbar-left">
                {/* Collapse icons (decorative, matching Evernote chrome) */}
                <div className="editor-topbar-collapse">
                  <button className="editor-collapse-btn" onClick={() => navigate('/app')} title="Back">
                    <ChevronsLeft size={16} />
                  </button>
                </div>

                {/* Breadcrumb */}
                <nav className="editor-breadcrumb">
                  <button className="editor-breadcrumb-link" onClick={() => navigate('/app')}>
                    Axon
                  </button>
                  <ChevronRight size={13} className="editor-breadcrumb-sep" />
                  <span className="editor-breadcrumb-current">
                    {title || 'Untitled'}
                  </span>
                </nav>
              </div>

              <div className="editor-topbar-right">
                {/* Save status */}
                <span className={`editor-save-status ${saving ? '' : dirty ? 'unsaved' : 'saved'}`}>
                  {saving && <><div className="dash-spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} /> Saving…</>}
                  {!saving && dirty && 'Unsaved changes'}
                  {!saving && !dirty && '✓ Saved'}
                </span>

                {/* Preview/Edit toggle */}
                <button
                  className={`editor-btn ${preview ? 'active' : ''}`}
                  onClick={() => setPreview((p) => !p)}
                >
                  {preview ? <><Edit3 size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
                </button>

                {/* Manual Save */}
                <button
                  className="editor-btn primary"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                >
                  <Save size={13} /> Save
                </button>
              </div>
            </div>

            {/* ── Edited time ── */}
            {activeNote && (
              <div className="editor-edittime">
                {formatEditedTime(activeNote.updatedAt)}
              </div>
            )}

            {/* ── Title + start-writing hint + tags ── */}
            <div className="editor-note-header">
              <input
                className="editor-note-title"
                value={title}
                onChange={(e) => change(() => setTitle(e.target.value))}
                placeholder="Title"
              />
              {!content && !preview && (
                <p className="editor-start-hint">
                  Start writing, drag files or start from a template
                </p>
              )}
              {/* Tags */}
              <div className="editor-tags-row">
                <Tag size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                {tags.map((t) => (
                  <span key={t} className="editor-tag-chip">
                    {t}
                    <button className="editor-tag-remove" onClick={() => change(() => setTags((p) => p.filter((x) => x !== t)))}>
                      <X size={9} />
                    </button>
                  </span>
                ))}
                <input
                  className="editor-tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Add tag…"
                />
              </div>
            </div>

            {/* ── Content area ── */}
            <div className="editor-content-area">
              {preview ? (
                <div className="editor-preview-area">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '*Nothing to preview*'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className="editor-textarea"
                  value={content}
                  onChange={(e) => change(() => setContent(e.target.value))}
                  placeholder={`Start writing…\n\nUse [[Note Title]] to link to other notes.\nMarkdown is fully supported.`}
                  spellCheck={false}
                  autoFocus
                />
              )}
            </div>

            {/* ── Add tag bar (bottom) ── */}
            <div className="editor-add-tag-bar">
              <Bell size={13} />
              <span>Add tag</span>
            </div>
          </>
        )}
      </div>

      {/* ══ RIGHT PANEL: Links + Version history ══ */}
      {activeNoteId && !editorLoading && (
        <aside className="notes-right-panel">

          {/* Linked notes */}
          <div className="right-panel-section">
            <div className="right-panel-label">
              <Link2 size={11} /> Links
            </div>
            {links.length === 0
              ? <span className="right-panel-empty">No outgoing links</span>
              : links.map((l, i) =>
                l.noteId ? (
                  <button
                    key={i}
                    className="link-chip-new"
                    onClick={() => openNote(l.noteId._id || l.noteId)}
                  >
                    {l.title}
                  </button>
                ) : (
                  <span key={i} className="right-panel-empty">{l.title} (not found)</span>
                )
              )
            }
          </div>

          {/* Backlinks */}
          <div className="right-panel-section">
            <div className="right-panel-label">
              <ArrowLeft size={11} /> Backlinks
            </div>
            {backlinks.length === 0
              ? <span className="right-panel-empty">No backlinks</span>
              : backlinks.map((n) => (
                <button
                  key={n._id}
                  className="link-chip-back"
                  onClick={() => openNote(n._id)}
                >
                  {n.title}
                </button>
              ))
            }
          </div>

          {/* Version history */}
          <div className="right-panel-section">
            <div className="right-panel-label">
              <History size={11} /> Version History
            </div>
            {versions.length === 0
              ? <span className="right-panel-empty">No versions yet</span>
              : versions.slice(0, 8).map((v, idx) => (
                <div key={idx} className="vh-item">
                  <div className="vh-item-top">
                    <span className="vh-item-ver">v{versions.length - idx}</span>
                    <span className="vh-item-time">{formatDateTime(v.timestamp)}</span>
                  </div>
                  <span className="vh-item-preview">{stripMarkdown(v.content) || 'Empty'}</span>
                  <button
                    className="vh-restore-btn"
                    onClick={() => handleRestore(idx)}
                    disabled={restoringIdx === idx}
                  >
                    <RotateCcw size={10} />
                    {restoringIdx === idx ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              ))
            }
          </div>

        </aside>
      )}
    </div>
  );
};

export default NotesPage;
