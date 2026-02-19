const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  username: { type: String, required: true, unique: true, },
  guardian: { type: String, default: '',},
  admissionNo: { type: String, required: true, unique: true, },
  email: { type: String, required: true, unique: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null, },
  attendanceHistory: [{
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['present', 'absent'], required: true },
  }],
  grades: [{
    subject: { type: String },
    grade: { type: String },
  }],
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
