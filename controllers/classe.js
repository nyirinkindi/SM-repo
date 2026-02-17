const Classe = require('../models/Classe');
const Course = require('../models/Course');
const User = require('../models/User');
const School = require('../models/School');
const Mark = require('../models/MARKS');
const Notification = require('../models/Notification');
const Content = require('../models/Content');
const log_err = require('./manage/errorLogger');
const Finalist = require('../models/Finalist');
const Util = require('../utils.js');
const SchoolProgram = require('../models/SchoolProgram');

/*
Une classe est par exemple S2MCE pour le High school ou 3rd Year in Universities
*/

// ========== CREATE CLASS ==========

exports.postNewClass = async (req, res, next) => {
  const classLevel = req.body.level;
  req.assert('school_id', 'Invalid data').notEmpty().isMongoId();
  req.assert('class_teacher', 'Invalid data').notEmpty().isMongoId();
  req.assert('level', 'A level must be a number').isInt();
  req.assert('name', 'A name is required').notEmpty();
  req.assert('currentTerm', 'Sorry, specify a term').isInt();
  if (classLevel > 3) req.assert('option', 'Select option').notEmpty();

  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school = await School.findOne({ _id: req.body.school_id });
    if (!school) return res.status(500).send("This school doesn't exist");
    if (req.body.currentTerm > school.term_quantity)
      return res.status(400).send("Sorry term must be lower than " + school.term_quantity);

    const classe_exists = await Classe.findOne({
      name: req.body.name.trim().toLowerCase(),
      school_id: req.body.school_id
    });
    if (classe_exists) return res.status(400).send("This class is already registered");

    req.body.option = req.body.option === null ? '' : req.body.option;
    req.body.sub_level = req.body.sub_level ? req.body.sub_level : '';

    const newClass = new Classe({
      school_id: req.body.school_id,
      level: req.body.level,
      name: req.body.name,
      academic_year: Number(new Date().getFullYear()) - 2000,
      class_teacher: req.body.class_teacher,
      currentTerm: req.body.currentTerm,
      option: req.body.option,
      sub_level: req.body.sub_level,
    });

    await newClass.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== GET CLASSES (JSON) ==========

exports.getClasses_JSON = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  const access_lvl = String(req.user.access_level);
  const superadmin = String(req.app.locals.access_level.SUPERADMIN);
  let school_id;

  if (access_lvl === superadmin) {
    school_id = req.params.school_id;
  } else {
    if (String(req.params.school_id) !== String(req.user.school_id))
      return res.status(400).send("This is not your school");
    school_id = req.user.school_id;
  }

  try {
    const classes = await Classe.find({ school_id }, { __v: 0 }).sort({ name: 1 }).lean();

    // Count students for each class in parallel
    await Promise.all(
      classes.map(async (currentClass) => {
        currentClass.students = await User.countDocuments({ class_id: currentClass._id });
      })
    );

    return res.json(classes);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== GET SINGLE CLASS PAGE ==========

exports.getPageOneClasse = async (req, res, next) => {
  req.assert('classe_id', 'Invalid data').isMongoId();

  if (req.query.u || req.query.allow) {
    req.assert('u', 'Invalid data u').isMongoId();
    req.assert('allow', 'Invalid data a').equals('true');
  }

  const errors = req.validationErrors();
  if (errors) return res.render('./lost', { msg: errors[0].msg });

  const date = new Date();
  const year = parseInt(date.getFullYear()) - 2000;

  if (!req.query.ay || req.query.ay < 17 || req.query.ay > year)
    return res.render('./lost', { msg: 'Invalid data' });

  const query = req.query.u && req.query.allow
    ? '?ay=' + req.query.ay + '&u=' + req.query.u + '&allow=true'
    : '?ay=' + req.query.ay;

  try {
    const classe_exists = await Classe.findOne({ _id: req.params.classe_id });
    if (!classe_exists) return res.render('./lost', { msg: "This class doesn't exist" });

    const first_letter = classe_exists.name.toLowerCase().charAt(0);
    const class_name = first_letter === 's' ? classe_exists.name : 's' + classe_exists.name;

    const school_exists = await School.findOne({ _id: classe_exists.school_id });
    if (!school_exists) return res.render('./lost', { msg: "This school doesn't exist" });

    let user = {};
    if (req.query.u && req.query.allow) {
      const userExists = await User.findOne({ _id: req.query.u });
      if (!userExists) return res.render('./lost', { msg: "This user doesn't exist" });
      user = userExists;
    }

    const subHeader = user.name
      ? user.name.replace("'", "\\'") + '->' + class_name.toUpperCase()
      : class_name.toUpperCase();

    return res.render('school/one_class_view', {
      title: class_name.toUpperCase(),
      school_id: classe_exists.school_id,
      school_name: school_exists.name,
      academic_year: req.query.ay,
      userid: req.query.u || '',
      subhead: subHeader,
      term_name: school_exists.term_name,
      term_quantity: school_exists.term_quantity,
      class_id: req.params.classe_id,
      query,
      currentTerm: classe_exists.currentTerm,
      pic_id: req.user._id,
      access_lvl: req.user.access_level,
      pic_name: req.user.name.replace("'", "\\'"),
      csrf_token: res.locals.csrftoken,
    });
  } catch (err) {
    return log_err(err, true, req, res);
  }
};

// ========== GET CLASS COURSES ==========

exports.getClassCourses = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  if (req.query.u && req.query.allow) {
    req.assert('u', 'Invalid data u').isMongoId();
    req.assert('allow', 'Invalid data a').equals('true');
  }
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const courses = await new Promise((resolve, reject) => {
      Util.listCourses(req, (err, courses) => {
        if (err) reject(err);
        else resolve(courses);
      });
    });
    if (!courses) return res.status(400).send('No courses listed');
    return res.json(courses);
  } catch (err) {
    return res.status(400).send(err);
  }
};

