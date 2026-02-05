/**
 * Graceful shutdown handler
 */

const mongoose = require('mongoose');

async function gracefulShutdown(server, redisClient) {
  console.log('\nShutting down gracefully...');
  
  try {
    server.close(() => {
      console.log('✓ HTTP server closed');
    });

    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');

    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log('✓ Redis connection closed');
    }

    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

module.exports = { gracefulShutdown };