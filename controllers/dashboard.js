const School = require('../models/School');
const Classe = require('../models/Classe');
const Course = require('../models/Course');
const Content = require('../models/Content');
const Library = require('../models/Library');
const Marks = require('../models/MARKS');
const University = require('../models/University');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Unit = require('../models/Unit');
const SchoolCourse = require('../models/SchoolCourse');
const SchoolProgram = require('../models/SchoolProgram');
const Util = require('../utils.js');
const User = require('../models/User');
const Finalist = require('../models/Finalist');
const ErrorLog = require('../models/ErrorLog');
const log_err = require('./manage/errorLogger');

// ========== MAIN DASHBOARD PAGES ==========

exports.getHomePageDashboard = function(req, res, next) {
  let link = "";
  switch(req.user.access_level) {
    case req.app.locals.access_level.SUPERADMIN: 
      break;
    case req.app.locals.access_level.HOD:
    case req.app.locals.access_level.SA_SCHOOL: 
    case req.app.locals.access_level.ADMIN_TEACHER:
    case req.app.locals.access_level.ADMIN: 
      link = "/dashboard/classe/" + req.user.school_id;
      break;
    default: 
      break;
  }
  
  if(link !== "") return res.redirect(link);

  return res.render('dashboard/general', {
    title: 'Dashboard',
    pic_id: req.user._id,
    pic_name: req.user.name.replace('\'', "\\'"),
    access_lvl: req.user.access_level,
    csrf_token: res.locals.csrftoken,
  });
};

// ========== SCHOOLS MANAGEMENT PAGE ==========

exports.getPageSchoolsList = async (req, res, next) => {
  try {
    console.log('ðŸ“‹ Super Admin accessing schools list');
    console.log('   User:', req.user.email);
    console.log('   Access Level:', req.user.access_level);
    
    // Get schools statistics - âœ… CORRECTED
    const [totalSchools, totalStudents, totalTeachers, schoolsWithIssues] = await Promise.all([
      School.countDocuments({ institution: 2 }),  // âœ… CHANGED: Only actual schools
      User.countDocuments({ access_level: req.app.locals.access_level.STUDENT, isEnabled: true }),
      User.countDocuments({ 
        $or: [
          { access_level: req.app.locals.access_level.TEACHER },
          { access_level: req.app.locals.access_level.ADMIN_TEACHER }
        ],
        isEnabled: true 
      }),
      School.countDocuments({ institution: 2, numUsers: { $lt: 10 } })  // âœ… CHANGED
    ]);

    return res.render('dashboard/view_schools', {
      title: 'Schools Management',
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      is_super_admin: req.user.access_level === req.app.locals.access_level.SUPERADMIN,
      csrf_token: res.locals.csrftoken,
      stats: {
        totalSchools,
        totalStudents,
        totalTeachers,
        schoolsWithIssues
      }
    });
  } catch (error) {
    console.error('âŒ Error rendering schools list page:', error);
    return res.render('./lost', { 
      msg: 'Failed to load schools management page' 
    });
  }
};

exports.getDashboardPage = (req, res, next) => {
  const superAdmin = req.app.locals.access_level.SUPERADMIN;
  const school_dir = req.app.locals.access_level.SA_SCHOOL;
  const accLvl = req.user.access_level;
  
  if(accLvl === school_dir) {
    return res.redirect('/school.dashboard.home/' + req.user.school_id);
  }
  return res.redirect("back");
};

// ========== STATISTICS ==========

