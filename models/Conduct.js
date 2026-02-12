// models/Conduct.js
const mongoose = require('mongoose');

const conductSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  punctuality: { type: String, default: 'Not set' },
  neatness: { type: String, default: 'Not set' },
  obedience: { type: String, default: 'Not set' },
  teamwork: { type: String, default: 'Not set' },
  teacherComment: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Conduct', conductSchema);
