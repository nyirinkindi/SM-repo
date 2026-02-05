/**
 * controllers/university.js
 * University management controller
 */

const University = require('../models/University');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const User = require('../models/User');
const log_err = require('./manage/errorLogger');

/**
 * GET /dashboard/universities
 * Render universities list page (similar to school.pug)
 */
exports.getUniversityListPage = (req, res) => {
  try {
    res.render('university/list', {
      title: 'Universities',
      user: req.session.user,
      pic_id: req.session.user._id,
      pic_name: req.session.user.name.replace('\'', "\\'"),
      access_lvl: req.session.user.access_level,
      csrf_token: res.locals.csrftoken,
      page: 'universities'
    });
  } catch (error) {
    console.error('Error rendering universities page:', error);
    res.status(500).render('error', {
      message: 'Error loading universities page',
      user: req.session.user
    });
  }
};

/**
 * GET /university/list
 * Get universities list as JSON (for AngularJS)
 */
exports.getUniversityList_JSON = async (req, res) => {
  try {
    const universities = await University.find()
      .select('name code description district_name cover_photo logo admin_mail numFaculties numDepartments numStudents numUsers term_name term_quantity isActive')
      .populate('admin_id', 'name email')
      .sort({ created_at: -1 })
      .lean();

    console.log(`📚 Fetched ${universities.length} universities`);
    
    res.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json([]);
  }
};

/**
 * GET /university/:university_id
 * Get single university details
 */
exports.getUniversityDetails = async (req, res) => {
  try {
    const { university_id } = req.params;

    const university = await University.findById(university_id)
      .populate('admin_id', 'name email profile_pic')
      .populate('faculties')
      .lean();

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    // Get faculties with their departments
    const faculties = await Faculty.find({ university_id })
      .populate('dean_id', 'name email')
      .lean();

    res.json({
      success: true,
      university,
      faculties
    });
  } catch (error) {
    console.error('Error fetching university details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching university details'
    });
  }
};

/**
 * POST /university/add
 * Create new university
 */
exports.postAddUniversity = async (req, res) => {
  try {
    req.assert('name', 'University name is required').notEmpty().len(1, 200);
    req.assert('code', 'University code is required').notEmpty().len(1, 20);
    req.assert('term_name', 'Term type is required').isIn(['S', 'T']);
    req.assert('term_quantity', 'Term quantity must be between 1 and 4').isInt({ min: 1, max: 4 });

    const errors = req.validationErrors();
    if (errors) return res.status(400).send(errors[0].msg);

    // Check if code already exists
    const existingUniversity = await University.findOne({ 
      code: req.body.code.toUpperCase() 
    });
    
    if (existingUniversity) {
      return res.status(400).send('A university with this code already exists');
    }

    const university = new University({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      description: req.body.description,
      district_name: req.body.district_name,
      location: req.body.location,
      cover_photo: req.body.cover_photo,
      logo: req.body.logo,
      admin_mail: req.body.admin_mail,
      phone_number: req.body.phone_number,
      website: req.body.website,
      term_name: req.body.term_name,
      term_quantity: req.body.term_quantity,
      admin_id: req.body.admin_id || null,
      createdBy: req.session.user._id
    });

    await university.save();

    console.log(`✅ University created: ${university.name} (${university.code})`);

    res.json({
      success: true,
      message: 'University created successfully',
      university_id: university._id
    });
  } catch (error) {
    console.error('Error creating university:', error);
    return log_err(error, false, req, res);
  }
};

/**
 * POST /university/update
 * Update university
 */
exports.updateUniversity = async (req, res) => {
  try {
    req.assert('university_id', 'University ID is required').isMongoId();

    const errors = req.validationErrors();
    if (errors) return res.status(400).send(errors[0].msg);

    const university = await University.findById(req.body.university_id);
    if (!university) {
      return res.status(404).send('University not found');
    }

    // Update fields
    if (req.body.name) university.name = req.body.name;
    if (req.body.description !== undefined) university.description = req.body.description;
    if (req.body.district_name) university.district_name = req.body.district_name;
    if (req.body.location) university.location = req.body.location;
    if (req.body.cover_photo) university.cover_photo = req.body.cover_photo;
    if (req.body.logo) university.logo = req.body.logo;
    if (req.body.admin_mail) university.admin_mail = req.body.admin_mail;
    if (req.body.phone_number) university.phone_number = req.body.phone_number;
    if (req.body.website) university.website = req.body.website;
    if (req.body.term_name) university.term_name = req.body.term_name;
    if (req.body.term_quantity) university.term_quantity = req.body.term_quantity;

    await university.save();

    console.log(`✅ University updated: ${university.name}`);

    res.json({
      success: true,
      message: 'University updated successfully'
    });
  } catch (error) {
    console.error('Error updating university:', error);
    return log_err(error, false, req, res);
  }
};

/**
 * POST /university/delete
 * Delete university
 */
