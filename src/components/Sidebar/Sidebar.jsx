import { useEffect, useState, useRef } from 'react';
import { Plus, FileText, Tag, Trash2, Clock } from 'lucide-react';
import { fetchAllNotes, createNote, deleteNote } from '../../api';
import './Sidebar.css';

const Sidebar = ({ activeNoteId, onSelectNote, onNoteDeleted, refreshTrigger }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadNotes = async () => {
    try {
      const res = await fetchAllNotes();
      setNotes(res.data.data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotes(); }, [refreshTrigger]);

  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))].sort();

  const filteredNotes = activeTag
    ? notes.filter((n) => n.tags?.includes(activeTag))
    : notes;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createNote({ title: 'Untitled Note', content: '', tags: [] });
      await loadNotes();
      onSelectNote(res.data.data._id);
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    setDeletingId(id);
    try {
      await deleteNote(id);
      await loadNotes();
      if (activeNoteId === id) onNoteDeleted();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeletingId(null);
    }
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

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-heading">Notes</span>
        <button
          id="new-note-btn"
          className="btn btn-primary btn-sm"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={15} />}
          New
        </button>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="sidebar-tags">
          <button
            className={`tag tag-filter ${!activeTag ? 'active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag tag-filter ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              <Tag size={10} /> {tag}
            </button>
          ))}
        </div>
      )}

      <div className="divider" />

      {/* Note list */}
      <div className="sidebar-notes">
        {loading && (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        )}
        {!loading && filteredNotes.length === 0 && (
          <div className="empty-state">
            <FileText size={32} />
            <p>{activeTag ? `No notes tagged "${activeTag}"` : 'No notes yet. Create one!'}</p>
          </div>
        )}
        {!loading && filteredNotes.map((note) => (
          <button
            key={note._id}
            id={`note-item-${note._id}`}
            className={`note-item ${activeNoteId === note._id ? 'active' : ''}`}
            onClick={() => onSelectNote(note._id)}
          >
            <div className="note-item-content">
              <span className="note-item-title">{note.title || 'Untitled'}</span>
              <div className="note-item-meta">
                <Clock size={11} />
                <span>{formatDate(note.updatedAt)}</span>
                {note.tags?.slice(0, 2).map((t) => (
                  <span key={t} className="tag" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{t}</span>
                ))}
              </div>
            </div>
            <button
              className="note-item-delete btn-icon"
              onClick={(e) => handleDelete(e, note._id)}
              disabled={deletingId === note._id}
              title="Delete note"
            >
              {deletingId === note._id
                ? <div className="spinner" style={{ width: 12, height: 12 }} />
                : <Trash2 size={13} />}
            </button>
          </button>
        ))}
      </div>

      {/* Footer count */}
      <div className="sidebar-footer">
        <span>{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}</span>
      </div>
    </aside>
  );
};

export default Sidebar;
