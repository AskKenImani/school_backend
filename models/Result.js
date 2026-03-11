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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },

    weekly:{
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },

    test1:{
      type:Number,
      default:0,
      min:0,
      max:10
    },

    test2:{
      type:Number,
      default:0,
      min:0,
      max:10
    },

    exam:{
      type:Number,
      default:0,
      min:0,
      max:60
    },

    total: {
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

resultSchema.pre('save',function(next){

  const total = this.weekly + this.test1 + this.test2 + this.exam
  this.total = total

  const {grade,remark} = calculateGrade(total)

  this.grade = grade
  this.gradeRemark = remark

  next()
});

resultSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.total !== undefined) {
    const { grade, remark } = calculateGrade(update.total);
    update.grade = grade;
    update.gradeRemark = remark;
  }

  next();
});

module.exports = mongoose.model('Result', resultSchema);
