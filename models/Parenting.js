'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Parenting Schema
 * Links a parent to a student within a school.
 *
 * allowed: -1 = Rejected | 0 = Waiting | 1 = Accepted
 */
const ParentingSchema = new Schema({
  parent_URN:  { type: String,                required: true, lowercase: true, trim: true },
  student_URN: { type: String,                required: true, maxlength: 100, lowercase: true, trim: true },
  school_id:   { type: Schema.Types.ObjectId, required: true },
  allowed:     { type: Number,                required: true, default: 0, enum: [-1, 0, 1] },
});

module.exports = mongoose.model('Parentings', ParentingSchema);