// ========== GET CLASS TO REPEAT ==========

exports.getClasseToRepeat = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const class_exists = await Classe.findOne({ _id: req.params.class_id });
    if (!class_exists) return res.status(400).send('Unknown class');

    const level_class = Number(class_exists.level);
    let parameters;
    if (class_exists.level > 3) {
      parameters = { level: level_class, school_id: req.user.school_id, option: class_exists.option };
    } else {
      parameters = { level: level_class, school_id: req.user.school_id, $or: [{ option: null }, { option: '' }] };
    }

    const classes = await Classe.find(parameters);
    return res.json(classes);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== GET NEXT CLASSES ==========

exports.getNextClasses = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const class_exists = await Classe.findOne({ _id: req.params.class_id });
    if (!class_exists) return res.status(400).send('Unknown class');

    const next_class = Number(class_exists.level) + 1;
    let parameters;
    if (class_exists.level > 3) {
      parameters = { level: next_class, school_id: req.user.school_id, option: class_exists.option };
    } else if (class_exists.level === 3) {
      parameters = { level: next_class, school_id: req.user.school_id };
    } else {
      parameters = { level: next_class, school_id: req.user.school_id, $or: [{ option: null }, { option: '' }] };
    }

    const nextClasses = await Classe.find(parameters);
    return res.json(nextClasses);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== SET STUDENT TO REPEAT ==========

