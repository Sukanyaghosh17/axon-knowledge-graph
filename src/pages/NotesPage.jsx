import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      {open && (
        <div
          className="tb-dropdown-menu"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/* ── Rich Toolbar ────────────────────────────────────────── */
const RichToolbar = ({ editorRef, font, setFont, fontSize, setFontSize, handleEditorInput }) => {
  // Store selection as a cloned Range — no DOM mutation, survives focus changes
  const savedRangeRef = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const range = savedRangeRef.current;
    if (!range || !editorRef.current) { editorRef.current?.focus(); return; }
    editorRef.current.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // Save selection whenever user interacts with the editor
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onSelect = () => saveSelection();
    el.addEventListener('mouseup', onSelect);
    el.addEventListener('keyup', onSelect);
    return () => {
      el.removeEventListener('mouseup', onSelect);
      el.removeEventListener('keyup', onSelect);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef]);

  const exec = (cmd, val = null) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    saveSelection();
  };

  const [activeBlock, setActiveBlock] = useState('Normal Text');

  const turnInto = (type, tag) => {
    restoreSelection();
    setActiveBlock(type);
    document.execCommand('formatBlock', false, `<${tag}>`);
    if (tag === 'p') document.execCommand('removeFormat', false, null);
    saveSelection();
  };

  const [activeColor, setActiveColor] = useState('inherit');
  const [activeHighlight, setActiveHighlight] = useState('transparent');

  const applyColor = (color) => {
    restoreSelection();
    setActiveColor(color);
    document.execCommand('foreColor', false, color === 'inherit' ? '#1C1917' : color);
    saveSelection();
  };

  const applyHighlight = (color) => {
    restoreSelection();
    setActiveHighlight(color);
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    saveSelection();
  };

  const applyFont = (f) => {
    restoreSelection();
    setFont(f);
    if (editorRef.current) editorRef.current.style.fontFamily = FONT_MAP[f];
    saveSelection();
  };

  const applyFontSize = (size) => {
    restoreSelection();
    setFontSize(size);
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
    fontEls?.forEach(el => {
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.innerHTML = el.innerHTML;
      el.parentNode.replaceChild(span, el);
    });
    saveSelection();
    handleEditorInput();
  };

  const insertLink = () => {
    restoreSelection();
    const url = window.prompt('Enter URL:');
    if (url) { document.execCommand('createLink', false, url); saveSelection(); }
  };

  const insertHr = () => {
    restoreSelection();
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"/>');
    saveSelection();
  };

  const insertCodeBlock = () => {
    restoreSelection();
    document.execCommand('insertHTML', false,
      '<pre style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 16px;font-family:JetBrains Mono,monospace;font-size:0.85rem;margin:8px 0;white-space:pre-wrap"><code>code here</code></pre>'
    );
    saveSelection();
  };

  const insertQuote = () => {
    restoreSelection();
    document.execCommand('insertHTML', false,
      '<blockquote style="border-left:3px solid var(--accent);padding-left:16px;margin:8px 0;color:var(--text-muted);font-style:italic">Quote</blockquote>'
    );
    saveSelection();
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
              onMouseDown={(e) => e.preventDefault()}
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
  const { id: urlId } = useParams();

  // Track the last opened id so the effect doesn't re-run when openNote reference changes
  const openedIdRef = useRef(null);

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
  const [externalLinks, setExternalLinks] = useState([]);
  const [extTitle, setExtTitle]         = useState('');
  const [extUrl, setExtUrl]           = useState('');
  const [saving, setSaving]             = useState(false);
  const [dirty, setDirty]               = useState(false);
  // Start in loading state if we already have a note ID in the URL so there's no empty-state flash
  const [editorLoading, setEditorLoading] = useState(!!urlId);

  const [suggestedTags, setSuggestedTags] = useState(() => {
    try {
      const saved = localStorage.getItem('axon-suggested-tags');
      return saved ? JSON.parse(saved) : ['draft', 'new_ideas', 'content', 'port creating'];
    } catch {
      return ['draft', 'new_ideas', 'content', 'port creating'];
    }
  });

  const removeSuggestedTag = (e, t) => {
    e.stopPropagation();
    const nextTags = suggestedTags.filter(st => st !== t);
    setSuggestedTags(nextTags);
    localStorage.setItem('axon-suggested-tags', JSON.stringify(nextTags));
  };

  // ── Toolbar state ──
  const [font, setFont]         = useState('Sans Serif');
  const [fontSize, setFontSize] = useState('15');

  // ── Right panel ──
  const [links, setLinks]               = useState([]);
  const [backlinks, setBacklinks]       = useState([]);
  const [versions, setVersions]         = useState([]);
  const [restoringIdx, setRestoringIdx] = useState(null);
  const [toast, setToast]               = useState(null); // { msg, type: 'success'|'error' }

  // ── Linking state ──
  const [isLinking, setIsLinking]           = useState(false);
  const [noteSearch, setNoteSearch]         = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  // Sync from URL params — runs when urlId changes (direct link, browser back/forward)
  useEffect(() => {
    if (urlId && urlId !== openedIdRef.current) {
      openedIdRef.current = urlId;
      openNote(urlId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  /* ─── sync editor content → state ─────────────────────── */
  const handleEditorInput = () => {
    const html = editorRef.current?.innerHTML || '';
    setContent(html);
    setDirty(true);
  };

  /* ─── open / load a note ───────────────────────────────── */
  const openNote = useCallback(async (id) => {
    if (!id) return;
    openedIdRef.current = id;
    setActiveNoteId(id);
    // Only push a new history entry when switching between notes;
    // use replace when the URL already has this id (direct load / same note)
    const currentPath = window.location.pathname;
    if (currentPath !== `/app/edit/${id}`) {
      navigate(`/app/edit/${id}`);
    }
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
      setExternalLinks(n.externalLinks || []);
      setLinks(linksRes.data.data || []);
      setBacklinks(backRes.data.data || []);
      setVersions(versRes.data.data || []);
      setDirty(false);
      // Inject HTML into contenteditable (runs after re-render because editorLoading goes false)
    } catch (err) {
      console.error('Failed to load note:', err);
      showToast('Failed to load note', 'error');
    } finally {
      setEditorLoading(false);
    }
  // navigate is stable from react-router; showToast defined above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Inject content into the contenteditable div after editorLoading flips false
  useEffect(() => {
    if (!editorLoading && editorRef.current && activeNoteId && content !== undefined) {
      // Only overwrite DOM if it differs to avoid resetting cursor position
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content || '';
      }
    }
  // content changes after each keystroke — only sync when editorLoading toggles
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorLoading]);

  /* ─── auto-save ────────────────────────────────────────── */
  const handleSave = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeNoteId) return;

    // Always read latest HTML from DOM to avoid stale state
    const htmlContent = editorRef.current?.innerHTML || content;
    // Also read title from the input element directly in case state is stale
    const titleEl = document.querySelector('.editor-note-title');
    const currentTitle =
      (titleEl ? titleEl.value : null)?.trim() ||
      title?.trim() ||
      'Untitled';

    setSaving(true);
    clearTimeout(saveTimeout.current);

    try {
      await updateNote(activeNoteId, { title: currentTitle, content: htmlContent, tags, externalLinks });
      setContent(htmlContent);
      setTitle(currentTitle);
      setDirty(false);
      showToast('Note saved ✓');
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
      console.error('Save error:', err.response?.status, err.message);

      // Note lost (server restart wiped in-memory DB) — recreate it
      if (err.response?.status === 404) {
        try {
          const safeTitle = currentTitle || 'Untitled';
          const res = await createNote({ title: safeTitle, content: htmlContent, tags, externalLinks });
          const newId = res.data.data._id;
          setActiveNoteId(newId);
          navigate(`/app/edit/${newId}`, { replace: true });
          setContent(htmlContent);
          setTitle(safeTitle);
          setDirty(false);
          showToast('Note recreated & saved ✓');
          loadNotes();
        } catch (createErr) {
          console.error('Recreate failed:', createErr.response?.data, createErr.message);
          showToast(
            'Recreate failed: ' + (createErr.response?.data?.message || createErr.message),
            'error'
          );
        }
      } else {
        showToast(
          'Save failed: ' + (err.response?.data?.message || err.message),
          'error'
        );
      }
    } finally {
      setSaving(false);
    }
  }, [activeNoteId, dirty, title, content, tags, externalLinks, loadNotes, navigate]);

  useEffect(() => {
    if (!dirty || !activeNoteId) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(handleSave, 1500);
    return () => clearTimeout(saveTimeout.current);
  }, [title, content, tags, dirty, handleSave]);

  // Handle Ctrl+S for manual save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (dirty) handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, dirty]);

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
        navigate('/app/edit', { replace: true });
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

  /* ─── reverse filtered for linking ─── */
  const otherNotes = notes.filter(n => n._id !== activeNoteId);
  const linkMatches = noteSearch
    ? otherNotes.filter(n => (n.title || '').toLowerCase().includes(noteSearch.toLowerCase()))
    : [];

  const insertNoteLink = (note) => {
    if (!editorRef.current) return;
    const linkText = ` [[${note.title}]] `;
    
    // Focus and insert at end for simplicity, or we could use Range API
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.startContainer)) {
        const textNode = document.createTextNode(linkText);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += linkText;
      }
    } else {
      editorRef.current.innerHTML += linkText;
    }
    
    handleEditorInput();
    setIsLinking(false);
    setNoteSearch('');
    showToast(`Linked to ${note.title}`);
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

      {/* ── Toast ── */}
      {toast && (
        <div className={`notes-toast ${toast.type === 'error' ? 'notes-toast-error' : 'notes-toast-success'}`}>
          {toast.msg}
        </div>
      )}

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
                  type="button"
                  className="editor-btn primary"
                  onClick={handleSave}
                  disabled={saving}
                  title="Save (Ctrl+S)"
                >
                  {saving
                    ? <><div className="dash-spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Saving…</>
                    : <><Save size={13} /> Save</>}
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
              {/* Tags Section */}
              <div className="editor-tags-section" style={{ marginBottom: '16px' }}>
                <div className="editor-tags-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '8px', paddingLeft: '2px', fontWeight: 500 }}>
                  <Tag size={13} style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="editor-tag-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Add tag..."
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, width: '100%' }}
                  />
                </div>
                <div className="editor-tags-row">
                  {/* Default / Suggested tags */}
                  {suggestedTags.map((defaultTag) => (
                    !tags.includes(defaultTag) && (
                      <span
                        key={defaultTag}
                        className="editor-tag-chip"
                        onClick={() => change(() => setTags((p) => [...p, defaultTag]))}
                        style={{ cursor: 'pointer', border: '1px solid rgba(188, 108, 37, 0.4)', padding: '4px 10px', background: 'var(--highlight)' }}
                        title="Click to add tag"
                      >
                        #{defaultTag}
                        <button
                          className="editor-tag-remove"
                          title="Remove suggested tag"
                          onClick={(e) => removeSuggestedTag(e, defaultTag)}
                          style={{ marginLeft: '2px' }}
                        >
                          <X size={9} />
                        </button>
                      </span>
                    )
                  ))}

                  {/* Active tags */}
                  {tags.map((t) => (
                    <span key={t} className="editor-tag-chip" style={{ border: '1px solid rgba(188, 108, 37, 0.4)', padding: '4px 10px', background: 'var(--highlight)' }}>
                      #{t}
                      <button className="editor-tag-remove" onClick={() => change(() => setTags((p) => p.filter((x) => x !== t)))}>
                        <X size={9} />
                      </button>
                    </span>
                  ))}

                </div>
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
            <div className="right-panel-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link2 size={11} /> Links
              </span>
              <button 
                className="tb-btn" 
                style={{ width: 18, height: 18 }} 
                onClick={() => setIsLinking(!isLinking)}
                title="Link a note"
              >
                <Plus size={12} />
              </button>
            </div>

            {isLinking && (
              <div className="link-search-box" style={{ margin: '12px 0 16px', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    className="notes-list-search-input"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1, borderRadius: '16px', border: '1px solid rgba(188, 108, 37, 0.3)', background: 'var(--highlight)' }}
                    placeholder="Search notes to link..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    autoFocus
                  />
                  <button 
                    onClick={() => { setIsLinking(false); setNoteSearch(''); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
                {linkMatches.length > 0 && (
                  <div className="link-results-dropdown" style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, 
                    background: 'var(--surface)', border: '1px solid var(--border)', 
                    borderRadius: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto',
                    boxShadow: 'var(--shadow-md)', marginTop: '4px'
                  }}>
                    {linkMatches.map(n => (
                      <button 
                        key={n._id}
                        className="tb-dd-item"
                        style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                        onClick={() => insertNoteLink(n)}
                      >
                        {n.title}
                      </button>
                    ))}
                  </div>
                )}
                {noteSearch && linkMatches.length === 0 && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '4px 8px' }}>
                    No notes found
                  </div>
                )}
              </div>
            )}

            {links.length === 0 && externalLinks.length === 0
              ? <span className="right-panel-empty">No outgoing links</span>
              : (
                <>
                  {/* Internal */}
                  {links.map((l, i) =>
                    l.noteId ? (
                      <button
                        key={`int-${i}`}
                        className="link-chip-new"
                        onClick={() => openNote(l.noteId._id || l.noteId)}
                      >
                        {l.title}
                      </button>
                    ) : (
                      <span key={`int-err-${i}`} className="right-panel-empty">{l.title} (not found)</span>
                    )
                  )}
                  {/* External */}
                  {externalLinks.map((l, i) => (
                    <div key={`ext-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                       <a
                        href={l.url.startsWith('http') ? l.url : `https://${l.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link-chip-new"
                        style={{ borderStyle: 'dashed', color: 'var(--accent)', flex: 1 }}
                      >
                        {l.title}
                      </a>
                      <button 
                        onClick={() => change(() => setExternalLinks(prev => prev.filter((_, idx) => idx !== i)))}
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </>
              )
            }

            {/* Manual External Link Form */}
            <div style={{ marginTop: '16px', padding: '12px', border: '1px dashed rgba(188, 108, 37, 0.4)', borderRadius: '12px', background: 'var(--highlight)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>ADD WEB LINK</div>
              <input 
                className="notes-list-search-input" 
                style={{ width: '100%', padding: '6px 12px', fontSize: '0.75rem', marginBottom: '8px', borderRadius: '16px', border: '1px solid rgba(188, 108, 37, 0.2)', background: 'var(--bg)' }}
                placeholder="Link Title (e.g. My Website)"
                value={extTitle}
                onChange={(e) => setExtTitle(e.target.value)}
              />
               <input 
                className="notes-list-search-input" 
                style={{ width: '100%', padding: '6px 12px', fontSize: '0.75rem', marginBottom: '12px', borderRadius: '16px', border: '1px solid rgba(188, 108, 37, 0.2)', background: 'var(--bg)' }}
                placeholder="URL (e.g. google.com)"
                value={extUrl}
                onChange={(e) => setExtUrl(e.target.value)}
              />
              <button 
                className="vh-restore-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '6px 12px', borderRadius: '16px', border: '1px solid rgba(188, 108, 37, 0.3)', background: 'transparent', color: 'var(--text-secondary)' }}
                onClick={() => {
                  if (extTitle && extUrl) {
                    change(() => setExternalLinks(prev => [...prev, { title: extTitle, url: extUrl }]));
                    setExtTitle('');
                    setExtUrl('');
                    showToast('Web link saved ✓');
                  }
                }}
              >
                <Save size={12} style={{ marginRight: '4px' }} /> Save Web Link
              </button>
            </div>
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
