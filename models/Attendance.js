const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true,},
  status: { type: String, enum: ['Present', 'Absent'], required: true },
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
