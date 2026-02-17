'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Unit Schema
 * Quizzes, tests, assessments and assignments belong to a Unit.
 */
const UnitSchema = new Schema({
  title:         { type: String,                required: true, maxlength: 100, lowercase: true, trim: true },
  description:   { type: String,                required: true, maxlength: 140, lowercase: true, trim: true },
  academic_year: { type: Number,                required: false },
  course_id:     { type: Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'created_at' } });

/**
 * Check whether a unit with the same title already exists in this course.
 * Returns a Promise — use with async/await or .then()/.catch()
 */
UnitSchema.statics.checkExistence = function (unit) {
  return this.findOne({ title: unit.title, course_id: unit.course_id });
};

module.exports = mongoose.model('Units', UnitSchema);
