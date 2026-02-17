const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, 
    },
    level: {
      type: String,
      required: true,
    },
    arm: {
      type: String,
      required: true,
    },
    subjectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
