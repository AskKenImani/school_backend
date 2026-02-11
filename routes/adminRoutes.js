const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 
const verifyToken = require('../middleware/auth');
const Admin = require('../models/Admin')
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

const router = express.Router();

// Get dashboard data for the admin
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalStudents = await Student.countDocuments();
    const attendanceToday = await Attendance.countDocuments({
      date: new Date().toISOString().slice(0, 10), // Get today's attendance
    });

    res.json({
      totalTeachers,
      totalClasses,
      totalStudents,
      attendanceToday,
    });
  } catch (error) {
    console.error('Error in /api/admin/dashboard:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

function generateRandomPassword(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);  // Generate a random string
}

// Teacher creation route
router.post('/create-teacher', async (req, res) => {
  const { name, email, phone, className } = req.body;

  try {
    // Step 1: Generate a unique temporary password (randomized)
    const tempPassword = generateRandomPassword(12);  // Generate a password with 12 characters

    // Step 2: Hash the temporary password before saving
    const hashedPassword = await bcrypt.hash(tempPassword, 10);  // 10 rounds of hashing

    // Step 3: Create the new teacher and save it with the hashed password
    const newTeacher = new Teacher({
      name,
      email,
      phone,
      password: hashedPassword,  // Store the hashed password
      assignedClasses: className ? [className] : [],  // Assign class if provided
    });

    await newTeacher.save();

    // Optional: Log the generated temporary password (for admin's reference)
    console.log(`New teacher created. Temporary password for ${name}: ${tempPassword}`);

    res.status(201).json({ message: 'Teacher created successfully', teacher: newTeacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'Failed to create teacher', error });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Create student
router.post('/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Update student
router.post('/students/:id', async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});


router.post('/create-first-admin', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists with this email.' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);  // Use bcryptjs to hash the password

    // Create the new admin
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,  // Save the hashed password
    });

    // Save the admin to the database
    await newAdmin.save();

    res.status(201).json({ message: 'First admin created successfully', admin: newAdmin });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});


module.exports = router;
