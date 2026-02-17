'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Application Schema
 * Processes student registration applications
 * Status: A=Admitted, P=Pending, F=Fill missing, R=Rejected
 */
const applicationSchema = new Schema({
  school_id: { type: Schema.Types.ObjectId, required: false },
  user_id:   { type: Schema.Types.ObjectId, required: true },
  comment:   { type: String,                required: false },
  year_o_s:  { type: Number,                required: false },
  program:   { type: String,                required: false },
  faculty:   { type: String,                required: true },
  status:    { type: String,                required: true, enum: ['A', 'P', 'F', 'R'] },
}, { timestamps: { createdAt: 'created_at' } });

/**
 * Check whether an application already exists for this user + school.
 * Returns a Promise — use with async/await or .then()/.catch()
 */
applicationSchema.statics.checkApplicationExists = function (application) {
  return this.findOne({
    school_id: application.school_id,
    user_id:   application.user_id,
  });
};

module.exports = mongoose.model('Applications', applicationSchema);
