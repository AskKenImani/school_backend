const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    grade: String,

    gradeRemark: String,

    teacherComment: String,

    term: {
      type: String,
      required: true,
    },

    session: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

function calculateGrade(score) {
  if (score >= 75) return { grade: 'A', remark: 'Excellent' };
  if (score >= 65) return { grade: 'B', remark: 'Very Good' };
  if (score >= 50) return { grade: 'C', remark: 'Good' };
  if (score >= 40) return { grade: 'D', remark: 'Fair' };
  return { grade: 'F', remark: 'Fail' };
}

resultSchema.pre('save', function (next) {
  if (this.isModified('score')) {
    const { grade, remark } = calculateGrade(this.score);
    this.grade = grade;
    this.gradeRemark = remark;
  }
  next();
});

resultSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.score !== undefined) {
    const { grade, remark } = calculateGrade(update.score);
    update.grade = grade;
    update.gradeRemark = remark;
  }

  next();
});

module.exports = mongoose.model('Result', resultSchema);
