'use strict';
const mongoose = require('mongoose');

/**
 * Department Schema
 * Belongs to a Faculty; contains Classes/Programs.
 */
const departmentSchema = new mongoose.Schema({
  /* Basic */
  name:             { type: String, required: true, trim: true, maxlength: 200 },
  code:             { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
  description:      { type: String, maxlength: 1000 },

  /* Relationships */
  faculty_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  university_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  head_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  /* Visual */
  cover_photo:      { type: String, default: null },

  /* Contact */
  email:            { type: String, lowercase: true, trim: true, maxlength: 100 },
  phone_number:     { type: String, maxlength: 20 },
  office_location:  { type: String, maxlength: 200 },

  /* Structure */
  classes:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classes' }],

  /* Academic settings */
  term_name:        { type: String, default: 'S', enum: ['S', 'T'] },
  term_quantity:    { type: Number, default: 2, min: 1, max: 4 },

  /* Denormalised stats */
  numClasses:       { type: Number, default: 0 },
  numCourses:       { type: Number, default: 0 },
  numStudents:      { type: Number, default: 0 },
  numLecturers:     { type: Number, default: 0 },

  /* Status */
  isActive:         { type: Boolean, default: true },

  /* Metadata */
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

/* Indexes */
departmentSchema.index({ code: 1, faculty_id: 1 }, { unique: true });
departmentSchema.index({ faculty_id: 1 });
departmentSchema.index({ university_id: 1 });
departmentSchema.index({ head_id: 1 });
departmentSchema.index({ name: 1 });

/* Virtual */
departmentSchema.virtual('fullName').get(function () {
  return `${this.name} (${this.code})`;
});

/**
 * Recalculate and persist denormalised statistics for this department.
 */
departmentSchema.methods.updateStatistics = async function () {
  const Classe  = mongoose.model('Classes');
  const Course  = mongoose.model('Courses');
  const User    = mongoose.model('User');

  const classes   = await Classe.find({ owner_type: 'Department', owner_id: this._id }).select('_id');
  const classIds  = classes.map(c => c._id);

  this.numClasses  = classes.length;
  this.numCourses  = classIds.length ? await Course.countDocuments({ class_id: { $in: classIds } }) : 0;
  this.numStudents = await User.countDocuments({ department_id: this._id, access_level: 4 });
  this.numLecturers= await User.countDocuments({ department_id: this._id, access_level: 3 });

  await this.save();
};

module.exports = mongoose.model('Department', departmentSchema);
