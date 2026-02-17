'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Course Schema
 * A course belongs to one class and can have multiple teachers.
 *
 * courseTerm:
 *   1: Semester 1 | 2: Semester 2 | 3: Semester 3 | 4: Whole year
 *   REB → 4  |  WDA / University → 1, 2, 3
 */
const CourseSchema = new Schema({
  name:             { type: String, required: true,  maxlength: 300, lowercase: true, trim: true },
  code:             { type: String, required: true,  maxlength: 100, lowercase: true, trim: true },
  school_id:        { type: Schema.Types.ObjectId, required: true },
  class_id:         { type: Schema.Types.ObjectId, required: true },
  teacher_list:     { type: [Schema.Types.ObjectId], required: true },
  courseTerm:       { type: Number, required: true,  min: 0 },
  currentTerm:      { type: Number, min: 0 },
  level:            { type: Number, required: true,  min: 0 },
  isConsidered:     { type: Boolean, required: false, default: true },

  /* Report quotas */
  exam_quota:       { type: Number, required: false, default: 50 },
  test_quota:       { type: Number, required: false, default: 50 },
  attendance_limit: { type: Number, required: true,  min: 0 },
  weightOnReport:   { type: Number, required: true,  default: 100 },
});

/**
 * Validate that exam_quota + test_quota === weightOnReport before saving.
 */
CourseSchema.pre('save', function (next) {
  if (this.exam_quota + this.test_quota !== this.weightOnReport) {
    return next(new Error('Quotas are not accepted: exam_quota + test_quota must equal weightOnReport'));
  }
  next();
});

/**
 * Check whether a course with the same code OR name already exists in the same class.
 * Returns a Promise — use with async/await or .then()/.catch()
 */
CourseSchema.statics.checkCourseExists = function (course) {
  return this.findOne({
    $and: [
      { $or: [{ code: course.code.trim().toLowerCase() }, { name: course.name.trim().toLowerCase() }] },
      { class_id: course.class_id },
    ],
  });
};

module.exports = mongoose.model('Courses', CourseSchema);
