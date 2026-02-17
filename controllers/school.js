const passport = require('passport');
const School = require('../models/School');
const User = require('../models/User');
const SchoolCourse = require('../models/SchoolCourse');
const SchoolProgram = require('../models/SchoolProgram');
const Unit = require('../models/Unit');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Content = require('../models/Content');
const Marks = require('../models/MARKS');
const Util = require("../utils");
const Notification = require('../models/Notification');
const Classe = require('../models/Classe');
const Finalist = require('../models/Finalist');
const Message = require('../models/Message');
const log_err = require('./manage/errorLogger');

// ========== HELPER FUNCTIONS ==========

function checkArray(array, attr, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][attr] === value) {
      return true;
    }
  }
  return false;
}

// ========== SCHOOL PAGES ==========

exports.getPageSchool = function(req, res, next) {
  return res.redirect("/school/" + req.user.school_id);
};
/**
 * Fixed homepageSchool function with better error handling
 * Replace the existing function in controllers/school.js
 */
exports.homepageSchool = async function(req, res, next) {
  console.log('ðŸ« homepageSchool called with params:', req.params);
  console.log('ðŸ” school_id:', req.params.school_id);
  
  // Validate school ID
  req.assert('school_id', 'Invalid Data').isMongoId();
  const errors = req.validationErrors();
  
  if (errors) {
    console.error('âŒ Validation errors:', errors);
    return res.render("./lost", { msg: errors[0].msg });
  }

  try {
    console.log('ðŸ”Ž Looking for school with ID:', req.params.school_id);
    
    const school = await School.findOne({ _id: req.params.school_id });
    
    if (!school) {
      console.error('âŒ School not found:', req.params.school_id);
      return res.render("./lost", { msg: "School not found" });
    }
    
    console.log('âœ… School found:', school.name);
    console.log('ðŸ‘¤ User school_id:', req.user.school_id);
    console.log('ðŸ‘¤ User access_level:', req.user.access_level);
    console.log('ðŸ« School _id:', school._id);
    
    // Check if user belongs to this school (only for non-super admins)
    const ACCESS_LEVELS = req.app.locals.access_level;
    if (req.user.access_level > ACCESS_LEVELS.ADMIN_TEACHER) {
      if (String(school._id) !== String(req.user.school_id)) {
        console.error('âŒ User does not belong to this school');
        return res.render("./lost", { msg: "This is not your school" });
      }
    }

    // Determine effective access level for template
    // Super admins get admin-teacher level privileges when viewing schools
    let effectiveAccessLevel = req.user.access_level;
    if (req.user.access_level === ACCESS_LEVELS.SUPERADMIN) {
      effectiveAccessLevel = ACCESS_LEVELS.ADMIN_TEACHER;
      console.log('ðŸ”“ Super admin viewing school - granting admin-teacher privileges');
    }

    console.log('âœ… Rendering school page for:', school.name);
    
    return res.render('school/view_classes', {
      title: school.name,
      school_id: String(school._id),  // âœ… CHANGED: Convert ObjectId to string
      school_name: school.name,
      term_name: school.term_name,
      pic_id: String(req.user._id),   // âœ… CHANGED: Convert ObjectId to string
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: effectiveAccessLevel,
      actual_access_lvl: req.user.access_level,
      is_super_admin: req.user.access_level === ACCESS_LEVELS.SUPERADMIN,
      student_class: req.user.class_id ? String(req.user.class_id) : '',  // âœ… CHANGED: Convert to string with null check
      csrf_token: res.locals.csrftoken,
    });
  } catch (err) {
    console.error('âŒ Error in homepageSchool:', err);
    return log_err(err, true, req, res);
  }
};

