/**
 * routes/index.js - Main Router
 * Centralized route configuration with error checking
 */

module.exports = function(app) {
  /**
   * Global middleware
   */
  
  // Logging middleware (dev only)
  app.use((req, res, next) => {
    if (process.env.devStatus === 'DEV') {
      const userInfo = req.user ? req.user.name : 'Not connected';
      console.log(`${userInfo} ${req.method} @ ${req.path}`);
    }
    next();
  });

  // Disabled account check
  app.use((req, res, next) => {
    if (req.user && !req.user.isEnabled) {
      return res.status(401).send('Your account has been disabled');
    }
    next();
  });

  // Session currentOption for HOD
  app.use((req, res, next) => {
    if (req.session?.currentOption && req.user?.access_level === req.app.locals.access_level.HOD) {
      req.user.school_id = req.session.currentOption;
    }
    next();
  });

  /**
   * Helper function to safely require route modules
   */
  function safeRequire(modulePath, moduleName) {
    try {
      const module = require(modulePath);
      if (typeof module !== 'function') {
        console.error(`❌ ${moduleName} is not a valid router (not a function)`);
        return null;
      }
      console.log(`✓ Loaded ${moduleName}`);
      return module;
    } catch (error) {
      console.error(`❌ Failed to load ${moduleName}:`, error.message);
      return null;
    }
  }

  /**
   * Mount route modules with proper prefixes
   */
  
  console.log('\n📦 Loading route modules...\n');

  // Authentication routes
  const authRoutes = safeRequire('./auth.routes', 'auth.routes.js');
  if (authRoutes) app.use('/auth', authRoutes);
  
  // User management routes
  const userRoutes = safeRequire('./user.routes', 'user.routes.js');
  if (userRoutes) app.use('/user', userRoutes);
  
  // Parent routes
  const parentRoutes = safeRequire('./parent.routes', 'parent.routes.js');
  if (parentRoutes) app.use('/parent', parentRoutes);
  
  // School routes
  const schoolRoutes = safeRequire('./school.routes', 'school.routes.js');
  if (schoolRoutes) app.use('/school', schoolRoutes);
  
  // Dashboard routes
  const dashboardRoutes = safeRequire('./dashboard.routes', 'dashboard.routes.js');
  if (dashboardRoutes) app.use('/dashboard', dashboardRoutes);
  
  // Class routes
  const classRoutes = safeRequire('./class.routes', 'class.routes.js');
  if (classRoutes) app.use('/classe', classRoutes);
  
  // Course routes
  const courseRoutes = safeRequire('./course.routes', 'course.routes.js');
  if (courseRoutes) app.use('/courses', courseRoutes);
  
  // Unit routes
  const unitRoutes = safeRequire('./unit.routes', 'unit.routes.js');
  if (unitRoutes) app.use('/unit', unitRoutes);
  
  // Content routes
  const contentRoutes = safeRequire('./content.routes', 'content.routes.js');
  if (contentRoutes) app.use('/content', contentRoutes);
  
  // Report routes
  const reportRoutes = safeRequire('./report.routes', 'report.routes.js');
  if (reportRoutes) app.use('/report', reportRoutes);
  
  // University routes (mounted on TWO paths)
  const universityRoutes = safeRequire('./university.routes', 'university.routes.js');
  if (universityRoutes) {
    app.use('/university', universityRoutes);
    app.use('/dashboard/universities', universityRoutes);
  }
  
  // Library routes
  const libraryRoutes = safeRequire('./library.routes', 'library.routes.js');
  if (libraryRoutes) app.use('/library', libraryRoutes);
  
  // Timeline routes
  const timelineRoutes = safeRequire('./timeline.routes', 'timeline.routes.js');
  if (timelineRoutes) app.use('/timeline', timelineRoutes);
  
  // Payment routes
  const paymentRoutes = safeRequire('./payment.routes', 'payment.routes.js');
  if (paymentRoutes) app.use('/payment', paymentRoutes);
  
  // Application routes
  const applicationRoutes = safeRequire('./application.routes', 'application.routes.js');
  if (applicationRoutes) app.use('/application', applicationRoutes);
  
  // Backup routes
  const backupRoutes = safeRequire('./backup.routes', 'backup.routes.js');
  if (backupRoutes) app.use('/backup', backupRoutes);
  
  // Profile routes
  const profileRoutes = safeRequire('./profile.routes', 'profile.routes.js');
  if (profileRoutes) app.use('/profile', profileRoutes);
  
  // Legacy redirects (BEFORE info routes for backward compatibility)
  const legacyRedirects = safeRequire('./legacy-redirects.routes', 'legacy-redirects.routes.js');
  if (legacyRedirects) {
    app.use(legacyRedirects);
  }
  
  // Info routes (public pages - must be last before 404)
  const infoRoutes = safeRequire('./info.routes', 'info.routes.js');
  if (infoRoutes) app.use('/', infoRoutes);

  console.log('\n✅ Route modules loaded\n');

  /**
   * 404 handler (must be after all routes)
   */
  app.use((req, res, next) => {
    res.status(404).render('./lost', { 
      msg: 'Page not found',
      path: req.originalUrl 
    });
  });
};