exports.getPageDashboardStats = async (req, res) => {
  try {
    const [
      classes,
      users,
      courses,
      schools,  // âœ… This should count only institution: 2
      univs,
      faculties,
      units,
      errors_num,
      accounts_to_validate
    ] = await Promise.all([
      Classe.countDocuments(),
      User.countDocuments(),
      Course.countDocuments(),
      School.countDocuments({ institution: 2 }),  // âœ… CHANGED: Only actual schools
      University.countDocuments(),
      Faculty.countDocuments(),
      Unit.countDocuments(),
      ErrorLog.countDocuments(),
      User.countDocuments({ school_id: req.user.school_id, isEnabled: false })
    ]);

    return res.send({
      univs,
      faculties,
      schools,
      classes,
      courses,
      units,
      users,
      errors_num,
      toValidate: accounts_to_validate,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.getDirectorStats = async (req, res, next) => {
  try {
    const student = req.app.locals.access_level.STUDENT;
    const admin = req.app.locals.access_level.ADMIN;
    const teacher = req.app.locals.access_level.TEACHER;
    const admin_teacher = req.app.locals.access_level.ADMIN_TEACHER;

    const [
      students_male,
      students_fem,
      admins_male,
      admins_fem,
      teachers_male,
      teachers_fem,
      courses,
      programs,
      classes_ol,
      classes_al
    ] = await Promise.all([
      User.countDocuments({ school_id: req.user.school_id, isEnabled: true, access_level: student, gender: 1 }),
      User.countDocuments({ school_id: req.user.school_id, isEnabled: true, access_level: student, gender: 2 }),
      User.countDocuments({ school_id: req.user.school_id, isEnabled: true, $or: [{ access_level: admin }, { access_level: admin_teacher }], gender: 1 }),
      User.countDocuments({ school_id: req.user.school_id, isEnabled: true, $or: [{ access_level: admin }, { access_level: admin_teacher }], gender: 2 }),
      User.countDocuments({ school_id: req.user.school_id, isEnabled: true, access_level: teacher, gender: 1 }),
      User.countDocuments({ school_id: req.user.school_id, isEnabled: true, access_level: teacher, gender: 2 }),
      SchoolCourse.countDocuments({ school_id: req.user.school_id }),
      SchoolProgram.countDocuments({ school_id: req.user.school_id }),
      Classe.countDocuments({ school_id: req.user.school_id, $or: [{ option: null }, { option: '' }] }),
      Classe.countDocuments({ school_id: req.user.school_id, option: { $ne: null } })
    ]);

    const response = {
      students_male,
      students_fem,
      admins_male,
      admins_fem,
      teachers_male,
      teachers_fem,
      courses,
      programs,
      classes_ol,
      classes_al
    };

    console.log('API Stats:', JSON.stringify(response));
    return res.json(response);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== SCHOOL PAGES ==========

exports.getPageSchools = function(req, res, next) {
  return res.render('dashboard/add_school', {
    title: 'Dashboard',
    pic_id: req.user._id,
    pic_name: req.user.name.replace('\'', "\\'"),
    access_lvl: req.user.access_level,
    csrf_token: res.locals.csrftoken,
  });
};

exports.getSchoolRedirection = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  const school_id = req.params.school_id;

  try {
    const school_exists = await School.findOne({ _id: school_id });
    if(!school_exists) return res.render("./lost", { msg: "Unknown school" });

    const student = req.app.locals.access_level.STUDENT;
    const admin = req.app.locals.access_level.ADMIN;
    const teacher = req.app.locals.access_level.TEACHER;
    const admin_teacher = req.app.locals.access_level.ADMIN_TEACHER;

    const [
      students_male,
      students_fem,
      admins_male,
      admins_fem,
      teachers_male,
      teachers_fem,
      courses,
      programs,
      classes_ol,
      classes_al,
      finalists
    ] = await Promise.all([
      User.countDocuments({ school_id, isEnabled: true, access_level: student, gender: 1 }),
      User.countDocuments({ school_id, isEnabled: true, access_level: student, gender: 2 }),
      User.countDocuments({ school_id, isEnabled: true, access_level: { $lte: req.app.locals.access_level.ADMIN_TEACHER }, gender: 1 }),
      User.countDocuments({ school_id, isEnabled: true, access_level: { $lte: req.app.locals.access_level.ADMIN_TEACHER }, gender: 2 }),
      User.countDocuments({ school_id, isEnabled: true, access_level: teacher, gender: 1 }),
      User.countDocuments({ school_id, isEnabled: true, access_level: teacher, gender: 2 }),
      SchoolCourse.countDocuments({ school_id }),
      SchoolProgram.countDocuments({ school_id }),
      Classe.countDocuments({ school_id, $or: [{ option: { $exists: false } }, { option: "" }] }),
      Classe.countDocuments({ school_id, option: { $exists: true, $ne: "" } }),
      Finalist.countDocuments({ school_id })
    ]);

    const response = {
      students_male,
      students_fem,
      admins_male,
      admins_fem,
      teachers_male,
      teachers_fem,
      courses,
      programs,
      classes_ol,
      classes_al,
      finalists
    };

    return res.render('dashboard/director_dashboard', {
      title: 'Dashboard',
      info: response,
      school_id,
      school_name: school_exists.name.toUpperCase(),
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return res.render('/lost', { msg: 'Service not available' });
  }
};

exports.getPageUpdateSchool = async function(req, res, next) {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const school_exists = await School.findOne({ _id: req.params.school_id });
    if(!school_exists) return res.status(400).send('Sorry invalid data');

    return res.render('dashboard/add_classe', {
      title: 'Classes',
      term_quantity: school_exists.term_quantity,
      school_id: req.params.school_id,
      term_name: school_exists.term_name,
      department_id: req.user.access_level === req.app.locals.access_level.HOD ? req.user.department_id : null,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== UNIVERSITY PAGES ==========

exports.getPageUniversities = function(req, res, next) {
  return res.render('dashboard/add_university', {
    title: 'Universities',
    pic_id: req.user._id,
    pic_name: req.user.name.replace('\'', "\\'"),
    access_lvl: req.user.access_level,
    csrf_token: res.locals.csrftoken,
  });
};

exports.getAvailableUniversities = async (req, res, next) => {
  try {
    const list = await University.find({}, { __v: 0 });
    return res.json(list);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== FACULTY PAGES ==========

exports.getPageFaculties = async function(req, res, next) {
  req.assert('univ_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: "Invalid data" });

  try {
    const univ_exists = await University.findOne({ _id: req.params.univ_id });
    if(!univ_exists) return res.render("./lost", { msg: "University not recognized" });

    return res.render('dashboard/add_faculty', {
      title: 'Faculties',
      univ_name: univ_exists.name,
      univ_id: univ_exists._id,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.getAvailableFaculties = async (req, res, next) => {
  req.assert('univ_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(500).send(errors[0].msg);

  try {
    const list = await Faculty.find({ univ_id: req.params.univ_id }, { __v: 0 });
    return res.json(list);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== DEPARTMENT PAGES ==========

exports.getPageDepartments = async function(req, res, next) {
  req.assert('fac_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const fac_exists = await Faculty.findOne({ _id: req.params.fac_id });
    if(!fac_exists) return res.render("./lost", { msg: "Faculty not recognized" });

    return res.render('dashboard/add_department', {
      title: 'Departments',
      fac_id: req.params.fac_id,
      fac_name: fac_exists.name,
      pic_id: req.user._id,
      univ_id: fac_exists.univ_id,      
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.getAvailableDepartments = async (req, res, next) => {
  req.assert('faculty_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(500).send(errors[0].msg);

  try {
    const list = await Department.find({ fac_id: req.params.faculty_id }, { __v: 0 });
    return res.json(list);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== OPTIONS PAGES ==========

exports.getPageOptions = async function(req, res, next) {
  req.assert('department_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const department_exists = await Department.findOne({ _id: req.params.department_id });
    if(!department_exists) return res.render("./lost", { msg: "Department not recognized" });

    return res.render('dashboard/add_option', {
      title: 'Options',
      department_id: req.params.department_id,
      department_name: department_exists.name,
      pic_id: req.user._id,
      univ_id: department_exists.univ_id,      
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.getAvailableOptions = async (req, res, next) => {
  req.assert('department_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(500).send(errors[0].msg);

  try {
    const list = await School.find(
      { department_id: req.params.department_id, institution: 1 },
      { __v: 0 }
    );
    return res.json(list);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== CLASS PAGES ==========

exports.getPageClasse = async (req, res, next) => {
  req.assert('classe_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const myClass = await Classe.findOne({ _id: req.params.classe_id });
    if(!myClass) return res.redirect("back");

    const mySchool = await School.findOne({ _id: myClass.school_id });
    if(!mySchool) return res.redirect("back");

    return res.render('dashboard/add_course', {
      title: 'Courses',
      classe_id: req.params.classe_id,
      school_id: myClass.school_id,
      classe_name: myClass.name,
      institution: mySchool.institution,
      academic_year: myClass.academic_year,
      currentTerm: myClass.currentTerm,
      school_name: mySchool.name,
      term_name: mySchool.term_name,
      term_quantity: mySchool.term_quantity,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, true, req, res);
  }
};

exports.getAvailableClasses = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(500).send(errors[0].msg);

  try {
    const list = await Classe.find({ school_id: req.params.school_id }, { __v: 0 });
    return res.json(list);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.getPageRegisterCourse = async (req, res) => {
  try {
    const school_exists = await School.findOne({ _id: req.params.school_id });
    if(!school_exists) return log_err(null, true, req, res);

    const npgs = req.app.locals.per_pages;
    return res.render('dashboard/register_course', {
      title: 'Register courses',
      school_id: school_exists._id,
      school_name: school_exists.name,
      term_name: school_exists.term_name,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      n_pages: npgs,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, true, req, res);
  }
};

// ========== TEACHER PAGES ==========

exports.getPageTeachers = async function(req, res, next) {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const school_exists = await School.findOne({ _id: req.params.school_id });
    if(!school_exists) return res.render("./lost", { msg: "School not recognized" });

    return res.render('dashboard/view_teacher', {
      title: 'Teachers',
      school_name: school_exists.name,
      school_id: req.params.school_id,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== ADMIN PAGES ==========

exports.getPageAdmins = async function(req, res, next) {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const school_exists = await School.findOne({ _id: req.params.school_id });
    if(!school_exists) return res.render("./lost", { msg: "School not recognized" });

    return res.render('dashboard/add_admin', {
      title: 'Administrators',
      school_id: req.params.school_id,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.postNewAdmin = async (req, res, next) => {
  req.assert('email', 'Student\'s email is required').isEmail();
  req.assert('school_id', 'Data is invalid').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school_exists = await School.findOne({ _id: req.body.school_id });
    if(!school_exists) return res.status(400).send("This school is not recognized");

    const user_exists = await User.findOne({ email: req.body.email, school_id: req.body.school_id });
    if(!user_exists) return res.status(400).send("User not found");

    user_exists.access_level = 2;
    await user_exists.save();
    return res.end();
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== STUDENT PAGES ==========

exports.getPageStudents = async function(req, res, next) {
  req.assert('class_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: errors[0].msg });

  try {
    const class_exists = await Classe.findOne({ _id: req.params.class_id });
    if(!class_exists) return res.render("./lost", { msg: "This class is not recognized" });

    const school_exists = await School.findOne({ _id: class_exists.school_id });
    if(!school_exists) return res.render("./lost", { msg: "School not recognized" });

    return res.render('dashboard/view_student', {
      title: 'Students',
      class_id: req.params.class_id,
      level: class_exists.level,
      classe_name: class_exists.name,
      academic_year: class_exists.academic_year,
      school_id: school_exists._id,
      term_name: school_exists.term_name,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, true, req, res);
  }
};

exports.studentSetPaid = async (req, res, next) => {
  req.assert('student_id', 'Invalid user').isMongoId();
  req.assert('hasPaid', 'Invalid user').isBoolean();
  const errors = req.validationErrors();
  if(errors) return res.status(400).send(errors[0].msg);

  try {
    const userOk = await User.findOneAndUpdate(
      { _id: req.body.student_id, access_level: req.app.locals.access_level.STUDENT },
      { $set: { hasPaid: req.body.hasPaid } },
      { new: true }
    );
    return res.json(userOk.hasPaid);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== ACCOUNT CONFIRMATION ==========

exports.getPageConfirmAccounts = async function(req, res, next) {
  try {
    const school_exists = await School.findOne({ _id: req.user.school_id });
    if(!school_exists) return res.render("./lost", { msg: "Your school is not recognized" });

    return res.render('dashboard/confirm_accounts', {
      title: 'Accounts confirmations',
      school_name: school_exists.name,
      term_name: school_exists.term_name,
      school_id: school_exists._id,
      level_student: req.app.locals.access_level.STUDENT,
      level_teacher: req.app.locals.access_level.TEACHER,
      pic_id: req.user._id,
      pic_name: req.user.name.replace('\'', "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.getAccountsValidate_JSON = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return log_err(errors, false, req, res);

  try {
    const list = await User.find(
      { school_id: req.body.school_id, isEnabled: false },
      { __v: 0, password: 0, school_id: 0, isValidated: 0 }
    );
    return res.json(list);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.confirmTeacherAccount = async function(req, res, next) {
  req.assert("teacher_id", "Invalid data").isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(500).send(errors[0].msg);

  try {
    await User.updateOne(
      { _id: req.body.teacher_id, school_id: req.user.school_id },
      { $set: { isEnabled: true } }
    );
    return res.end();
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.confirmStudentAccount = async function(req, res, next) {
  req.assert("student_id", "Invalid data").isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(500).send(errors[0].msg);

  try {
    await User.updateOne(
      { 
        _id: req.body.student_id, 
        school_id: req.user.school_id, 
        access_level: req.app.locals.access_level.STUDENT 
      },
      { $set: { isEnabled: true } }
    );
    return res.end();
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== CONTENT MANAGEMENT ==========

exports.getAllConts = async (req, res, next) => {
  req.assert('course_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: "Invalid data" });

  try {
    const contents = await Content.find({ course_id: req.body.course_id });
    return res.json(contents);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

// ========== DEBUG/UTILITY ENDPOINTS ==========

exports.Ssg3nSAwdtAztx79dLGb = (req, res, next) => {
  return res.render('dashboard/Ssg3nSAwdtAztx79dLGb', {
    title: 'Dashboard',
    pic_id: req.user._id,
    pic_name: req.user.name.replace('\'', "\\'"),
    access_lvl: req.user.access_level,
    csrf_token: res.locals.csrftoken,
  });
};

exports.Ssg3nSAwdtAztx79dLGbPost = async (req, res, next) => {
  const school_id = "595647b43e5ea452049f2aa4";
  const class_id = "595cb10d83bef46aa6cc31be";
  
  try {
    const allterms = await Course.find({ class_id });
    return res.json(allterms);
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.Ssg3nSAwdtAztx79dLGbDelete = async (req, res, next) => {
  const userid = req.body.user_id;
  
  try {
    const user = await Library.findOne({ _id: userid });
    if(!user) return log_err(null, false, req, res);

    const { promises: fs } = require("fs");
    try { await fs.unlink(user.bookName); } catch { console.log("FILE NOT DELETED!"); }

    await Library.deleteOne({ _id: userid });
    return res.end();
  } catch(err) {
    return log_err(err, false, req, res);
  }
};

exports.Ssg3nSAwdtAztx79dLGbUpdate = async (req, res, next) => {
  req.assert('content', 'Invalid data').isMongoId();
  req.assert('term', 'Term invalid').isInt();
  const errors = req.validationErrors();
  if (errors) return res.render("./lost", { msg: "Invalid data" });

  const content = req.body.content;
  const this_term = req.body.term;

  try {
    await Content.updateMany({ _id: content }, { $set: { currentTerm: this_term } });
    await Marks.updateMany({ content_id: content }, { $set: { currentTerm: this_term } });
    return res.end();
  } catch(err) {
    return log_err(err, false, req, res);
  }
};