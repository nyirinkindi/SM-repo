/**
 * routes/class.routes.js
 * Class/Classe management routes
 */

const express = require('express');
const router = express.Router();
const classeController = require('../controllers/classe');
const auth = require('../middlewares/auth.middleware');

// View single class page
router.get('/:classe_id', auth.isAuthenticated, classeController.getPageOneClasse);

// Get class courses
router.get('/get/courses/:class_id', auth.isAuthenticated, classeController.getClassCourses);

// Authenticated routes - List classes
router.get('/list/:school_id', auth.isAuthenticated, classeController.getClasses_JSON);
router.get('/list/for/report/:school_id', auth.isAuthenticated, classeController.getClasses_JSON_For_Report);
router.get('/list/confirm/:school_id', auth.isAuthenticated, classeController.getClasses_JSONConfirm);

// Admin routes - Class management
router.post('/add', auth.isAtLeastAdmin, classeController.postNewClass);
router.post('/edit', auth.isAtLeastAdmin, classeController.editClasse);
router.post('/delete', auth.isAtLeastAdmin, classeController.removeClasse);
router.post('/update/settings', auth.isAtLeastAdmin, classeController.updateSettings);
router.post('/teacher/set', auth.isAtLeastAdmin, classeController.setClassTeacher);

// Admin routes - Student progression
router.get('/get/nexts/:class_id', auth.isAtLeastAdmin, classeController.getNextClasses);
router.get('/get/repeat/:class_id', auth.isAtLeastAdmin, classeController.getClasseToRepeat);
router.post('/set/ac_year/student/:class_id', auth.isAtLeastAdmin, classeController.setAcYearOfRepeat);
router.post('/change/to/next', auth.isAtLeastAdmin, classeController.getToNextClass);
router.post('/change/to/previous', auth.isAtLeastAdmin, classeController.returnToPreviousClass);
router.post('/student/repeat', auth.isAtLeastAdmin, classeController.setStudentToRepeat);

module.exports = router;