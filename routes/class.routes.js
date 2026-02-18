/**
 * routes/class.routes.js (mounted at /classe)
 * Class/Classe management routes
 * 
 * CRITICAL: Specific routes MUST come before the catch-all /:classe_id
 * or they'll never match (/:classe_id catches everything)
 */

const express = require('express');
const router = express.Router();
const classeController = require('../controllers/classe');
const auth = require('../middlewares/auth.middleware');

// ========== SPECIFIC ROUTES FIRST (before /:classe_id catch-all) ==========

// ========== CLASS CRUD ==========

// Get classes list (JSON) with student count
router.get('/list/:school_id',
  auth.isAuthenticated,
  classeController.getClasses_JSON
);

// Get classes for reports
router.get('/list/for/report/:school_id',
  auth.isAuthenticated,
  classeController.getClasses_JSON_For_Report
);

// Get classes with unconfirmed students count
router.get('/list/confirm/:school_id',
  auth.isAuthenticated,
  classeController.getClasses_JSONConfirm
);

// Add new class
router.post('/add',
  auth.isAtLeastAdmin,
  classeController.postNewClass
);

// Edit class
router.post('/edit',
  auth.isAtLeastAdmin,
  classeController.editClasse
);

// Delete class
router.post('/delete',
  auth.isAtLeastAdmin,
  classeController.removeClasse
);

// Update class settings (term/year)
router.post('/update/settings',
  auth.isAtLeastAdmin,
  classeController.updateSettings
);

// Set class teacher
router.post('/teacher/set',
  auth.isAtLeastAdmin,
  classeController.setClassTeacher
);

// ========== CLASS UTILITIES ==========

// Get next-level classes (for promotion)
router.get('/get/nexts/:class_id',
  auth.isAtLeastAdmin,
  classeController.getNextClasses
);

// Get classes at same level (for repeat)
router.get('/get/repeat/:class_id',
  auth.isAtLeastAdmin,
  classeController.getClasseToRepeat
);

// Get class courses
router.get('/get/courses/:class_id',
  auth.isAuthenticated,
  classeController.getClassCourses
);

// ========== STUDENT PROMOTION/MANAGEMENT ==========

// Set academic year for repeated classes
router.post('/set/ac_year/student/:class_id',
  auth.isAtLeastAdmin,
  classeController.setAcYearOfRepeat
);

// Promote student to next class
router.post('/change/to/next',
  auth.isAtLeastAdmin,
  classeController.getToNextClass
);

// Return student to previous class
router.post('/change/to/previous',
  auth.isAtLeastAdmin,
  classeController.returnToPreviousClass
);

// Set student to repeat
router.post('/student/repeat',
  auth.isAtLeastAdmin,
  classeController.setStudentToRepeat
);

// ========== CATCH-ALL (MUST BE LAST) ==========

// Render single class view page
// This MUST be last or it catches /list, /add, /edit, etc.
router.get('/:classe_id',
  auth.isAuthenticated,
  classeController.getPageOneClasse
);

module.exports = router;