import axios from 'axios';

// ── In-Memory Mock Data ──────────────────────────────────────
let mockNotes = [
  { _id: '1', title: 'Welcome to Axon', content: 'Start creating your notes here. Use [[Note Title]] to link.', tags: ['welcome'], updatedAt: new Date().toISOString() },
  { _id: '2', title: 'Design Ideas', content: '1. Use orange theme\n2. Evernote layout\n3. No AI or Upgrade features', tags: ['design'], updatedAt: new Date().toISOString() }
];

// Helper to simulate network latency and API response structure
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const mockResponse = (data) => delay(250).then(() => ({ data: { data } }));

// ── Notes ──────────────────────────────────────────────────
export const fetchAllNotes = () => mockResponse(mockNotes);

export const fetchNote = (id) => {
  const note = mockNotes.find(n => n._id === id);
  return mockResponse(note || {});
};

export const createNote = (data) => {
  const newNote = {
    _id: Math.random().toString(36).substr(2, 9),
    title: data.title || 'Untitled',
    content: data.content || '',
    tags: data.tags || [],
    updatedAt: new Date().toISOString()
  };
  mockNotes = [newNote, ...mockNotes];
  return mockResponse(newNote);
};

export const updateNote = (id, data) => {
  const idx = mockNotes.findIndex(n => n._id === id);
  if (idx > -1) {
    mockNotes[idx] = { ...mockNotes[idx], ...data, updatedAt: new Date().toISOString() };
  }
  return mockResponse(mockNotes[idx]);
};

export const deleteNote = (id) => {
  mockNotes = mockNotes.filter(n => n._id !== id);
  return mockResponse({ success: true });
};

// ── Search ─────────────────────────────────────────────────
export const searchNotes = (q) => {
  const term = q.toLowerCase();
  const results = mockNotes.filter(n => 
    (n.title || '').toLowerCase().includes(term) || 
    (n.content || '').toLowerCase().includes(term)
  );
  return mockResponse(results);
};

// ── Versions ───────────────────────────────────────────────
export const fetchVersions = (id) => mockResponse([]); // Mock empty versions
export const restoreVersion = (id, versionIndex) => mockResponse({});

// ── Links ──────────────────────────────────────────────────
export const fetchLinks = (id) => mockResponse([]);
export const fetchBacklinks = (id) => mockResponse([]);

// ── Graph ──────────────────────────────────────────────────
export const fetchGraphData = () => {
  return mockResponse({ nodes: [], links: [] });
};

// Dummy axios instance to avoid errors if used directly
export default axios.create();
