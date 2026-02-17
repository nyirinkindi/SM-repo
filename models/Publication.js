'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Publication Schema
 * School-wide posts and announcements.
 *
 * category: 1 = For all school | 2 = For administration
 */
const PublicationsSchema = new Schema({
  user_id:   { type: Schema.Types.ObjectId, required: true },
  user_name: { type: String,                required: true, trim: true },
  content:   { type: String,                required: true, trim: true },
  likes:     { type: [String],              default: [] },
  comments:  { type: [Schema.Types.Mixed],  default: [] },
  class_id:  { type: Schema.Types.ObjectId, required: false },
  school_id: { type: Schema.Types.ObjectId, required: true },
  isAuto:    { type: Boolean,               required: true },
  category:  { type: Number,                default: 1 },
  tags:      { type: [String],              default: [] },
}, { timestamps: { createdAt: 'time' } });

module.exports = mongoose.model('Publications', PublicationsSchema);
