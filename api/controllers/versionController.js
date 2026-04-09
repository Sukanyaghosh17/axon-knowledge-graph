const Note = require('../models/Note');

// @desc  Get version history of a note
// @route GET /api/notes/:id/versions
const getVersions = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id, 'versions title');
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    // Return versions in reverse chronological order (newest first)
    const sorted = [...note.versions].reverse();
    res.json({ success: true, data: sorted, noteTitle: note.title });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Restore a specific version
// @route POST /api/notes/:id/restore/:versionIndex
// versionIndex is 0-based index in the REVERSED array (0 = most recent version)
const restoreVersion = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const idx = parseInt(req.params.versionIndex, 10);
    const reversed = [...note.versions].reverse();

    if (idx < 0 || idx >= reversed.length) {
      return res.status(400).json({ success: false, message: 'Invalid version index' });
    }

    const targetVersion = reversed[idx];

    // Save current content as a new version before restoring
    note.versions.push({ content: note.content, timestamp: new Date() });
    note.content = targetVersion.content;
    if (note.versions.length > 50) note.versions = note.versions.slice(-50);

    await note.save();
    res.json({ success: true, data: note, message: 'Version restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getVersions, restoreVersion };
