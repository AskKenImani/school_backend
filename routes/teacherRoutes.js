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
const Class = require('../models/Class')
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
    const teacher = await Teacher.findById(req.user.id)
      .select('-password')
      .populate('classTeacherOf', 'name level arm');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: req.user.role,
      classTeacherOf: teacher.classTeacherOf
        ? {
            _id: teacher.classTeacherOf._id,
            name: teacher.classTeacherOf.name
          }
        : null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ---------------------
// Attendance marking
// ---------------------
router.post('/attendance', verifyToken, roleAuth(['teacher']), async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    const teacherId = req.user.id;

    if (!classId || !date || !records) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // 🔥 CHECK IF TEACHER IS CLASS TEACHER
    if (!classDoc.teacherId || classDoc.teacherId.toString() !== teacherId) {
      return res.status(403).json({
        message: 'You are not assigned as a class teacher'
      });
    }

    // 🔥 LOCK AFTER 24 HOURS
    const attendanceDate = new Date(date);
    const now = new Date();
    const diffHours = (now - attendanceDate) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return res.status(400).json({
        message: 'Attendance locked after 24 hours'
      });
    }

    const existing = await Attendance.findOne({
      classId,
      teacherId,
      date
    });

    if (existing) {
      existing.records = records;
      await existing.save();
      return res.json({ message: 'Attendance updated successfully' });
    }

    const attendance = await Attendance.create({
      classId,
      teacherId,
      date,
      records
    });

    res.status(201).json({
      message: 'Attendance saved successfully',
      attendance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ---------------------
// GET Attendance for class + date
// ---------------------

router.get('/attendance/:classId/:date', verifyToken, roleAuth(['teacher']), async (req, res) => {
    try {
      const { classId, date } = req.params;
      const teacherId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const attendance = await Attendance.findOne({
        classId,
        teacherId,
        date
      });

      if (!attendance) {
        return res.json({ records: [] });
      }

      res.json(attendance);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// ---------------------
// Upload note (file or text)
// ---------------------
router.post('/upload-note', verifyToken, roleAuth(['teacher']), upload.single('noteFile'), async (req, res) => {
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
router.post('/save-text-note', verifyToken, roleAuth(['teacher']), async (req, res) => {
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
router.get('/notes/:teacherId', verifyToken, roleAuth(['teacher']), async (req, res) => {
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
router.get('/timetable/:teacherId', verifyToken, roleAuth(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params

      // Get all classes where teacher is mapped
      const classes = await Class.find({
        'subjectMappings.teacherId': teacherId
      }).populate('subjectMappings.subjectId')

      if (!classes.length) {
        return res.json([])
      }

      const result = []

      for (const klass of classes) {
        const timetable = await Timetable.findOne({
          className: klass.name
        })

        if (!timetable) continue

        const filteredGrid = {}

        Object.keys(timetable.grid || {}).forEach(day => {
          filteredGrid[day] = timetable.grid[day].filter(period =>
            period.teacherId?.toString() === teacherId
          )
        })

        result.push({
          className: klass.name,
          timetable: filteredGrid
        })
      }

      res.json(result)
    } catch (err) {
      console.error('Teacher timetable error:', err)
      res.status(500).json({ message: 'Failed to fetch timetable' })
    }
  });

// ---------------------
// Fetch class students for a teacher
// ---------------------
router.get('/class-students/:classId', verifyToken, roleAuth(['teacher']), async (req, res) => {
    try {
      const { classId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const students = await Student.find({ classId }).select('-password');

      res.json(students);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });

module.exports = router;