exports.deleteUniversity = async (req, res) => {
  try {
    req.assert('university_id', 'University ID is required').isMongoId();

    const errors = req.validationErrors();
    if (errors) return res.status(400).send(errors[0].msg);

    const university = await University.findById(req.body.university_id);
    if (!university) {
      return res.status(404).send('University not found');
    }

    // Check if university has faculties
    const facultyCount = await Faculty.countDocuments({ university_id: req.body.university_id });
    if (facultyCount > 0) {
      return res.status(400).send(`Cannot delete university with ${facultyCount} faculties. Delete faculties first.`);
    }

    await University.findByIdAndDelete(req.body.university_id);

    console.log(`✅ University deleted: ${university.name}`);

    res.json({
      success: true,
      message: 'University deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting university:', error);
    return log_err(error, false, req, res);
  }
};

/**
 * POST /university/admin/assign
 * Assign admin to university
 */
exports.assignUniversityAdmin = async (req, res) => {
  try {
    req.assert('university_id', 'University ID is required').isMongoId();
    req.assert('admin_id', 'Admin ID is required').isMongoId();

    const errors = req.validationErrors();
    if (errors) return res.status(400).send(errors[0].msg);

    const [university, admin] = await Promise.all([
      University.findById(req.body.university_id),
      User.findById(req.body.admin_id)
    ]);

    if (!university) return res.status(404).send('University not found');
    if (!admin) return res.status(404).send('Admin not found');

    // Check if user has admin privileges
    if (admin.access_level > 2) {
      return res.status(400).send('User must have admin privileges');
    }

    university.admin_id = req.body.admin_id;
    await university.save();

    console.log(`✅ Admin assigned to university: ${admin.name} -> ${university.name}`);

    res.json({
      success: true,
      message: 'Admin assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning admin:', error);
    return log_err(error, false, req, res);
  }
};

/**
 * GET /university/:university_id/faculties
 * Get faculties for a university
 */
exports.getFacultiesByUniversity = async (req, res) => {
  try {
    const { university_id } = req.params;

    const faculties = await Faculty.find({ university_id })
      .populate('dean_id', 'name email')
      .sort({ name: 1 })
      .lean();

    res.json(faculties);
  } catch (error) {
    console.error('Error fetching faculties:', error);
    res.status(500).json([]);
  }
};

/**
 * POST /faculty/add
 * Create new faculty
 */
exports.postAddFaculty = async (req, res) => {
  try {
    req.assert('name', 'Faculty name is required').notEmpty().len(1, 200);
    req.assert('code', 'Faculty code is required').notEmpty().len(1, 20);
    req.assert('university_id', 'University ID is required').isMongoId();

    const errors = req.validationErrors();
    if (errors) return res.status(400).send(errors[0].msg);

    // Check if code exists in this university
    const existingFaculty = await Faculty.findOne({
      code: req.body.code.toUpperCase(),
      university_id: req.body.university_id
    });

    if (existingFaculty) {
      return res.status(400).send('A faculty with this code already exists in this university');
    }

    const faculty = new Faculty({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      description: req.body.description,
      university_id: req.body.university_id,
      dean_id: req.body.dean_id || null,
      cover_photo: req.body.cover_photo,
      email: req.body.email,
      phone_number: req.body.phone_number,
      office_location: req.body.office_location,
      createdBy: req.session.user._id
    });

    await faculty.save();

    // Update university's faculties array
    await University.findByIdAndUpdate(req.body.university_id, {
      $push: { faculties: faculty._id },
      $inc: { numFaculties: 1 }
    });

    console.log(`✅ Faculty created: ${faculty.name} (${faculty.code})`);

    res.json({
      success: true,
      message: 'Faculty created successfully',
      faculty_id: faculty._id
    });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return log_err(error, false, req, res);
  }
};

/**
 * POST /department/add
 * Create new department
 */
exports.postAddDepartment = async (req, res) => {
  try {
    req.assert('name', 'Department name is required').notEmpty().len(1, 200);
    req.assert('code', 'Department code is required').notEmpty().len(1, 20);
    req.assert('faculty_id', 'Faculty ID is required').isMongoId();

    const errors = req.validationErrors();
    if (errors) return res.status(400).send(errors[0].msg);

    // Get faculty to get university_id
    const faculty = await Faculty.findById(req.body.faculty_id);
    if (!faculty) return res.status(404).send('Faculty not found');

    // Check if code exists in this faculty
    const existingDepartment = await Department.findOne({
      code: req.body.code.toUpperCase(),
      faculty_id: req.body.faculty_id
    });

    if (existingDepartment) {
      return res.status(400).send('A department with this code already exists in this faculty');
    }

    const department = new Department({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      description: req.body.description,
      faculty_id: req.body.faculty_id,
      university_id: faculty.university_id,
      head_id: req.body.head_id || null,
      cover_photo: req.body.cover_photo,
      email: req.body.email,
      phone_number: req.body.phone_number,
      office_location: req.body.office_location,
      term_name: req.body.term_name || faculty.term_name || 'S',
      term_quantity: req.body.term_quantity || 2,
      createdBy: req.session.user._id
    });

    await department.save();

    // Update faculty's departments array
    await Faculty.findByIdAndUpdate(req.body.faculty_id, {
      $push: { departments: department._id },
      $inc: { numDepartments: 1 }
    });

    // Update university's department count
    await University.findByIdAndUpdate(faculty.university_id, {
      $inc: { numDepartments: 1 }
    });

    console.log(`✅ Department created: ${department.name} (${department.code})`);

    res.json({
      success: true,
      message: 'Department created successfully',
      department_id: department._id
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return log_err(error, false, req, res);
  }
};

/**
 * GET /faculty/:faculty_id/departments
 * Get departments for a faculty
 */
exports.getDepartmentsByFaculty = async (req, res) => {
  try {
    const { faculty_id } = req.params;

    const departments = await Department.find({ faculty_id })
      .populate('head_id', 'name email')
      .sort({ name: 1 })
      .lean();

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json([]);
  }
};