exports.getSettingSchoolPage = async function(req, res, next) {
  req.assert('school_id', 'Invalid Data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const school = await School.findOne({ _id: req.params.school_id });
    if (!school) return res.render("./lost", { msg: "Invalid data" });

    return res.render('dashboard/school_setting', {
      title: school.name,
      school_id: school._id,
      school_name: school.name,
      school_profile: school.cover_photo,
      school_po_box: school.contact.postal_code,
      school_phone: school.contact.telephone,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch (err) {
    return log_err(err, true, req, res);
  }
};

// ========== SCHOOL PROFILE ==========

exports.getSchoolProfile = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  const picture_location = process.env.SCHOOL_PIC_PATH;
  if (errors) return res.sendFile(picture_location + "/schoo_default.png");

  try {
    const schoolExists = await School.findOne({ _id: req.params.school_id });
    let img_path = schoolExists && schoolExists.cover_photo ? schoolExists.cover_photo : "schoo_default.png";
    let file_location = picture_location + "/" + img_path;
    
    const fs = require("fs").promises;
    try {
      await fs.access(file_location, require("fs").constants.F_OK | require("fs").constants.R_OK);
    } catch {
      file_location = picture_location + "/schoo_default.png";
    }
    return res.sendFile(file_location);
  } catch (err) {
    console.log("Error picture " + err);
    return res.sendFile(picture_location + "/schoo_default.png");
  }
};

exports.displayProfile = async function(req, res, next) {
  try {
    const school = await School.findOne({ _id: req.user.school_id });
    if (!school) return res.render("./lost", { msg: "Invalid data" });

    return res.render('profile/create_profile', {
      title: 'Create Profile',
      access_lvl: req.user.access_level,
      email: req.user.email,
      school_id: req.user.school_id,
      school: school,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      csrf_token: res.locals.csrftoken,
    });
  } catch (err) {
    return log_err(err, true, req, res);
  }
};

exports.createSchoolProfile = async function(req, res, next) {
  req.assert('school_fees', 'Amount must a number and not empty').notEmpty().isFloat();
  req.assert('school_years', 'Years of studies must be 1 to 6').isIn([1, 2, 3, 4, 5, 6]);
  req.assert('school_desc', 'A small description is required').notEmpty();
  req.assert('school_curr', 'Select curriculum').notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const schoolExists = await School.findOne({ _id: req.user.school_id });
    if (!schoolExists) return res.render("./lost", { msg: "Invalid data" });

    schoolExists.average_school_fees = req.body.school_fees;
    schoolExists.years = req.body.school_years;
    schoolExists.combinations = req.body.school_faculties;
    schoolExists.description = req.body.school_desc;
    schoolExists.curriculum = req.body.school_curr;
    schoolExists.additional_information = req.body.school_info;
    schoolExists.stories.success_stories = req.body.school_stor;
    schoolExists.stories.icons = req.body.school_peop;
    schoolExists.other_programs = req.body.school_prog;
    schoolExists.contact.website = req.body.school_site;
    schoolExists.contact.address = req.body.school_addr;
    schoolExists.contact.telephone = req.body.school_tel;
    schoolExists.contact.postal_code = req.body.school_code;
    schoolExists.student_requirements = req.body.school_requ;

    await schoolExists.save();
    return res.end();
  } catch (err) {
    console.log('My errors: ' + JSON.stringify(err));
    return log_err(err, true, req, res);
  }
};

exports.changeSchoolProfile = (req, res, next) => {
  const multer = require('multer');
  const MB = 1024 * 1024;
  const imgMaxSize = 1 * MB;
  let img_extension;
  let img_name;
  
  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      img_extension = "." + file.originalname.split('.').pop();
      img_name = require('mongodb').ObjectID();
      cb(null, process.env.SCHOOL_PIC_PATH);
    },
    filename: function(req, file, cb) {
      cb(null, img_name + img_extension);
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: imgMaxSize },
    fileFilter: (req, file, cb) => {
      console.log(" File before saving" + JSON.stringify(file));
      if (!file.mimetype.startsWith("image/")) return cb("Sorry, only images are accepted");
      return cb(null, true);
    },
  }).single('school_pic');

  upload(req, res, async (uploadErr) => {
    if (uploadErr) return res.render("./lost", { msg: uploadErr });

    try {
      const schoolExists = await School.findOne({ _id: req.body.school_id });
      if (!schoolExists) return res.render("./lost", { msg: "Invalid data" });

      const oldPic = schoolExists.cover_photo;
      schoolExists.cover_photo = img_name + img_extension;
      
      await schoolExists.save();
      
      if ((oldPic !== schoolExists.cover_photo) && oldPic) {
        const fileToDelete = process.env.SCHOOL_PIC_PATH + "/" + oldPic;
        require("fs").promises.unlink(fileToDelete)
          .then(() => console.log("===>>Success AKIMANA "))
          .catch((err) => console.log("===>>DELETION ERROR " + err));
      }
      return res.redirect("back");
    } catch (err) {
      return log_err(err, true, req, res);
    }
  });
};

exports.addSchoolInfo = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  req.assert('phone', 'Enter phone number').notEmpty();
  req.assert('po_box', 'Enter P.O Box').notEmpty();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const schoolExists = await School.findOne({ _id: req.body.school_id });
    if (!schoolExists) return res.render("./lost", { msg: "Invalid data" });

    schoolExists.contact.telephone = req.body.phone;
    schoolExists.contact.postal_code = req.body.po_box;
    await schoolExists.save();
    return res.end();
  } catch (err) {
    return log_err(err, true, req, res);
  }
};

// ========== SCHOOL CRUD ==========

