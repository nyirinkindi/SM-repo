/**
 * Session configuration module
 */

const session = require('express-session');
const RedisStore = require('connect-redis').default;

function configureSession(app, redisClient) {
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
  if (redisClient && redisClient.isReady) {
    sessionConfig.store = new RedisStore({
      client: redisClient,
      prefix: `${process.env.REDIS_PREFIX || 'sess'}:`,
      ttl: 7200,
    });
    console.log('✓ Using Redis session store');
  } else {
    console.warn('⚠️  Using memory session store (not recommended for production)');
  }

  app.use(session(sessionConfig));
}

module.exports = { configureSession };