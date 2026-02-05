/**
 * routes/profile.routes.js
 * School profiles and fee management routes
 */

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile');
const auth = require('../middlewares/auth.middleware');

// ========== PUBLIC ROUTES ==========

// View single school profile (public)
router.get('/:profile_id', profileController.singleSchoolProfile);

// ========== ADMIN ROUTES ==========

// Fees profile page
router.get('/fees', auth.isAtLeastAdmin, profileController.feesProfile);

module.exports = router;