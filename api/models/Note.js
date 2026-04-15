const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const LinkSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  title: { type: String },
}, { _id: false });

const ExternalLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    links: {
      type: [LinkSchema],
      default: [],
    },
    externalLinks: {
      type: [ExternalLinkSchema],
      default: [],
    },
    versions: {
      type: [VersionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Full-text index for search
NoteSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Note', NoteSchema);
