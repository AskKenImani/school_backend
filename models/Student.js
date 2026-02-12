const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  attendanceHistory: [{
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
  }],
  grades: [{
    subject: { type: String },
    grade: { type: String },
  }],
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
