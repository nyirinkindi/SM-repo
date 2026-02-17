'use strict';
const bcrypt     = require('bcrypt-nodejs');
const mongoose   = require('mongoose');
const Schema     = mongoose.Schema;
const saltRounds = 10;

/*
 * ACCESS_LEVELS:
 *  1 = SuperAdmin | 2 = Admin | 3 = Teacher | 4 = Student | (5 = Parent)
 */
const UserSchema = new Schema({
  name:             { type: String, required: true,  maxlength: 100, trim: true, uppercase: true },
  email:            { type: String, required: true,  lowercase: true, trim: true,
                      match: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/ },
  URN:              { type: String, required: true,  lowercase: true, trim: true },
  password:         { type: String, required: false, maxlength: 100 },
  gender:           { type: Number, default: 4,      enum: [1, 2] },
  phone_number:     { type: String, required: false },
  class_id:         { type: Schema.Types.ObjectId, required: false },
  prev_classes:     { type: Array,  required: false },
  school_id:        { type: Schema.Types.ObjectId, required: false },
  department_id:    { type: Schema.Types.ObjectId, required: false },
  marital_status:   { type: String, required: false },

  address: {
    province: { type: String, required: false },
    district: { type: String, required: false },
    sector:   { type: String, required: false },
  },

  guardian: {
    name:  { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: false },
  },

  past_info: {
    prev_school:        { type: String, required: false },
    prev_combination:   { type: String, required: false },
    grade:              { type: Number, required: false, min: 0 },
  },

  finance_category: { type: String, required: false },

  documents: {
    id_card:    { type: String, required: false },
    transcipt:  { type: String, required: false },
  },

  access_level:  { type: Number, default: 4,    enum: [1, 2, 3, 4] },
  isEnabled:     { type: Boolean, default: false },
  isValidated:   { type: Boolean, default: false },
  course_retake: { type: [String], required: false },
  profile_pic:   { type: String,  required: false },
  hasPaid:       { type: Boolean, default: true  },
  lastSeen:      { type: Date,    required: false },
}, { timestamps: { createdAt: 'created_at' } });

/**
 * Hash the password (+ email salt) before saving if it was modified.
 */
UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = bcrypt.genSaltSync(saltRounds);
    this.password = bcrypt.hashSync(this.password + this.email.toLowerCase(), salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Compare a plaintext candidate password against the stored hash.
 * Still uses a callback for compatibility with Passport.js local strategy.
 */
UserSchema.methods.comparePassword = function (candidatePassword, email, cb) {
  bcrypt.compare(
    candidatePassword + email.toLowerCase().trim(),
    this.password,
    (err, isMatch) => {
      if (err) return cb(err);
      cb(null, isMatch);
    }
  );
};

/**
 * Hash a password synchronously and return via callback (kept for compatibility).
 */
UserSchema.methods.hash_password = function (candidatePassword, email, cb) {
  try {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(candidatePassword + email.toLowerCase(), salt);
    cb(null, hash);
  } catch (err) {
    cb(err);
  }
};

module.exports = mongoose.model('User', UserSchema);
