const express = require('express');
const verifyToken = require('../middleware/auth');

const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Conduct = require('../models/Conduct');
const Timetable = require('../models/Timetable');
const Result = require('../models/Result');

const router = express.Router();

/* ===============================
   GET STUDENT PROFILE
================================ */
router.get('/profile', verifyToken, async (req, res) => {
  try {

    const student = await Student.findById(req.user.id)
      .populate('classId', 'name')
      .select('-password')

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    res.json({
      ...student._doc,
      className: student.classId ? student.classId.name : 'Not Assigned'
    })

  } catch (error) {
    console.error('Error fetching student profile:', error)
    res.status(500).json({ message: 'Server Error', error })
  }
})

/* ===============================
   GET NOTES FOR STUDENT CLASS
================================ */
router.get('/notes', verifyToken, async (req, res) => {
  try {

    const Note = require('../models/TeacherNote')

    const student = await Student.findById(req.user.id)

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    if (!student.classId) {
      return res.json({ notes: [] })
    }

    const notes = await Note.find({
      classId: student.classId
    }).populate('subjectId', 'name')
      .sort({ createdAt: -1 })

    res.json({ notes })

  } catch (error) {
    console.error('Error fetching notes:', error)
    res.status(500).json({ message: 'Server Error' })
  }
})

/* ===============================
   GET STUDENT ATTENDANCE
================================ */
router.get('/attendance', verifyToken, async (req, res) => {
  try {
    const attendance = await Attendance.find({ studentId: req.user.id });
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

/* ===============================
   GET STUDENT CONDUCT
================================ */
router.get('/conduct', verifyToken, async (req, res) => {
  try {
    const conduct = await Conduct.findOne({ studentId: req.user.id });
    if (!conduct) return res.status(404).json({ message: 'Conduct not found' });
    res.json(conduct);
  } catch (error) {
    console.error('Error fetching conduct:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

/* ===============================
   GET STUDENT TIMETABLE
================================ */
router.get('/timetable', verifyToken, async (req, res) => {
  try {

    const student = await Student.findById(req.user.id)
      .populate({
        path: 'classId',
        populate: {
          path: 'subjectMappings.teacherId',
          select: 'name'
        }
      })

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    if (!student.classId) {
      return res.json({})
    }

    const timetable = await Timetable.findOne({
      classId: student.classId
    })
    .populate('classId')

    if (!timetable) {
      return res.json({})
    }

    const Subject = require('../models/Subject')

    const grid = timetable.grid || {}
    const output = {}

    for (const day of Object.keys(grid)) {
      output[day] = {}

      for (const period of Object.keys(grid[day])) {
        const cell = grid[day][period]

        if (!cell?.subjectId) {
          output[day][period] = {}
          continue
        }

        const subject = await Subject.findById(cell.subjectId)

        const mapping = student.classId.subjectMappings.find(
          m => String(m.subjectId) === String(cell.subjectId)
        )

        const teacherName = mapping?.teacherId?.name || ''

        output[day][period] = {
          subject: subject?.name || '',
          teacher: teacherName
        }

      }

    }

    res.json(output)

  } catch (error) {
    console.error('Error fetching timetable:', error)
    res.status(500).json({ message: 'Failed to fetch timetable' })
  }
})

/* ===============================
   GET STUDENT RESULTS
================================ */
router.get('/results/:studentId', verifyToken, async (req, res) => {
  try {
    // Ensure student can only access their own results
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const results = await Result.find({ studentId: req.params.studentId });

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No results found' });
    }

    // Calculate total score, max score, average
    let totalScore = 0;
    let maxScore = 0;
    const grades = {};

    results.forEach((r) => {
      totalScore += r.score;
      maxScore += 100; // Assuming each subject is out of 100
      grades[r.subject] = { score: r.score, grade: r.grade };
    });

    const average = ((totalScore / maxScore) * 100).toFixed(2);

    // Fetch conduct and remarks
    const conduct = await Conduct.findOne({ studentId: req.params.studentId });
    const teacherRemarks = conduct?.teacherComment || '';
    const principalRemarks = ''; // Optional: extend later

    res.json({
      totalScore,
      maxScore,
      average,
      grades,
      conduct,
      teacherRemarks,
      principalRemarks,
      scores: results
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

module.exports = router;
