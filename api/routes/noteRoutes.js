const express = require('express');
const router = express.Router();

const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  getGraphData,
} = require('../controllers/noteController');

const { getVersions, restoreVersion } = require('../controllers/versionController');
const { getLinks, getBacklinks } = require('../controllers/linkController');

// Search (must be before /:id to avoid conflict)
router.get('/search', searchNotes);

// Graph
router.get('/graph', getGraphData);

// CRUD
router.route('/')
  .get(getAllNotes)
  .post(createNote);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

// Versions
router.get('/:id/versions', getVersions);
router.post('/:id/restore/:versionIndex', restoreVersion);

// Links
router.get('/:id/links', getLinks);
router.get('/:id/backlinks', getBacklinks);

module.exports = router;
