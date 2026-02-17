'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Classe Schema
 * Represents a school class, e.g. "S2MCE" (High School) or "3rd Year" (University)
 */
const ClasseSchema = new Schema({
  name:          { type: String, required: true,  maxlength: 300, lowercase: true, trim: true },
  level:         { type: Number, required: true,  min: 1 },
  option:        { type: String, required: false, lowercase: true, trim: true },
  sub_level:     { type: String, required: false, lowercase: true, trim: true },
  currentTerm:   { type: Number, required: true },
  academic_year: { type: Number, required: false },
  class_teacher: { type: Schema.Types.ObjectId, required: false },
  school_id:     { type: Schema.Types.ObjectId, required: true },
});

module.exports = mongoose.model('Classes', ClasseSchema);
