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
    subjectMappings: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true
        },
        teacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
          default: null
        }
      }
    ],
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
