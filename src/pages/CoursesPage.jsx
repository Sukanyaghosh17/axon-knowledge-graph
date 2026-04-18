import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Grid, List, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Folder, Plus, Code, BookOpen, Layers, Briefcase, FlaskConical, FileText,
  Edit2, Trash2, FilePlus, Check, X, Palette, MoreHorizontal, UploadCloud,
  FileIcon, ImageIcon, FileJson, FileVideo, FileAudio, FileArchive
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

const DEFAULT_PLAYLISTS = [
  { 
    id: 'p1',
    title: "Striver's A2Z DSA Course", 
    author: 'takeUforward', 
    img: '/striver_thumbnail.png', 
    videos: 'Full Learning Path',
    url: 'https://youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz&si=-m3W8WZDD84sgRNc'
  },
  { 
    id: 'p2',
    title: 'JavaScript One Shot', 
    author: 'Programming with Mosh', 
    img: 'https://img.youtube.com/vi/sscX432bMZo/maxresdefault.jpg', 
    videos: 'View Lesson',
    url: 'https://youtu.be/sscX432bMZo?si=AAI8ph9ljtZIYWk4'
  },
  { 
    id: 'p3',
    title: 'React One Shot', 
    author: 'Programming with Mosh', 
    img: 'https://img.youtube.com/vi/SqcY0GlETPk/maxresdefault.jpg', 
    videos: 'View Lesson',
    url: 'https://youtu.be/SqcY0GlETPk?si=-ZibRmXmmwAy4O53'
  }
];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (!data.playlists || data.playlists.length === 0) {
        data.playlists = DEFAULT_PLAYLISTS;
      }
      return data;
    }
  } catch (_) {}
  return { 
    courses: [], 
    files: {}, 
    playlists: DEFAULT_PLAYLISTS
  };
}

function saveData(courses, files, playlists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ courses, files, playlists }));
}

