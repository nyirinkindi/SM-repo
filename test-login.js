/**
 * test-login.js
 * Script to test password comparison manually
 * 
 * Usage: node test-login.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Find MongoDB URI from environment variables
const MONGODB_URI = 
  process.env.MONGODB_URI || 
  process.env.MONGOLAB_URI || 
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  process.env.DB_URI;

if (!MONGODB_URI) {
  console.error('❌ MongoDB URI not found in environment variables!');
  console.error('   Please check your .env file');
  process.exit(1);
}

// Connect to MongoDB (no deprecated options for newer MongoDB drivers)
mongoose.connect(MONGODB_URI)
.then(() => console.log('✓ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import User model
const User = require('./models/User');

// Test credentials
const TEST_EMAIL = 'admin@eshuri.com';
const TEST_PASSWORD = 'Admin@123';

async function testLogin() {
  try {
    console.log('\n🔍 Testing login for:', TEST_EMAIL);
    console.log('=========================================\n');

    // Find user
    const user = await User.findOne({ 
      email: TEST_EMAIL.toLowerCase().trim() 
    });

    if (!user) {
      console.log('❌ User not found!');
      console.log('   Make sure you ran: node create-superadmin.js\n');
      process.exit(1);
    }

    console.log('✓ User found:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  URN:', user.URN);
    console.log('  Access Level:', user.access_level);
    console.log('  Enabled:', user.isEnabled);
    console.log('  Validated:', user.isValidated);
    console.log('  Hashed Password:', user.password.substring(0, 30) + '...');
    console.log('\n=========================================\n');

    // Test password comparison
    user.comparePassword(TEST_PASSWORD, TEST_EMAIL, (err, isMatch) => {
      if (err) {
        console.log('❌ Error comparing password:', err);
        process.exit(1);
      }

      console.log('🔐 Password Test Result:');
      console.log('   Password:', TEST_PASSWORD);
      console.log('   Match:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
      
      if (isMatch) {
        console.log('\n✅ Authentication should work!');
        console.log('   If login still fails, the issue is in:');
        console.log('   - Passport strategy configuration');
        console.log('   - Route/controller setup');
        console.log('   - Session configuration\n');
      } else {
        console.log('\n❌ Password comparison failed!');
        console.log('   Possible issues:');
        console.log('   - Password was not hashed correctly during creation');
        console.log('   - Email case mismatch');
        console.log('   - Wrong password format\n');
        console.log('💡 Try recreating the user with: node create-superadmin.js\n');
      }

      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testLogin();