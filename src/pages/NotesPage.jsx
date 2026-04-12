import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus, Search, FileText, Trash2, Clock, ArrowLeft,
  Save, Tag, X, Link2, RotateCcw, History,
  ChevronRight, ChevronsLeft, Bell, Bold, Italic,
  Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Type, Highlighter, Link, Image as ImageIcon,
  Code2, Quote, Minus, ChevronDown, Info
} from 'lucide-react';
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

const stripHtml = (html) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/* ── Font options ────────────────────────────────────────── */
const FONTS = ['Sans Serif', 'Serif', 'Slab Serif', 'Monospace', 'Script', 'Handwritten'];
const FONT_MAP = {
  'Sans Serif':  'Inter, system-ui, sans-serif',
  'Serif':       'Georgia, "Times New Roman", serif',
  'Slab Serif':  '"Roboto Slab", "Courier New", serif',
  'Monospace':   '"JetBrains Mono", "Courier New", monospace',
  'Script':      '"Dancing Script", cursive',
  'Handwritten': '"Caveat", cursive',
};
const FONT_SIZES = ['12', '13', '14', '15', '16', '18', '20', '24', '28', '32', '36', '40', '48', '64'];
const TEXT_COLORS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Light Gray', value: '#d1d5db' },
  { label: 'Gray', value: '#9ca3af' },
  { label: 'Medium Gray', value: '#6b7280' },
  { label: 'Dark Gray', value: '#374151' },
  { label: 'Black', value: '#000000' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Magenta', value: '#d946ef' },
  { label: 'Pink', value: '#f472b6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#facc15' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Royal Blue', value: '#2563eb' },
];
const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent' },
  { label: 'Soft Yellow', value: 'rgba(254, 240, 138, 0.6)' },
  { label: 'Light Pink', value: 'rgba(252, 231, 243, 0.6)' },
  { label: 'Mint Green', value: 'rgba(209, 250, 229, 0.6)' },
  { label: 'Light Cyan', value: 'rgba(207, 250, 254, 0.6)' },
  { label: 'Lavender', value: 'rgba(237, 233, 254, 0.6)' },
  { label: 'Peach', value: 'rgba(255, 237, 213, 0.6)' },
];

/* ── Toolbar Dropdown ────────────────────────────────────── */
const ToolbarDropdown = ({ trigger, children, className = '', title }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className={`tb-dropdown ${className}`} ref={ref}>
      <button 
        className="tb-dropdown-trigger" 
        onClick={() => setOpen(p => !p)} 
        onMouseDown={(e) => e.preventDefault()}
        type="button"
        data-tooltip={title}
      >
        {trigger}
        <ChevronDown size={10} className="tb-dropdown-arrow" />
      </button>
      {open && <div className="tb-dropdown-menu" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  );
};

