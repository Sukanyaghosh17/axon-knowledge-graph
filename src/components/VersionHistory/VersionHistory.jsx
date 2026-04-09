import { useEffect, useState } from 'react';
import { Clock, RotateCcw, ChevronDown, ChevronRight, X } from 'lucide-react';
import { fetchVersions, restoreVersion } from '../../api';
import './VersionHistory.css';

const VersionHistory = ({ noteId, onRestored, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringIdx, setRestoringIdx] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');

  useEffect(() => {
    if (!noteId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchVersions(noteId);
        setVersions(res.data.data);
        setNoteTitle(res.data.noteTitle || '');
        setExpandedIdx(null);
      } catch (err) {
        console.error('Failed to load versions:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [noteId]);

  const handleRestore = async (idx) => {
    if (!window.confirm('Restore this version? Current content will be saved as a new version.')) return;
    setRestoringIdx(idx);
    try {
      await restoreVersion(noteId, idx);
      onRestored?.();
    } catch (err) {
      console.error('Failed to restore version:', err);
    } finally {
      setRestoringIdx(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const preview = (content) => {
    if (!content) return 'Empty content';
    return content.slice(0, 180) + (content.length > 180 ? '…' : '');
  };

  return (
    <div className="version-history">
      {/* Panel header */}
      <div className="vh-header">
        <div className="vh-title">
          <Clock size={14} />
          <span>Version History</span>
        </div>
        <button className="btn-icon" onClick={onClose} title="Close panel">
          <X size={15} />
        </button>
      </div>

      {noteTitle && <div className="vh-note-name">{noteTitle}</div>}

      <div className="vh-list">
        {loading && (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="spinner" />
          </div>
        )}
        {!loading && versions.length === 0 && (
          <div className="empty-state" style={{ padding: '24px' }}>
            <Clock size={28} />
            <p>No versions yet.{'\n'}Edit this note to create history.</p>
          </div>
        )}

        {!loading && versions.map((v, idx) => (
          <div key={idx} className={`version-item ${expandedIdx === idx ? 'expanded' : ''}`}>
            <div className="version-item-header" onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
              <div className="version-meta">
                <span className="version-index">v{versions.length - idx}</span>
                <span className="version-time">{formatDate(v.timestamp)}</span>
              </div>
              <div className="version-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleRestore(idx); }}
                  disabled={restoringIdx === idx}
                  title="Restore this version"
                >
                  {restoringIdx === idx
                    ? <div className="spinner" style={{ width: 12, height: 12 }} />
                    : <RotateCcw size={12} />}
                  Restore
                </button>
                {expandedIdx === idx ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            {expandedIdx === idx && (
              <div className="version-preview fade-in">
                <pre>{preview(v.content)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionHistory;
