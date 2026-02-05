/**
 * controllers/course.js
 * Course management controller
 */

const Course = require('../models/Course');
const User = require('../models/User');
const Content = require('../models/Content');
const Unit = require('../models/Unit');
const mongoose = require('mongoose');

// ========== COURSE PAGES ==========

/**
 * GET /:course_id
 * Render course details page
 */
exports.getCoursePage = async (req, res) => {
  try {
    const { course_id } = req.params;
    
    const course = await Course.findById(course_id)
      .populate('teachers', 'name email')
      .populate('school', 'name')
      .lean();

    if (!course) {
      return res.status(404).render('error', {
        message: 'Course not found',
        user: req.session.user
      });
    }

    // Get course contents
    const contents = await Content.find({ course: course_id })
      .populate('unit', 'name order')
      .sort({ order: 1 })
      .lean();

    res.render('course/view', {
      course,
      contents,
      user: req.session.user,
      title: course.name
    });
  } catch (error) {
    console.error('Error loading course page:', error);
    res.status(500).render('error', {
      message: 'Error loading course',
      user: req.session.user
    });
  }
};

/**
 * GET /:course_id/:content_id
 * Render course page with specific content
 */
exports.getCourseWithContent = async (req, res) => {
  try {
    const { course_id, content_id } = req.params;

    const [course, content, allContents] = await Promise.all([
      Course.findById(course_id)
        .populate('teachers', 'name email')
        .populate('school', 'name')
        .lean(),
      Content.findById(content_id)
        .populate('unit', 'name')
        .lean(),
      Content.find({ course: course_id })
        .populate('unit', 'name order')
        .sort({ order: 1 })
        .lean()
    ]);

    if (!course || !content) {
      return res.status(404).render('error', {
        message: 'Course or content not found',
        user: req.session.user
      });
    }

    res.render('course/view-content', {
      course,
      content,
      contents: allContents,
      user: req.session.user,
      title: `${course.name} - ${content.title}`
    });
  } catch (error) {
    console.error('Error loading course content:', error);
    res.status(500).render('error', {
      message: 'Error loading content',
      user: req.session.user
    });
  }
};

// ========== COURSE CRUD ==========

/**
 * POST /list
 * Get courses list (JSON)
 */
exports.getCoursesList = async (req, res) => {
  try {
    const { school_id, term_id, search, department_id } = req.body;
    
    const query = {};
    
    if (school_id) query.school = school_id;
    if (term_id) query.term = term_id;
    if (department_id) query.department = department_id;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('teachers', 'name email')
      .populate('school', 'name')
      .populate('department', 'name')
      .populate('term', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
};

/**
 * GET /details/:course_id
 * Get course details (JSON)
 */
exports.getCourseDetails = async (req, res) => {
  try {
    const { course_id } = req.params;

    const course = await Course.findById(course_id)
      .populate('teachers', 'name email profile_picture')
      .populate('school', 'name')
      .populate('department', 'name')
      .populate('term', 'name startDate endDate')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details'
    });
  }
};

/**
 * POST /add
 * Add new course
 */
exports.postAddCourse = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      school,
      department,
      term,
      credits,
      teachers
    } = req.body;

    // Validation
    if (!name || !code || !school) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, and school are required'
      });
    }

    // Check for duplicate course code in the same school
    const existingCourse = await Course.findOne({ code, school });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'A course with this code already exists in this school'
      });
    }

    const course = new Course({
      name,
      code,
      description,
      school,
      department,
      term,
      credits: credits || 0,
      teachers: teachers || [],
      createdBy: req.session.user._id
    });

    await course.save();

    res.json({
      success: true,
      message: 'Course created successfully',
      course_id: course._id
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course'
    });
  }
};

/**
 * POST /update
 * Update course
 */
exports.updateCourse = async (req, res) => {
  try {
    const {
      course_id,
      name,
      code,
      description,
      department,
      term,
      credits
    } = req.body;

    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update fields
    if (name) course.name = name;
    if (code) course.code = code;
    if (description !== undefined) course.description = description;
    if (department) course.department = department;
    if (term) course.term = term;
    if (credits !== undefined) course.credits = credits;

    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course'
    });
  }
};

