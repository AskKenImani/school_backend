const mongoose = require('mongoose');
const bcrypt = require('bcrypt');  // You can use bcrypt to hash passwords

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,  // Ensures no two users can have the same email
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      default: 'student', // Set default role to student
    },
  },
  {
    timestamps: true,  // Automatically adds createdAt and updatedAt fields
  }
);

// Hash password before saving it to the database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();  // Proceed to save if the password hasn't been modified
  }
  const salt = await bcrypt.genSalt(10);  // Generate a salt for bcrypt
  this.password = await bcrypt.hash(this.password, salt);  // Hash password
  next();  // Proceed with saving the user
});

// Compare password with hashed password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
