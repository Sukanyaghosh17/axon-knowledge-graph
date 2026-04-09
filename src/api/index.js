import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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
export const restoreVersion = (id, versionIndex) =>
  api.post(`/notes/${id}/restore/${versionIndex}`);

// ── Links ──────────────────────────────────────────────────
export const fetchLinks = (id) => api.get(`/notes/${id}/links`);
export const fetchBacklinks = (id) => api.get(`/notes/${id}/backlinks`);

// ── Graph ──────────────────────────────────────────────────
export const fetchGraphData = () => api.get('/notes/graph');

export default api;
