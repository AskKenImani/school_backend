const express = require('express');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const router = express.Router();

// Get student profile
router.get('/profile', async (req, res) => {
  try {
    const student = await Student.findById(req.studentId); // Assuming studentId is in the request
    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Get student attendance
router.get('/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.find({ studentId: req.studentId });
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

module.exports = router;
