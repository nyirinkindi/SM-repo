'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Notification Schema
 * Announcements and alerts within a school.
 */
const NotificationSchema = new Schema({
  user_id:   { type: Schema.Types.ObjectId, required: true },
  user_name: { type: String,                required: true, trim: true },
  content:   { type: String,                required: true, trim: true },
  class_id:  { type: Schema.Types.ObjectId, required: false },
  school_id: { type: Schema.Types.ObjectId, required: true },
  dest_id:   { type: Schema.Types.ObjectId, required: false },
  level:     { type: Number,                required: false, default: 0 },
  isAuto:    { type: Boolean,               required: true },
}, { timestamps: { createdAt: 'time' } });

module.exports = mongoose.model('Notification', NotificationSchema);