const CoursesPage = () => {
  const navigate = useNavigate();
  const { courses: initCourses, files: initFiles, playlists: initPlaylists = [] } = loadData();

  const [courses, setCourses] = useState(initCourses);
  const [files, setFiles] = useState(initFiles); // { [courseId]: [{id,title,type,content}] }
  const [playlists, setPlaylists] = useState(initPlaylists);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [newFileFolder, setNewFileFolder] = useState('Resources'); // 'Lectures' | 'Assignments' | 'Resources'
  const [activeFolderFilter, setActiveFolderFilter] = useState('All');
  
  // Add folder modal
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Add playlist modal
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [newPlUrl, setNewPlUrl] = useState('');
  const [newPlTitle, setNewPlTitle] = useState('');
  const [newPlAuthor, setNewPlAuthor] = useState('');
  
  // Upload simulation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  useEffect(() => { saveData(courses, files, playlists); }, [courses, files, playlists]);

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

  // ── Playlist actions ─────────────────────────────────────────────
  const handleAddPlaylist = () => {
    if (!newPlUrl.trim() || !newPlTitle.trim()) return;

    let img = '/striver_thumbnail.png'; // default fallback
    let typeText = 'Full Learning Path';

    if (newPlUrl.includes('youtu.be') || newPlUrl.includes('v=')) {
      typeText = 'View Lesson';
    }

    const vMatch = newPlUrl.match(/(?:v=|youtu\.be\/|embed\/)([^&?\/]+)/);
    if (vMatch && vMatch[1]) {
      img = `https://img.youtube.com/vi/${vMatch[1]}/maxresdefault.jpg`;
    }

    const newItem = {
      id: `pl_${Date.now()}`,
      title: newPlTitle.trim(),
      author: newPlAuthor.trim() || 'YouTube',
      img,
      videos: typeText,
      url: newPlUrl.trim()
    };

    setPlaylists(prev => [...prev, newItem]);
    setNewPlUrl('');
    setNewPlTitle('');
    setNewPlAuthor('');
    setShowAddPlaylist(false);
  };

  const handleDeletePlaylist = (id, e) => {
    e.stopPropagation();
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  // ── File actions ────────────────────────────────────────────────
  const handleAddFolder = () => {
    if (!newFolderName.trim() || !activeCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id === activeCourseId) {
        const currentFolders = c.folders || ['Lectures', 'Assignments', 'Resources'];
        if (!currentFolders.includes(newFolderName.trim())) {
          return { ...c, folders: [...currentFolders, newFolderName.trim()] };
        }
      }
      return c;
    }));
    setNewFolderName('');
    setShowAddFolder(false);
  };

  const handleDeleteFolder = (folderName, e) => {
    e.stopPropagation();
    if (['Lectures', 'Assignments', 'Resources'].includes(folderName)) return;
    if (!window.confirm(`Delete the "${folderName}" folder and all its files?`)) return;

    setCourses(prev => prev.map(c => {
      if (c.id === activeCourseId) {
        return { ...c, folders: (c.folders || []).filter(f => f !== folderName) };
      }
      return c;
    }));

    // Optionally delete files in that folder
    setFiles(prev => ({
      ...prev,
      [activeCourseId]: (prev[activeCourseId] || []).filter(f => f.folder !== folderName)
    }));
  };

  const handleAddFile = () => {
    if (!newFileTitle.trim() || !activeCourseId) return;
    const file = {
      id: `file_${Date.now()}`,
      title: newFileTitle.trim(),
      type: newFileType,
      content: newFileType === 'code' ? '// Start writing code here...' : '',
      folder: newFileFolder
    };
    setFiles(prev => {
      const next = { ...prev, [activeCourseId]: [...(prev[activeCourseId] || []), file] };
      return next;
    });
    setNewFileTitle('');
    setNewFileType('code');
    setNewFileFolder('Resources');
    setShowAddFile(false);
    setActiveFileId(file.id);
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0 || !activeCourseId) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const newFiles = uploadedFiles.map(f => {
            let fType = 'document';
            if (f.name.endsWith('.pdf')) fType = 'pdf';
            else if (f.name.match(/\.(jpeg|jpg|gif|png)$/i)) fType = 'image';
            
            return {
              id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: f.name,
              type: fType,
              content: `Simulation of uploaded file: ${f.name}`,
              folder: newFileFolder
            };
          });

          setFiles(prevFiles => ({
            ...prevFiles,
            [activeCourseId]: [...(prevFiles[activeCourseId] || []), ...newFiles]
          }));

          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setShowAddFile(false);
          }, 500);
          
          return 100;
        }
        return prev + 10;
      });
    }, 150);
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

      {/* Main */}
      <main className="courses-main">
        {/* Page header */}
        <div className="courses-header-wrapper">
          <div className="courses-header-titles">
            <h1>Your Courses</h1>
            <p>Manage all your semester resources in one place.</p>
          </div>
          <div className="courses-header-actions">
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
              <div className="courses-list">
                {filteredCourses.length === 0 && (
                  <div className="courses-empty-hint">
                    {searchQuery ? 'No courses match your search.' : 'No courses yet. Click "+ Add Course" to start.'}
                  </div>
                )}
                {filteredCourses.map((course, index) => {
                  const isActive = activeCourseId === course.id;
                  const fileCount = (files[course.id] || []).length;
                  const COURSE_ICONS = [Folder, Layers, BookOpen, Briefcase, FlaskConical];
                  const Icon = COURSE_ICONS[index % COURSE_ICONS.length];
                  return (
                    <div
                      key={course.id}
                      className={`course-card ${isActive ? 'active' : ''}`}
                      onClick={() => { setActiveCourseId(course.id); setActiveFileId(null); }}
                    >
                      <div className="course-card-icon">
                        <Icon size={20} strokeWidth={2.5} />
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

          {/* Column 2: Resources */}
          <section className="courses-col courses-col-center">
            {activeFile ? (
              <div className="courses-editor-wrapper">
                <div className="courses-col-topbar" style={{ borderBottom: '1px solid #EBE4D5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(() => {
                      if (activeFile.type === 'code') return <Code size={18} color="#BA8252" />;
                      if (activeFile.type === 'image') return <ImageIcon size={18} color="#748A85" />;
                      if (activeFile.type === 'pdf') return <FileIcon size={18} color="#D9534F" />;
                      return <BookOpen size={18} color="#748A85" />;
                    })()}
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
                      {activeFile.type.toUpperCase()}
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
                    <Trash2 size={16} color="#D9534F" style={{ cursor: 'pointer' }} title="Delete file" onClick={e => { setActiveFileId(null); handleDeleteFile(activeFile.id, e); }} />
                    <button className="courses-icon-btn plain" onClick={() => setActiveFileId(null)} style={{ marginLeft: '8px' }} title="Close Editor">
                      <X size={18} color="#A79F93" />
                    </button>
                  </div>
                </div>
                {['code', 'note'].includes(activeFile.type) ? (
                  <textarea
                    ref={editorRef}
                    className={activeFile.type === 'code' ? 'courses-code-textarea' : 'courses-note-textarea'}
                    value={activeFile.content}
                    onChange={handleContentChange}
                    spellCheck={activeFile.type === 'note'}
                    placeholder={activeFile.type === 'code' ? '// Write your code here...' : 'Start writing your notes here...'}
                  />
                ) : (
                  <div className="courses-file-preview-placeholder">
                    <div className="preview-icon-large">
                      {activeFile.type === 'image' ? <ImageIcon size={64} /> : <FileIcon size={64} />}
                    </div>
                    <h3>Preview not available</h3>
                    <p>This is a simulation of the uploaded <strong>{activeFile.title}</strong>.</p>
                    <button className="courses-btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.alert('Download started...')}>
                       Download File
                    </button>
                  </div>
                )}
              </div>
            ) : activeCourse ? (
              <>
                <div className="courses-resources-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Course Resources</h2>
                  <button className="courses-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={() => setShowAddFolder(true)}>
                    <Plus size={14} /> Add Folder
                  </button>
                </div>
                
                <div className="courses-breadcrumb">
                  <Folder size={16} color="#BA8252" fill="#FDF5E6" />
                  <span onClick={() => setActiveFileId(null)} style={{ cursor: 'pointer', hover: { color: '#BA8252' } }}>
                    {activeCourse.title}
                  </span>
                  <ChevronRight size={14} color="#A79F93" />
                  <strong>Resources</strong>
                </div>

                <div className="courses-folders-row" style={{ flexWrap: 'wrap' }}>
                  {(activeCourse.folders || ['Lectures', 'Assignments', 'Resources']).map(folder => (
                    <div 
                      key={folder} 
                      className="courses-folder-item"
                      style={{ position: 'relative' }}
                      onClick={() => {
                        setNewFileFolder(folder);
                        setShowAddFile(true);
                      }}
                    >
                      <Folder size={64} color="#E8DAC1" fill="#FDF5E6" strokeWidth={1} />
                      <span>{folder}</span>
                      {!['Lectures', 'Assignments', 'Resources'].includes(folder) && (
                        <div 
                          className="folder-delete-btn"
                          onClick={(e) => handleDeleteFolder(folder, e)}
                          title="Delete folder"
                        >
                          <X size={12} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {(() => {
                  return courseFiles.length === 0 ? (
                    <div className="courses-empty-state">
                      <p>No files in this course yet. Click a folder above to add one.</p>
                    </div>
                  ) : (
                    <table className="courses-file-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Folder</th>
                          <th style={{textAlign: 'right'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseFiles.map(file => (
                          <tr key={file.id} onClick={() => setActiveFileId(file.id)}>
                            <td>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                {(() => {
                                  if (file.type === 'code') return <Code size={16} color="#BA8252"/>;
                                  if (file.type === 'image') return <ImageIcon size={16} color="#748A85"/>;
                                  if (file.type === 'pdf') return <FileIcon size={16} color="#D9534F"/>;
                                  if (file.type === 'video') return <FileVideo size={16} color="#5C6E8A"/>;
                                  return <FileText size={16} color="#BA8252"/>;
                                })()}
                                {file.title}
                              </div>
                            </td>
                            <td><span className={`file-type-badge ${file.type}`}>{file.type === 'code' ? 'Code' : 'Note'}</span></td>
                            <td><span className="file-folder-badge">{file.folder || 'Resources'}</span></td>
                            <td style={{textAlign: 'right'}}>
                              <Trash2 size={16} color="#D9534F" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, e); }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </>
            ) : (
              <div className="courses-empty-state">
                <p>Select a course to view resources.</p>
              </div>
            )}
          </section>

          {/* Column 3: Playlists */}
          <section className="courses-col courses-col-right">
            <div className="courses-overview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Playlists and Videos</h2>
              <button className="courses-icon-btn plain" onClick={() => setShowAddPlaylist(true)} title="Add YouTube Link">
                <Plus size={18} color="#A79F93" />
              </button>
            </div>
            <div className="courses-playlists-list">
              {playlists.map((pl) => (
                <div 
                  key={pl.id} 
                  className="courses-playlist-item" 
                  onClick={() => pl.url !== '#' && window.open(pl.url, '_blank')}
                  style={{ position: 'relative' }}
                >
                  <img src={pl.img} alt={pl.title} className="courses-playlist-thumb" />
                  <div className="courses-playlist-info">
                    <h4 title={pl.title}>{pl.title}</h4>
                    <p>{pl.author}</p>
                    <span className="courses-playlist-meta">{pl.videos}</span>
                  </div>
                  <Trash2 
                    size={14} 
                    color="#D9534F" 
                    style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', opacity: 0.7 }} 
                    onClick={(e) => handleDeletePlaylist(pl.id, e)} 
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>


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

      {/* ── Add/Upload File Modal ── */}
      {showAddFile && activeCourse && (
        <div className="modal-overlay" onClick={() => setShowAddFile(false)}>
          <div className="modal-box modal-box-split" onClick={e => e.stopPropagation()}>
            <div className="modal-close-icon">
              <X size={20} style={{ cursor: 'pointer', color: '#A79F93' }} onClick={() => setShowAddFile(false)} />
            </div>

            {/* Left Pane: Create File */}
            <div className="modal-pane modal-pane-left">
              <h3>Create File</h3>
              
              <div className="modal-field">
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8C8477', marginBottom: '6px', fontWeight: '500' }}>Target Folder</label>
                <select 
                  className="modal-folder-select" 
                  value={newFileFolder}
                  onChange={e => setNewFileFolder(e.target.value)}
                >
                  {(activeCourse.folders || ['Lectures', 'Assignments', 'Resources']).map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              </div>

              <div className="modal-type-toggle" style={{ marginTop: '0.5rem' }}>
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
                style={{ marginTop: '0.5rem' }}
                placeholder={newFileType === 'code' ? 'File name (e.g. Quick Sort)' : 'Note title'}
                value={newFileTitle}
                autoFocus
                onChange={e => setNewFileTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddFile(); }}
              />

              <div className="modal-actions" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button className="modal-btn-primary" style={{ width: '100%' }} onClick={handleAddFile} disabled={!newFileTitle.trim()}>Create File</button>
              </div>
            </div>

            {/* Right Pane: Upload File */}
            <div className="modal-pane modal-pane-right">
              <h3>Upload File</h3>
              <p style={{ fontSize: '0.85rem', color: '#8C8477', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                Files will be uploaded to the <strong>{newFileFolder}</strong> folder.
              </p>
              
              <div className="modal-upload-area">
                {isUploading ? (
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: '1rem', color: '#BA8252', fontWeight: 600 }}>Uploading... {uploadProgress}%</div>
                    <div style={{ width: '100%', height: '8px', background: '#EBE4D5', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#BA8252', transition: 'width 0.2s' }}></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={48} color="#BA8252" style={{ marginBottom: '8px' }} />
                    <p>Drag and Drop Files</p>
                    <span>Or</span>
                    <label className="modal-btn-upload">
                      Browse
                      <input type="file" multiple style={{display: 'none'}} onChange={handleFileUpload} />
                    </label>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
      {/* ── Add Folder Modal ── */}
      {showAddFolder && activeCourse && (
        <div className="modal-overlay" onClick={() => setShowAddFolder(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Folder</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#A79F93' }} onClick={() => setShowAddFolder(false)} />
            </div>
            <input
              type="text"
              className="modal-input"
              placeholder="Folder name (e.g. Past Papers)"
              value={newFolderName}
              autoFocus
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setShowAddFolder(false); }}
            />
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="modal-btn-cancel" onClick={() => setShowAddFolder(false)}>Cancel</button>
              <button className="modal-btn-primary" onClick={handleAddFolder} disabled={!newFolderName.trim()}>Add Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Playlist Modal ── */}
      {showAddPlaylist && (
        <div className="modal-overlay" onClick={() => setShowAddPlaylist(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add YouTube Resource</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#A79F93' }} onClick={() => setShowAddPlaylist(false)} />
            </div>
            
            <div className="modal-field" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8C8477', marginBottom: '6px', fontWeight: '500' }}>YouTube URL</label>
              <input
                type="text"
                className="modal-input"
                placeholder="https://youtube.com/..."
                value={newPlUrl}
                autoFocus
                onChange={e => setNewPlUrl(e.target.value)}
              />
            </div>

            <div className="modal-field" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8C8477', marginBottom: '6px', fontWeight: '500' }}>Title</label>
              <input
                type="text"
                className="modal-input"
                placeholder="e.g. Next.js Crash Course"
                value={newPlTitle}
                onChange={e => setNewPlTitle(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8C8477', marginBottom: '6px', fontWeight: '500' }}>Author / Channel Name (Optional)</label>
              <input
                type="text"
                className="modal-input"
                placeholder="e.g. Fireship"
                value={newPlAuthor}
                onChange={e => setNewPlAuthor(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddPlaylist(); }}
              />
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="modal-btn-cancel" onClick={() => setShowAddPlaylist(false)}>Cancel</button>
              <button className="modal-btn-primary" onClick={handleAddPlaylist} disabled={!newPlUrl.trim() || !newPlTitle.trim()}>Add Resource</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoursesPage;
