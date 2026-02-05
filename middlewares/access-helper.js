/**
 * Access Level Helper Middleware
 * Provides consistent access level checking across the application
 * 
 * Add this to middlewares/access-helper.js
 */

const accessHelper = {
  /**
   * Check if user can manage a school (admin privileges)
   * Super admins, school admins, and admin-teachers can manage schools
   */
  canManageSchool: (req, res, next) => {
    const ACCESS_LEVELS = req.app.locals.access_level;
    const userLevel = req.user.access_level;
    
    // Super admin, School admin, or Admin-teacher can manage
    if (userLevel <= ACCESS_LEVELS.ADMIN_TEACHER) {
      return next();
    }
    
    return res.status(403).render('./lost', { 
      msg: 'You do not have permission to manage this school',
      path: req.originalUrl 
    });
  },

  /**
   * Check if user has at least admin privileges for a school
   * Useful for adding this to req object for template access
   */
  setEffectiveAccessLevel: (req, res, next) => {
    const ACCESS_LEVELS = req.app.locals.access_level;
    const userLevel = req.user.access_level;
    
    // Super admin gets highest privileges
    if (userLevel === ACCESS_LEVELS.SUPERADMIN) {
      req.effectiveAccessLevel = ACCESS_LEVELS.SUPERADMIN;
      req.canManageSchool = true;
      req.canManageClasses = true;
      req.canManageCourses = true;
      req.canViewAllCourses = true;
    }
    // School admin / Head of school
    else if (userLevel === ACCESS_LEVELS.SA_SCHOOL) {
      req.effectiveAccessLevel = ACCESS_LEVELS.SA_SCHOOL;
      req.canManageSchool = true;
      req.canManageClasses = true;
      req.canManageCourses = true;
      req.canViewAllCourses = true;
    }
    // Admin teacher
    else if (userLevel === ACCESS_LEVELS.ADMIN_TEACHER) {
      req.effectiveAccessLevel = ACCESS_LEVELS.ADMIN_TEACHER;
      req.canManageSchool = true;
      req.canManageClasses = true;
      req.canManageCourses = true;
      req.canViewAllCourses = true;
    }
    // Regular teacher
    else if (userLevel === ACCESS_LEVELS.TEACHER) {
      req.effectiveAccessLevel = ACCESS_LEVELS.TEACHER;
      req.canManageSchool = false;
      req.canManageClasses = false;
      req.canManageCourses = false;
      req.canViewAllCourses = false; // Only their courses
    }
    // Student
    else if (userLevel === ACCESS_LEVELS.STUDENT) {
      req.effectiveAccessLevel = ACCESS_LEVELS.STUDENT;
      req.canManageSchool = false;
      req.canManageClasses = false;
      req.canManageCourses = false;
      req.canViewAllCourses = false;
    }
    
    next();
  },

  /**
   * Determine what courses a user can see
   */
  getCoursesQuery: (req, userId, classId) => {
    const ACCESS_LEVELS = req.app.locals.access_level;
    const userLevel = req.user.access_level;
    
    // Super admin, school admin, admin-teacher: See ALL courses
    if (userLevel <= ACCESS_LEVELS.ADMIN_TEACHER) {
      return { class_id: classId };
    }
    // Regular teacher: Only their courses
    else if (userLevel === ACCESS_LEVELS.TEACHER) {
      return { class_id: classId, teacher_list: userId };
    }
    // Student: All courses in their class
    else if (userLevel === ACCESS_LEVELS.STUDENT) {
      return { class_id: classId };
    }
    
    return null;
  },

  /**
   * Check if user can view/edit a specific course
   */
  canAccessCourse: async (req, courseId) => {
    const ACCESS_LEVELS = req.app.locals.access_level;
    const userLevel = req.user.access_level;
    
    // Super admin and school admins can access everything
    if (userLevel <= ACCESS_LEVELS.ADMIN_TEACHER) {
      return true;
    }
    
    // Teachers can access their courses
    if (userLevel === ACCESS_LEVELS.TEACHER) {
      const Course = require('../models/Course');
      const course = await Course.findOne({ 
        _id: courseId, 
        teacher_list: req.user._id 
      });
      return !!course;
    }
    
    // Students can view (but not edit) their class courses
    if (userLevel === ACCESS_LEVELS.STUDENT) {
      const Course = require('../models/Course');
      const course = await Course.findOne({ 
        _id: courseId, 
        class_id: req.user.class_id 
      });
      return !!course;
    }
    
    return false;
  }
};

module.exports = accessHelper;