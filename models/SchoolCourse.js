'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * SchoolCourse Schema
 * A master list of courses offered by a school (not yet assigned to a class).
 */
const SchoolCourseSchema = new Schema({
  name:      { type: String,                required: true, maxlength: 300, lowercase: true, trim: true },
  school_id: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'time' } });

/**
 * Check whether a course with the same name already exists in this school.
 * Returns a Promise — use with async/await or .then()/.catch()
 */
SchoolCourseSchema.statics.checkCourseExists = function (course) {
  return this.findOne({
    $and: [
      { name:      course.name.trim().toLowerCase() },
      { school_id: course.school_id },
    ],
  });
};

module.exports = mongoose.model('SchoolCourses', SchoolCourseSchema);
