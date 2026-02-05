/*
 * Security middleware for eShuri app
 * Node.js v24 compatible
 */

const csrf = require('csurf');
const helmet = require('helmet');
const contentLength = require('express-content-length-validator');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const MAX_CONTENT_LENGTH_ACCEPTED = 15 * 1024 * 1024; // 15 MB

module.exports = function (app) {

  /* -----------------------------
   * Cookie parsing (required for CSRF)
   * ----------------------------- */
  app.use(cookieParser());

  /* -----------------------------
   * Payload size protection
   * ----------------------------- */
  app.use(
    contentLength.validateMax({
      max: MAX_CONTENT_LENGTH_ACCEPTED,
      status: 400,
      message: 'Payload too large'
    })
  );

  /* -----------------------------
   * HTTP Parameter Pollution protection
   * ----------------------------- */
  app.use(hpp());

  /* -----------------------------
   * Helmet (modern configuration)
   * ----------------------------- */
  app.use(
    helmet({
      contentSecurityPolicy: false, // enable later when ready
      crossOriginEmbedderPolicy: false
    })
  );

  /* -----------------------------
   * Obfuscate server signature
   * ----------------------------- */
  const webServers = [
    'Apache/2.4.18',
    'Microsoft-IIS/8.5',
    'nginx',
    'Express',
    'Phusion Passenger'
  ];

  app.use(
    helmet.hidePoweredBy({
      setTo: webServers[Math.floor(Math.random() * webServers.length)]
    })
  );

  /* -----------------------------
   * CSRF (optional)
   * ----------------------------- */
  /*
  const csrfProtection = csrf({ cookie: true });
  app.use(csrfProtection);
  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
  });
  console.log('CSRF protection enabled');
  */

  console.log('CSRF protection not enabled');

  /* -----------------------------
   * Privilege awareness (cross-platform)
   * ----------------------------- */
  if (typeof process.getuid === 'function') {
    console.log(`Running as UID: ${process.getuid()}`);
  } else {
    console.log('process.getuid() not available (Windows)');
  }
};
