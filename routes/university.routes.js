/**
 * routes/university.routes.js
 * University, Faculty, and Department routes
 */

const express = require('express');
const router = express.Router();
const universityController = require('../controllers/university');
const auth = require('../middlewares/auth.middleware');

// ========== UNIVERSITY PAGES ==========

// Universities list page (HTML)
router.get('/list', 
  auth.isAuthenticated, 
  universityController.getUniversityListPage
);

// ========== UNIVERSITY API (JSON) ==========

// Get universities list (JSON)
router.get('/api/list', 
  auth.isAuthenticated, 
  universityController.getUniversityList_JSON
);

// Get single university details
router.get('/api/:university_id', 
  auth.isAuthenticated, 
  universityController.getUniversityDetails
);

// ========== UNIVERSITY CRUD ==========

// Create university
router.post('/add', 
  auth.isSuperAdmin, 
  universityController.postAddUniversity
);

// Update university
router.post('/update', 
  auth.isSuperAdmin, 
  universityController.updateUniversity
);

// Delete university
router.post('/delete', 
  auth.isSuperAdmin, 
  universityController.deleteUniversity
);

// Assign admin to university
router.post('/admin/assign', 
  auth.isSuperAdmin, 
  universityController.assignUniversityAdmin
);

// ========== FACULTY MANAGEMENT ==========

// Get faculties for a university
router.get('/:university_id/faculties', 
  auth.isAuthenticated, 
  universityController.getFacultiesByUniversity
);

// Create faculty
router.post('/faculty/add', 
  auth.isSuperAdmin, 
  universityController.postAddFaculty
);

// ========== DEPARTMENT MANAGEMENT ==========

// Get departments for a faculty
router.get('/faculty/:faculty_id/departments', 
  auth.isAuthenticated, 
  universityController.getDepartmentsByFaculty
);

// Create department
router.post('/department/add', 
  auth.isSuperAdmin, 
  universityController.postAddDepartment
);

module.exports = router;