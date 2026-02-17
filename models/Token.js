'use strict';
const mongoose = require('mongoose');

/**
 * Token Schema
 * Stores email-verification / password-reset tokens.
 * Value format: "<email>+<token>"
 */
const tokenSchema = new mongoose.Schema({
  value: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Token', tokenSchema);
