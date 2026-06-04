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
      classId: student.classId._id
    })
    .sort({ uploadedAt: -1 })

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

    let conduct = await Conduct.findOne({ studentId: req.user.id });

    if (!conduct) {
      conduct = {
        punctuality: 'Not set',
        neatness: 'Not set',
        obedience: 'Not set',
        teamwork: 'Not set',
        teacherComment: ''
      };
    }

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
      classId: student.classId._id
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

    const { term, session } = req.query;

    const results = await Result.find({
      studentId: req.params.studentId,
      ...(term && { term }),
      ...(session && { session })
    }).populate('subject', 'name');

    if (!results || results.length === 0) {
      return res.json({
        totalScore: 0,
        maxScore: 0,
        average: 0,
        grades: {},
        scores: []
      });
    }

    // Calculate total score, max score, average
    let totalScore = 0;
    let maxScore = results.length * 100;

    results.forEach((r)=>{
      totalScore += r.total;
    });

    const average =
    maxScore > 0
    ? ((totalScore / maxScore) * 100).toFixed(2)
    : 0;

    // Fetch conduct and remarks
    const conduct = await Conduct.findOne({ studentId: req.params.studentId });
    const teacherRemarks = conduct?.teacherComment || '';
    const principalRemarks = ''; // Optional: extend later

    res.json({

      term: results[0]?.term || '',
      session: results[0]?.session || '',
      totalScore,
      maxScore,
      average,
      scores: results,
      conduct,
      teacherRemarks,
      principalRemarks
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

module.exports = router;
