/**
 * routes/unit.routes.js
 * Course unit management routes
 */

const express = require('express');
const router = express.Router();
const unitsController = require('../controllers/unit');
const auth = require('../middlewares/auth.middleware');

// Get units list
router.post('/list', auth.isAuthenticated, unitsController.getUnit_JSON);

// Teacher routes - Unit management
router.post('/add', auth.isAtLeastTeacher, unitsController.postNewUnit);
router.post('/delete', auth.isAtLeastTeacher, unitsController.removeUnit);

module.exports = router;