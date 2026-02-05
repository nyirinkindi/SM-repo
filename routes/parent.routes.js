/**
 * routes/parent.routes.js
 * Parent and parent-student relationship routes
 */

const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parent');
const auth = require('../middlewares/auth.middleware');

// ========== PARENT ROUTES ==========
// Parent accessing their dashboard
router.get('/', auth.isAuthenticated, auth.isParent, parentController.getParentPage);

// Parent managing their children
router.post('/request', auth.isAuthenticated, auth.isParent, parentController.postRequestChild);
router.get('/child/list', auth.isAuthenticated, auth.isParent, parentController.getListChild);
router.get('/child/remove/:student_URN', auth.isAuthenticated, auth.isParent, parentController.removeFromChild);

// Parent viewing student reports
router.post('/set/student', auth.isAuthenticated, auth.isParent, parentController.parentSetStudent);
router.get('/get/student/report', auth.isAuthenticated, auth.isParent, parentController.parentGetStudentReport);

// ========== STUDENT ROUTES (managing their parents) ==========
// Student managing parent access
router.get('/parents', auth.isAuthenticated, auth.isStudent, parentController.getParentPage);
router.get('/student/parents/list', auth.isAuthenticated, auth.isStudent, parentController.getListParents);
router.delete('/student/parent/remove/:parent_URN', auth.isAuthenticated, auth.isStudent, parentController.removeFromParents);
router.put('/student/action/on/parent', auth.isAuthenticated, auth.isStudent, parentController.modifyAccessOnParent);

module.exports = router;