const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const verifyToken = require('../middleware/auth');

const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const roleAuth = require('../middleware/roleAuth');
const Timetable = require('../models/Timetable');

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/* ===============================
   ADMIN ACCESS MIDDLEWARE
================================ */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

/* ===============================
   DASHBOARD
================================ */
router.get(
  '/dashboard',
  verifyToken,
  roleAuth(['admin']),
  async (req, res) => {
    try {
      const totalTeachers = await Teacher.countDocuments();
      const totalStudents = await Student.countDocuments();
      const totalClasses = await Class.countDocuments();

      // 🔥 Attendance Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Attendance Today
      const attendanceTodayRecords = await Attendance.find({
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      });

      const attendanceToday = attendanceTodayRecords.length;

      const presentToday = attendanceTodayRecords.filter(
        (a) => a.status === 'present'
      ).length;

      const absentToday = attendanceTodayRecords.filter(
        (a) => a.status === 'absent'
      ).length;

      res.json({
        totalStudents,
        totalTeachers,
        totalClasses,
        attendanceToday,
        presentToday,
        absentToday,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to load dashboard' });
    }
  }
);

/* ===============================
   TEACHERS
================================ */

// Get all teachers
router.get('/teachers', verifyToken, requireAdmin, async (req, res) => {
  const teachers = await Teacher.find().select('-password');
  res.json(teachers);
});

// Create teacher
router.post('/teachers', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, subject = '' } = req.body; // subject default to empty

    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Teacher already exists' });

    // Generate random password (plain-text to return to frontend)
    const tempPassword = crypto.randomBytes(5).toString('hex'); // 10-char random
    const hashed = await bcrypt.hash(tempPassword, 10);

    const teacher = await Teacher.create({
      name,
      email,
      phone,
      subject,
      password: hashed,
      role: 'teacher'
    });

    res.status(201).json({
      message: 'Teacher created',
      teacher: { id: teacher._id, name, email, subject, phone },
      tempPassword // send to frontend to display
    });
  } catch (err) {
    console.error('Teacher creation error:', err);
    res.status(500).json({ message: 'Failed to create teacher', error: err.message });
  }
});

/* ===============================
   STUDENTS
================================ */

// Get all students
router.get('/students', verifyToken, requireAdmin, async (req, res) => {
  try {
    const students = await Student.find().populate('classId', 'name');

    res.json(
      students.map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        admissionNo: s.admissionNo,
        username: s.username,
        guardian: s.guardian,
        classId: s.classId?._id || null,
        className: s.classId?.name || null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Create student
router.post('/students', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, admissionNo, username, guardian, classId } = req.body;

    if (!name || !email || !admissionNo || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const exists = await Student.findOne({
      $or: [{ email }, { admissionNo }, { username }],
    });

    if (exists) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    let klass = null;

    if (classId) {
      await Class.findByIdAndUpdate(classId, {
        $addToSet: { studentIds: student._id },
      });
    }

    const tempPassword = crypto.randomBytes(5).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, 10);

    const student = await Student.create({
      name,
      email,
      admissionNo,
      username,
      guardian,
      classId: classId || null,
      role: 'student',
    });

    if (klass) {
      klass.students.push(student._id);
      await klass.save();
    }

    res.status(201).json({
      id: student._id,
      name: student.name,
      email: student.email,
      admissionNo: student.admissionNo,
      username: student.username,
      guardian: student.guardian,
      classId: student.classId,
    });

  } catch (err) {
    console.error('Student creation error:', err);
    res.status(500).json({ message: 'Failed to create student', error: err.message });
  }
});

/* ===============================
   SUBJECTS
================================ */

// Get subjects
router.get('/subjects', verifyToken, requireAdmin, async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
});

// Create subject
router.post('/subjects', verifyToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  const subject = await Subject.create({ name });
  res.status(201).json(subject);
});

// Delete subject
router.delete('/subjects/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

/* ===============================
   CLASSES
================================ */

// Get classes
router.get('/classes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacherId', 'name')
      .populate('studentIds', 'name');

    res.json(
      classes.map((c) => ({
        id: c._id,
        name: c.name,
        level: c.level,
        arm: c.arm,
        teacherId: c.teacherId?._id || null,
        teacherName: c.teacherId?.name || null,
        studentIds: c.studentIds.map((s) => s._id),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Create a new class
router.post('/classes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { level, arm } = req.body;

    if (!level || !arm) {
      return res.status(400).json({ message: 'Level and Arm required' });
    }

    const name = `${level} ${arm}`;

    const exists = await Class.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Class already exists' });
    }

    const newClass = await Class.create({
      name,
      level,
      arm,
    });

    res.status(201).json({
      id: newClass._id,
      name: newClass.name,
      level: newClass.level,
      arm: newClass.arm,
      teacherId: null,
      studentIds: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create class' });
  }
});

// Update class (assign teacher or students)
router.put('/classes/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { teacherId, studentIds } = req.body;

    const klass = await Class.findById(req.params.id);
    if (!klass) return res.status(404).json({ message: 'Class not found' });

    if (teacherId !== undefined) {
      klass.teacherId = teacherId;
    }

    if (studentIds !== undefined) {
      klass.studentIds = studentIds;
    }

    await klass.save();

    res.json({ message: 'Class updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update class' });
  }
});

/* ===============================
   ATTENDANCE
================================ */

// Get attendance
router.get('/attendance', verifyToken, requireAdmin, async (req, res) => {
  const attendance = await Attendance.find()
    .populate('studentId', 'name')
    .populate('classId', 'name')
    .populate('markedBy', 'name');
  res.json(attendance);
});

// Create attendance (Teacher OR Admin)
router.post(
  '/attendance',
  verifyToken,
  roleAuth(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId, studentId, status } = req.body;

      const attendance = await Attendance.create({
        classId,
        studentId,
        status,
        markedBy: req.user.id, // 🔥 track teacher/admin
      });

      res.status(201).json(attendance);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to create attendance' });
    }
  }
);

