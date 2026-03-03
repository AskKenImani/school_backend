const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },

    date: {
      type: String,
      required: true
    },

    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true
        },
        status: {
          type: String,
          enum: ['present', 'absent'],
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

// Prevent duplicates
attendanceSchema.index(
  { classId: 1, teacherId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);