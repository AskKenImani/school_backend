// models/TeacherNote.js
const mongoose = require('mongoose');

const teacherNoteSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher', // Referencing the Teacher model
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  fileUrl: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const TeacherNote = mongoose.model('TeacherNote', teacherNoteSchema);

module.exports = TeacherNote;