/* ===============================
   TIMETABLE
================================ */

// Get timetable
router.get('/timetable', verifyToken, requireAdmin, async (req, res) => {
  const timetable = await Timetable.find();
  res.json(timetable);
});

// Create timetable entry
router.post('/timetable', verifyToken, requireAdmin, async (req, res) => {
  const entry = await Timetable.create(req.body);
  res.status(201).json(entry);
});

/* ===============================
   RESULTS / SCORES
================================ */

// Get all results (Admin only)
router.get('/results', verifyToken, requireAdmin, async (req, res) => {
  const results = await Result.find()
    .populate('studentId', 'name className')
    .populate('teacherId', 'name');
  res.json(results);
});

// Create result
router.post(
  '/results',
  verifyToken,
  roleAuth(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { studentId, subject, score, term, session, teacherComment } =
        req.body;

      const result = await Result.create({
        studentId,
        subject,
        score,
        term,
        session,
        teacherComment,
        teacherId: req.user.id, // 🔥 critical update
      });

      res.status(201).json({
        message: 'Result created successfully',
        result,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// Update result
router.put(
  '/results/:id',
  verifyToken,
  roleAuth(['admin', 'teacher']),
  async (req, res) => {
    try {
      const updated = await Result.findOneAndUpdate(
        { _id: req.params.id },
        req.body,
        { new: true }
      );

      res.json({
        message: 'Result updated successfully',
        result: updated,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// Get results for one student (Admin, Teacher, or Parent)
router.get(
  '/results/student/:studentId',
  verifyToken,
  roleAuth(['admin', 'teacher', 'student']),
  async (req, res) => {
    try {
      const results = await Result.find({
        studentId: req.params.studentId,
      });

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch results' });
    }
  }
);

// 🔥 TERM SUMMARY (Total + Average)
router.get(
  '/results/student/:studentId/summary',
  verifyToken,
  async (req, res) => {
    try {
      const { term, session } = req.query;

      // Student can only see own results
      if (
        req.user.role === 'student' &&
        req.user.id !== req.params.studentId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const results = await Result.find({
        studentId: req.params.studentId,
        term,
        session,
      });

      const totalScore = results.reduce(
        (sum, item) => sum + item.score,
        0
      );

      const averageScore =
        results.length > 0
          ? (totalScore / results.length).toFixed(2)
          : 0;

      res.json({
        totalSubjects: results.length,
        totalScore,
        averageScore,
        results,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

/* ===============================
   REPORTS
================================ */

// Basic report summary
router.get('/reports', verifyToken, requireAdmin, async (req, res) => {
  const totalStudents = await Student.countDocuments();
  const totalTeachers = await Teacher.countDocuments();
  const totalResults = await Result.countDocuments();

  res.json({
    totalStudents,
    totalTeachers,
    totalResults
  });
});

// Generate PDF result sheet for a student per term/session
router.get(
  '/results/:studentId/pdf',
  verifyToken,
  async (req, res) => {
    try {
      const { term, session } = req.query;
      const { studentId } = req.params;

      // Access control: students can see only their own results
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Fetch student info
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Fetch results for term/session
      const results = await Result.find({ studentId, term, session });

      if (!results.length) {
        return res.status(404).json({ message: 'No results found for this term/session' });
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${student.name}_Result_${term}_${session}.pdf`
      );

      // Pipe PDF to response
      doc.pipe(res);

      // --- HEADER ---
      doc
        .fontSize(20)
        .text('Kenmatics School', { align: 'center' })
        .moveDown(0.5);
      doc
        .fontSize(16)
        .text(`Student Result Sheet`, { align: 'center' })
        .moveDown(1);

      doc
        .fontSize(12)
        .text(`Name: ${student.name}`)
        .text(`Class: ${student.className}`)
        .text(`Term: ${term}`)
        .text(`Session: ${session}`)
        .moveDown(1);

      // --- TABLE HEADER ---
      doc
        .fontSize(12)
        .text('Subject', 50, doc.y, { width: 100 })
        .text('Score', 150, doc.y, { width: 50 })
        .text('Grade', 200, doc.y, { width: 50 })
        .text('Remark', 250, doc.y, { width: 100 })
        .text('Teacher Comment', 350, doc.y, { width: 200 })
        .moveDown(0.5);

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

      // --- TABLE ROWS ---
      results.forEach((r) => {
        doc
          .fontSize(12)
          .text(r.subject, 50, doc.y, { width: 100 })
          .text(r.score, 150, doc.y, { width: 50 })
          .text(r.grade, 200, doc.y, { width: 50 })
          .text(r.gradeRemark, 250, doc.y, { width: 100 })
          .text(r.teacherComment || '-', 350, doc.y, { width: 200 })
          .moveDown(0.5);
      });

      // --- SUMMARY ---
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const averageScore = (totalScore / results.length).toFixed(2);

      doc.moveDown(1);
      doc
        .fontSize(12)
        .text(`Total Score: ${totalScore}`, { continued: true })
        .text(`   Average Score: ${averageScore}`);

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  }
);


module.exports = router;
