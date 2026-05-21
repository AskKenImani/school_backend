const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({

  surname: {
    type: String,
    required: true
  },

  firstName: {
    type: String,
    required: true
  },

  middleName: {
    type: String
  },

  gender: {
    type: String,
    required: true
  },

  dateOfBirth: {
    type: Date,
    required: true
  },

  applyingForClass: {
    type: String,
    required: true
  },

  previousSchool: {
    type: String
  },

  parentName: {
    type: String,
    required: true
  },

  parentPhone: {
    type: String,
    required: true
  },

  parentEmail: {
    type: String
  },

  address: {
    type: String,
    required: true
  },

  passportPhoto: {
    type: String,
    default: ''
  },

  admissionNumber: {
    type: String,
    default: ''
  },

  remarks: {
    type: String,
    default: ''
   },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  admissionStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },

  entranceScore: {
    type: Number,
    default: null
  },

  role: {
    type: String,
    default: 'applicant'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Applicant', applicantSchema);