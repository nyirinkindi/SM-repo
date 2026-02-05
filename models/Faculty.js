/**
 * models/Faculty.js
 * Faculty model - belongs to a University, contains Departments
 */

const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
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
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Relationship
  university_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  
  // Administration
  dean_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Visual
  cover_photo: {
    type: String,
    default: null
  },
  
  // Contact
  email: {
    type: String,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  
  phone_number: {
    type: String,
    maxlength: 20
  },
  
  office_location: {
    type: String,
    maxlength: 200
  },
  
  // Structure
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  
  // Statistics
  numDepartments: {
    type: Number,
    default: 0
  },
  
  numStudents: {
    type: Number,
    default: 0
  },
  
  numLecturers: {
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

// Compound index to ensure unique code within a university
facultySchema.index({ code: 1, university_id: 1 }, { unique: true });
facultySchema.index({ university_id: 1 });
facultySchema.index({ dean_id: 1 });
facultySchema.index({ name: 1 });

// Update timestamp
facultySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Virtual for full name
facultySchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Method to update statistics
facultySchema.methods.updateStatistics = async function() {
  const Department = mongoose.model('Department');
  const User = mongoose.model('User');
  
  try {
    // Count departments
    this.numDepartments = await Department.countDocuments({ faculty_id: this._id });
    
    // Count students in all departments of this faculty
    const departments = await Department.find({ faculty_id: this._id }).select('_id');
    const deptIds = departments.map(d => d._id);
    
    if (deptIds.length > 0) {
      this.numStudents = await User.countDocuments({
        department_id: { $in: deptIds },
        access_level: 4 // Student role
      });
      
      this.numLecturers = await User.countDocuments({
        department_id: { $in: deptIds },
        access_level: 3 // Teacher/Lecturer role
      });
    }
    
    await this.save();
  } catch (error) {
    console.error('Error updating faculty statistics:', error);
  }
};

module.exports = mongoose.model('Faculty', facultySchema);