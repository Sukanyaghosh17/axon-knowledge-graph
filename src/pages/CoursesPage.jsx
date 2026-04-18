import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Grid, List, ChevronDown, ChevronUp,
  Folder, Plus, Code, BookOpen,
  Edit2, Trash2, FilePlus, Check, X, Palette, MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CoursesPage.css';

const COURSE_COLORS = [
  { bg: '#E4EDDD', color: '#6A8A5C' },
  { bg: '#F2E8D3', color: '#B37D50' },
  { bg: '#E6EAE8', color: '#748A85' },
  { bg: '#EDE4ED', color: '#8A5C8A' },
  { bg: '#E4E8ED', color: '#5C6E8A' },
  { bg: '#EDE8E4', color: '#8A6E5C' },
];

const STORAGE_KEY = 'axon-courses-data';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { courses: [], files: {} };
}

function saveData(courses, files) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ courses, files }));
}

const CoursesPage = () => {
  const navigate = useNavigate();
  const { courses: initCourses, files: initFiles } = loadData();

  const [courses, setCourses] = useState(initCourses);
  const [files, setFiles] = useState(initFiles); // { [courseId]: [{id,title,type,content}] }
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [avatarUrl, setAvatarUrl] = useState('/avtar_others.png');

  // Inline edit states
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editedCourseTitle, setEditedCourseTitle] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [editedFileTitle, setEditedFileTitle] = useState('');

  // Add course modal
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseColor, setNewCourseColor] = useState(COURSE_COLORS[0]);

  // Add file modal
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileType, setNewFileType] = useState('code'); // 'code' | 'note'
  const [openMenuId, setOpenMenuId] = useState(null); // course id with open dropdown

  const editorRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Persist on change
  useEffect(() => { saveData(courses, files); }, [courses, files]);

  // Avatar
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('axon-user-settings') || '{}');
      if (s.customAvatar) setAvatarUrl(s.customAvatar);
      else if (s.gender === 'Male') setAvatarUrl('/avtar_Male.png');
      else if (s.gender === 'Female') setAvatarUrl('/avtar_Female.png');
    } catch (_) {}
  }, []);

  const activeCourse = courses.find(c => c.id === activeCourseId) || null;
  const courseFiles = activeCourseId ? (files[activeCourseId] || []) : [];
  const activeFile = courseFiles.find(f => f.id === activeFileId) || null;

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Course actions ──────────────────────────────────────────────
  const handleAddCourse = () => {
    if (!newCourseTitle.trim()) return;
    const course = {
      id: `course_${Date.now()}`,
      title: newCourseTitle.trim(),
      ...newCourseColor,
    };
    const next = [...courses, course];
    setCourses(next);
    setNewCourseTitle('');
    setNewCourseColor(COURSE_COLORS[0]);
    setShowAddCourse(false);
    setActiveCourseId(course.id);
    setActiveFileId(null);
  };

  const handleSaveCourseTitle = (courseId, e) => {
    e?.stopPropagation();
    if (!editedCourseTitle.trim()) { setEditingCourseId(null); return; }
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, title: editedCourseTitle.trim() } : c));
    setEditingCourseId(null);
  };

  const handleDeleteCourse = (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this course and all its files?')) return;
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setFiles(prev => { const n = { ...prev }; delete n[courseId]; return n; });
    if (activeCourseId === courseId) { setActiveCourseId(null); setActiveFileId(null); }
  };

  // ── File actions ────────────────────────────────────────────────
  const handleAddFile = () => {
    if (!newFileTitle.trim() || !activeCourseId) return;
    const file = {
      id: `file_${Date.now()}`,
      title: newFileTitle.trim(),
      type: newFileType,
      content: newFileType === 'code' ? '// Start writing code here...' : '',
    };
    setFiles(prev => {
      const next = { ...prev, [activeCourseId]: [...(prev[activeCourseId] || []), file] };
      return next;
    });
    setNewFileTitle('');
    setNewFileType('code');
    setShowAddFile(false);
    setActiveFileId(file.id);
  };

  const handleQuickAddFile = (courseId, type, e) => {
    e.stopPropagation();
    const file = {
      id: `file_${Date.now()}`,
      title: type === 'code' ? 'Untitled Code' : 'Untitled Note',
      type,
      content: type === 'code' ? '// Start writing...' : '',
    };
    setFiles(prev => ({ ...prev, [courseId]: [...(prev[courseId] || []), file] }));
    const course = courses.find(c => c.id === courseId);
    if (course) { setActiveCourseId(courseId); setActiveFileId(file.id); }
  };

  const handleSaveFileTitle = (fileId, e) => {
    e?.stopPropagation();
    if (!editedFileTitle.trim()) { setEditingFileId(null); return; }
    setFiles(prev => ({
      ...prev,
      [activeCourseId]: prev[activeCourseId].map(f =>
        f.id === fileId ? { ...f, title: editedFileTitle.trim() } : f
      )
    }));
    setEditingFileId(null);
  };

  const handleDeleteFile = (fileId, e) => {
    e.stopPropagation();
    setFiles(prev => ({
      ...prev,
      [activeCourseId]: prev[activeCourseId].filter(f => f.id !== fileId)
    }));
    if (activeFileId === fileId) setActiveFileId(null);
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setFiles(prev => ({
      ...prev,
      [activeCourseId]: prev[activeCourseId].map(f =>
        f.id === activeFileId ? { ...f, content: val } : f
      )
    }));
  };

  return (
    <div className="courses-root">
      {/* Navbar */}
      <header className="courses-navbar">
        <div className="courses-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/Logo.png" alt="Axon" className="courses-logo-img" />
          <span className="courses-brand-text">Axon</span>
        </div>
        <div className="courses-nav-right">
          <div className="courses-search">
            <Search size={16} className="courses-search-icon" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="courses-avatar">
            <img src={avatarUrl} alt="User Avatar" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="courses-main">
        {/* Page header */}
        <div className="courses-header-wrapper">
          <div className="courses-header-titles">
            <h1>Your Courses</h1>
            <p>Manage all your semester resources in one place.</p>
          </div>
          <div className="courses-header-actions">
            <div className="courses-view-toggles">
              <button className={`courses-icon-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
              <button className={`courses-icon-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={18} /></button>
            </div>
            <button className="courses-btn-primary" onClick={() => setShowAddCourse(true)}>
              <Plus size={16} /> Add Course
            </button>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="courses-layout">

          {/* Column 1: Course List */}
          <section className="courses-col courses-col-left">
            <div className="courses-accordion-header">
              <h2>All Courses</h2>
              <div onClick={() => setIsExpanded(v => !v)} style={{ cursor: 'pointer' }}>
                {isExpanded
                  ? <ChevronDown size={18} color="#A79F93" />
                  : <ChevronUp size={18} color="#A79F93" />}
              </div>
            </div>

            {isExpanded && (
              <div className={`courses-list ${viewMode === 'grid' ? 'courses-list-grid' : ''}`}>
                {filteredCourses.length === 0 && (
                  <div className="courses-empty-hint">
                    {searchQuery ? 'No courses match your search.' : 'No courses yet. Click "+ Add Course" to start.'}
                  </div>
                )}
                {filteredCourses.map(course => {
                  const isActive = activeCourseId === course.id;
                  const fileCount = (files[course.id] || []).length;
                  return (
                    <div
                      key={course.id}
                      className={`course-card ${isActive ? 'active' : ''}`}
                      onClick={() => { setActiveCourseId(course.id); setActiveFileId(null); }}
                    >
                      <div className="course-card-icon" style={{ backgroundColor: course.bg, color: course.color }}>
                        <Folder size={20} strokeWidth={2.5} />
                      </div>
                      <div className="course-card-info">
                        {editingCourseId === course.id ? (
                          <input
                            type="text"
                            value={editedCourseTitle}
                            autoFocus
                            className="course-inline-input"
                            onChange={e => setEditedCourseTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCourseTitle(course.id, e);
                              if (e.key === 'Escape') setEditingCourseId(null);
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <h3>{course.title}</h3>
                        )}
                        <p>{fileCount} {fileCount === 1 ? 'File' : 'Files'}</p>
                      </div>
                      <div className="course-card-actions" ref={openMenuId === course.id ? menuRef : null}>
                        {editingCourseId === course.id ? (
                          <>
                            <Check size={15} color="green" style={{ cursor: 'pointer' }} onClick={e => handleSaveCourseTitle(course.id, e)} />
                            <X size={15} color="red" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setEditingCourseId(null); }} />
                          </>
                        ) : (
                          <div className="course-menu-wrapper">
                            <button
                              className="course-three-dot"
                              onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === course.id ? null : course.id); }}
                              title="Options"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {openMenuId === course.id && (
                              <div className="course-dropdown" onClick={e => e.stopPropagation()}>
                                <button className="course-dropdown-item" onClick={e => { setOpenMenuId(null); setActiveCourseId(course.id); setShowAddFile(true); }}>
                                  <FilePlus size={14} color="#BA8252" /> Add File
                                </button>
                                <button className="course-dropdown-item" onClick={e => { setOpenMenuId(null); setEditingCourseId(course.id); setEditedCourseTitle(course.title); }}>
                                  <Edit2 size={14} color="#748A85" /> Rename
                                </button>
                                <button className="course-dropdown-item danger" onClick={e => { setOpenMenuId(null); handleDeleteCourse(course.id, e); }}>
                                  <Trash2 size={14} color="#D9534F" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button className="courses-dashed-add" onClick={() => setShowAddCourse(true)}>
                  <Plus size={16} /> Add Course
                </button>
              </div>
            )}
          </section>

          {/* Column 2: Editor */}
          <section className="courses-col courses-col-center">
            {activeFile ? (
              <div className="courses-editor-wrapper">
                <div className="courses-col-topbar" style={{ borderBottom: '1px solid #EBE4D5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeFile.type === 'code'
                      ? <Code size={18} color="#BA8252" />
                      : <BookOpen size={18} color="#748A85" />}
                    {editingFileId === activeFile.id ? (
                      <input
                        type="text"
                        value={editedFileTitle}
                        autoFocus
                        className="file-title-input"
                        onChange={e => setEditedFileTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveFileTitle(activeFile.id, e);
                          if (e.key === 'Escape') setEditingFileId(null);
                        }}
                      />
                    ) : (
                      <span
                        style={{ fontWeight: 600, color: '#4A4036', cursor: 'pointer' }}
                        title="Click to rename"
                        onClick={() => { setEditingFileId(activeFile.id); setEditedFileTitle(activeFile.title); }}
                      >
                        {activeFile.title}
                      </span>
                    )}
                    <span className={`file-type-badge ${activeFile.type}`}>
                      {activeFile.type === 'code' ? 'Code' : 'Note'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {editingFileId === activeFile.id && (
                      <>
                        <Check size={16} color="green" style={{ cursor: 'pointer' }} onClick={e => handleSaveFileTitle(activeFile.id, e)} />
                        <X size={16} color="red" style={{ cursor: 'pointer' }} onClick={() => setEditingFileId(null)} />
                      </>
                    )}
                    <Edit2 size={16} color="#A79F93" style={{ cursor: 'pointer' }} title="Rename file" onClick={() => { setEditingFileId(activeFile.id); setEditedFileTitle(activeFile.title); }} />
                    <Trash2 size={16} color="#D9534F" style={{ cursor: 'pointer' }} title="Delete file" onClick={e => handleDeleteFile(activeFile.id, e)} />
                  </div>
                </div>
                <textarea
                  ref={editorRef}
                  className={activeFile.type === 'code' ? 'courses-code-textarea' : 'courses-note-textarea'}
                  value={activeFile.content}
                  onChange={handleContentChange}
                  spellCheck={activeFile.type === 'note'}
                  placeholder={activeFile.type === 'code' ? '// Write your code here...' : 'Start writing your notes here...'}
                />
              </div>
            ) : activeCourse ? (
              /* ── File browser for selected course ── */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="courses-col-topbar" style={{ borderBottom: '1px solid #EBE4D5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={18} color="#BA8252" />
                    <span style={{ fontWeight: 600, color: '#4A4036' }}>{activeCourse.title}</span>
                    <span style={{ fontSize: '0.8rem', color: '#A79F93' }}>({courseFiles.length} {courseFiles.length === 1 ? 'file' : 'files'})</span>
                  </div>
                  <button className="courses-btn-primary" style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }} onClick={() => setShowAddFile(true)}>
                    <Plus size={14} /> Add File
                  </button>
                </div>

                {courseFiles.length === 0 ? (
                  <div className="courses-empty-state">
                    <div className="courses-empty-folder">
                      <Folder size={64} color="#E8DAC1" fill="#FDF5E6" strokeWidth={1} />
                    </div>
                    <p>No files yet. Add a code file or note.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="courses-btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => { setNewFileType('code'); setShowAddFile(true); }}>
                        <Code size={14} /> New Code File
                      </button>
                      <button className="courses-btn-secondary" onClick={() => { setNewFileType('note'); setShowAddFile(true); }}>
                        <BookOpen size={14} /> New Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="file-browser-grid">
                    {courseFiles.map(file => (
                      <div
                        key={file.id}
                        className="file-browser-card"
                        onClick={() => setActiveFileId(file.id)}
                      >
                        <div className={`file-browser-icon ${file.type}`}>
                          {file.type === 'code'
                            ? <Code size={28} />
                            : <BookOpen size={28} />}
                        </div>
                        <span className="file-browser-title">{file.title}</span>
                        <span className={`file-type-badge ${file.type}`}>
                          {file.type === 'code' ? 'Code' : 'Note'}
                        </span>
                        <div className="file-browser-actions">
                          <Edit2 size={13} color="#748A85" title="Rename" onClick={e => { e.stopPropagation(); setEditingFileId(file.id); setEditedFileTitle(file.title); setActiveFileId(file.id); }} />
                          <Trash2 size={13} color="#D9534F" title="Delete" onClick={e => { e.stopPropagation(); handleDeleteFile(file.id, e); }} />
                        </div>
                      </div>
                    ))}
                    <div className="file-browser-card file-browser-add" onClick={() => setShowAddFile(true)}>
                      <div className="file-browser-icon add">
                        <Plus size={28} />
                      </div>
                      <span className="file-browser-title">Add File</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="courses-empty-state">
                <div className="courses-empty-folder">
                  <Folder size={64} color="#E8DAC1" fill="#FDF5E6" strokeWidth={1} />
                </div>
                <p>Select a course from the left panel.</p>
              </div>
            )}
          </section>

          {/* Column 3: File Details */}
          {activeCourse ? (
            <section className="courses-col courses-col-right">
              <div className="courses-col-topbar details-topbar">
                <div>
                  <h2>{activeCourse.title}</h2>
                </div>
                <button className="courses-icon-btn plain"><MoreHorizontal size={18} color="#A79F93" /></button>
              </div>
              <div className="courses-section">
                <div className="courses-section-header">
                  <h3>Files & Notes <span>({courseFiles.length})</span></h3>
                  <button className="courses-icon-btn plain" onClick={() => setShowAddFile(true)} title="Add file">
                    <Plus size={16} color="#BA8252" />
                  </button>
                </div>
                <div className="courses-item-list">
                  {courseFiles.length === 0 && (
                    <div className="courses-empty-hint" style={{ textAlign: 'center', padding: '1rem 0' }}>
                      No files yet. Add one below.
                    </div>
                  )}
                  {courseFiles.map(file => (
                    <div
                      key={file.id}
                      className={`courses-item-row ${activeFileId === file.id ? 'active' : ''}`}
                      onClick={() => setActiveFileId(file.id)}
                    >
                      <div className="courses-item-left">
                        {file.type === 'code'
                          ? <Code size={16} color={activeFileId === file.id ? '#BA8252' : '#9EA3A5'} />
                          : <BookOpen size={16} color={activeFileId === file.id ? '#748A85' : '#9EA3A5'} />}
                        <span style={{ color: activeFileId === file.id ? '#BA8252' : '#5D5449', fontWeight: activeFileId === file.id ? 600 : 400 }}>
                          {file.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="courses-item-open"
                          style={{ background: activeFileId === file.id ? '#EBD8C8' : '#F3ECE2' }}
                          onClick={e => { e.stopPropagation(); setActiveFileId(file.id); }}
                        >
                          {activeFileId === file.id ? 'Editing' : 'Open'} <ChevronRight size={13} />
                        </button>
                        <Trash2
                          size={14}
                          color="#D9534F"
                          style={{ cursor: 'pointer', flexShrink: 0 }}
                          title="Delete file"
                          onClick={e => handleDeleteFile(file.id, e)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'center' }}>
                  <button className="courses-pill-add" onClick={() => { setNewFileType('code'); setShowAddFile(true); }}>
                    <Code size={13} /> Code
                  </button>
                  <button className="courses-pill-add" onClick={() => { setNewFileType('note'); setShowAddFile(true); }}>
                    <BookOpen size={13} /> Note
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="courses-col courses-col-right" style={{ justifyContent: 'center', alignItems: 'center', color: '#A79F93', display: 'flex' }}>
              <div style={{ textAlign: 'center' }}>
                <Folder size={40} color="#E8DAC1" style={{ marginBottom: '8px' }} />
                <p>Select a course</p>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* FAB */}
      <button className="courses-fab" onClick={() => setShowAddCourse(true)} title="Add Course">
        <Plus size={24} />
      </button>

      {/* ── Add Course Modal ── */}
      {showAddCourse && (
        <div className="modal-overlay" onClick={() => setShowAddCourse(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Course</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#A79F93' }} onClick={() => setShowAddCourse(false)} />
            </div>
            <input
              type="text"
              className="modal-input"
              placeholder="Course title (e.g. Operating Systems)"
              value={newCourseTitle}
              autoFocus
              onChange={e => setNewCourseTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCourse(); if (e.key === 'Escape') setShowAddCourse(false); }}
            />
            <div className="modal-color-label"><Palette size={14} /> Choose Color</div>
            <div className="modal-color-row">
              {COURSE_COLORS.map((c, i) => (
                <div
                  key={i}
                  className={`modal-color-swatch ${newCourseColor === c ? 'selected' : ''}`}
                  style={{ background: c.bg, border: `2px solid ${newCourseColor === c ? c.color : 'transparent'}` }}
                  onClick={() => setNewCourseColor(c)}
                >
                  <Folder size={16} color={c.color} />
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowAddCourse(false)}>Cancel</button>
              <button className="modal-btn-primary" onClick={handleAddCourse} disabled={!newCourseTitle.trim()}>Create Course</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add File Modal ── */}
      {showAddFile && activeCourse && (
        <div className="modal-overlay" onClick={() => setShowAddFile(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add File to "{activeCourse.title}"</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#A79F93' }} onClick={() => setShowAddFile(false)} />
            </div>
            <div className="modal-type-toggle">
              <button
                className={`modal-type-btn ${newFileType === 'code' ? 'active' : ''}`}
                onClick={() => setNewFileType('code')}
              ><Code size={14} /> Code File</button>
              <button
                className={`modal-type-btn ${newFileType === 'note' ? 'active' : ''}`}
                onClick={() => setNewFileType('note')}
              ><BookOpen size={14} /> Note</button>
            </div>
            <input
              type="text"
              className="modal-input"
              placeholder={newFileType === 'code' ? 'File name (e.g. Quick Sort)' : 'Note title (e.g. Lecture 3 Notes)'}
              value={newFileTitle}
              autoFocus
              onChange={e => setNewFileTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddFile(); if (e.key === 'Escape') setShowAddFile(false); }}
            />
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowAddFile(false)}>Cancel</button>
              <button className="modal-btn-primary" onClick={handleAddFile} disabled={!newFileTitle.trim()}>Add File</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
