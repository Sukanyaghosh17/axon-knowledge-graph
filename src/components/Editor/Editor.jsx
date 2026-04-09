import { useEffect, useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, Eye, Edit3, Tag, X, Link2, ArrowLeft } from 'lucide-react';
import { fetchNote, updateNote, fetchLinks, fetchBacklinks } from '../../api';
import { useNavigate } from 'react-router-dom';
import './Editor.css';

// Highlight [[wikilinks]] in raw text
const highlightWikilinks = (text) => {
  if (!text) return '';
  return text.replace(/\[\[([^\[\]]+)\]\]/g, (_, title) =>
    `<span class="wikilink">[[${title}]]</span>`
  );
};

const Editor = ({ noteId, onSaved }) => {
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [links, setLinks] = useState([]);
  const [backlinks, setBacklinks] = useState([]);
  const saveTimeout = useRef(null);

  const loadNote = useCallback(async () => {
    if (!noteId) return;
    setLoading(true);
    try {
      const [noteRes, linksRes, backRes] = await Promise.all([
        fetchNote(noteId),
        fetchLinks(noteId),
        fetchBacklinks(noteId),
      ]);
      const n = noteRes.data.data;
      setNote(n);
      setTitle(n.title);
      setContent(n.content);
      setTags(n.tags || []);
      setLinks(linksRes.data.data || []);
      setBacklinks(backRes.data.data || []);
      setDirty(false);
    } catch (err) {
      console.error('Failed to load note:', err);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => { loadNote(); }, [loadNote]);

  const handleSave = async () => {
    if (!noteId || !dirty) return;
    setSaving(true);
    try {
      await updateNote(noteId, { title, content, tags });
      setDirty(false);
      onSaved?.();
      // Refresh links
      const [linksRes, backRes] = await Promise.all([fetchLinks(noteId), fetchBacklinks(noteId)]);
      setLinks(linksRes.data.data || []);
      setBacklinks(backRes.data.data || []);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save after 1.5s of inactivity
  useEffect(() => {
    if (!dirty || !noteId) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(handleSave, 1500);
    return () => clearTimeout(saveTimeout.current);
  }, [title, content, tags, dirty]);

  const change = (fn) => { fn(); setDirty(true); };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (newTag && !tags.includes(newTag)) change(() => setTags((t) => [...t, newTag]));
      setTagInput('');
    }
  };

  const removeTag = (t) => change(() => setTags((prev) => prev.filter((x) => x !== t)));

  if (!noteId) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-inner">
          <div className="editor-empty-icon">✦</div>
          <h2>Select or create a note</h2>
          <p>Choose a note from the sidebar, or click <strong>New</strong> to start fresh.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="editor-empty"><div className="spinner" /></div>;
  }

  return (
    <div className="editor fade-in">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <div className="editor-status">
            {saving && <><div className="spinner" style={{ width: 12, height: 12 }} /><span>Saving…</span></>}
            {!saving && !dirty && note && <span className="status-saved">✓ Saved</span>}
            {!saving && dirty && <span className="status-unsaved">Unsaved changes</span>}
          </div>
        </div>
        <div className="editor-toolbar-right">
          <button
            id="preview-toggle-btn"
            className={`btn btn-ghost btn-sm ${preview ? 'active' : ''}`}
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? <Edit3 size={14} /> : <Eye size={14} />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            id="save-btn"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="editor-title-wrap">
        <input
          id="note-title-input"
          className="editor-title-input"
          value={title}
          onChange={(e) => change(() => setTitle(e.target.value))}
          placeholder="Note title…"
        />
      </div>

      {/* Tags */}
      <div className="editor-tags-row">
        <Tag size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <div className="editor-tags">
          {tags.map((t) => (
            <span key={t} className="tag">
              {t}
              <button className="btn-icon" style={{ padding: 0 }} onClick={() => removeTag(t)}>
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            id="tag-input"
            className="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Add tag…"
          />
        </div>
      </div>

      <div className="divider" style={{ margin: '0' }} />

      {/* Content area */}
      <div className="editor-body">
        {preview ? (
          <div className="editor-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing to preview*'}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="note-content-textarea"
            className="editor-textarea"
            value={content}
            onChange={(e) => change(() => setContent(e.target.value))}
            placeholder={`Start writing… Use [[Note Title]] to link notes\n\nTip: Switch to Preview mode to see rendered markdown`}
            spellCheck={false}
          />
        )}
      </div>

      {/* Links panel */}
      {(links.length > 0 || backlinks.length > 0) && (
        <div className="editor-links-panel">
          {links.length > 0 && (
            <div className="links-section">
              <div className="links-section-title"><Link2 size={12} /> Links</div>
              <div className="links-list">
                {links.map((l, i) => (
                  l.noteId ? (
                    <button
                      key={i}
                      className="link-chip"
                      onClick={() => navigate(`/?note=${l.noteId._id || l.noteId}`)}
                    >
                      {l.title}
                    </button>
                  ) : (
                    <span key={i} className="link-chip unresolved">{l.title} (not found)</span>
                  )
                ))}
              </div>
            </div>
          )}
          {backlinks.length > 0 && (
            <div className="links-section">
              <div className="links-section-title"><ArrowLeft size={12} /> Backlinks</div>
              <div className="links-list">
                {backlinks.map((n) => (
                  <button
                    key={n._id}
                    className="link-chip backlink"
                    onClick={() => navigate(`/?note=${n._id}`)}
                  >
                    {n.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Editor;