exports.setStudentToRepeat = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  req.assert('student_id', 'Invalid data').isMongoId();
  req.assert('level', 'Invalid data').isIn([1, 2, 3, 4, 5, 6]);
  req.assert('new_class', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school_exists = await School.findOne({ _id: req.user.school_id });
    if (!school_exists) return res.status(400).send("This school doesn't exist");

    const class_exists = await Classe.findOne({ _id: req.body.new_class, school_id: school_exists._id });
    if (!class_exists) return log_err(null, false, req, res);
    if (class_exists.level != req.body.level) return res.status(400).send('Invalid repeating class');

    const student_exists = await User.findOne({
      _id: req.body.student_id,
      school_id: school_exists._id,
      class_id: req.body.class_id,
      access_level: req.app.locals.access_level.STUDENT
    });
    if (!student_exists) return res.status(400).send('Unknown student');

    student_exists.class_id = class_exists._id;
    student_exists.prev_classes.push({ class_id: req.body.class_id, academic_year: class_exists.academic_year });
    await student_exists.save();

    await new Notification({
      user_id: req.user._id,
      user_name: req.user.name,
      content: req.user.name + " has changed your class to S" + class_exists.name + ". Keep it up, I know you can make it. SUCCESS!!!",
      school_id: school_exists._id,
      class_id: class_exists._id,
      dest_id: student_exists._id,
      isAuto: false,
    }).save();

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== MOVE STUDENT TO NEXT CLASS ==========

exports.getToNextClass = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  req.assert('student_id', 'Invalid data').isMongoId();
  req.assert('level', 'Invalid data').isIn([1, 2, 3, 4, 5, 6]);
  if (req.body.new_class !== 'fin') req.assert('new_class', 'Invalid data new class').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  const new_class = req.body.new_class;
  const level = req.body.level;
  const next_level = Number(level) + 1;

  try {
    const school_exists = await School.findOne({ _id: req.user.school_id });
    if (!school_exists) return res.status(400).send("This school doesn't exist");

    if (new_class !== 'fin') {
      const class_exists = await Classe.findOne({ _id: new_class, school_id: school_exists._id });
      if (!class_exists) return log_err(null, false, req, res);
      if (class_exists.level != next_level) return res.status(400).send('Invalid next class');

      const student_exists = await User.findOne({
        _id: req.body.student_id,
        school_id: school_exists._id,
        class_id: req.body.class_id,
        access_level: req.app.locals.access_level.STUDENT
      });
      if (!student_exists) return res.status(400).send('Unknown student');

      student_exists.class_id = class_exists._id;
      student_exists.prev_classes.push({ class_id: req.body.class_id, academic_year: class_exists.academic_year });
      await student_exists.save();

      await new Notification({
        user_id: req.user._id,
        user_name: req.user.name,
        content: req.user.name + " has changed your class to S" + class_exists.name + ". You are welcome to the next level. SUCCESS!!!",
        school_id: school_exists._id,
        class_id: class_exists._id,
        dest_id: student_exists._id,
        isAuto: false,
      }).save();

    } else {
      // Student becomes a finalist
      const student_exists = await User.findOne({
        _id: req.body.student_id,
        school_id: school_exists._id,
        class_id: req.body.class_id,
        access_level: req.app.locals.access_level.STUDENT
      });
      if (!student_exists) return res.status(400).send('Unknown student');

      student_exists.class_id = null;
      student_exists.prev_classes.push({ class_id: req.body.class_id, academic_year: req.body.academic_year });
      await student_exists.save();

      await new Finalist({
        school_id: school_exists._id,
        class_id: req.body.class_id,
        student_id: student_exists._id,
        academic_year: req.body.academic_year,
      }).save();

      await new Notification({
        user_id: req.user._id,
        user_name: req.user.name,
        content: "You are a finalist at " + school_exists.name.toUpperCase() + ". SUCCESS!!!",
        school_id: school_exists._id,
        dest_id: student_exists._id,
        isAuto: false,
      }).save();
    }

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== RETURN STUDENT TO PREVIOUS CLASS ==========

exports.returnToPreviousClass = async (req, res, next) => {
  req.assert('student_id', 'Invalid data st').isMongoId();
  req.assert('new_class', 'Invalid data new class').isMongoId();
  if (req.body.class_id) req.assert('class_id', 'Invalid data cl').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  const new_class = req.body.new_class;
  let parameters;
  if (req.body.class_id) {
    parameters = { _id: req.body.student_id, school_id: req.user.school_id, class_id: req.body.class_id, access_level: req.app.locals.access_level.STUDENT };
  } else {
    parameters = { _id: req.body.student_id, school_id: req.user.school_id, class_id: null, access_level: req.app.locals.access_level.STUDENT };
  }

  try {
    const school_exists = await School.findOne({ _id: req.user.school_id });
    if (!school_exists) return res.status(400).send("This school doesn't exist");

    const class_exists = await Classe.findOne({ _id: new_class, school_id: school_exists._id });
    if (!class_exists) return log_err(null, false, req, res);

    const student_exists = await User.findOne(parameters);
    if (!student_exists) return res.status(400).send('Unknown student');

    const prevClassIndex = student_exists.prev_classes[0] && student_exists.prev_classes[0]['class_id'] !== undefined
      ? student_exists.prev_classes.findIndex(x => x.class_id == new_class)
      : student_exists.prev_classes.indexOf(new_class);

    if (prevClassIndex === -1) return res.status(400).send("Service isn't available");

    // Remove the class we're returning to from prev_classes
    const newClasses = student_exists.prev_classes.filter(
      (thisClasse) => thisClasse.class_id != new_class
    );

    student_exists.class_id = class_exists._id;
    student_exists.prev_classes = newClasses;
    await student_exists.save();

    if (!req.body.class_id) {
      // Student was a finalist — remove finalist record
      const finalist = await Finalist.findOne({ student_id: req.body.student_id });
      if (finalist) await finalist.deleteOne();
    }

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== SET ACADEMIC YEAR OF REPEAT ==========

exports.setAcYearOfRepeat = async (req, res) => {
  req.assert('class_id', 'Invalid data1').isMongoId();
  req.assert('student_id', 'Invalid data2').isMongoId();
  req.assert('classes', 'Invalid data3').isArray();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const student = await User.findOne({ _id: req.body.student_id, class_id: req.body.class_id });
    if (!student) return res.status(400).send('User does not exist');

    const studentClasses = [];
    for (const current of req.body.classes) {
      if (!current.class_id) return res.status(400).send('Invalid data 4');
      if (!current.academic_year) return res.status(400).send('Set academic year');
      if (current.academic_year > 19 || current.academic_year < 17) {
        return res.status(400).send('Set Invalid academic year');
      }
      studentClasses.push({ class_id: current.class_id, academic_year: current.academic_year });
    }

    student.prev_classes = studentClasses;
    await student.save();
    return res.end();
  } catch (err) {
    return res.status(400).send('Service not available');
  }
};

// ========== GET CLASSES FOR REPORT ==========

exports.getClasses_JSON_For_Report = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const classes = await Classe.find({ school_id: req.params.school_id }, { __v: 0 }).sort({ name: 1 });
    return res.json(classes);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== GET CLASSES FOR ACCOUNT CONFIRMATION ==========

exports.getClasses_JSONConfirm = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const classes = await Classe.find({ school_id: req.params.school_id }, { __v: 0 }).sort({ name: 1 }).lean();

    const listClasses = await Promise.all(
      classes.map(async (currentClass) => {
        const num = await User.countDocuments({
          class_id: currentClass._id,
          isEnabled: false,
          access_level: req.app.locals.access_level.STUDENT
        });
        return {
          _id: currentClass._id,
          name: currentClass.name,
          level: currentClass.level,
          currentTerm: currentClass.currentTerm,
          academic_year: currentClass.academic_year,
          students: num
        };
      })
    );

    return res.json(listClasses);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== EDIT CLASS ==========

exports.editClasse = async (req, res, next) => {
  const classLevel = req.body.level;
  req.assert('classe_id', 'Invalid data').isMongoId().notEmpty();
  req.assert('name', 'A name is required').notEmpty();
  req.assert('level', 'Type valid level').notEmpty().isIn([1, 2, 3, 4, 5, 6]);
  if (classLevel <= 3) {
    req.assert('sub_level', 'Specify sub level e.g.: A,B...').isIn(['a', 'b', 'c', 'd']).notEmpty();
  } else {
    req.assert('option', 'Specify option').notEmpty();
  }
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  req.body.option = req.body.option ? req.body.option.trim().toLowerCase() : '';
  req.body.sub_level = req.body.sub_level ? req.body.sub_level.trim().toLowerCase() : '';

  try {
    const name_exist = await SchoolProgram.findOne({ school_id: req.user.school_id, abbreviation: req.body.option });
    if (!name_exist && classLevel > 3) return res.status(400).send('Name does not match any school program');

    const class_exist = await Classe.findOne({ school_id: req.user.school_id, name: req.body.name.trim().toLowerCase() });
    if (class_exist && class_exist._id != req.body.classe_id) {
      return res.status(400).send('There is a class with the same information');
    }

    const this_classe = await Classe.findOne({ school_id: req.user.school_id, _id: req.body.classe_id });
    if (!this_classe) return res.status(400).send('Unknown class');

    this_classe.name = req.body.name;
    this_classe.level = req.body.level;
    this_classe.option = req.body.option;
    this_classe.sub_level = req.body.sub_level;
    await this_classe.save();

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== REMOVE CLASS ==========

exports.removeClasse = async (req, res, next) => {
  req.assert('classe_id', 'Invalid data').isMongoId();
  req.assert('confirmPass', 'Super admin password is required to do this action').notEmpty();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const [course_number, user_number] = await Promise.all([
      Course.countDocuments({ class_id: req.body.classe_id }),
      User.countDocuments({ class_id: req.body.classe_id })
    ]);

    if (user_number > 0)
      return res.status(400).send('There are still ' + user_number + ' users in this class,<br> Remove them first');
    if (course_number > 0)
      return res.status(400).send('There are still ' + course_number + ' courses in this class,<br> Remove them first');

    await Classe.deleteOne({ _id: req.body.classe_id });
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== UPDATE CLASS SETTINGS ==========

exports.updateSettings = async (req, res, next) => {
  req.assert('academic_year', 'Invalid academic year').isInt();
  req.assert('currentTerm', 'Invalid term').isInt();
  req.assert('class_id', 'Invalid class').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school_exists = await School.findOne({ _id: req.user.school_id });
    if (!school_exists) return res.status(400).send('School not recognized');
    if (req.body.currentTerm > school_exists.term_quantity) return res.status(400).send('Invalid data');

    const class_exists = await Classe.findOne({ _id: req.body.class_id, school_id: req.user.school_id });
    if (!class_exists) return res.status(400).send('Invalid data');
    if (req.body.academic_year <= 2000) return res.status(400).send('Invalid academic year');

    class_exists.academic_year = Number(req.body.academic_year) - 2000;
    class_exists.currentTerm = req.body.currentTerm;
    await class_exists.save();

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== SET CLASS TEACHER ==========

exports.setClassTeacher = async (req, res, next) => {
  req.assert('teacher_id', 'Invalid data').isMongoId();
  req.assert('class_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school_exists = await School.findOne({ _id: req.user.school_id });
    if (!school_exists) return res.status(400).send('School not recognized');

    const isClassTeacher = await Classe.findOne({ school_id: req.user.school_id, class_teacher: req.body.teacher_id });
    if (isClassTeacher) return res.status(400).send('Sorry, this teacher is already a class teacher in another class');

    const class_exists = await Classe.findOne({ _id: req.body.class_id, school_id: school_exists._id });
    if (!class_exists) return res.status(400).send('Invalid data');

    class_exists.class_teacher = req.body.teacher_id;
    await class_exists.save();

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};