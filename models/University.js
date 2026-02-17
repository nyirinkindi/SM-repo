'use strict';
const mongoose = require('mongoose');

/**
 * University Schema
 * Top-level institution model for higher-education.
 *
 * term_name: S = Semester | T = Term
 */
const universitySchema = new mongoose.Schema({
  /* Basic */
  name:           { type: String, required: true, trim: true, maxlength: 200 },
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
  description:    { type: String, maxlength: 1000 },

  /* Location */
  district_name:  { type: String, maxlength: 100 },
  location:       { type: String, maxlength: 200 },

  /* Visual */
  cover_photo:    { type: String, default: null },
  logo:           { type: String, default: null },

  /* Administration */
  admin_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  admin_mail:     { type: String, lowercase: true, trim: true, maxlength: 100 },
  phone_number:   { type: String, maxlength: 20 },
  website:        { type: String, maxlength: 200 },

  /* Structure */
  faculties:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }],

  /* Academic settings */
  term_name:      { type: String, default: 'S', enum: ['S', 'T'] },
  term_quantity:  { type: Number, default: 2, min: 1, max: 4 },

  /* Denormalised stats */
  numUsers:       { type: Number, default: 0 },
  numFaculties:   { type: Number, default: 0 },
  numDepartments: { type: Number, default: 0 },
  numStudents:    { type: Number, default: 0 },

  /* Status */
  isActive:       { type: Boolean, default: true },

  /* Metadata */
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

/* Indexes */
universitySchema.index({ name: 1 });
universitySchema.index({ code: 1 });
universitySchema.index({ district_name: 1 });
universitySchema.index({ admin_id: 1 });
universitySchema.index({ isActive: 1 });

/* Virtual */
universitySchema.virtual('fullName').get(function () {
  return `${this.name} (${this.code})`;
});

/**
 * Recalculate and persist denormalised statistics for this university.
 */
universitySchema.methods.updateStatistics = async function () {
  const Faculty    = mongoose.model('Faculty');
  const Department = mongoose.model('Department');
  const User       = mongoose.model('User');

  const faculties  = await Faculty.find({ university_id: this._id }).select('_id');
  const facultyIds = faculties.map(f => f._id);

  this.numFaculties = faculties.length;

  if (facultyIds.length) {
    this.numDepartments = await Department.countDocuments({ faculty_id: { $in: facultyIds } });
  }

  this.numStudents = await User.countDocuments({ university_id: this._id, access_level: 4 });
  this.numUsers    = await User.countDocuments({ university_id: this._id });

  await this.save();
};

module.exports = mongoose.model('University', universitySchema);
