/**
 * models/University.js
 * University model for higher education institutions
 */

const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Location
  district_name: {
    type: String,
    maxlength: 100
  },
  
  location: {
    type: String,
    maxlength: 200
  },
  
  // Visual
  cover_photo: {
    type: String,
    default: null
  },
  
  logo: {
    type: String,
    default: null
  },
  
  // Administration
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Contact Information
  admin_mail: {
    type: String,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  
  phone_number: {
    type: String,
    maxlength: 20
  },
  
  website: {
    type: String,
    maxlength: 200
  },
  
  // Academic Structure
  faculties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  }],
  
  // Academic Settings
  term_name: {
    type: String,
    default: 'S', // S = Semester, T = Term
    enum: ['S', 'T']
  },
  
  term_quantity: {
    type: Number,
    default: 2,
    min: 1,
    max: 4
  },
  
  // Statistics (denormalized for performance)
  numUsers: {
    type: Number,
    default: 0
  },
  
  numFaculties: {
    type: Number,
    default: 0
  },
  
  numDepartments: {
    type: Number,
    default: 0
  },
  
  numStudents: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
universitySchema.index({ name: 1 });
universitySchema.index({ code: 1 });
universitySchema.index({ district_name: 1 });
universitySchema.index({ admin_id: 1 });
universitySchema.index({ isActive: 1 });

// Update the updated_at timestamp before saving
universitySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Virtual for full name with code
universitySchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Method to update statistics
universitySchema.methods.updateStatistics = async function() {
  const Faculty = mongoose.model('Faculty');
  const User = mongoose.model('User');
  
  try {
    // Count faculties
    this.numFaculties = await Faculty.countDocuments({ university_id: this._id });
    
    // Count departments (through faculties)
    const faculties = await Faculty.find({ university_id: this._id }).select('_id');
    const facultyIds = faculties.map(f => f._id);
    
    if (facultyIds.length > 0) {
      const Department = mongoose.model('Department');
      this.numDepartments = await Department.countDocuments({ 
        faculty_id: { $in: facultyIds } 
      });
    }
    
    // Count students
    this.numStudents = await User.countDocuments({ 
      university_id: this._id,
      access_level: 4 // Student role
    });
    
    // Count all users
    this.numUsers = await User.countDocuments({ university_id: this._id });
    
    await this.save();
  } catch (error) {
    console.error('Error updating university statistics:', error);
  }
};

module.exports = mongoose.model('University', universitySchema);