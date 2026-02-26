const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      unique: true,
      index: true
    },

    grid: {
      type: Object,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Timetable', timetableSchema);