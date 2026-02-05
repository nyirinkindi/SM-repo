/**
 * routes/school.routes.js
 * School management routes - Complete version
 */

const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/school');
const auth = require('../middlewares/auth.middleware');

// DEBUG: Check which controller methods exist
console.log('\n🔍 Checking school controller methods:');
const requiredMethods = [
  'getPageSchool',
  'homepageSchool', 
  'getSettingSchoolPage',
  'displayProfile',
  'getSchool_JSON',
  'getSchool_DashboardJSON',
  'getDepartments_JSON',
  'getSchool_BySearch',
  'getSchoolProfile',
  'postNewSchool',
  'deleteWholeSchool',
  'removeSchool',
  'createSchoolProfile',
  'changeSchoolProfile',
  'addSchoolInfo'
];

requiredMethods.forEach(method => {
  const exists = typeof schoolController[method] === 'function';
  console.log(`  ${exists ? '✓' : '❌'} ${method}: ${exists ? 'exists' : 'MISSING'}`);
});
console.log('');

// ========== IMPORTANT: SPECIFIC ROUTES MUST COME FIRST ==========
// Routes with specific paths like /list, /departments, /settings MUST come
// before the dynamic /:school_id route, or they'll be caught as school IDs

// ========== SCHOOL LIST & DASHBOARD PAGES ==========

// Main schools list page (renders school.pug with AngularJS)




// Get schools list as JSON (for AngularJS $http calls)
router.get('/list',
  auth.isAuthenticated,
  schoolController.getSchool_JSON
);

// Get departments/options as JSON (for AngularJS $http calls)
router.get('/departments',
  auth.isAuthenticated,
  schoolController.getDepartments_JSON
);

// ========== SCHOOL SETTINGS & PROFILE ==========

// School settings page
router.get('/settings/:school_id', 
  auth.isAuthenticated,
  schoolController.getSettingSchoolPage
);

// Display profile form
router.get('/profile/create', 
  auth.isAuthenticated, 
  schoolController.displayProfile
);

// School profile page
router.get('/profile/:school_id',
  auth.isAuthenticated,
  schoolController.displayProfile
);

// Get school profile image/data
router.get('/api/profile/:school_id',
  auth.isAuthenticated,
  schoolController.getSchoolProfile
);

// ========== SEARCH & FILTERING ==========

// Search schools
router.get('/search/:name', 
  auth.isAuthenticated, 
  schoolController.getSchool_BySearch
);

// Search schools (POST method)
router.post('/search',
  auth.isAuthenticated,
  schoolController.getSchool_BySearch
);

// ========== DEPARTMENTS & OPTIONS ==========

// Get departments by faculty
router.post('/department/list', 
  auth.isAuthenticated, 
  schoolController.getDepartment_JSON
);

// Get options by department
router.get('/options/:department_id', 
  auth.isAuthenticated, 
  schoolController.getOptions_JSON
);

// ========== SCHOOL COURSES & PROGRAMS ==========

// Get school programs (JSON)
router.get('/programs/:school_id', 
  auth.isAuthenticated, 
  schoolController.getSchoolProgram_JSON
);

// Get courses and programs together
router.get('/courses-programs/:school_id', 
  auth.isAuthenticated, 
  schoolController.getSchoolCourseAndProgram_JSON
);

// Get courses for class
router.post('/courses/list', 
  auth.isAuthenticated, 
  schoolController.getCoursesList
);

// Add school course
router.post('/course/add', 
  auth.isAtLeastAdmin, 
  schoolController.postSchoolCourse
);

// Delete school course
router.post('/course/delete', 
  auth.isAtLeastAdmin, 
  schoolController.deleteSchoolCourse
);

// Add school program
router.post('/program/add', 
  auth.isAtLeastAdmin, 
  schoolController.postSchoolProgram
);

// Delete school program
router.post('/program/delete', 
  auth.isAtLeastAdmin, 
  schoolController.deleteSchoolProgram
);

// ========== STUDENTS ==========

// Get students page
router.get('/students/:school_id', 
  auth.isAtLeastAdmin, 
  schoolController.getPageStudents
);

// Get students list (JSON)
router.post('/students/list', 
  auth.isAtLeastAdmin, 
  schoolController.getStudents_JSON
);

// Get students by class (JSON)
router.post('/class/students', 
  auth.isAuthenticated, 
  schoolController.getStudentsList
);

// Add new student
router.post('/student/add', 
  auth.isAtLeastAdmin, 
  schoolController.addNewStudent
);

// Edit student
router.post('/student/edit', 
  auth.isAtLeastAdmin, 
  schoolController.editStudent
);

// Remove student
router.post('/student/remove', 
  auth.isAtLeastAdmin, 
  schoolController.removeStudent
);

