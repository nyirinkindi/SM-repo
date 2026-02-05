const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const saltRounds = 10;
const Schema = mongoose.Schema;

/*  ACCESS_LEVELS possible
  1: SuperAdmin
  2: Admin
  3: Teacher
  4: Student
  5: Parent
*/

const UserSchema = new Schema({
  name: { type: String, required: true, maxlength: 100, trim: true, uppercase: true },
  email: { type: String, required: true, match: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, lowercase: true, trim: true },
  URN: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: false, maxlength: 100 },
  gender: { type: Number, default: 4, enum: [1, 2] },
  phone_number: { type: String, required: false },
  class_id: { type: Schema.Types.ObjectId, required: false },
  prev_classes: { type: Array, required: false },
  school_id: { type: Schema.Types.ObjectId, required: false },
  department_id: { type: Schema.Types.ObjectId, required: false },
  marital_status: { type: String, required: false },
  address: {
    province: { type: String, required: false },
    district: { type: String, required: false },
    sector: { type: String, required: false },
  },
  guardian: {
    name: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: false },
  },
  past_info: {
    prev_school: { type: String, required: false },
    prev_combination: { type: String, required: false },
    grade: { type: Number, required: false, min: 0 },
  },
  finance_category: { type: String, required: false },
  documents: {
    id_card: { type: String, required: false },
    transcipt: { type: String, required: false }
  },
  access_level: { type: Number, default: 4, enum: [1, 2, 3, 4] },
  isEnabled: { type: Boolean, required: false, default: false },
  isValidated: { type: Boolean, required: false, default: false },
  course_retake: { type: [String], required: false },
  profile_pic: { type: String, required: false },
  hasPaid: { type: Boolean, required: false, default: true },
  lastSeen: { type: Date, required: false },
}, { timestamps: { createdAt: 'created_at' } });

/**
 * Password hash middleware - MUST come before model compilation
 */
UserSchema.pre('save', function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt synchronously
    const salt = bcrypt.genSaltSync(saltRounds);
    // Hash password + email
    const passwordWithEmail = this.password + this.email.toLowerCase();
    const hash = bcrypt.hashSync(passwordWithEmail, salt);
    this.password = hash;
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Compare password method
 */
UserSchema.methods.comparePassword = function(candidatePassword, email, cb) {
  const passwordWithEmail = candidatePassword + email.toLowerCase().trim();
  bcrypt.compare(passwordWithEmail, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

/**
 * Hash password method (for compatibility)
 */
UserSchema.methods.hash_password = function(candidatePassword, email, cb) {
  try {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(candidatePassword + email.toLowerCase(), salt);
    cb(null, hash);
  } catch (err) {
    cb(err);
  }
};

const User = mongoose.model('User', UserSchema);
module.exports = User;