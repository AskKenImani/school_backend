const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  marks: { type: Number, required: true },
  grade: { type: String },
  examDate: { type: Date, required: true },
  remarks: { type: String },
}, { timestamps: true });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