// ========== TEACHERS & ADMINS ==========

// Get teachers list (JSON)
router.get('/teachers/:school_id', 
  auth.isAtLeastAdmin, 
  schoolController.getTeachersList
);

// Get admins list (JSON)
router.post('/admins/list', 
  auth.isAtLeastAdmin, 
  schoolController.getAdminsList
);

// Get teachers and admins (JSON)
router.get('/staff/:school_id', 
  auth.isAuthenticated, 
  schoolController.getTeacherAndAdminSchool
);

// Dissociate teacher from course
router.post('/teacher/dissociate', 
  auth.isAtLeastAdmin, 
  schoolController.dissociateTeacher
);

// Remove teacher from school
router.post('/teacher/remove', 
  auth.isAtLeastAdmin, 
  schoolController.removeTeacher
);

// Promote teacher to admin
router.post('/teacher/promote', 
  auth.isAtLeastAdmin, 
  schoolController.setTeacherAsAdmin
);

// Demote admin to teacher
router.post('/admin/demote', 
  auth.isAtLeastAdmin, 
  schoolController.setAdminAsTeacher
);

// Update school super admin
router.post('/admin/update', 
  auth.isSuperAdmin, 
  schoolController.updateSuperAdmin
);

// Set head of department
router.post('/hod/set', 
  auth.isSuperAdmin, 
  schoolController.setHeadOfDepartment
);

// ========== FINALISTS (ALUMNI) ==========

// Get finalists page
router.get('/finalists/:school_id', 
  auth.isAtLeastAdmin, 
  schoolController.getPageFinalists
);

// Get all finalists (JSON)
router.get('/finalists/list/:school_id', 
  auth.isAtLeastAdmin, 
  schoolController.getAllFinalists
);

// ========== SCHOOL DATA & UTILITIES ==========

// Get user's classes
router.get('/classes/:school_id', 
  auth.isAuthenticated, 
  schoolController.getUserClasses
);

// Get all users in school
router.get('/users/:school_id', 
  auth.isAuthenticated, 
  schoolController.getUsersSchool
);

// Get comprehensive school data
router.get('/data/:school_id', 
  auth.isAuthenticated, 
  schoolController.getSchoolData
);

// ========== SCHOOL CRUD OPERATIONS ==========

// Create new school
router.post('/add',
  auth.isSuperAdmin,
  schoolController.postNewSchool
);

// Delete entire school (with all data)
router.post('/delete/complete', 
  auth.isSuperAdmin, 
  schoolController.deleteWholeSchool
);

// Remove school (only if empty)
router.post('/delete',
  auth.isSuperAdmin,
  schoolController.removeSchool
);

// Remove school (soft delete) - alternative endpoint
router.post('/remove',
  auth.isSuperAdmin,
  schoolController.removeSchool
);

// Create school profile
router.post('/profile/create',
  auth.isAuthenticated,
  schoolController.createSchoolProfile
);

// Update school profile / Change school cover photo
router.post('/profile/update',
  auth.isAtLeastAdmin,
  schoolController.changeSchoolProfile
);

// Add school contact info
router.post('/info/add',
  auth.isAtLeastAdmin,
  schoolController.addSchoolInfo
);

// ========== CATCH-ALL ROUTES (MUST BE LAST) ==========

// Redirect to user's school (root path)
router.get('/', 
  auth.isAuthenticated, 
  (req, res) => {
    console.log('🏠 Root school route - redirecting to user school');
    return res.redirect("/school/" + req.user.school_id);
  }
);

router.get('/:school_id',  
  auth.isAuthenticated, 
  (req, res, next) => {
    console.log('🎯 Catch-all school route hit');
    console.log('   URL:', req.originalUrl);
    console.log('   Param:', req.params.school_id);
    
    // Call the actual controller
    return schoolController.homepageSchool(req, res, next);
  }
);  // ✅ Just closing parenthesis and semicolon

// Temporary debug route - add this near the top, after other routes
router.get('/debug/all-schools', 
  auth.isSuperAdmin,
  async (req, res) => {
    try {
      const allSchools = await require('../models/School').find({})
        .select('name institution partnership category')
        .lean();
      
      const grouped = {
        regularSchools: allSchools.filter(s => s.institution !== 1 && s.institution !== 2),
        departments: allSchools.filter(s => s.institution === 1),
        universities: allSchools.filter(s => s.institution === 2),
        options: allSchools.filter(s => s.partnership === 3)
      };
      
      return res.json({
        total: allSchools.length,
        grouped: grouped,
        counts: {
          regularSchools: grouped.regularSchools.length,
          departments: grouped.departments.length,
          universities: grouped.universities.length,
          options: grouped.options.length
        }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
module.exports = router;