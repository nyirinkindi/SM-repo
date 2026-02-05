/**
 * eShuri Express Server
 * Modernized for Node.js v24 + Redis v4 + MongoDB + Passport
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '.env') });

// Import configuration modules
const { validateEnvironment } = require('./config/environment');
const { connectMongoDB } = require('./config/database');
const { createRedisClient } = require('./config/redis');
const { configureMiddleware } = require('./config/middleware');
const { configureSession } = require('./config/session');
const { setupRoutes } = require('./routes');
const { gracefulShutdown } = require('./config/shutdown');

/**
 * Validate critical environment variables
 */
validateEnvironment();

/**
 * Create Express application
 */
const app = express();
app.set('port', process.env.PORT || 6800);

/**
 * Connect to databases
 */
connectMongoDB();
const redisClient = createRedisClient();

/**
 * Configure Express settings
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.pretty = process.env.devStatus !== 'PROD';

/**
 * Apply middleware (security, parsing, validation, etc.)
 */
configureMiddleware(app);

/**
 * Configure sessions with Redis
 */
configureSession(app, redisClient);

/**
 * Setup Passport authentication
 */
const passport = require('passport');
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(require('express-flash')());

/**
 * Application constants and security
 */
require('./constants')(app);
require('./config/security')(app);

/**
 * Create HTTP server
 */
const server = require('http').createServer(app);

/**
 * Initialize Socket.IO
 */
const io = require('./socket_io')(server, app);

/**
 * Setup all application routes
 */
const mainRoutes = require('./routes');
mainRoutes(app);

/**
 * Error handling
 */
if (process.env.devStatus !== 'PROD') {
  app.use(require('errorhandler')({ log: true }));
} else {
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).render('error', {
      message: 'An error occurred',
      error: {},
    });
  });
}

/**
 * Graceful shutdown handlers
 */
process.on('SIGTERM', () => gracefulShutdown(server, redisClient));
process.on('SIGINT', () => gracefulShutdown(server, redisClient));
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Start server
 */
const PORT = app.get('port');

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 eShuri Server Started Successfully');
  console.log('========================================');
  console.log(`Port:        ${PORT}`);
  console.log(`URL:         http://127.0.0.1:${PORT}`);
  console.log(`Environment: ${process.env.devStatus || 'DEVELOPMENT'}`);
  console.log(`Node:        ${process.version}`);
  console.log('========================================\n');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

module.exports = { app, server };