exports.postNewSchool = async function(req, res, next) {
  req.assert('name', 'The name is required').notEmpty();
  req.assert('term_name', 'Choose parts name ').isIn(['S', 'T']);
  req.assert('term_quantity', 'Choose valid parts number').isInt({ min: 1, max: 10 });
  req.assert('description', 'A small description is required').notEmpty();
  req.assert('district_name', 'District is required').notEmpty();
  req.assert('retake_marks', 'Marks after retaking are required').isFloat({ min: 0, max: 100 });
  req.assert('category', 'Category is required').isIn([1, 2, 3]);
  req.assert('genderness', 'Gender category is required').isIn([1, 2, 3]);
  req.assert('partnership', 'Partnership is required').isIn([1, 2, 3]);
  req.assert('institution', 'Choose the institution').isIn([1, 2, 3, 4]);

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  if (req.body.department_id) req.body.institution = 1;

  try {
    const school_exists = await School.checkSchoolExists(req.body);
    if (school_exists) return res.status(400).send("This name is already taken");

    const nouveauSchool = new School({
      name: req.body.name,
      cover_photo: req.body.cover_photo || "http://www.debaterwanda.org/wp-content/uploads/2014/02/schools_lndc.png",
      description: req.body.description,
      district_name: req.body.district_name,
      term_quantity: req.body.term_quantity,
      term_name: req.body.term_name,
      retake_marks: req.body.retake_marks,
      category: req.body.category,
      genderness: req.body.genderness,
      partnership: req.body.partnership,
      institution: req.body.institution,
      isInternational: req.body.isInternational,
      department_id: req.body.department_id,
    });

    await nouveauSchool.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.deleteWholeSchool = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  req.assert('confirmPass', 'Super admin password is required to do this action').notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const user_exists = await User.findOne({ _id: req.user._id });
    if (!user_exists) return res.status(400).send("Invalid data");

    const isMatch = await new Promise((resolve, reject) => {
      user_exists.comparePassword(req.body.confirmPass, req.user.email, (err, match) => {
        if (err) reject(err);
        else resolve(match);
      });
    });

    if (!isMatch) return res.status(400).send("Password is incorrect");

    const school_exists = await School.findOne({ _id: req.body.school_id });
    if (!school_exists) return res.status(400).send("Invalid data");

    await Promise.all([
      Classe.deleteMany({ school_id: school_exists._id }),
      Course.deleteMany({ school_id: school_exists._id }),
      User.deleteMany({ school_id: school_exists._id })
    ]);

    await school_exists.deleteOne();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.removeSchool = async function(req, res, next) {
  req.assert('school_id', 'Invalid data').isMongoId();
  req.assert('confirmPass', 'Super admin password is required to do this action').notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const user_exists = await User.findOne({ _id: req.user._id });
    if (!user_exists) return res.status(400).send("Invalid data");

    const isMatch = await new Promise((resolve, reject) => {
      user_exists.comparePassword(req.body.confirmPass, req.user.email, (err, match) => {
        if (err) reject(err);
        else resolve(match);
      });
    });

    if (!isMatch) return res.status(400).send("Password is incorrect");

    const school_exists = await School.findOne({ _id: req.body.school_id });
    if (!school_exists) return res.status(400).send("Invalid data");

    const [num_courses, num_classes, num_units, num_contents, num_users] = await Promise.all([
      Course.countDocuments({ school_id: req.body.school_id }),
      Classe.countDocuments({ school_id: req.body.school_id }),
      Unit.countDocuments({ school_id: req.body.school_id }),
      Content.countDocuments({ school_id: req.body.school_id }),
      User.countDocuments({ school_id: req.body.school_id })
    ]);

    if (num_classes > 0) return res.status(400).send('There is ' + num_classes + ' classes in this school <br/> Delete them first');
    if (num_units > 0) return res.status(400).send('There is ' + num_units + ' units in this school <br/> Delete them first');
    if (num_courses > 0) return res.status(400).send('There is ' + num_courses + ' courses in this school <br/> Delete them first');
    if (num_contents > 0) return res.status(400).send('There is ' + num_contents + ' content in this school <br/> Delete them first');
    if (num_users > 0) return res.status(400).send('There is ' + num_users + ' users in this school <br/> Delete them first');

    await school_exists.deleteOne();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== SCHOOL LISTS ==========
exports.getSchool_JSON = async (req, res) => {
  try {
    console.log('ðŸ“š Fetching schools list...');
    console.log('   User:', req.user.email);
    console.log('   Access Level:', req.user.access_level);
    
    // âœ… CORRECTED: Fetch only actual schools (institution = 2)
    // institution: 1 = Departments/Options
    // institution: 2 = Actual Schools
    const schools = await School.find({
      institution: 2  // âœ… Only actual schools
    })
      .select('name cover_photo description district_name term_quantity term_name retake_marks category genderness partnership institution admin_mail numUsers')
      .sort({ name: 1 })
      .lean();

    console.log(`âœ… Returning ${schools.length} schools`);
    
    // Log sample for debugging
    if (schools.length > 0) {
      console.log('ðŸ“‹ Sample school:', {
        name: schools[0].name,
        id: schools[0]._id,
        institution: schools[0].institution
      });
    }
    
    res.json(schools);
  } catch (error) {
    console.error('âŒ Error fetching schools:', error);
    res.status(500).json([]);
  }
};

exports.getSchool_BySearch = async (req, res, next) => {
  try {
    const schools = await School.find({ name: /req.params.name/ }, { __v: 0 });
    console.log(" sending back " + JSON.stringify(schools));
    return res.json(schools);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};
exports.getSchool_DashboardJSON = async (req, res) => {
  try {
    console.log('ðŸ“‹ Rendering schools list dashboard');
    console.log('   User:', req.user.email);
    console.log('   Access Level:', req.user.access_level);
    
    const ACCESS_LEVELS = req.app.locals.access_level;
    
    // Render the schools LIST page (not a single school page)
    res.render('school/schools_list', {
      title: 'Schools Dashboard',
      user: req.user,
      page: 'schools',
      pic_id: String(req.user._id),
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      is_super_admin: req.user.access_level === ACCESS_LEVELS.SUPERADMIN,
      csrf_token: res.locals.csrftoken
    });
  } catch (error) {
    console.error('âŒ Error rendering schools page:', error);
    res.status(500).render('error', {
      message: 'Error loading schools page',
      user: req.user
    });
  }
};
exports.getDepartments_JSON = async (req, res) => {
  try {
    console.log('ðŸ›ï¸ Fetching departments list...');
    
    // âœ… CORRECTED: Fetch only departments/options (institution = 1)
    const departments = await School.find({
      institution: 1  // âœ… Only departments/options
    })
      .select('name cover_photo description district_name term_quantity category institution numUsers partnership department_id')
      .sort({ name: 1 })
      .lean();

    console.log(`âœ… Returning ${departments.length} departments`);
    
    res.json(departments);
  } catch (error) {
    console.error('âŒ Error fetching departments:', error);
    res.status(500).json([]);
  }
};
exports.getDepartment_JSON = async function(req, res, next) {
  req.assert('fac_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const schools = await School.find({ faculty_id: req.body.fac_id, institution: 1 }, { __v: 0 });
    return res.json(schools);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getOptions_JSON = async function(req, res, next) {
  req.assert('department_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const schools = await School.find({ department_id: req.params.department_id, institution: 1 }, { __v: 0 });
    return res.json(schools);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== SCHOOL COURSES & PROGRAMS ==========

exports.postSchoolCourse = async function(req, res, next) {
  req.assert('name', 'The name is required').notEmpty();
  req.assert('school_id', 'Invalid data').isMongoId();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);
  if (req.user.access_level > req.app.locals.access_level.ADMIN_TEACHER) {
    return res.status(400).send("Sorry you are not authorized");
  }

  try {
    const school_exists = await School.findOne({ _id: req.body.school_id });
    if (!school_exists) return res.status(400).send("This school doesn't exists ");

    const school_course_exists = await SchoolCourse.checkCourseExists(req.body);
    if (school_course_exists) return res.status(400).send("This course is registered");

    const nouveauCourse = new SchoolCourse({
      name: req.body.name,
      school_id: req.body.school_id,
    });

    await nouveauCourse.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.deleteSchoolCourse = async (req, res, next) => {
  req.assert('course_id', 'Invalid data').isMongoId();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const course_exists = await SchoolCourse.findOne({ _id: req.body.course_id });
    if (!course_exists) return res.status(400).send("Invalid data");
    if (String(req.user.school_id) !== String(course_exists.school_id)) {
      return res.status(400).send("Not authorized to do this");
    }

    await course_exists.deleteOne();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.postSchoolProgram = async function(req, res, next) {
  req.assert('abbreviation', 'The abbreviation is required');
  req.assert('name', 'The name is required').notEmpty();
  req.assert('school_id', 'Invalid data').isMongoId();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);
  if (req.user.access_level > req.app.locals.access_level.ADMIN_TEACHER) {
    return res.status(400).send("Sorry you are not authorized");
  }

  try {
    const school_exists = await School.findOne({ _id: req.body.school_id });
    if (!school_exists) return res.status(400).send("This school doesn't exists ");

    const school_program_exists = await SchoolProgram.checkProgramExists(req.body);
    if (school_program_exists) return res.status(400).send("This program is registered");

    const nouveauProgram = new SchoolProgram({
      name: req.body.name,
      school_id: req.body.school_id,
      abbreviation: req.body.abbreviation
    });

    await nouveauProgram.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.deleteSchoolProgram = async (req, res, next) => {
  req.assert('program_id', 'Invalid data').isMongoId();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const program_exists = await SchoolProgram.findOne({ _id: req.body.program_id });
    if (!program_exists) return res.status(400).send("Invalid data");
    if (String(req.user.school_id) !== String(program_exists.school_id)) {
      return res.status(400).send("Not authorized to do this");
    }

    await program_exists.deleteOne();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getSchoolProgram_JSON = async function(req, res, next) {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school_programs = await SchoolProgram
      .find({ school_id: req.params.school_id }, { __v: 0, school_id: 0 })
      .sort({ name: 1 });
    return res.json(school_programs);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getSchoolCourseAndProgram_JSON = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const [programs, courses] = await Promise.all([
      SchoolProgram.find({ school_id: req.params.school_id }, { __v: 0, school_id: 0 }).sort({ name: 1 }),
      SchoolCourse.find({ school_id: req.params.school_id }, { __v: 0, school_id: 0 }).sort({ name: 1 })
    ]);

    return res.json({ programs, courses });
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== STUDENTS ==========

exports.addNewStudent = async (req, res, next) => {
  req.assert('names', 'Type student names').notEmpty();
  req.assert('email', 'Type the email').notEmpty();
  req.assert('gender', 'Invalid data(gender)').isIn([1, 2]);
  req.assert('class_id', 'No class selected').isMongoId();
  req.assert('school_id', 'Invalid data').isMongoId();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const schoolExists = await School.findOne({ _id: req.body.school_id });
    if (!schoolExists) return res.status(400).send(' Invalid data');

    const number = await User.countDocuments();
    let userURN = Util.generate_URN(number);
    const user_urn = await User.findOne({ URN: userURN });
    if (user_urn) userURN = Util.generate_URN(number);

    const email = req.body.email.toLowerCase().trim();
    const name = req.body.names.toLowerCase().trim();
    const URN = userURN.toLowerCase().trim();

    const resultats = await User.aggregate([
      { $match: { email: email } },
      { $group: { _id: { email: "$email" } } },
      { $limit: 1 }
    ]);

    if (resultats.length > 0 && resultats[0]._id.email === email) {
      return res.status(400).send('This email is already registered');
    }

    const newUser = new User({
      name: req.body.names,
      email: email,
      URN: URN,
      password: "MyEshuri",
      school_id: req.body.school_id,
      department_id: req.body.department_id,
      phone_number: req.body.phone_number,
      access_level: req.app.locals.access_level.STUDENT,
      gender: req.body.gender,
      isEnabled: false,
      class_id: req.body.class_id
    });

    await newUser.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getPageStudents = async (req, res, next) => {
  req.assert('school_id', 'Invalid Data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const school = await School.findOne({ _id: req.params.school_id });
    if (!school) return res.render("./lost", { msg: "Invalid data" });

    const school_name = school.name.split(' ').map((item) => item[0]).join('').toUpperCase();
    
    return res.render('school/view_students', {
      title: school_name + ' students',
      school_id: req.params.school_id,
      school_name: school.name,
      term_name: school.term_name,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      student_class: req.user.class_id,
      csrf_token: res.locals.csrftoken,
    });
  } catch (err) {
    return log_err(err, true, req, res);
  }
};

exports.getStudents_JSON = async (req, res, next) => {
  req.assert('school_id', 'Invalid Data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school = await School.findOne({ _id: req.body.school_id });
    if (!school) return res.status(400).send('Invalid data');

    const class_prefix = school.term_name === 'T' ? 'S' : 'Y';
    const students_list = await User
      .find(
        { school_id: req.body.school_id, access_level: req.app.locals.access_level.STUDENT },
        { __v: 0, password: 0, gender: 0, isValidated: 0, upload_time: 0, updatedAt: 0 }
      )
      .sort({ name: 1 })
      .lean();

    for (const thisStudent of students_list) {
      const classe = await Classe.findOne({ _id: thisStudent.class_id });
      thisStudent.classe = classe ? class_prefix + classe.name.toUpperCase() : 'Alumnus';
    }

    return res.json(students_list);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.editStudent = async (req, res, next) => {
  req.assert('student_id', 'Invalid data').isMongoId();
  req.assert('name', 'Enter name please').notEmpty();
  req.assert('email', 'Enter email please').notEmpty();
  req.assert('admin_pass', 'Enter your password').notEmpty();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const userExists = await User.findOne({ email: req.user.email });
    if (!userExists) return res.status(400).send("System dont know you");

    const isMatch = await new Promise((resolve, reject) => {
      userExists.comparePassword(req.body.admin_pass, req.user.email, (err, match) => {
        if (err) reject(err);
        else resolve(match);
      });
    });

    if (!isMatch) return res.status(400).send("The password entered is incorrect!");

    const userDetails = await User.findOne({ _id: req.body.student_id });
    if (!userDetails) return res.status(400).send("Unknown user");
    if (userDetails.email === req.user.email) return res.status(400).send("Change your password using platform setting");
    if (userDetails.access_level <= req.user.access_level) return res.status(400).send("User password has not reset");

    await new Notification({
      user_id: req.body.student_id,
      user_name: userDetails.name,
      content: "Your password has reset to " + req.app.locals.defaultPwd + ". Please change it as long as you access the platform",
      school_id: userDetails.school_id,
      isAuto: false,
    }).save().catch((err) => console.log(" You have to log " + err));

    userDetails.name = req.body.name;
    userDetails.email = userDetails.email;
    userDetails.password = req.app.locals.defaultPwd;
    await userDetails.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.removeStudent = async function(req, res, next) {
  req.assert('student_id', 'Invalid data').isMongoId();
  req.assert('confirmPass', 'Password to confirm is necessary').notEmpty();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const user_exists = await User.findOne({ _id: req.user._id });
    if (!user_exists) return res.status(400).send("Invalid data");

    const isMatch = await new Promise((resolve, reject) => {
      user_exists.comparePassword(req.body.confirmPass, req.user.email, (err, match) => {
        if (err) reject(err);
        else resolve(match);
      });
    });

    if (!isMatch) return res.status(400).send("Password is incorrect");

    const studentExists = await User.findOne({ 
      _id: req.body.student_id, 
      access_level: req.app.locals.access_level.STUDENT 
    });
    if (!studentExists) return res.status(400).send('Invalid data');

    const profile_pic = process.env.PROFILE_PIC_PATH + "/" + studentExists.profile_pic;
    const hasProfilPic = studentExists.profile_pic;

    await Marks.deleteMany({ student_id: req.body.student_id });
    await studentExists.deleteOne();

    if (hasProfilPic) {
      require('fs').promises.unlink(profile_pic).catch(() => {});
    }
    
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== TEACHERS & ADMINS ==========

exports.dissociateTeacher = async function(req, res, next) {
  req.assert('teacher_id', 'Invalid data').isMongoId();
  req.assert('course_id', 'Invalid data').isMongoId();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const courseExists = await Course.findOne({ _id: req.body.course_id });
    if (!courseExists) return res.status(400).send('Data is not valid');

    const newTeacherList = courseExists.teacher_list.filter(
      teacher => teacher !== req.body.teacher_id
    );

    courseExists.teacher_list = newTeacherList;
    await courseExists.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.removeTeacher = async function(req, res, next) {
  req.assert('teacher_id', 'Invalid data').isMongoId();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const teacher_exists = await User.findOne({ _id: req.body.teacher_id });
    if (!teacher_exists) return res.status(400).send("Invalid data");
    if (String(req.user.school_id) !== String(teacher_exists.school_id)) {
      return res.status(400).send("This is not your school");
    }

    teacher_exists.school_id = null;
    await teacher_exists.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.setTeacherAsAdmin = async function(req, res, next) {
  req.assert('teacher_id', 'Invalid data').isMongoId();
  req.assert('school_id', 'Invalid data').isMongoId();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const teacher_exists = await User.findOne({ 
      school_id: req.body.school_id, 
      access_level: req.app.locals.access_level.TEACHER, 
      _id: req.body.teacher_id 
    });
    if (!teacher_exists) {
      return res.status(400).send(" This email doesn't match an existing teacher");
    }

    teacher_exists.access_level = req.app.locals.access_level.ADMIN_TEACHER;
    await teacher_exists.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.setAdminAsTeacher = async function(req, res, next) {
  req.assert('admin_id', 'Invalid data').isMongoId();
  req.assert('school_id', 'Invalid data').isMongoId();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);
  if (String(req.body.admin_id) === String(req.user._id)) {
    return res.status(400).send("You cannot remove yourself");
  }

  try {
    const admin_exists = await User.findOne({ 
      school_id: req.body.school_id, 
      $or: [
        { access_level: req.app.locals.access_level.ADMIN }, 
        { access_level: req.app.locals.access_level.ADMIN_TEACHER }
      ], 
      _id: req.body.admin_id 
    });

    if (!admin_exists) {
      return res.status(400).send(" This email doesn't match an existing administrator");
    }
    if (admin_exists.access_level <= req.user.access_level) {
      return res.status(400).send(" You cannot move this person");
    }

    admin_exists.access_level = req.app.locals.access_level.TEACHER;
    await admin_exists.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.updateSuperAdmin = async (req, res, next) => {
  req.assert('admin_mail', 'An email is required').isEmail();
  req.assert('school_id', 'Invalid data').isMongoId();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);
  if (req.body.admin_mail === req.user.email) {
    return res.status(400).send("You cannot change yourself! ;)");
  }
  if (String(req.user.access_level) !== req.app.locals.access_level.SUPERADMIN) {
    return res.status(400).send("You are not allowed");
  }

  try {
    const school_exists = await School.findOne({ _id: req.body.school_id });
    if (!school_exists) return res.status(400).send("Invalid data");
    if (school_exists.institution < 2) return res.status(400).send("This is not the way to do it");

    const user_exists = await User.findOne({ email: req.body.admin_mail });
    if (!user_exists) return res.status(400).send("This email is not yet registered");

    user_exists.access_level = req.app.locals.access_level.SA_SCHOOL;
    user_exists.isEnabled = true;
    user_exists.isValidated = true;
    user_exists.school_id = req.body.school_id;
    await user_exists.save();

    school_exists.admin_mail = req.body.admin_mail;
    await school_exists.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.setHeadOfDepartment = async (req, res, next) => {
  req.assert('admin_mail', 'An email is required').isEmail();
  req.assert('department_id', 'Invalid data').isMongoId();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);
  if (req.body.admin_mail === req.user.email) {
    return res.status(400).send("You cannot change yourself! ;)");
  }
  if (String(req.user.access_level) !== req.app.locals.access_level.SUPERADMIN) {
    return res.status(400).send("You are not allowed");
  }

  try {
    const departList = await Department.find({ admin_mail: req.body.admin_mail });
    if (departList.length > 0) {
      return res.status(400).send("This email is already used in Department " + departList[0].name);
    }

    const depart_exists = await Department.findOne({ _id: req.body.department_id });
    if (!depart_exists) return res.status(400).send("Department not recognized");

    const oldHOD_mail = depart_exists.admin_mail;

    const user_exists = await User.findOne({ email: req.body.admin_mail });
    if (!user_exists) return res.status(400).send("This email is not yet registered");
    if (user_exists.access_level < req.user.access_level) {
      return res.status(400).send("Impossible to use this email" + req.user.access_level);
    }

    user_exists.access_level = req.app.locals.access_level.HOD;
    user_exists.isEnabled = true;
    user_exists.isValidated = true;
    user_exists.department_id = req.body.department_id;
    await user_exists.save();

    await School.updateMany(
      { department_id: req.body.department_id }, 
      { $set: { admin_mail: req.body.admin_mail } }
    );

    depart_exists.admin_mail = req.body.admin_mail;
    await depart_exists.save();

    const oldHOD = await User.findOne({ email: oldHOD_mail });
    if (oldHOD) {
      oldHOD.access_level = req.app.locals.access_level.TEACHER;
      await oldHOD.save();
    }

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== FINALISTS ==========

exports.getPageFinalists = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school = await School.findOne({ _id: req.params.school_id });
    if (!school) return res.render("./lost", { msg: 'Service not available' });

    return res.render('dashboard/view_finalist_user', {
      title: 'Alumni',
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      school_name: school.name,
      term_name: school.term_name,
      school_id: req.params.school_id,
      csrf_token: res.locals.csrftoken
    });
  } catch (err) {
    return res.render("./lost", { msg: 'Service not available' });
  }
};

exports.getAllFinalists = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const all_finalists = await Finalist.find({ school_id: req.params.school_id }).lean();

    for (const thisfinalist of all_finalists) {
      const user_details = await User.findOne({ _id: thisfinalist.student_id });
      if (user_details) {
        const gender = (user_details.gender === 1) ? 'Male' : 'Female';
        thisfinalist.name = user_details.name;
        thisfinalist.user_id = user_details._id;
        thisfinalist.classes = user_details.prev_classes;
        thisfinalist.phone = user_details.phone_number;
        thisfinalist.urn = user_details.URN;
        thisfinalist.gender = gender;
      }
    }

    return res.json(all_finalists);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== LISTS & DATA ==========

exports.getUserClasses = async (req, res, next) => {
  req.assert('school_id', 'Invalid Data').isMongoId();
  
  if (req.query.u && req.query.allow) {
    req.assert('u', 'Invalid data u').isMongoId();
    req.assert('allow', 'Invalid data a').equals('true');
  }
  
  const errors = req.validationErrors();
  if (errors) {
    console.error('âŒ Validation errors in getUserClasses:', errors);
    return res.status(400).json({ error: errors[0].msg });
  }

  const userId = req.query.u ? req.query.u : req.user._id;
  
  console.log('ðŸ“‹ getUserClasses called:');
  console.log('  - School ID:', req.params.school_id);
  console.log('  - User ID:', userId);
  console.log('  - User Access Level:', req.user.access_level);
  
  try {
    // âœ… Convert callback to Promise-based approach
    const classes = await new Promise((resolve, reject) => {
      Util.listClasses(req, userId, (err, classes) => {
        if (err) {
          console.error('âŒ Error from listClasses:', err);
          reject(err);
        } else {
          console.log('âœ… Classes returned:', classes ? classes.length : 0);
          resolve(classes);
        }
      });
    });
    
    // âœ… ALWAYS return JSON, never HTML
    return res.json(classes || []);
    
  } catch (err) {
    console.error('âŒ Error in getUserClasses:', err);
    // âœ… Return JSON error, not HTML
    return res.status(400).json({ error: err.toString() });
  }
};
exports.getCoursesList = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  req.assert('currentTerm', 'Invalid data').notEmpty();
  
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const courses_list = await Course.find({ 
      class_id: req.body.class_id, 
      currentTerm: req.body.currentTerm 
    });
    return res.json(courses_list);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getAdminsList = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const admins_list = await User.find(
      { 
        school_id: req.body.school_id, 
        access_level: { $lte: req.app.locals.access_level.ADMIN_TEACHER } 
      },
      { 
        __v: 0, password: 0, gender: 0, class_id: 0, school_id: 0, 
        isEnabled: 0, isValidated: 0, upload_time: 0, updatedAt: 0 
      }
    );
    return res.json(admins_list);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getTeachersList = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const teachers_list = await User.find(
      { 
        school_id: req.params.school_id, 
        $or: [
          { access_level: req.app.locals.access_level.TEACHER },
          { access_level: req.app.locals.access_level.ADMIN_TEACHER }
        ]
      },
      { 
        __v: 0, password: 0, gender: 0, class_id: 0, school_id: 0, 
        isValidated: 0, upload_time: 0, updatedAt: 0 
      }
    ).sort({ name: 1 });

    return res.json(teachers_list);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getStudentsList = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const students_list = await User.find(
      { 
        class_id: req.body.class_id, 
        access_level: req.app.locals.access_level.STUDENT 
      },
      { 
        __v: 0, password: 0, gender: 0, isValidated: 0, 
        upload_time: 0, updatedAt: 0 
      }
    ).sort({ name: 1 });

    return res.json(students_list);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getUsersSchool = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    if (req.user.access_level === 5) {
      const usersList = await User.find(
        { 
          school_id: req.params.school_id, 
          access_level: 3, 
          _id: { $ne: req.user._id }, 
          isEnabled: true 
        },
        { 
          __v: 0, email: 0, password: 0, gender: 0, phone_number: 0, 
          class_id: 0, school_id: 0, isEnabled: 0, isValidated: 0, 
          upload_time: 0, updatedAt: 0 
        }
      );
      return res.json(usersList);
    } else {
      const usersList = await User.find(
        { 
          school_id: req.params.school_id, 
          _id: { $ne: req.user._id }, 
          isEnabled: true 
        },
        { 
          __v: 0, email: 0, password: 0, gender: 0, phone_number: 0, 
          class_id: 0, school_id: 0, isEnabled: 0, isValidated: 0, 
          upload_time: 0, updatedAt: 0 
        }
      ).sort({ name: 1 }).lean();

      for (const thisUser of usersList) {
        const msg_number = await Message.countDocuments({ 
          conv_id: Util.getConv_id(req.user._id, thisUser._id), 
          isRead: false 
        });
        
        thisUser.unReads = msg_number;
        thisUser.hasMsg = msg_number > 0;
      }

      return res.json(usersList);
    }
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getTeacherAndAdminSchool = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const AdminTeachersList = await User.find(
      {
        school_id: req.params.school_id,
        access_level: { $lte: req.app.locals.access_level.TEACHER },
        _id: { $ne: req.user._id },
        isEnabled: true
      },
      { 
        __v: 0, email: 0, password: 0, gender: 0, phone_number: 0, 
        class_id: 0, school_id: 0, isEnabled: 0, isValidated: 0, 
        upload_time: 0, updatedAt: 0 
      }
    );
    return res.json(AdminTeachersList);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

exports.getSchoolData = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const schoolId = req.params.school_id;
    const linkParams = req.user.access_level === req.app.locals.access_level.SUPERADMIN 
      ? '?s=' + schoolId + '&allow=true' 
      : '';

    const school_exists = await School.findOne({ _id: schoolId });
    if (!school_exists) return res.status(400).send("School not found");

    const program_name = school_exists.term_name === 'T' ? 'Combinations' : 'Programs';
    
    const theData = [
      { list: [] },
      { 
        infos: {
          term_name: school_exists.term_name,
          term_quantity: school_exists.term_quantity,
          name: school_exists.name
        }
      }
    ];

    const [
      newAccountsCount,
      classe_list,
      num_teachers,
      num_admins,
      num_students,
      num_school_courses,
      num_school_programs,
      num_finalists
    ] = await Promise.all([
      User.countDocuments({ school_id: schoolId, isEnabled: false }),
      Classe.find({ school_id: schoolId }, { school_id: 0, __v: 0 }).sort({ name: 1 }),
      User.countDocuments({ 
        school_id: schoolId, 
        $or: [
          { access_level: req.app.locals.access_level.TEACHER }, 
          { access_level: req.app.locals.access_level.ADMIN_TEACHER }
        ]
      }),
      User.countDocuments({ 
        school_id: schoolId, 
        access_level: { $lte: req.app.locals.access_level.ADMIN_TEACHER } 
      }),
      User.countDocuments({ 
        school_id: schoolId, 
        access_level: req.app.locals.access_level.STUDENT, 
        class_id: { $ne: null } 
      }),
      SchoolCourse.countDocuments({ school_id: schoolId }),
      SchoolProgram.countDocuments({ school_id: schoolId }),
      Finalist.countDocuments({ school_id: schoolId })
    ]);

    theData.push({ classes: classe_list });

    theData[0].list.push(
      { type: 'New accounts to confirm', number: newAccountsCount, url: '/dashboard.accounts.validation' + linkParams, icon: 'verified_user' },
      { type: 'Teachers', number: num_teachers, url: '/dashboard.teachers/' + schoolId + linkParams, icon: 'person' },
      { type: 'Administrators', number: num_admins, url: '/dashboard.admins/' + schoolId + linkParams, icon: 'supervisor_account' },
      { type: 'Students', number: num_students, url: '/school.students/' + schoolId + linkParams, icon: 'person' },
      { type: 'Courses', number: num_school_courses, url: '/dashboard.register.course/' + schoolId + linkParams, icon: 'class' },
      { type: program_name, number: num_school_programs, url: '/dashboard.register.course/' + schoolId + linkParams, icon: 'class' },
      { type: 'Alumni', number: num_finalists, url: '/finalists/' + schoolId + linkParams, icon: 'person' }
    );

    if (req.user.access_level === req.app.locals.access_level.SUPERADMIN) {
      theData[0].list.push({ type: 'Report', number: null, url: '/report' + linkParams });
    }

    return res.json(theData);
  } catch (err) {
    return log_err(err, false, req, res);
  }
  // Add this at the end of your school controller
exports.debugSchoolsList = async (req, res) => {
  try {
    // Get ALL schools regardless of institution type
    const allSchools = await School.find({}, { name: 1, institution: 1 });
    
    // Get only non-department schools
    const regularSchools = await School.find({ institution: { $gt: 1 } }, { name: 1, institution: 1 });
    
    return res.json({
      total: allSchools.length,
      allSchools: allSchools,
      regularSchools: regularSchools,
      message: "If regularSchools is empty but allSchools has data, your schools might all be institution:1 (departments)"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
};