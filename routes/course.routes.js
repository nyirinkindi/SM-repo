/**
 * routes/course.routes.js
 * Course management routes
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course');
const auth = require('../middlewares/auth.middleware');

// Validate controller methods before registering routes
const requiredMethods = [
  'getCoursePage',
  'getCourseWithContent',
  'getCoursesList',
  'getCourseDetails',
  'postAddCourse',
  'updateCourse',
  'deleteCourse',
  'getCourseTeachers',
  'assignTeacherToCourse',
  'removeTeacherFromCourse',
  'getCourseContents',
  'getCourseStatistics',
  'updateCourseSettings',
  'changeCourseTerm'
];

console.log('🔍 Checking course controller methods:');
const missingMethods = [];

requiredMethods.forEach(method => {
  if (typeof courseController[method] === 'function') {
    console.log(`  ✓ ${method}: exists`);
  } else {
    console.log(`  ❌ ${method}: MISSING or not a function`);
    missingMethods.push(method);
  }
});

if (missingMethods.length > 0) {
  console.error(`\n❌ Course routes cannot be loaded. Missing methods: ${missingMethods.join(', ')}`);
  console.error('Please implement these methods in controllers/course.js\n');
  
  // Export empty router to prevent app crash
  module.exports = router;
} else {
  // ========== COURSE PAGES ==========

  // View course details page
  router.get('/:course_id', auth.isAuthenticated, courseController.getCoursePage);

  // View course with specific content
  router.get('/:course_id/:content_id', auth.isAuthenticated, courseController.getCourseWithContent);

  // ========== COURSE CRUD ==========

  // Get courses list (JSON)
  router.post('/list', auth.isAuthenticated, courseController.getCoursesList);

  // Get course details (JSON)
  router.get('/details/:course_id', auth.isAuthenticated, courseController.getCourseDetails);

  // Add new course
  router.post('/add', auth.isAtLeastAdmin, courseController.postAddCourse);

  // Update course
  router.post('/update', auth.isAtLeastAdmin, courseController.updateCourse);

  // Delete course
  router.post('/delete', auth.isAtLeastAdmin, courseController.deleteCourse);

  // ========== COURSE TEACHERS ==========

  // Get teachers for course
  router.get('/teachers/:course_id', auth.isAuthenticated, courseController.getCourseTeachers);

  // Assign teacher to course
  router.post('/teacher/assign', auth.isAtLeastAdmin, courseController.assignTeacherToCourse);

  // Remove teacher from course
  router.post('/teacher/remove', auth.isAtLeastAdmin, courseController.removeTeacherFromCourse);

  // ========== COURSE CONTENT ==========

  // Get course contents list
  router.get('/contents/:course_id', auth.isAuthenticated, courseController.getCourseContents);

  // Get course statistics
  router.get('/statistics/:course_id', auth.isAuthenticated, courseController.getCourseStatistics);

  // ========== COURSE SETTINGS ==========

  // Update course settings
  router.post('/settings/update', auth.isAtLeastAdmin, courseController.updateCourseSettings);

  // Change course term
  router.post('/term/change', auth.isAtLeastAdmin, courseController.changeCourseTerm);

  console.log('✓ All course routes registered successfully\n');

  module.exports = router;
}