'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Marks Schema
 * Stores student assessment results.
 *
 * content_type: 3 = Automated | 4 = Written | 5 = Uploaded
 */
const MarksSchema = new Schema({
  isCorrected:    { type: Boolean, required: false, default: false },
  isCAT:          { type: Boolean, required: false, default: true  },
  isQuoted:       { type: Boolean, required: false, default: true  },

  content_type:   { type: Number, required: true, enum: [3, 4, 5] },
  content_id:     { type: Schema.Types.ObjectId, required: true },
  teacher_id:     { type: Schema.Types.ObjectId, required: true },
  student_id:     { type: Schema.Types.ObjectId, required: true },
  student_URN:    { type: String,                required: true },

  marks:          { type: Number, required: true, min: 0 },
  percentage:     { type: Number, required: true, min: 0, max: 100 },

  school_id:      { type: Schema.Types.ObjectId, required: true },
  course_id:      { type: Schema.Types.ObjectId, required: true },
  course_name:    { type: String,                required: true },   // Denormalised for report speed
  class_id:       { type: Schema.Types.ObjectId, required: true },

  currentTerm:    { type: Number, required: true, min: 1 },
  level:          { type: Number, required: true, min: 1 },

  /* Optional submission data */
  uploaded_file:  { type: String, index: false },
  uploaded_text:  { type: String, index: false },
  uploaded_array: { type: Array,  index: false },
  comment:        { type: String, maxlength: 140, index: false },

  /* Computed at save */
  academic_year:  { type: Number, min: 17 },
}, { timestamps: { createdAt: 'upload_time' } });

module.exports = mongoose.model('Marks', MarksSchema);
