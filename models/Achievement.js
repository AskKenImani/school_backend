const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    image: {
      type: String,
      required: true
    },

    animation: {
      type: String,
      enum: [
        'fade',
        'slide',
        'zoom',
        'flip'
      ],
      default: 'fade'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Achievement', achievementSchema);