/**
 * POST /delete
 * Delete course
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course has content
    const contentCount = await Content.countDocuments({ course: course_id });
    if (contentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course with ${contentCount} content items. Delete content first.`
      });
    }

    await Course.findByIdAndDelete(course_id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
};

// ========== COURSE TEACHERS ==========

/**
 * GET /teachers/:course_id
 * Get teachers for course
 */
exports.getCourseTeachers = async (req, res) => {
  try {
    const { course_id } = req.params;

    const course = await Course.findById(course_id)
      .populate('teachers', 'name email profile_picture role')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      teachers: course.teachers || []
    });
  } catch (error) {
    console.error('Error fetching course teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers'
    });
  }
};

/**
 * POST /teacher/assign
 * Assign teacher to course
 */
exports.assignTeacherToCourse = async (req, res) => {
  try {
    const { course_id, teacher_id } = req.body;

    if (!course_id || !teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and Teacher ID are required'
      });
    }

    const [course, teacher] = await Promise.all([
      Course.findById(course_id),
      User.findById(teacher_id)
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if teacher is already assigned
    if (course.teachers && course.teachers.includes(teacher_id)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is already assigned to this course'
      });
    }

    // Add teacher to course
    if (!course.teachers) course.teachers = [];
    course.teachers.push(teacher_id);
    await course.save();

    res.json({
      success: true,
      message: 'Teacher assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning teacher'
    });
  }
};

/**
 * POST /teacher/remove
 * Remove teacher from course
 */
exports.removeTeacherFromCourse = async (req, res) => {
  try {
    const { course_id, teacher_id } = req.body;

    if (!course_id || !teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and Teacher ID are required'
      });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Remove teacher from course
    course.teachers = course.teachers.filter(
      t => t.toString() !== teacher_id
    );
    await course.save();

    res.json({
      success: true,
      message: 'Teacher removed successfully'
    });
  } catch (error) {
    console.error('Error removing teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing teacher'
    });
  }
};

// ========== COURSE CONTENT ==========

/**
 * GET /contents/:course_id
 * Get course contents list
 */
exports.getCourseContents = async (req, res) => {
  try {
    const { course_id } = req.params;

    const contents = await Content.find({ course: course_id })
      .populate('unit', 'name order')
      .populate('createdBy', 'name')
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      contents
    });
  } catch (error) {
    console.error('Error fetching course contents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contents'
    });
  }
};

/**
 * GET /statistics/:course_id
 * Get course statistics
 */
exports.getCourseStatistics = async (req, res) => {
  try {
    const { course_id } = req.params;

    const [course, contentCount, unitCount] = await Promise.all([
      Course.findById(course_id).lean(),
      Content.countDocuments({ course: course_id }),
      Unit.countDocuments({ course: course_id })
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const stats = {
      totalContents: contentCount,
      totalUnits: unitCount,
      teacherCount: course.teachers ? course.teachers.length : 0,
      credits: course.credits || 0
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching course statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

// ========== COURSE SETTINGS ==========

/**
 * POST /settings/update
 * Update course settings
 */
exports.updateCourseSettings = async (req, res) => {
  try {
    const {
      course_id,
      settings
    } = req.body;

    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update settings
    if (settings) {
      course.settings = { ...course.settings, ...settings };
    }

    await course.save();

    res.json({
      success: true,
      message: 'Course settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating course settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
};

/**
 * POST /term/change
 * Change course term
 */
exports.changeCourseTerm = async (req, res) => {
  try {
    const { course_id, term_id } = req.body;

    if (!course_id || !term_id) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and Term ID are required'
      });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.term = term_id;
    await course.save();

    res.json({
      success: true,
      message: 'Course term changed successfully'
    });
  } catch (error) {
    console.error('Error changing course term:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing term'
    });
  }
};