/* ── Rich Toolbar ────────────────────────────────────────── */
const RichToolbar = ({ editorRef, font, setFont, fontSize, setFontSize, handleEditorInput }) => {
  // Robust selection save using marker nodes
  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount || !editorRef.current?.contains(sel.anchorNode)) return null;
    
    const range = sel.getRangeAt(0);
    const startMarker = document.createElement('span');
    startMarker.id = 'selection-marker-start';
    startMarker.style.display = 'none';
    const endMarker = document.createElement('span');
    endMarker.id = 'selection-marker-end';
    endMarker.style.display = 'none';

    const rangeEnd = range.cloneRange();
    rangeEnd.collapse(false);
    rangeEnd.insertNode(endMarker);

    const rangeStart = range.cloneRange();
    rangeStart.collapse(true);
    rangeStart.insertNode(startMarker);

    return { startMarker, endMarker };
  };

  // Restore selection using markers and clean up
  const restoreSelection = (markers) => {
    if (!markers || !editorRef.current) {
        editorRef.current?.focus();
        return;
    }
    
    const { startMarker, endMarker } = markers;
    const sel = window.getSelection();
    const range = document.createRange();

    range.setStartAfter(startMarker);
    range.setEndBefore(endMarker);

    sel.removeAllRanges();
    sel.addRange(range);
    
    startMarker.remove();
    endMarker.remove();
    editorRef.current.focus();
  };

  const exec = (cmd, val = null) => {
    const markers = saveSelection();
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    restoreSelection(markers);
  };

  const [activeBlock, setActiveBlock] = useState('Normal Text');

  const turnInto = (type, tag) => {
    const markers = saveSelection();
    setActiveBlock(type);
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, `<${tag}>`);
    if (tag === 'p') {
      document.execCommand('removeFormat', false, null);
    }
    restoreSelection(markers);
  };

  const [activeColor, setActiveColor] = useState('inherit');
  const [activeHighlight, setActiveHighlight] = useState('transparent');

  const applyColor = (color) => {
    const markers = saveSelection();
    setActiveColor(color);
    editorRef.current?.focus();
    document.execCommand('foreColor', false, color === 'inherit' ? '#1C1917' : color);
    restoreSelection(markers);
  };

  const applyHighlight = (color) => {
    const markers = saveSelection();
    setActiveHighlight(color);
    editorRef.current?.focus();
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    restoreSelection(markers);
  };

  const applyFont = (f) => {
    const markers = saveSelection();
    setFont(f);
    if (editorRef.current) {
        editorRef.current.style.fontFamily = FONT_MAP[f];
    }
    restoreSelection(markers);
  };

  const applyFontSize = (size) => {
    const markers = saveSelection();
    setFontSize(size);
    editorRef.current?.focus();
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
    fontEls?.forEach(el => {
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.innerHTML = el.innerHTML;
      el.parentNode.replaceChild(span, el);
    });
    restoreSelection(markers);
    handleEditorInput();
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertHr = () => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"/>');
  };

  const insertCodeBlock = () => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false,
      '<pre style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 16px;font-family:JetBrains Mono,monospace;font-size:0.85rem;margin:8px 0;white-space:pre-wrap"><code>code here</code></pre>'
    );
  };

  const insertQuote = () => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false,
      '<blockquote style="border-left:3px solid var(--accent);padding-left:16px;margin:8px 0;color:var(--text-muted);font-style:italic">Quote</blockquote>'
    );
  };

  return (
    <div className="rich-toolbar">
      {/* Undo / Redo */}
      <div className="tb-group">
        <button 
          className="tb-btn" 
          onClick={() => exec('undo')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Undo (Ctrl+Z)" 
          type="button"
        >
          <Undo2 size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('redo')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Redo (Ctrl+Y)" 
          type="button"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <div className="tb-sep" />

      {/* Turn into */}
      <ToolbarDropdown
        title="Turn into..."
        trigger={
          <span className="tb-font-label">
            {activeBlock === 'Normal Text' ? 'Aa' : 
             activeBlock === 'H1 Large Header' ? 'H1' : 
             activeBlock === 'H2 Medium Header' ? 'H2' : 
             activeBlock === 'H3 Small Header' ? 'H3' : 'Aa'}
          </span>
        }
        className="tb-turn-into-dd"
      >
        <div className="tb-turn-into-header">
          <span>Turn into</span>
          <Info size={14} className="tb-info-icon" />
        </div>
        <button className={`tb-dd-item ${activeBlock === 'Normal Text' ? 'active' : ''}`} onClick={() => turnInto('Normal Text', 'p')}>
           <div className="tb-dd-item-content">
             <span className="tb-block-icon">Aa</span>
             <span className="tb-block-text">Normal Text</span>
           </div>
           <ChevronRight size={14} />
        </button>
        <button className={`tb-dd-item ${activeBlock === 'H1 Large Header' ? 'active' : ''}`} onClick={() => turnInto('H1 Large Header', 'h1')}>
           <div className="tb-dd-item-content">
             <span className="tb-block-icon h1">H1</span>
             <span className="tb-block-text">H1 Large Header</span>
           </div>
           <ChevronRight size={14} />
        </button>
        <button className={`tb-dd-item ${activeBlock === 'H2 Medium Header' ? 'active' : ''}`} onClick={() => turnInto('H2 Medium Header', 'h2')}>
           <div className="tb-dd-item-content">
             <span className="tb-block-icon h2">H2</span>
             <span className="tb-block-text">H2 Medium Header</span>
           </div>
           <ChevronRight size={14} />
        </button>
        <button className={`tb-dd-item ${activeBlock === 'H3 Small Header' ? 'active' : ''}`} onClick={() => turnInto('H3 Small Header', 'h3')}>
           <div className="tb-dd-item-content">
             <span className="tb-block-icon h3">H3</span>
             <span className="tb-block-text">H3 Small Header</span>
           </div>
           <ChevronRight size={14} />
        </button>
        <div className="tb-dd-sep" />
        <button className="tb-dd-item footer">
          Change default settings...
        </button>
      </ToolbarDropdown>

      <div className="tb-sep" />

      {/* Font family */}
      <ToolbarDropdown 
        title="Font family"
        trigger={<span className="tb-font-label">{font}</span>} 
        className="tb-font-dd"
      >
        {FONTS.map(f => (
          <button
            key={f}
            className={`tb-dd-item ${font === f ? 'active' : ''}`}
            onClick={() => applyFont(f)}
            style={{ fontFamily: FONT_MAP[f] }}
            type="button"
          >{f}</button>
        ))}
      </ToolbarDropdown>

      {/* Font size */}
      <ToolbarDropdown 
        title="Font size"
        trigger={<span className="tb-size-label">{fontSize}</span>} 
        className="tb-size-dd"
      >
        {FONT_SIZES.map(s => (
          <button
            key={s}
            className={`tb-dd-item ${fontSize === s ? 'active' : ''}`}
            onClick={() => applyFontSize(s)}
            type="button"
          >{s}</button>
        ))}
      </ToolbarDropdown>

      <div className="tb-sep" />

      {/* Text format */}
      <div className="tb-group">
        <button 
          className="tb-btn" 
          onClick={() => exec('bold')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Bold" 
          type="button"
        >
          <Bold size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('italic')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Italic" 
          type="button"
        >
          <Italic size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('underline')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Underline" 
          type="button"
        >
          <UnderlineIcon size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('strikeThrough')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Strikethrough" 
          type="button"
        >
          <Strikethrough size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={insertLink} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Insert link" 
          type="button"
        >
          <Link size={14} />
        </button>
      </div>

      <div className="tb-sep" />

      {/* Text color */}
      <ToolbarDropdown
        title="Text color"
        trigger={
          <span className="tb-color-trigger">
            <Type size={13} />
            <span className="tb-color-swatch" style={{ background: activeColor === 'inherit' ? 'var(--text-primary)' : activeColor }} />
          </span>
        }
        className="tb-color-dd"
      >
        <div className="tb-color-menu">
          <button 
            className={`tb-color-auto ${activeColor === 'inherit' ? 'active' : ''}`}
            onClick={() => applyColor('inherit')}
            onMouseDown={(e) => e.preventDefault()}
            data-tooltip="Reset to default color"
          >
            <div className="tb-color-auto-icon" />
            <span>Auto</span>
          </button>
          
          <div className="tb-color-grid">
            {TEXT_COLORS.filter(c => c.value !== 'inherit').map(c => (
              <button
                key={c.value}
                className={`tb-color-dot ${activeColor === c.value ? 'active' : ''}`}
                style={{ background: c.value }}
                onClick={() => applyColor(c.value)}
                onMouseDown={(e) => e.preventDefault()}
                title={c.label}
                type="button"
              />
            ))}
          </div>
        </div>
      </ToolbarDropdown>

      {/* Highlight */}
      <ToolbarDropdown
        title="Highlight color"
        trigger={
          <span className="tb-color-trigger">
            <Highlighter size={13} />
            <span className="tb-color-swatch" style={{ background: activeHighlight === 'transparent' ? 'transparent' : activeHighlight, border: '1px solid var(--border)' }} />
          </span>
        }
        className="tb-color-dd"
      >
        <div className="tb-color-grid">
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.value}
              className={`tb-color-dot ${activeHighlight === c.value ? 'active' : ''}`}
              style={{ background: c.value, border: '1px solid var(--border-strong)' }}
              onClick={() => applyHighlight(c.value)}
              title={c.label}
              type="button"
            />
          ))}
        </div>
      </ToolbarDropdown>

      <div className="tb-sep" />

      {/* Lists */}
      <div className="tb-group">
        <button 
          className="tb-btn" 
          onClick={() => exec('insertUnorderedList')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Bullet list" 
          type="button"
        >
          <List size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('insertOrderedList')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Numbered list" 
          type="button"
        >
          <ListOrdered size={14} />
        </button>
      </div>

      <div className="tb-sep" />

      {/* Alignment */}
      <div className="tb-group">
        <button 
          className="tb-btn" 
          onClick={() => exec('justifyLeft')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Align left" 
          type="button"
        >
          <AlignLeft size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('justifyCenter')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Align center" 
          type="button"
        >
          <AlignCenter size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('justifyRight')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Align right" 
          type="button"
        >
          <AlignRight size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={() => exec('justifyFull')} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Justify" 
          type="button"
        >
          <AlignJustify size={14} />
        </button>
      </div>

      <div className="tb-sep" />

      {/* Insert extras */}
      <div className="tb-group">
        <button 
          className="tb-btn" 
          onClick={insertCodeBlock} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Code block" 
          type="button"
        >
          <Code2 size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={insertQuote} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Blockquote" 
          type="button"
        >
          <Quote size={14} />
        </button>
        <button 
          className="tb-btn" 
          onClick={insertHr} 
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Horizontal rule" 
          type="button"
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
};

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
  const [saving, setSaving]             = useState(false);
  const [dirty, setDirty]               = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);

  // ── Toolbar state ──
  const [font, setFont]         = useState('Sans Serif');
  const [fontSize, setFontSize] = useState('15');

  // ── Right panel ──
  const [links, setLinks]               = useState([]);
  const [backlinks, setBacklinks]       = useState([]);
  const [versions, setVersions]         = useState([]);
  const [restoringIdx, setRestoringIdx] = useState(null);

  const saveTimeout = useRef(null);
  const editorRef   = useRef(null);

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

  /* ─── sync editor content → state ─────────────────────── */
  const handleEditorInput = () => {
    const html = editorRef.current?.innerHTML || '';
    setContent(html);
    setDirty(true);
  };

  /* ─── open / load a note ───────────────────────────────── */
  const openNote = async (id) => {
    setActiveNoteId(id);
    setSearchParams({ note: id });
    setEditorLoading(true);
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
      // Inject HTML into contenteditable
      if (editorRef.current) {
        editorRef.current.innerHTML = n.content || '';
      }
    } catch (err) {
      console.error('Failed to load note:', err);
    } finally {
      setEditorLoading(false);
    }
  };

  // When the editor mounts after loading, set its content
  useEffect(() => {
    if (!editorLoading && editorRef.current && activeNoteId) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [editorLoading]);

  /* ─── auto-save ────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!activeNoteId || !dirty) return;
    setSaving(true);
    try {
      const htmlContent = editorRef.current?.innerHTML || content;
      await updateNote(activeNoteId, { title, content: htmlContent, tags });
      setContent(htmlContent);
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
        if (editorRef.current) editorRef.current.innerHTML = '';
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
             stripHtml(n.content || '').toLowerCase().includes(q);
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
              <span className="note-list-item-preview">{stripHtml(note.content) || 'No content'}</span>
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
                <div className="editor-topbar-collapse">
                  <button className="editor-collapse-btn" onClick={() => navigate('/app')} title="Back">
                    <ChevronsLeft size={16} />
                  </button>
                </div>
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

                {/* Manual Save */}
                <button
                  className="editor-btn primary"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                >
                  <Save size={13} /> Save
                </button>

                {/* Delete Note */}
                <button
                  className="editor-btn"
                  onClick={(e) => handleDelete(e, activeNoteId)}
                  disabled={deletingId === activeNoteId}
                  style={{ color: '#dc2626', borderColor: '#fee2e2' }}
                  title="Delete Note"
                >
                  {deletingId === activeNoteId
                    ? <><div className="dash-spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Deleting…</>
                    : <><Trash2 size={13} /> Delete</>}
                </button>
              </div>
            </div>

            {/* ── Rich Formatting Toolbar ── */}
            <RichToolbar
              editorRef={editorRef}
              font={font}
              setFont={setFont}
              fontSize={fontSize}
              setFontSize={setFontSize}
              handleEditorInput={handleEditorInput}
            />

            {/* ── Edited time ── */}
            {activeNote && (
              <div className="editor-edittime">
                {formatEditedTime(activeNote.updatedAt)}
              </div>
            )}

            {/* ── Title + tags ── */}
            <div className="editor-note-header">
              <input
                className="editor-note-title"
                value={title}
                onChange={(e) => change(() => setTitle(e.target.value))}
                placeholder="Title"
              />
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

            {/* ── Rich Text Content area ── */}
            <div className="editor-content-area">
              {/* Start hint when empty */}
              {!content && (
                <p className="editor-start-hint-overlay">
                  Start writing, drag files or start from a template
                </p>
              )}
              <div
                ref={editorRef}
                className="editor-rich-content"
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                style={{ fontFamily: FONT_MAP[font] }}
                spellCheck={false}
              />
            </div>

            {/* ── Add tag footer bar ── */}
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
                  <span className="vh-item-preview">{stripHtml(v.content) || 'Empty'}</span>
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
