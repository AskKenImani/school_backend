const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true,},
  records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        status: {
          type: String,
          enum: ['present', 'absent'],
          required: true
        }
      }
    ],
  status: { type: String, enum: ['Present', 'Absent'], required: true },
}, { timestamps: true });

attendanceSchema.index(
  { classId: 1, subjectId: 1, teacherId: 1, date: 1 },
  { unique: true }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
