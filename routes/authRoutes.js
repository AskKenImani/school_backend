const express = require('express');
const bcrypt = require('bcryptjs');  // For password comparison
const jwt = require('jsonwebtoken'); // For JWT generation
const Teacher = require('../models/Teacher'); // Import Teacher model
const Admin = require('../models/Admin');   // Import Admin model
const Student = require('../models/Student'); // Import Student model

const router = express.Router();

// Login route for all users (admin, teacher, student)
router.post('/login', async (req, res) => {
  console.log('Received login request:', req.body); 
  const { email, password, role } = req.body;
  const user = await Admin.findOne({ email }) || await Teacher.findOne({ email }) || await Student.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },  // Include userId and role in the token
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },  // Include role and user info
  });
//   } catch (error) {
//     console.error('Error during login:', error);
//     res.status(500).json({ message: 'Server Error', error });
//   }
});

module.exports = router;
