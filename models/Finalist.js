'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Finalist Schema
 * Tracks students who have completed/graduated from a class in a given academic year.
 */
const FinalistSchema = new Schema({
  school_id:     { type: Schema.Types.ObjectId, required: true },
  class_id:      { type: Schema.Types.ObjectId, required: true },
  student_id:    { type: Schema.Types.ObjectId, required: true },
  academic_year: { type: Number,                required: true },
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = mongoose.model('Finalists', FinalistSchema);
