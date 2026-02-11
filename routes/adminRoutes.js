const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 
const verifyToken = require('../middleware/auth');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

const router = express.Router();

// Helper: generate random password
function generateRandomPassword(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// ----------------------------
// Admin Dashboard Data
// ----------------------------
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalStudents = await Student.countDocuments();
    const attendanceToday = await Attendance.countDocuments({
      date: new Date().toISOString().slice(0, 10),
    });

    res.json({ totalTeachers, totalClasses, totalStudents, attendanceToday });
  } catch (error) {
    console.error('Error in /api/admin/dashboard:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// ----------------------------
// Create Teacher
// ----------------------------
router.post('/create-teacher', verifyToken, async (req, res) => {
  const { name, email, phone, className } = req.body;

  try {
    // Check if teacher exists
    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Teacher already exists' });

    const tempPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newTeacher = new Teacher({
      name,
      email,
      phone,
      password: hashedPassword,
      assignedClasses: className ? [className] : [],
      role: 'teacher',
    });

    await newTeacher.save();

    // Return the password to admin
    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: newTeacher,
      tempPassword
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// ----------------------------
// Create Student
// ----------------------------
router.post('/create-student', verifyToken, async (req, res) => {
  const { name, admissionNo, username, className, guardian } = req.body;

  try {
    const exists = await Student.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Student username already exists' });

    const tempPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newStudent = new Student({
      name,
      admissionNo,
      username,
      className: className || null,
      guardian,
      password: hashedPassword,
      role: 'student',
    });

    await newStudent.save();

    res.status(201).json({
      message: 'Student created successfully',
      student: newStudent,
      tempPassword
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// ----------------------------
// Get All Students
// ----------------------------
router.get('/students', verifyToken, async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// ----------------------------
// Update Student
// ----------------------------
router.post('/students/:id', verifyToken, async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// ----------------------------
// Create First Admin
// ----------------------------
router.post('/create-first-admin', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword, role: 'admin' });
    await newAdmin.save();

    res.status(201).json({ message: 'First admin created successfully', admin: newAdmin });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

module.exports = router;
