const express = require('express');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const TeacherNote = require('../models/TeacherNote');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where notes will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // File name
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

// Get teacher profile
router.get('/profile', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacherId); // Assuming teacherId is in the request
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Mark attendance for students
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, status, classId } = req.body;
    const attendance = new Attendance({ studentId, status, classId });
    await attendance.save();
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Upload note (both file and text-based)
router.post('/upload-note', upload.single('noteFile'), async (req, res) => {
  try {
    const { teacherId, title, noteText } = req.body; // Get teacherId, title and noteText (if any)

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`; // File upload logic
    }

    // Save the note to the database
    const newNote = new TeacherNote({
      teacher: teacherId,
      title,
      text: noteText, // Save text-based note
      fileUrl,         // Save uploaded file URL if any
      uploadedAt: Date.now(),
    });

    await newNote.save();
    res.status(200).json({ message: 'Note uploaded successfully', note: newNote });
  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).json({ message: 'Failed to upload note', error });
  }
});

// Save text-based note
router.post('/save-text-note', async (req, res) => {
  try {
    const { teacherId, note, title } = req.body;

    const newTextNote = new TeacherNote({
      teacher: teacherId,
      title,
      text: note,
      uploadedAt: Date.now(),
    });

    await newTextNote.save();
    res.status(200).json({ message: 'Text note saved successfully', note: newTextNote });
  } catch (error) {
    console.error('Error saving text note:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Get notes for a specific teacher
router.get('/notes/:teacherId', async (req, res) => {
  console.log('Fetching notes for teacherId:', req.params.teacherId); // Add this for debugging
  try {
    const teacherId = mongoose.Types.ObjectId(req.params.teacherId);
    const notes = await TeacherNote.find({ teacher: req.params.teacherId });
    if (!notes) {
      return res.status(404).json({ message: 'No notes found' });
    }
    res.json({ notes });
  } catch (error) {
    console.error('Error fetching teacher notes:', error); // Log the error for debugging
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});


module.exports = router;

