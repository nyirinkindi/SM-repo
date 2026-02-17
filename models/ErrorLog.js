'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ErrorLog Schema
 * Records application errors for debugging/auditing.
 */
const ErrorLogSchema = new Schema({
  error:     { type: Schema.Types.Mixed,   required: true },
  user_info: { type: Schema.Types.Mixed,   required: true },
  route:     { type: String,               required: true },
  method:    { type: String,               required: true },
  request:   { type: [Schema.Types.Mixed], required: true },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('ErrorLogs', ErrorLogSchema);
