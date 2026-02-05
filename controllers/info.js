/**
 * controllers/info.js
 * Info page controllers - Fixed for new route structure
 */

/**
 * Main landing page (public)
 */
exports.getMainPage = function(req, res, next) {
  return res.render('info/homepage', {
    title: 'eShuri homepage',
    access_lvl: req.isAuthenticated() ? req.user.access_level : null,
  });
};

/**
 * Welcome page - redirects authenticated users to appropriate dashboard
 */
exports.getWelcomePage = (req, res, next) => {
  // If not authenticated, redirect to sign in (NEW PATH)
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/signin');
  }

  let link = '';
  console.log('Access: ' + req.user.access_level);

  // Determine redirect based on user role
  switch (req.user.access_level) {
    case req.app.locals.access_level.SUPERADMIN:
      link = '/dashboard';
      break;

    case req.app.locals.access_level.SA_SCHOOL:
      link = '/dashboard/director';
      break;

    // Admins and HODs → Dashboard
    case req.app.locals.access_level.HOD:
    case req.app.locals.access_level.ADMIN:
    case req.app.locals.access_level.ADMIN_TEACHER:
      link = '/dashboard/classe/' + req.user.school_id;
      break;

    // Teachers and Students → Timeline
    case req.app.locals.access_level.TEACHER:
    case req.app.locals.access_level.STUDENT:
      link = '/timeline';
      break;

    // Parents → Parent dashboard
    case req.app.locals.access_level.PARENT:
      link = '/parent';
      break;

    // Guests → Application page
    case req.app.locals.access_level.GUEST:
      link = '/application';
      break;

    default:
      break;
  }

  // Redirect to appropriate page
  if (link !== '') {
    return res.redirect(link);
  }

  // Unknown user type
  return res.render('./lost', { 
    msg: 'Unknown user type. Please contact administrator.' 
  });
};

/**
 * About page
 */
exports.getPageAbout = function(req, res, next) {
  return res.render('info/about', {
    title: 'About eShuri',
  });
};

/**
 * Terms and Conditions page
 */
exports.getTerms_Conditions = function(req, res, next) {
  return res.render('info/termsConditions', {
    title: 'Terms and Conditions',
  });
};

/**
 * 404 Page Not Found
 */
exports.getPage404 = (req, res, next) => {
  res.status(404).render('page404', { 
    title: '404 - Page Not Found',
    path: req.originalUrl 
  });
};