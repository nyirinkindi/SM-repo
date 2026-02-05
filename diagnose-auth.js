/**
 * diagnose-auth.js
 * Complete diagnostic script to check authentication setup
 */

const mongoose = require('mongoose');
require('dotenv').config();

console.log('\n🔍 AUTHENTICATION DIAGNOSTICS');
console.log('=====================================\n');

// Step 1: Check environment variables
console.log('📋 Step 1: Environment Variables');
console.log('-----------------------------------');
const MONGODB_URI = 
  process.env.MONGODB_URI || 
  process.env.MONGOLAB_URI || 
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  process.env.DB_URI;

if (!MONGODB_URI) {
  console.log('❌ No MongoDB URI found!');
  process.exit(1);
}

console.log('✓ MongoDB URI found:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
console.log('✓ Database name:', MONGODB_URI.split('/').pop().split('?')[0]);
console.log('');

// Step 2: Connect to MongoDB
console.log('📋 Step 2: Database Connection');
console.log('-----------------------------------');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const User = require('./models/User');
    
    // Step 3: Check database and collection
    console.log('📋 Step 3: Database Check');
    console.log('-----------------------------------');
    const dbName = mongoose.connection.db.databaseName;
    console.log('Connected to database:', dbName);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    console.log('');
    
    // Step 4: Count users
    console.log('📋 Step 4: User Count');
    console.log('-----------------------------------');
    const userCount = await User.countDocuments();
    console.log('Total users in database:', userCount);
    console.log('');
    
    // Step 5: Find admin user
    console.log('📋 Step 5: Super Admin Check');
    console.log('-----------------------------------');
    const adminEmail = 'admin@eshuri.com';
    console.log('Searching for:', adminEmail);
    
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('❌ Super admin NOT FOUND');
      console.log('\n💡 Solution: Run this command to create super admin:');
      console.log('   node create-superadmin.js\n');
      
      // Show all users with access_level 1
      const superAdmins = await User.find({ access_level: 1 });
      if (superAdmins.length > 0) {
        console.log('⚠️  Found other super admins (access_level=1):');
        superAdmins.forEach(u => {
          console.log(`   - ${u.name} (${u.email})`);
        });
      }
      process.exit(0);
    }
    
    console.log('✓ Super admin FOUND:');
    console.log('  Name:', admin.name);
    console.log('  Email:', admin.email);
    console.log('  URN:', admin.URN);
    console.log('  Access Level:', admin.access_level);
    console.log('  Enabled:', admin.isEnabled);
    console.log('  Validated:', admin.isValidated);
    console.log('  Password exists:', !!admin.password);
    console.log('  Password length:', admin.password ? admin.password.length : 0);
    console.log('');
    
    // Step 6: Test password comparison
    console.log('📋 Step 6: Password Test');
    console.log('-----------------------------------');
    const testPassword = 'Admin@123';
    console.log('Testing password:', testPassword);
    
    admin.comparePassword(testPassword, adminEmail, (err, isMatch) => {
      if (err) {
        console.log('❌ Password comparison ERROR:', err);
        process.exit(1);
      }
      
      console.log('Password match:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
      
      if (isMatch) {
        console.log('\n✅ DIAGNOSIS COMPLETE - EVERYTHING LOOKS GOOD!');
        console.log('=====================================');
        console.log('\nThe issue might be:');
        console.log('1. Session configuration problem');
        console.log('2. Passport initialization issue');
        console.log('3. CSRF token mismatch');
        console.log('4. Route configuration issue\n');
      } else {
        console.log('\n❌ DIAGNOSIS COMPLETE - PASSWORD PROBLEM!');
        console.log('=====================================');
        console.log('\nThe password hash is incorrect.');
        console.log('Delete and recreate the user:\n');
        console.log('1. mongosh');
        console.log('2. use', dbName);
        console.log('3. db.users.deleteOne({ email: "admin@eshuri.com" })');
        console.log('4. exit');
        console.log('5. node create-superadmin.js\n');
      }
      
      process.exit(0);
    });
    
  })
  .catch(err => {
    console.log('❌ MongoDB connection error:', err);
    process.exit(1);
  });