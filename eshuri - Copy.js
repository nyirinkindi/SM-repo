/**
 * eShuri Express Server
 * Modernized for Node.js v24 + Redis v4 + MongoDB + Passport
 */

const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');

const flash = require('express-flash');
const helmet = require('helmet');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

/**
 * Load environment variables from .env file
 */
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Validate critical environment variables
 */
const requiredEnvVars = ['MONGODB_URI', 'SESSION_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

/**
 * Create Express application
 */
const app = express();

/**
 * MongoDB connection with retry logic
 */
const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

connectDB();

/**
 * Redis client setup (v4)
 */
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    connectTimeout: 10000,
  },
  password: process.env.REDIS_SECRET || undefined,
});

redisClient.on('error', err => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✓ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('✓ Redis ready to accept commands');
});

// Connect Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
    console.warn('Continuing without Redis session store');
  }
})();

/**
 * Express configuration
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 6800);
app.locals.pretty = process.env.devStatus !== 'PROD';

/**
 * Security middleware
 */
if (process.env.devStatus === 'PROD') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      },
    },
  }));
}

/**
 * Body parsing middleware
 */
app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Custom NoSQL Injection Prevention
 * (express-mongo-sanitize incompatible with Node.js v24)
 */
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
});

app.use((req, res, next) => {
  // Initialize validation errors array
  req._validations = [];
  
  /**
   * Legacy req.assert() implementation
   * Returns a chainable validator object
   */
  req.assert = function(field, message) {
    const validator = {
      notEmpty: function() {
        const value = req.body[field] || req.params[field] || req.query[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      len: function(min, max) {
        const value = String(req.body[field] || req.params[field] || req.query[field] || '');
        if (value.length < min || (max && value.length > max)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isEmail: function() {
        const value = String(req.body[field] || req.params[field] || req.query[field] || '');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isMongoId: function() {
        const value = String(req.body[field] || req.params[field] || req.query[field] || '');
        const mongoIdRegex = /^[a-f\d]{24}$/i;
        if (!mongoIdRegex.test(value)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isIn: function(values) {
        const value = req.body[field] || req.params[field] || req.query[field];
        if (!values.includes(value) && !values.includes(Number(value))) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isInt: function(options = {}) {
        const value = req.body[field] || req.params[field] || req.query[field];
        const num = parseInt(value);
        if (isNaN(num)) {
          req._validations.push({ param: field, msg: message });
        } else {
          if (options.min !== undefined && num < options.min) {
            req._validations.push({ param: field, msg: message });
          }
          if (options.max !== undefined && num > options.max) {
            req._validations.push({ param: field, msg: message });
          }
        }
        return validator;
      },
      
      isFloat: function(options = {}) {
        const value = req.body[field] || req.params[field] || req.query[field];
        const num = parseFloat(value);
        if (isNaN(num)) {
          req._validations.push({ param: field, msg: message });
        } else {
          if (options.min !== undefined && num < options.min) {
            req._validations.push({ param: field, msg: message });
          }
          if (options.max !== undefined && num > options.max) {
            req._validations.push({ param: field, msg: message });
          }
        }
        return validator;
      },
      
      equals: function(comparison) {
        const value = req.body[field] || req.params[field] || req.query[field];
        if (value !== comparison && String(value) !== String(comparison)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      }
    };
    
    return validator;
  };
  
  /**
   * Legacy req.validationErrors() implementation
   * Returns array of errors or false if no errors
   */
  req.validationErrors = function() {
    return req._validations && req._validations.length > 0 ? req._validations : false;
  };
  
  next();
});

/**
 * COMPLETE CODE SECTION FOR eshuri.js (lines 125-200)
 * Replace from the NoSQL prevention to before session config
 */

// Custom NoSQL Injection Prevention (line ~125)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
});

// ✅ ADD EXPRESS VALIDATOR LEGACY MIDDLEWARE HERE
app.use((req, res, next) => {
  req._validations = [];
  
  req.assert = function(field, message) {
    const validator = {
      notEmpty: function() {
        const value = req.body[field] || req.params[field] || req.query[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      len: function(min, max) {
        const value = String(req.body[field] || req.params[field] || req.query[field] || '');
        if (value.length < min || (max && value.length > max)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      isEmail: function() {
        const value = String(req.body[field] || req.params[field] || req.query[field] || '');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      isMongoId: function() {
        const value = String(req.body[field] || req.params[field] || req.query[field] || '');
        const mongoIdRegex = /^[a-f\d]{24}$/i;
        if (!mongoIdRegex.test(value)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      isIn: function(values) {
        const value = req.body[field] || req.params[field] || req.query[field];
        if (!values.includes(value) && !values.includes(Number(value))) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      isInt: function(options = {}) {
        const value = req.body[field] || req.params[field] || req.query[field];
        const num = parseInt(value);
        if (isNaN(num)) {
          req._validations.push({ param: field, msg: message });
        } else {
          if (options.min !== undefined && num < options.min) {
            req._validations.push({ param: field, msg: message });
          }
          if (options.max !== undefined && num > options.max) {
            req._validations.push({ param: field, msg: message });
          }
        }
        return validator;
      },
      isFloat: function(options = {}) {
        const value = req.body[field] || req.params[field] || req.query[field];
        const num = parseFloat(value);
        if (isNaN(num)) {
          req._validations.push({ param: field, msg: message });
        } else {
          if (options.min !== undefined && num < options.min) {
            req._validations.push({ param: field, msg: message });
          }
          if (options.max !== undefined && num > options.max) {
            req._validations.push({ param: field, msg: message });
          }
        }
        return validator;
      },
      equals: function(comparison) {
        const value = req.body[field] || req.params[field] || req.query[field];
        if (value !== comparison && String(value) !== String(comparison)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      }
    };
    return validator;
  };
  
  req.validationErrors = function() {
    return req._validations && req._validations.length > 0 ? req._validations : false;
  };
  
  next();
});


/**
 * Session configuration
 */
const HOURS = 3600000;
const sessionConfig = {
  name: process.env.REDIS_NAME || 'eShuriSession',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.devStatus === 'PROD',
    maxAge: 2 * HOURS,
    sameSite: 'lax',
  },
};

// Use Redis store if connected, otherwise fall back to memory store
if (redisClient.isReady) {
  sessionConfig.store = new RedisStore({
    client: redisClient,
    prefix: `${process.env.REDIS_PREFIX || 'sess'}:`,
    ttl: 7200,
  });
  console.log('✓ Using Redis session store');
} else {
  console.warn('⚠ Using memory session store (not recommended for production)');
}

app.use(session(sessionConfig));

/**
 * Passport configuration and middleware
 */
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

/**
 * Static assets with caching
 */
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.devStatus === 'PROD' ? 7 * 24 * HOURS : 0,
    etag: true,
  })
);

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: 0,
  })
);

/**
 * OAuth credentials check
 */
if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
  console.warn('⚠ Facebook OAuth credentials missing - Facebook login disabled');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠ Google OAuth credentials missing - Google login disabled');
}

/**
 * Application constants and security
 */
require('./constants')(app);
require('./config/security')(app);

/**
 * Create HTTP server (BEFORE Socket.IO)
 */
const server = require('http').createServer(app);

/**
 * Socket.IO configuration (AFTER server creation)
 */
const io = require('./socket_io')(server, app);
const universityRoutes = require('./routes/university.routes');
app.use('/university', universityRoutes);
app.use('/dashboard/universities', universityRoutes);

/**
 * API Routes (AFTER Socket.IO)
 */
require('./routes')(app);

/**
 * Error handling middleware
 */
if (process.env.devStatus !== 'PROD') {
  app.use(errorHandler({ log: true }));
} else {
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500);
    res.render('error', {
      message: 'An error occurred',
      error: {},
    });
  });
}

/**
 * Graceful shutdown
 */
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');
  
  try {
    server.close(() => {
      console.log('✓ HTTP server closed');
    });

    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');

    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('✓ Redis connection closed');
    }

    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/**
 * Unhandled rejection handler
 */
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