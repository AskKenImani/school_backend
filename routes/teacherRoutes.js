const express = require('express');
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const TeacherNote = require('../models/TeacherNote');
const Result = require('../models/Result');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Timetable = require('../models/Timetable');
const Student = require('../models/Student');

const router = express.Router();

// ---------------------
// Multer setup for file uploads
// ---------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------------
// Teacher profile
// ---------------------
router.get('/profile', verifyToken, roleAuth(['teacher']), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).select('-password');
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// ---------------------
// Attendance marking
// ---------------------
router.post('/attendance', verifyToken, roleAuth(['teacher']), async (req, res) => {
  try {
    const { className, date, records } = req.body;
    if (!className || !date || !records) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if attendance exists for class+date
    let attendance = await Attendance.findOne({ className, date });
    if (!attendance) {
      attendance = new Attendance({ className, date, markedBy: req.user.id, records });
    } else {
      attendance.records = records;
      attendance.markedBy = req.user.id;
    }

    await attendance.save();
    res.json({ message: 'Attendance saved successfully', attendance });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// ---------------------
// Upload note (file or text)
// ---------------------
router.post(
  '/upload-note',
  verifyToken,
  roleAuth(['teacher']),
  upload.single('noteFile'),
  async (req, res) => {
    try {
      const { title, noteText } = req.body;
      let fileUrl = null;
      if (req.file) fileUrl = `/uploads/${req.file.filename}`;

      const newNote = new TeacherNote({
        teacher: req.user.id,
        title,
        text: noteText || '',
        fileUrl,
        uploadedAt: new Date(),
      });

      await newNote.save();
      res.status(200).json({ message: 'Note uploaded successfully', note: newNote });
    } catch (error) {
      console.error('Error uploading note:', error);
      res.status(500).json({ message: 'Failed to upload note', error });
    }
  }
);

// ---------------------
// Save text note only
// ---------------------
router.post(
  '/save-text-note',
  verifyToken,
  roleAuth(['teacher']),
  async (req, res) => {
    try {
      const { title, note } = req.body;

      const newTextNote = new TeacherNote({
        teacher: req.user.id,
        title,
        text: note,
        uploadedAt: new Date(),
      });

      await newTextNote.save();
      res.status(200).json({ message: 'Text note saved successfully', note: newTextNote });
    } catch (error) {
      console.error('Error saving text note:', error);
      res.status(500).json({ message: 'Server Error', error });
    }
  }
);

// ---------------------
// Get notes for the logged-in teacher
// ---------------------
router.get(
  '/notes/:teacherId',
  verifyToken,
  roleAuth(['teacher']),
  async (req, res) => {
    try {
      const teacherId = req.params.teacherId;
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ message: 'Invalid teacher ID' });
      }

      const notes = await TeacherNote.find({ teacher: teacherId }).sort({ uploadedAt: -1 });
      res.json({ notes });
    } catch (error) {
      console.error('Error fetching teacher notes:', error);
      res.status(500).json({ message: 'Failed to fetch notes' });
    }
  }
);

// ---------------------
// Teacher timetable
// ---------------------
router.get(
  '/timetable',
  verifyToken,
  roleAuth(['teacher']),
  async (req, res) => {
    try {
      const timetable = await Timetable.find({ teacherId: req.user.id });
      // Transform timetable into { day: { period: {...} } } structure for frontend
      const grid = {};
      timetable.forEach((t) => {
        if (!grid[t.day]) grid[t.day] = {};
        grid[t.day][t.period] = {
          className: t.className,
          subjectId: t.subjectId.toString(),
        };
      });
      res.json(grid);
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      res.status(500).json({ message: 'Server Error', error });
    }
  }
);

// ---------------------
// Fetch class students for a teacher
// ---------------------
router.get(
  '/class-students/:className',
  verifyToken,
  roleAuth(['teacher']),
  async (req, res) => {
    try {
      const { className } = req.params;
      const students = await Student.find({ className }).select('-password');
      res.json(students);
    } catch (error) {
      console.error('Error fetching class students:', error);
      res.status(500).json({ message: 'Server Error', error });
    }
  }
);

module.exports = router;
