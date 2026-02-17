'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * SchoolProgram Schema
 * Academic programs offered by a school (e.g. MEG = Mathematics, Economics, Geography).
 */
const SchoolProgramSchema = new Schema({
  abbreviation: { type: String, required: false, maxlength: 300, lowercase: true, trim: true },
  name:         { type: String, required: true,  maxlength: 300, lowercase: true, trim: true },
  school_id:    { type: Schema.Types.ObjectId,   required: true },
}, { timestamps: { createdAt: 'time' } });

/**
 * Check whether a program with the same name OR abbreviation already exists in this school.
 * Returns a Promise — use with async/await or .then()/.catch()
 */
SchoolProgramSchema.statics.checkProgramExists = function (program) {
  return this.findOne({
    $and: [
      { $or: [{ name: program.name.trim().toLowerCase() }, { abbreviation: program.abbreviation }] },
      { school_id: program.school_id },
    ],
  });
};

module.exports = mongoose.model('SchoolPrograms', SchoolProgramSchema);
