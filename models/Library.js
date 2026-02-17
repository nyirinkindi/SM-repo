'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Library Schema
 * Books and study materials attached to a school.
 *
 * type:  1 = Book  | 2 = Document
 * level: 1 = Basic | 2 = Advanced
 */
const LibrarySchema = new Schema({
  title:       { type: String, required: true, maxlength: 300, lowercase: true },
  author:      { type: String, required: true, maxlength: 300, lowercase: true },
  description: { type: String, required: true },
  image:       { type: String },
  bookName:    { type: String, required: true },
  type:        { type: Number, required: true, enum: [1, 2] },
  level:       { type: Number, required: true, enum: [1, 2] },
  school_id:   { type: Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'upload_time' } });

module.exports = mongoose.model('libraries', LibrarySchema);
