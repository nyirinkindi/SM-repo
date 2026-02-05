/**
 * create-missing-routes.js
 * Creates stub files for any missing route modules
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');

// Ensure routes directory exists
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
  console.log('✓ Created routes directory');
}

// Template for missing route files
const routeTemplates = {
  'info.routes.js': `/**
 * routes/info.routes.js
 * Public information pages and static content
 */

const express = require('express');
const router = express.Router();
const infoController = require('../controllers/info');

// Main landing page
router.get('/', infoController.getMainPage);

// Welcome/home page
router.get('/home', infoController.getWelcomePage);

// About page
router.get('/aboutme', infoController.getPageAbout);

// Terms and Conditions
router.get('/termsConditions', infoController.getTerms_Conditions);

module.exports = router;`,

  'report.routes.js': `/**
 * routes/report.routes.js
 * Reports and statistics routes
 */

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

module.exports = router;`,

  'university.routes.js': `/**
 * routes/university.routes.js
 * University, faculty, and department management
 */

const express = require('express');
const router = express.Router();
const universityController = require('../controllers/university');
const facultyController = require('../controllers/faculty');
const departmentCtrl = require('../controllers/department');
const auth = require('../middlewares/auth.middleware');

// Universities
router.post('/add', auth.isSuperAdmin, universityController.postNewUniversity);
router.get('/list', auth.isSuperAdmin, universityController.getUniv_JSON);
router.post('/delete', auth.isSuperAdmin, universityController.removeUniversity);

// Faculties
router.post('/fac/add', auth.isSuperAdmin, facultyController.postNewFaculty);
router.post('/fac/list', auth.isSuperAdmin, facultyController.getFac_JSON);
router.post('/fac/delete', auth.isSuperAdmin, facultyController.removeFaculty);

// Departments
router.post('/department/list', auth.isSuperAdmin, departmentCtrl.getDepartment_JSON);
router.post('/department/add', auth.isSuperAdmin, departmentCtrl.postNewDepartment);
router.post('/department/delete', auth.isSuperAdmin, departmentCtrl.removeDepartment);

module.exports = router;`,

  'library.routes.js': `/**
 * routes/library.routes.js
 * Library management routes
 */

const express = require('express');
const router = express.Router();
const libraryCtrl = require('../controllers/library');
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Library main page
router.get('/', auth.isAuthenticated, libraryCtrl.getLibraryViewPage);

// Book operations
router.post('/book/list', auth.isAtLeastStudent, libraryCtrl.getLibraryBookList);
router.post('/do/upload', auth.isAtLeastTeacher, upload.single('file'), libraryCtrl.postLibraryFile);
router.get('/get/pdf/:bookId', auth.isAuthenticated, libraryCtrl.getPdfFile);
router.get('/get/photo/:bookId', auth.isAuthenticated, libraryCtrl.getPhoto);
router.delete('/delete/Book/:bookId', auth.isAtLeastTeacher, libraryCtrl.deleteBook);
router.put('/update/book/details', auth.isAtLeastTeacher, libraryCtrl.updateBookInfo);
router.post('/update/book/photo', auth.isAtLeastTeacher, libraryCtrl.updatePhoto);

// Level list
router.get('/level/list', auth.isAuthenticated, libraryCtrl.getLevelList);

module.exports = router;`,

  'timeline.routes.js': `/**
 * routes/timeline.routes.js
 * Timeline and messaging routes
 */

const express = require('express');
const router = express.Router();
const timelineCtrl = require('../controllers/timeline');
const auth = require('../middlewares/auth.middleware');

// Timeline page
router.get('/', auth.isAuthenticated, timelineCtrl.pageTimeline);

// Timeline operations
router.post('/create/post', auth.isAuthenticated, timelineCtrl.createPost);
router.post('/post/comment', auth.isAuthenticated, timelineCtrl.addComment);
router.get('/post/like/:post_id', auth.isAuthenticated, timelineCtrl.addLike);

// Get timeline data
router.get('/get', auth.isAuthenticated, timelineCtrl.getTimeline);
router.get('/get/adminpost', auth.isTeacherOrAdmin, timelineCtrl.getAdminPosts);

// Messages
router.get('/messages/get/:from_id', auth.isAuthenticated, timelineCtrl.getMEssageFromOne);
router.post('/messages/delete/unread', auth.isAuthenticated, timelineCtrl.deleteUnReads);

module.exports = router;`,

  'payment.routes.js': `/**
 * routes/payment.routes.js
 * Payment processing routes
 */

const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/payment');

// Payment routes (public)
router.get('/', paymentCtrl.getPaymentPage);
router.post('/post', paymentCtrl.postPayment);

module.exports = router;`,

  'application.routes.js': `/**
 * routes/application.routes.js
 * Student applications routes
 */

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

module.exports = router;`,

  'backup.routes.js': `/**
 * routes/backup.routes.js
 * Backup operations routes
 */

const express = require('express');
const router = express.Router();
const backUpCtrl = require('../controllers/manage/backup');
const auth = require('../middlewares/auth.middleware');

// Backup pages and operations (Super Admin only)
router.get('/page', auth.isSuperAdmin, backUpCtrl.getBackupPage);
router.get('/create', auth.isSuperAdmin, backUpCtrl.createBackUp);
router.get('/list', auth.isSuperAdmin, backUpCtrl.getbackupListAvailable);
router.get('/errors/list', auth.isSuperAdmin, backUpCtrl.getErrorsList);
router.get('/download/:file', auth.isSuperAdmin, backUpCtrl.downloadBackup);

module.exports = router;`,
};

// Check each route file and create if missing
console.log('🔍 Checking and creating missing route files...\n');

let created = 0;
let skipped = 0;

Object.keys(routeTemplates).forEach(filename => {
  const filePath = path.join(routesDir, filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped: ${filename} (already exists)`);
    skipped++;
  } else {
    fs.writeFileSync(filePath, routeTemplates[filename], 'utf8');
    console.log(`✅ Created: ${filename}`);
    created++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Created: ${created} files`);
console.log(`   Skipped: ${skipped} files`);

if (created > 0) {
  console.log('\n✅ Missing route files have been created!');
  console.log('   You can now start your server with: npm start');
} else {
  console.log('\n✅ All route files already exist!');
}