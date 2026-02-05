/**
 * routes/dashboard.routes.js
 * Admin dashboard and management routes
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const auth = require('../middlewares/auth.middleware');

// Main dashboards
router.get('/', auth.isAtLeastAdmin, dashboardController.getHomePageDashboard);
//router.get('/school', auth.isSuperAdmin, dashboardController.getPageSchools);
// Dashboard page that shows schools
// Schools management page (Super Admin only)
router.get('/school', auth.isSuperAdmin, dashboardController.getPageSchoolsList);
router.get('/university', auth.isSuperAdmin, dashboardController.getPageUniversities);
router.get('/director', auth.isAtLeastSchoolDirector, dashboardController.getDashboardPage);

// School dashboard
router.get('/school/home/:school_id', auth.isAtLeastSchoolDirector, dashboardController.getSchoolRedirection);

// School management pages
router.get('/classe/:school_id', auth.isAtLeastAdmin, dashboardController.getPageUpdateSchool);
router.get('/course/:classe_id', auth.isAtLeastAdmin, dashboardController.getPageClasse);
router.get('/register/course/:school_id', auth.isAtLeastAdmin, dashboardController.getPageRegisterCourse);

// University management
router.get('/faculty/:univ_id', auth.isAtLeastAdmin, dashboardController.getPageFaculties);
router.get('/departments/:fac_id', auth.isAtLeastAdmin, dashboardController.getPageDepartments);
router.get('/options/:department_id', auth.isAtLeastAdmin, dashboardController.getPageOptions);

// Account validation
router.get('/accounts/validation', auth.isAtLeastAdmin, dashboardController.getPageConfirmAccounts);
router.post('/accounts/tovalidate', auth.isAtLeastAdmin, dashboardController.getAccountsValidate_JSON);
router.post('/validate/teacher', auth.isAtLeastAdmin, dashboardController.confirmTeacherAccount);
router.post('/validate/student', auth.isAtLeastAdmin, dashboardController.confirmStudentAccount);

// Staff management
router.get('/admins/:school_id', auth.isAtLeastAdmin, dashboardController.getPageAdmins);
router.post('/admin/add', auth.isAtLeastAdmin, dashboardController.postNewAdmin);
router.get('/teachers/:school_id', auth.isAtLeastAdmin, dashboardController.getPageTeachers);
router.get('/students/:class_id', auth.isAtLeastAdmin, dashboardController.getPageStudents);

// Statistics
router.post('/statistics', auth.isAtLeastAdmin, dashboardController.getPageDashboardStats);
router.post('/direct/statistics', auth.isAtLeastAdmin, dashboardController.getDirectorStats);

// Public signup helpers
router.get('/universities/signup', dashboardController.getAvailableUniversities);
router.get('/faculties/signup/:univ_id', dashboardController.getAvailableFaculties);
router.get('/department/signup/:faculty_id', dashboardController.getAvailableDepartments);
router.get('/option/signup/:department_id', dashboardController.getAvailableOptions);
router.get('/class/signup/:school_id', dashboardController.getAvailableClasses);

// Student payment status
router.post('/student/set_paid', auth.isAtLeastAdmin, dashboardController.studentSetPaid);

// Super admin special routes (obfuscated)
router.get('/Ssg3nSAwdtAztx79dLGb', auth.isSuperAdmin, dashboardController.Ssg3nSAwdtAztx79dLGb);
router.get('/Ssg3nSAwdtAztx79dLGb/post', auth.isSuperAdmin, dashboardController.Ssg3nSAwdtAztx79dLGbPost);
router.post('/Ssg3nSAwdtAztx79dLGb/delete', auth.isSuperAdmin, dashboardController.Ssg3nSAwdtAztx79dLGbDelete);
router.post('/Ssg3nSAwdtAztx79dLGb/update', auth.isSuperAdmin, dashboardController.Ssg3nSAwdtAztx79dLGbUpdate);
router.post('/get/all/conts', auth.isSuperAdmin, dashboardController.getAllConts);

module.exports = router;