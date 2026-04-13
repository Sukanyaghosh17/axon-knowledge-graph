import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// ── Notes ──────────────────────────────────────────────────
export const fetchAllNotes = () => api.get('/notes');
export const fetchNote = (id) => api.get(`/notes/${id}`);
export const createNote = (data) => api.post('/notes', data);
export const updateNote = (id, data) => api.put(`/notes/${id}`, data);
export const deleteNote = (id) => api.delete(`/notes/${id}`);

// ── Search ─────────────────────────────────────────────────
export const searchNotes = (q) => api.get(`/notes/search?q=${encodeURIComponent(q)}`);

// ── Versions ───────────────────────────────────────────────
export const fetchVersions = (id) => api.get(`/notes/${id}/versions`);
export const restoreVersion = (id, versionIndex) => api.post(`/notes/${id}/restore/${versionIndex}`);

// ── Links ──────────────────────────────────────────────────
export const fetchLinks = (id) => api.get(`/notes/${id}/links`);
export const fetchBacklinks = (id) => api.get(`/notes/${id}/backlinks`);


export default api;
