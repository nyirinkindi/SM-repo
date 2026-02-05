/**
 * routes/user.routes.js
 * User profile and account management routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middlewares/auth.middleware');

// ========== AUTHENTICATED USER ROUTES ==========

// User settings page
router.get('/settings', auth.isAuthenticated, userController.getPageUserSettings);

// Get user ID
//router.get('/id', auth.isAuthenticated, userController.get_IDUser);
router.get('/id', 
  auth.isAuthenticated, 
  (req, res) => {
    res.json(req.user._id);
  }
);
// Profile management
router.post('/profile/update', auth.isAuthenticated, userController.changeProfile);

// Password management
router.post('/password/renew', auth.isAuthenticated, userController.renewPassword);

// Email management
router.post('/email/change', auth.isAuthenticated, userController.changeEmail);

// ========== LOGOUT ==========

// Logout - handles both GET and POST
router.get('/logout', userController.logout);
router.post('/logout', userController.logout);

// ========== PUBLIC PROFILE VIEWING ==========

// View user profile (pp = profile picture/page)
router.get('/pp/view/:user_id', userController.getProfileUser);

// ========== ADMIN USER MANAGEMENT ==========

// Super admin - View all users
router.get('/view', auth.isSuperAdmin, userController.getViewUserPage);

// Super admin - User list JSON
router.get('/list/general', auth.isSuperAdmin, userController.userList_JSON);

// Super admin - Reset user password
router.post('/password/reset/admin', auth.isSuperAdmin, userController.resetUserPwd);

// Super admin - Delete user completely
router.post('/delete_complete', auth.isSuperAdmin, userController.deleteCmply);

// Admin - Enable/disable user
router.get('/enable/:user_id', auth.isAtLeastAdmin, userController.enableUser);

// Admin - Change teacher email
router.post('/teacheremail/edit', auth.isAtLeastAdmin, userController.changeTeacherEmail);

// Admin - View user details
router.get('/details/:user_id', auth.isAtLeastAdmin, userController.viewPageUserDetails);

// Admin - Get user classes
router.get('/classe/:user_id', auth.isAtLeastAdmin, userController.getListUserClasses);

// Admin - Get user courses
router.get('/course/:class_id', auth.isAtLeastAdmin, userController.getListUserCourses);

module.exports = router;