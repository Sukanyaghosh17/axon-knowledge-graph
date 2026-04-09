const Note = require('../models/Note');

// @desc  Get outgoing links of a note
// @route GET /api/notes/:id/links
const getLinks = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id, 'links title').populate('links.noteId', 'title tags');
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: note.links });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get backlinks (notes that link TO this note)
// @route GET /api/notes/:id/backlinks
const getBacklinks = async (req, res) => {
  try {
    const noteId = req.params.id;
    const backlinks = await Note.find(
      { 'links.noteId': noteId },
      'title tags updatedAt'
    );
    res.json({ success: true, data: backlinks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLinks, getBacklinks };
