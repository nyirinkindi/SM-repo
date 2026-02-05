/**
 * Environment validation module
 */

function validateEnvironment() {
  const requiredEnvVars = ['MONGODB_URI', 'SESSION_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }

  // Warn about missing OAuth credentials
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    console.warn('⚠️  Facebook OAuth credentials missing - Facebook login disabled');
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials missing - Google login disabled');
  }
}

module.exports = { validateEnvironment };