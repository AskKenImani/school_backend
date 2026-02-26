const mongoose = require('mongoose')

const timetableSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      required: true,
      unique: true
    },

    grid: {
      type: Object,  
      required: true
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Timetable', timetableSchema)