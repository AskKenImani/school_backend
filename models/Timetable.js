const mongoose = require('mongoose')

const timetableSchema = new mongoose.Schema(
  {
    className: {
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