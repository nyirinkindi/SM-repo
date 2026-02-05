// ========================================
// routes/report.routes.js
// ========================================
const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marks');
const auth = require('../middlewares/auth.middleware');

// Report pages
router.get('/', auth.isAuthenticated, marksController.getPageReport);
router.get('/teacher', auth.isAbsoluteTeacher, marksController.getReportPageToTeacher);
router.get('/chart', auth.isAuthenticated, marksController.getPageChart);
router.get('/:student_id', auth.isAuthenticated, marksController.getPageReportUniversity);
router.get('/printable/report', auth.isAuthenticated, marksController.printableReport);

// Report data
router.post('/university', auth.isAuthenticated, marksController.getReport_JSON);
router.post('/one', auth.isAuthenticated, marksController.getFullReportOneStudent);
router.post('/all', auth.isAuthenticated, marksController.getFullReportAllStudent);
router.post('/midterm', auth.isAtLeastTeacher, marksController.getMidTermMarks);
router.post('/termSum', auth.isAtLeastTeacher, marksController.getSumTermMarks);
router.post('/endterm', auth.isAtLeastTeacher, marksController.getEndTermMarks);
router.post('/get/general/class/marks', auth.isAuthenticated, marksController.getClassMarks);

// Statistics
router.get('/statistics', auth.isAtLeastAdmin, marksController.getStatisticsPage);
router.post('/statistics/classe', auth.isAtLeastAdmin, marksController.getClasseAggregation);
router.post('/statistics/school', auth.isAtLeastAdmin, marksController.schoolAggregation);
router.post('/statistics/course', auth.isAtLeastAdmin, marksController.courseAggregation);
router.post('/statistics/student', auth.isAtLeastAdmin, marksController.studentCourseMarks);
router.post('/statistics/overall', auth.isAtLeastAdmin, marksController.getFirstAndLastStudents);

// Academic years and terms
router.get('/class/academic_years', auth.isAuthenticated, marksController.getListAcademicYears);
router.get('/class/academic_years/:class_id', auth.isAuthenticated, marksController.getClassAcademicYears);
router.get('/student/get/terms/:academic_year', auth.isAuthenticated, marksController.getListTerms);
router.post('/get/Class/terms', auth.isAuthenticated, marksController.getClassListTerms);

module.exports = router;
