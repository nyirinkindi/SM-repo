/**
 * Middleware configuration module
 */

const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');

// Import custom middleware
const { noSQLInjectionPrevention } = require('../middlewares/nosql-prevention');
const { legacyValidator } = require('../middlewares/legacy-validator');

function configureMiddleware(app) {
  const HOURS = 3600000;

  // Security middleware (production only)
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

  // Body parsing
  app.use(compression());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  // Custom security middleware
  app.use(noSQLInjectionPrevention);
  app.use(legacyValidator);

  // Static assets with caching
  app.use(
    express.static(path.join(__dirname, '..', 'public'), {
      maxAge: process.env.devStatus === 'PROD' ? 7 * 24 * HOURS : 0,
      etag: true,
    })
  );

  app.use(
    '/uploads',
    express.static(path.join(__dirname, '..', 'uploads'), {
      maxAge: 0,
    })
  );
}

module.exports = { configureMiddleware };