const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  password: { type: String, required: true },
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  uploadedNotes: [{
    fileUrl: { type: String }, // The URL of the uploaded file
    title: { type: String },  // Optional title for the note
    uploadedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
