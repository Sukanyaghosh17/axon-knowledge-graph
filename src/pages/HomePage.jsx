import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History } from 'lucide-react';
import Sidebar from '../components/Sidebar/Sidebar';
import Editor from '../components/Editor/Editor';
import VersionHistory from '../components/VersionHistory/VersionHistory';
import './HomePage.css';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editorKey, setEditorKey] = useState(0);

  // Sync note selection from URL (?note=id)
  useEffect(() => {
    const noteId = searchParams.get('note');
    if (noteId) setActiveNoteId(noteId);
  }, [searchParams]);

  const handleSelectNote = (id) => {
    setActiveNoteId(id);
    setSearchParams({ note: id });
    setShowVersions(false);
  };

  const handleNoteDeleted = () => {
    setActiveNoteId(null);
    setSearchParams({});
    setShowVersions(false);
  };

  const handleSaved = () => {
    setRefreshTrigger((n) => n + 1);
  };

  const handleRestored = () => {
    // Force editor to re-mount and reload note after restore
    setEditorKey((k) => k + 1);
    setShowVersions(false);
  };

  return (
    <div className="home-layout">
      {/* Sidebar */}
      <Sidebar
        activeNoteId={activeNoteId}
        onSelectNote={handleSelectNote}
        onNoteDeleted={handleNoteDeleted}
        refreshTrigger={refreshTrigger}
      />

      {/* Main editor area */}
      <div className="home-main">
        {/* Version history toggle button */}
        {activeNoteId && (
          <button
            id="version-history-btn"
            className={`vh-toggle-btn btn btn-ghost btn-sm ${showVersions ? 'active' : ''}`}
            onClick={() => setShowVersions((v) => !v)}
            title="Toggle version history"
          >
            <History size={14} />
            History
          </button>
        )}

        <Editor
          key={`editor-${activeNoteId}-${editorKey}`}
          noteId={activeNoteId}
          onSaved={handleSaved}
        />
      </div>

      {/* Version History Panel */}
      {showVersions && activeNoteId && (
        <VersionHistory
          noteId={activeNoteId}
          onRestored={handleRestored}
          onClose={() => setShowVersions(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
