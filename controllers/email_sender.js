/**
 * controllers/email_sender.js
 * Shim — re-exports email_sender from its actual location in manage/
 * Required because profile.js and applications.js import from different relative paths.
 */
module.exports = require('./manage/email_sender');