'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
 * Content Types:
 *  1: Written note
 *  2: Note (PDF)
 *  3: Automated assessment
 *  4: Written assessment
 *  5: Uploaded assessment
 *  6: Offline tests
 */
const ContentSchema = new Schema({
  /* MANDATORY */
  title:           { type: String, required: true,  maxlength: 300, lowercase: true, trim: true },
  source_question: { type: String, required: true,  index: false },   // NO INDEXATION intentional
  course_id:       { type: Schema.Types.ObjectId, required: true },
  school_id:       { type: Schema.Types.ObjectId, required: true },
  unit_id:         { type: Schema.Types.ObjectId, required: true },
  owner_URN:       { type: String, required: true,  maxlength: 30 },
  type:            { type: Number, required: true,  enum: [1, 2, 3, 4, 5, 6] },
  currentTerm:     { type: Number, required: true },

  /* OPTIONAL */
  q_info:          { type: Array,   required: false },
  q_solution:      { type: Array,   required: false },
  time:            { type: Date,    required: false },

  /* Report helpers */
  isCAT:           { type: Boolean, required: false, default: true },
  isQuoted:        { type: Boolean, required: false, default: true },
  isPublished:     { type: Boolean, required: false, default: false },
  marks:           { type: Number,  required: false, min: 0 },

  /* Anti-cheat */
  setNoCheating:   { type: Boolean, required: false, default: false },

  /* Computed at save */
  academic_year:   { type: Number,  required: false },
}, { timestamps: { createdAt: 'upload_time' } });

module.exports = mongoose.model('Contents', ContentSchema);
