/**
 * Redis client configuration module
 */

const { createClient } = require('redis');

function createRedisClient() {
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

  return redisClient;
}

module.exports = { createRedisClient };