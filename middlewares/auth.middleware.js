/**
 * middlewares/auth.middleware.js
 * Authentication and authorization middleware
 * FIXED: Proper authentication flow with redirects
 */

const authMiddleware = {
  // Base authentication check
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'Please login to access this page');
    return res.redirect('/auth/signin');
  },

  // Super admin only
  isSuperAdmin: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level === req.app.locals.access_level.SUPERADMIN) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'You are not authorized to access this page',
      path: req.originalUrl 
    });
  },

  // School director or higher
  isAtLeastSchoolDirector: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level <= req.app.locals.access_level.SA_SCHOOL) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is for Head of school',
      path: req.originalUrl 
    });
  },

  // Head of department or higher
  isAtLeastHOD: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level <= req.app.locals.access_level.HOD) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is for Head of department',
      path: req.originalUrl 
    });
  },

  // Admin or higher
  isAtLeastAdmin: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level <= req.app.locals.access_level.ADMIN_TEACHER) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is only for school administrators',
      path: req.originalUrl 
    });
  },

  // Teacher only (exact role)
  isAbsoluteTeacher: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user) {
      const lvl = req.user.access_level;
      const acc = req.app.locals.access_level;
      if (lvl === acc.TEACHER || lvl === acc.ADMIN_TEACHER) {
        return next();
      }
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is only for teachers',
      path: req.originalUrl 
    });
  },

  // Teacher or higher
  isAtLeastTeacher: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level <= req.app.locals.access_level.TEACHER) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is for teachers',
      path: req.originalUrl 
    });
  },

  // Teacher or admin
  isTeacherOrAdmin: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user) {
      const acc = req.app.locals.access_level;
      const lvl = req.user.access_level;
      if (lvl === acc.TEACHER || lvl === acc.ADMIN_TEACHER || lvl <= acc.ADMIN_TEACHER) {
        return next();
      }
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is for teachers or admins',
      path: req.originalUrl 
    });
  },

  // Student or higher
  isAtLeastStudent: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level <= req.app.locals.access_level.STUDENT) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'You are not authorized to view this',
      path: req.originalUrl 
    });
  },

  // Student only (exact role)
  isStudent: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level === req.app.locals.access_level.STUDENT) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is only for students',
      path: req.originalUrl 
    });
  },

  // Parent only
  isParent: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level === req.app.locals.access_level.PARENT) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is only for parents',
      path: req.originalUrl 
    });
  },

  // Guest only
  isGuest: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user?.access_level === req.app.locals.access_level.GUEST) {
      return next();
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is only for guests',
      path: req.originalUrl 
    });
  },

  // Guest or student
  isGuestOrStudent: (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/signin');
    }
    if (req.user) {
      const acc = req.app.locals.access_level;
      if (req.user.access_level === acc.GUEST || req.user.access_level === acc.STUDENT) {
        return next();
      }
    }
    return res.status(403).render('./lost', { 
      msg: 'This operation is only for guest or student',
      path: req.originalUrl 
    });
  }
};

module.exports = authMiddleware;