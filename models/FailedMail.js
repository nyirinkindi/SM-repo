'use strict';
const mongoose = require('mongoose');

/**
 * FailedMail Schema
 * Stores emails that failed to send for later retry.
 */
const failedMailSchema = new mongoose.Schema({
  content: { type: String, required: true },
  error:   { type: String, required: true },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('FailedMail', failedMailSchema);
