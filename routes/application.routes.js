// ========================================
// routes/application.routes.js
// ========================================
const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applications');
const profileController = require('../controllers/profile');
const auth = require('../middlewares/auth.middleware');

// Application form
router.get('/new', auth.isAuthenticated, auth.isGuestOrStudent, applicationsController.displayApplicationForm);
router.post('/submit/new', auth.isGuestOrStudent, applicationsController.newAppSubmission);

// View applications
router.get('/', auth.isAuthenticated, applicationsController.viewApplicationPage);
router.get('/view', auth.isAuthenticated, applicationsController.viewApplication);
router.get('/get/one/:app_id', auth.isAuthenticated, applicationsController.getOneApplication);

// Admin operations
router.post('/change/status', auth.isAtLeastAdmin, applicationsController.changeApplicationStatus);

// File attachments
router.post('/attach/fileid/:app_id', applicationsController.postIDFile);
router.post('/attach/file/transcript/:app_id', applicationsController.postTranscriptFile);

// School profiles (related to applications)
router.get('/profile/:profile_id', profileController.singleSchoolProfile);
router.get('/fees', auth.isAtLeastAdmin, profileController.feesProfile);

module.exports = router;