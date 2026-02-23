const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');

const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');

/* ===============================
   SHARED READ-ONLY ROUTES
   Access: Admin | Teacher | Student
================================ */

// Get all classes (read-only)
router.get('/classes', verifyToken, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacherId', 'name email')
      .lean();

    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Get all subjects (read-only)
router.get('/subjects', verifyToken, async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('teacherId', 'name')
      .populate('classId', 'name')
      .lean();

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

// Get timetable (read-only)
router.get('/timetable', verifyToken, async (req, res) => {
  try {
    const timetable = await Timetable.find()
      .populate('classId', 'name')
      .populate('entries.subjectId', 'name')
      .populate('entries.teacherId', 'name')
      .lean();

    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch timetable' });
  }
});

module.exports = router;