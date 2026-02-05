/**
 * create-superadmin.js
 * Script to create a super admin user with proper password hashing
 * 
 * Usage: node create-superadmin.js
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
  console.error('   Please check your .env file for:');
  console.error('   - MONGODB_URI');
  console.error('   - MONGOLAB_URI');
  console.error('   - MONGO_URI');
  console.error('   - DATABASE_URL');
  console.error('   - DB_URI');
  console.error('\n   Current environment variables starting with MONGO or DB:');
  Object.keys(process.env)
    .filter(key => key.includes('MONGO') || key.includes('DB'))
    .forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

console.log('Connecting to MongoDB...');

// Connect to MongoDB (no deprecated options for newer MongoDB drivers)
mongoose.connect(MONGODB_URI)
.then(() => console.log('✓ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import User model
const User = require('./models/User');

// Super Admin credentials
const SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@eshuri.rw',
  password: 'Admin@123',  // This will be hashed by the User model pre-save hook
  phone_number: '0788000000',
  URN: 'sa-2025-001',
  access_level: 1, // Super Admin level (SUPERADMIN)
  gender: 1, // Male
  isEnabled: true,
  isValidated: true,
};

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await User.findOne({ 
      email: SUPER_ADMIN.email.toLowerCase().trim()
    });

    if (existingAdmin) {
      console.log('\n⚠️  Super Admin with this email already exists!');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   URN:', existingAdmin.URN);
      console.log('   Access Level:', existingAdmin.access_level);
      console.log('   Enabled:', existingAdmin.isEnabled);
      console.log('\n💡 Tip: Delete the existing user or use a different email\n');
      process.exit(0);
    }

    // Hash password manually to bypass the pre-save hook issue
    const bcrypt = require('bcrypt-nodejs');
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordWithEmail = SUPER_ADMIN.password + SUPER_ADMIN.email.toLowerCase();
    const hashedPassword = bcrypt.hashSync(passwordWithEmail, salt);

    // Create user document directly without triggering pre-save
    const userDoc = {
      name: SUPER_ADMIN.name,
      email: SUPER_ADMIN.email.toLowerCase().trim(),
      URN: SUPER_ADMIN.URN.toLowerCase().trim(),
      password: hashedPassword, // Already hashed
      phone_number: SUPER_ADMIN.phone_number,
      access_level: SUPER_ADMIN.access_level,
      gender: SUPER_ADMIN.gender,
      isEnabled: SUPER_ADMIN.isEnabled,
      isValidated: SUPER_ADMIN.isValidated,
    };

    // Insert directly to bypass middleware
    await User.collection.insertOne(userDoc);

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('=========================================');
    console.log('Login Credentials:');
    console.log('=========================================');
    console.log('Email:    ', SUPER_ADMIN.email);
    console.log('Password: ', SUPER_ADMIN.password);
    console.log('URN:      ', SUPER_ADMIN.URN);
    console.log('=========================================');
    console.log('\n📝 Login Instructions:');
    console.log('   1. Go to: http://localhost:YOUR_PORT/auth/signin');
    console.log('   2. Enter email:', SUPER_ADMIN.email);
    console.log('   3. Enter password:', SUPER_ADMIN.password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('⚠️  The password is hashed with email using bcrypt-nodejs\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    if (error.code === 11000) {
      console.error('   Duplicate key error - user already exists');
    }
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();