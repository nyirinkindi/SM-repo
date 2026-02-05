/**
 * models/Department.js
 * Department model - belongs to a Faculty, contains Classes/Programs
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
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
  faculty_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  
  // For quick access to university
  university_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  },
  
  // Administration
  head_id: {
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
  
  // Structure - Classes/Programs in this department
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classe' // Using your existing Class model
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
  
  // Statistics
  numClasses: {
    type: Number,
    default: 0
  },
  
  numCourses: {
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

// Compound index to ensure unique code within a faculty
departmentSchema.index({ code: 1, faculty_id: 1 }, { unique: true });
departmentSchema.index({ faculty_id: 1 });
departmentSchema.index({ university_id: 1 });
departmentSchema.index({ head_id: 1 });
departmentSchema.index({ name: 1 });

// Update timestamp
departmentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Virtual for full name
departmentSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Method to update statistics
departmentSchema.methods.updateStatistics = async function() {
  const Classe = mongoose.model('Classe');
  const Course = mongoose.model('Course');
  const User = mongoose.model('User');
  
  try {
    // Count classes in this department
    this.numClasses = await Classe.countDocuments({ 
      owner_type: 'Department',
      owner_id: this._id 
    });
    
    // Count courses (through classes)
    const classes = await Classe.find({ 
      owner_type: 'Department',
      owner_id: this._id 
    }).select('_id');
    const classIds = classes.map(c => c._id);
    
    if (classIds.length > 0) {
      this.numCourses = await Course.countDocuments({ 
        class_id: { $in: classIds } 
      });
    }
    
    // Count students
    this.numStudents = await User.countDocuments({
      department_id: this._id,
      access_level: 4 // Student role
    });
    
    // Count lecturers/teachers
    this.numLecturers = await User.countDocuments({
      department_id: this._id,
      access_level: 3 // Teacher/Lecturer role
    });
    
    await this.save();
  } catch (error) {
    console.error('Error updating department statistics:', error);
  }
};

module.exports = mongoose.model('Department', departmentSchema);