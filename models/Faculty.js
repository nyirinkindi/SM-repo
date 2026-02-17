'use strict';
const mongoose = require('mongoose');

/**
 * Faculty Schema
 * Belongs to a University; contains Departments.
 */
const facultySchema = new mongoose.Schema({
  /* Basic */
  name:           { type: String, required: true, trim: true, maxlength: 200 },
  code:           { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
  description:    { type: String, maxlength: 1000 },

  /* Relationships */
  university_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  dean_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  /* Visual */
  cover_photo:    { type: String, default: null },

  /* Contact */
  email:          { type: String, lowercase: true, trim: true, maxlength: 100 },
  phone_number:   { type: String, maxlength: 20 },
  office_location:{ type: String, maxlength: 200 },

  /* Structure */
  departments:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],

  /* Denormalised stats */
  numDepartments: { type: Number, default: 0 },
  numStudents:    { type: Number, default: 0 },
  numLecturers:   { type: Number, default: 0 },

  /* Status */
  isActive:       { type: Boolean, default: true },

  /* Metadata */
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

/* Indexes */
facultySchema.index({ code: 1, university_id: 1 }, { unique: true });
facultySchema.index({ university_id: 1 });
facultySchema.index({ dean_id: 1 });
facultySchema.index({ name: 1 });

/* Virtual */
facultySchema.virtual('fullName').get(function () {
  return `${this.name} (${this.code})`;
});

/**
 * Recalculate and persist denormalised statistics for this faculty.
 */
facultySchema.methods.updateStatistics = async function () {
  const Department = mongoose.model('Department');
  const User       = mongoose.model('User');

  const departments = await Department.find({ faculty_id: this._id }).select('_id');
  const deptIds     = departments.map(d => d._id);

  this.numDepartments = departments.length;

  if (deptIds.length) {
    this.numStudents  = await User.countDocuments({ department_id: { $in: deptIds }, access_level: 4 });
    this.numLecturers = await User.countDocuments({ department_id: { $in: deptIds }, access_level: 3 });
  }

  await this.save();
};

module.exports = mongoose.model('Faculty', facultySchema);
