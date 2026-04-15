const Note = require('../models/Note');
const { extractLinks } = require('../utils/linkParser');

// @desc  Get all notes
// @route GET /api/notes
const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({}, 'title tags createdAt updatedAt').sort({ updatedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single note
// @route GET /api/notes/:id
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create note
// @route POST /api/notes
const createNote = async (req, res) => {
  try {
    const { title, content = '', tags = [] } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const note = await Note.create({ title, content, tags, links: [], versions: [] });
    // Resolve links after creation
    await resolveLinks(note);

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update note (saves version on content change)
// @route PUT /api/notes/:id
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const { title, content, tags, externalLinks } = req.body;

    // Save current content as a version if content changed
    if (content !== undefined && content !== note.content) {
      note.versions.push({ content: note.content, timestamp: new Date() });
      // Keep only last 50 versions
      if (note.versions.length > 50) note.versions = note.versions.slice(-50);
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (externalLinks !== undefined) note.externalLinks = externalLinks;

    await note.save();
    await resolveLinks(note);

    const updated = await Note.findById(note._id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete note
// @route DELETE /api/notes/:id
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Search notes (full-text)
// @route GET /api/notes/search?q=term
const searchNotes = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const notes = await Note.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' }, title: 1, tags: 1, updatedAt: 1 }
    ).sort({ score: { $meta: 'textScore' } });

    res.json({ success: true, data: notes });
  } catch (err) {
    // Fallback: regex search if text index not ready
    try {
      const regex = new RegExp(req.query.q, 'i');
      const notes = await Note.find(
        { $or: [{ title: regex }, { content: regex }] },
        'title tags updatedAt'
      ).sort({ updatedAt: -1 });
      res.json({ success: true, data: notes });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, message: fallbackErr.message });
    }
  }
};

// @desc  Get graph data (all nodes + edges)
// @route GET /api/graph
const getGraphData = async (req, res) => {
  try {
    const notes = await Note.find({}, 'title links');
    const nodes = notes.map((n) => ({ id: n._id.toString(), title: n.title }));
    const edges = [];
    notes.forEach((n) => {
      n.links.forEach((link) => {
        if (link.noteId) {
          edges.push({ source: n._id.toString(), target: link.noteId.toString() });
        }
      });
    });
    res.json({ success: true, data: { nodes, edges } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Internal helper ──────────────────────────────────────────
// Parses [[links]] in content and resolves noteIds by title match
const resolveLinks = async (note) => {
  const linkedTitles = extractLinks(note.content);
  const resolved = [];
  for (const title of linkedTitles) {
    const found = await Note.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
    resolved.push({ noteId: found ? found._id : null, title });
  }
  note.links = resolved;
  await note.save();
};

module.exports = { getAllNotes, getNoteById, createNote, updateNote, deleteNote, searchNotes, getGraphData };
