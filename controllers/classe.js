const Classe       = require('../models/Classe'),
      Course       = require('../models/Course'),
      User         = require('../models/User'),
      School       = require('../models/School'),
      Mark         = require('../models/MARKS'),
      Notification = require('../models/Notification'),
      Content      = require('../models/Content'),
      log_err      = require('./manage/errorLogger'),
      Finalist     = require('../models/Finalist'),
      Util         = require('../utils.js'),
      SchoolProgram = require('../models/SchoolProgram');

// ─────────────────────────────────────────────────────────────
// Create a new class
// ─────────────────────────────────────────────────────────────
exports.postNewClass = async (req, res, next) => {
  const classLevel = req.body.level;
  req.assert('school_id',    'Invalid data').notEmpty().isMongoId();
  req.assert('class_teacher','Invalid data').notEmpty().isMongoId();
  req.assert('level',        'A level must be a number').isInt();
  req.assert('name',         'A name is required').notEmpty();
  req.assert('currentTerm',  'Sorry, specify a term').isInt();
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

    req.body.option    = req.body.option    || '';
    req.body.sub_level = req.body.sub_level || '';

    await new Classe({
      school_id:    req.body.school_id,
      level:        req.body.level,
      name:         req.body.name,
      academic_year: Number(new Date().getFullYear()) - 2000,
      class_teacher: req.body.class_teacher,
      currentTerm:  req.body.currentTerm,
      option:       req.body.option,
      sub_level:    req.body.sub_level,
    }).save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Get classes list as JSON (with student count per class)
// ─────────────────────────────────────────────────────────────
exports.getClasses_JSON = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  const access_lvl  = String(req.user.access_level);
  const superadmin  = String(req.app.locals.access_level.SUPERADMIN);
  let   school_id;

  if (access_lvl === superadmin) {
    school_id = req.params.school_id;
  } else {
    if (String(req.params.school_id) !== String(req.user.school_id))
      return res.status(400).send("This is not your school");
    school_id = req.user.school_id;
  }

  try {
    const classes = await Classe.find({ school_id }, { __v: 0 }).sort({ name: 1 }).lean();
    await Promise.all(classes.map(async (c) => {
      c.students = await User.countDocuments({ class_id: c._id });
    }));
    return res.json(classes);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Render the single-class view page
// ─────────────────────────────────────────────────────────────
exports.getPageOneClasse = async (req, res, next) => {
  req.assert('classe_id', 'Invalid data').isMongoId();
  if (req.query.u || req.query.allow) {
    req.assert('u',     'Invalid data u').isMongoId();
    req.assert('allow', 'Invalid data a').equals('true');
  }
  const errors = req.validationErrors();
  if (errors) return res.render('./lost', { msg: errors[0].msg });

  const year = parseInt(new Date().getFullYear()) - 2000;
  if (!req.query.ay || req.query.ay < 17 || req.query.ay > year)
    return res.render('./lost', { msg: 'Invalid data' });

  const query = (req.query.u && req.query.allow)
    ? '?ay=' + req.query.ay + '&u=' + req.query.u + '&allow=true'
    : '?ay=' + req.query.ay;

  try {
    const classe_exists = await Classe.findOne({ _id: req.params.classe_id });
    if (!classe_exists) return res.render('./lost', { msg: "This class doesn't exist" });

    const first_letter = classe_exists.name.toLowerCase().charAt(0);
    const class_name   = first_letter === 's' ? classe_exists.name : 's' + classe_exists.name;

    const school = await School.findOne({ _id: classe_exists.school_id });
    if (!school) return res.render('./lost', { msg: "This school doesn't exist" });

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
      title:         class_name.toUpperCase(),
      school_id:     classe_exists.school_id,
      school_name:   school.name,
      academic_year: req.query.ay,
      userid:        req.query.u || '',
      subhead:       subHeader,
      term_name:     school.term_name,
      term_quantity: school.term_quantity,
      class_id:      req.params.classe_id,
      query,
      currentTerm:   classe_exists.currentTerm,
      pic_id:        req.user._id,
      access_lvl:    req.user.access_level,
      pic_name:      req.user.name.replace("'", "\\'"),
      csrf_token:    res.locals.csrftoken,
    });
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Get courses for a class
// ─────────────────────────────────────────────────────────────
exports.getClassCourses = (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  if (req.query.u && req.query.allow) {
    req.assert('u',     'Invalid data u').isMongoId();
    req.assert('allow', 'Invalid data a').equals('true');
  }
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  Util.listCourses(req, (err, courses) => {
    if (err) return res.status(400).send(err);
    if (!courses) return res.status(400).send('No courses listed');
    return res.json(courses);
  });
};

// ─────────────────────────────────────────────────────────────
// Get classes at same level (for repeat)
// ─────────────────────────────────────────────────────────────
exports.getClasseToRepeat = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const class_exists = await Classe.findOne({ _id: req.params.class_id });
    if (!class_exists) return res.status(400).send("Unknown class");

    const level = Number(class_exists.level);
    const params = level > 3
      ? { level, school_id: req.user.school_id, option: class_exists.option }
      : { level, school_id: req.user.school_id, $or: [{ option: null }, { option: '' }] };

    const classes = await Classe.find(params);
    return res.json(classes);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Get next-level classes (for promotion)
// ─────────────────────────────────────────────────────────────
exports.getNextClasses = async (req, res, next) => {
  req.assert('class_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const class_exists = await Classe.findOne({ _id: req.params.class_id });
    if (!class_exists) return res.status(400).send("Unknown class");

    const next_class = Number(class_exists.level) + 1;
    let params;
    if (class_exists.level > 3)       params = { level: next_class, school_id: req.user.school_id, option: class_exists.option };
    else if (class_exists.level == 3) params = { level: next_class, school_id: req.user.school_id };
    else                              params = { level: next_class, school_id: req.user.school_id, $or: [{ option: null }, { option: '' }] };

    const nextClasses = await Classe.find(params);
    return res.json(nextClasses);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Set a student to repeat the same level
// ─────────────────────────────────────────────────────────────
exports.setStudentToRepeat = async (req, res, next) => {
  req.assert('class_id',   'Invalid data').isMongoId();
  req.assert('student_id', 'Invalid data').isMongoId();
  req.assert('level',      'Invalid data').isIn([1, 2, 3, 4, 5, 6]);
  req.assert('new_class',  'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school = await School.findOne({ _id: req.user.school_id });
    if (!school) return res.status(400).send("This school doesn't exist");

    const class_exists = await Classe.findOne({ _id: req.body.new_class, school_id: school._id });
    if (!class_exists) return res.status(400).send("Unknown class");
    if (class_exists.level != req.body.level) return res.status(400).send("Invalid repeating class");

    const student = await User.findOne({
      _id: req.body.student_id, school_id: school._id,
      class_id: req.body.class_id, access_level: req.app.locals.access_level.STUDENT
    });
    if (!student) return res.status(400).send("Unknown student");

    student.class_id = class_exists._id;
    student.prev_classes.push({ class_id: req.body.class_id, academic_year: class_exists.academic_year });
    await student.save();

    await new Notification({
      user_id:   req.user._id,
      user_name: req.user.name,
      content:   req.user.name + " has changed your class to S" + class_exists.name + ". Keep it up, I know you can make it. SUCCESS!!!",
      school_id: school._id,
      class_id:  class_exists._id,
      dest_id:   student._id,
      isAuto:    false
    }).save();

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Promote a student to the next class (or make finalist)
// ─────────────────────────────────────────────────────────────
exports.getToNextClass = async (req, res, next) => {
  req.assert('class_id',   'Invalid data').isMongoId();
  req.assert('student_id', 'Invalid data').isMongoId();
  req.assert('level',      'Invalid data').isIn([1, 2, 3, 4, 5, 6]);
  if (req.body.new_class !== 'fin')
    req.assert('new_class', 'Invalid data new class').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  const next_level = Number(req.body.level) + 1;

  try {
    const school = await School.findOne({ _id: req.user.school_id });
    if (!school) return res.status(400).send("This school doesn't exist");

    if (req.body.new_class !== 'fin') {
      const class_exists = await Classe.findOne({ _id: req.body.new_class, school_id: school._id });
      if (!class_exists) return res.status(400).send("Unknown class");
      if (class_exists.level != next_level) return res.status(400).send("Invalid next class");

      const student = await User.findOne({
        _id: req.body.student_id, school_id: school._id,
        class_id: req.body.class_id, access_level: req.app.locals.access_level.STUDENT
      });
      if (!student) return res.status(400).send("Unknown student");

      student.class_id = class_exists._id;
      student.prev_classes.push({ class_id: req.body.class_id, academic_year: class_exists.academic_year });
      await student.save();

      await new Notification({
        user_id:   req.user._id,
        user_name: req.user.name,
        content:   req.user.name + " has changed your class to S" + class_exists.name + ". You are welcome into next level. SUCCESS!!!",
        school_id: school._id,
        class_id:  class_exists._id,
        dest_id:   student._id,
        isAuto:    false
      }).save();
    } else {
      const student = await User.findOne({
        _id: req.body.student_id, school_id: school._id,
        class_id: req.body.class_id, access_level: req.app.locals.access_level.STUDENT
      });
      if (!student) return res.status(400).send("Unknown student");

      student.class_id = null;
      student.prev_classes.push({ class_id: req.body.class_id, academic_year: req.body.academic_year });
      await student.save();

      await new Finalist({
        school_id:    school._id,
        class_id:     req.body.class_id,
        student_id:   student._id,
        academic_year: req.body.academic_year,
      }).save();

      await new Notification({
        user_id:   req.user._id,
        user_name: req.user.name,
        content:   "You are finalist at " + school.name.toUpperCase() + ". SUCCESS!!!",
        school_id: school._id,
        dest_id:   student._id,
        isAuto:    false
      }).save();
    }

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Return a student to a previous class
// ─────────────────────────────────────────────────────────────
exports.returnToPreviousClass = async (req, res, next) => {
  req.assert('student_id', 'Invalid data st').isMongoId();
  req.assert('new_class',  'Invalid data new class').isMongoId();
  if (req.body.class_id) req.assert('class_id', 'Invalid data cl').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  const params = req.body.class_id
    ? { _id: req.body.student_id, school_id: req.user.school_id, class_id: req.body.class_id, access_level: req.app.locals.access_level.STUDENT }
    : { _id: req.body.student_id, school_id: req.user.school_id, class_id: null,              access_level: req.app.locals.access_level.STUDENT };

  try {
    const school = await School.findOne({ _id: req.user.school_id });
    if (!school) return res.status(400).send("This school doesn't exist");

    const class_exists = await Classe.findOne({ _id: req.body.new_class, school_id: school._id });
    if (!class_exists) return res.status(400).send("Unknown class");

    const student = await User.findOne(params);
    if (!student) return res.status(400).send("Unknown student");

    const prevClassIndex = student.prev_classes[0]?.class_id !== undefined
      ? student.prev_classes.findIndex(x => x.class_id == req.body.new_class)
      : student.prev_classes.indexOf(req.body.new_class);

    if (prevClassIndex === -1) return res.status(400).send("Service isn't available");

    // Remove the target class from prev_classes
    const newClasses = student.prev_classes.filter(c => c.class_id != req.body.new_class);
    student.class_id     = class_exists._id;
    student.prev_classes = newClasses;
    await student.save();

    if (!req.body.class_id) {
      const finalist = await Finalist.findOne({ student_id: req.body.student_id });
      if (finalist) await Finalist.deleteOne({ _id: finalist._id });
    }

    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Set academic year for a student's previous classes
// ─────────────────────────────────────────────────────────────
exports.setAcYearOfRepeat = async (req, res) => {
  req.assert('class_id',   'Invalid data1').isMongoId();
  req.assert('student_id', 'Invalid data2').isMongoId();
  req.assert('classes',    'Invalid data3').isArray();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const student = await User.findOne({ _id: req.body.student_id, class_id: req.body.class_id });
    if (!student) return res.status(400).send('User does not exist');

    const studentClasses = [];
    for (const current of req.body.classes) {
      if (!current.class_id)    return res.status(400).send('Invalid data 4');
      if (!current.academic_year) return res.status(400).send('Set academic year');
      if (current.academic_year > 19 || current.academic_year < 17)
        return res.status(400).send('Invalid academic year');
      studentClasses.push({ class_id: current.class_id, academic_year: current.academic_year });
    }

    student.prev_classes = studentClasses;
    await student.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Get classes for report (simple list)
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Get classes with unconfirmed-student count (for confirmation)
// ─────────────────────────────────────────────────────────────
exports.getClasses_JSONConfirm = async (req, res, next) => {
  req.assert('school_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const classes = await Classe.find({ school_id: req.params.school_id }, { __v: 0 }).sort({ name: 1 }).lean();
    const listClasses = await Promise.all(classes.map(async (c) => {
      const students = await User.countDocuments({
        class_id:     c._id,
        isEnabled:    false,
        access_level: req.app.locals.access_level.STUDENT
      });
      return { _id: c._id, name: c.name, level: c.level, currentTerm: c.currentTerm, academic_year: c.academic_year, students };
    }));
    return res.json(listClasses);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Edit a class
// ─────────────────────────────────────────────────────────────
exports.editClasse = async (req, res, next) => {
  const classLevel = req.body.level;
  req.assert('classe_id', 'Invalid data').isMongoId().notEmpty();
  req.assert('name',      'A name is required').notEmpty();
  req.assert('level',     'Type valid level').notEmpty().isIn([1, 2, 3, 4, 5, 6]);
  if (classLevel <= 3) req.assert('sub_level', 'Specify sub level eg.:A,B...').isIn(['a', 'b', 'c', 'd']).notEmpty();
  else                 req.assert('option',    'Specify option').notEmpty();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  req.body.option    = req.body.option    ? req.body.option.trim().toLowerCase()    : '';
  req.body.sub_level = req.body.sub_level ? req.body.sub_level.trim().toLowerCase() : '';

  try {
    const name_exist = await SchoolProgram.findOne({ school_id: req.user.school_id, abbreviation: req.body.option });
    if (!name_exist && classLevel > 3) return res.status(400).send("Name does not match any school program");

    const class_exist = await Classe.findOne({ school_id: req.user.school_id, name: req.body.name.trim().toLowerCase() });
    if (class_exist && class_exist._id != req.body.classe_id)
      return res.status(400).send("There is a class with the same information");

    const this_classe = await Classe.findOne({ school_id: req.user.school_id, _id: req.body.classe_id });
    if (!this_classe) return res.status(400).send("Unknown class");

    this_classe.name      = req.body.name;
    this_classe.level     = req.body.level;
    this_classe.option    = req.body.option;
    this_classe.sub_level = req.body.sub_level;
    await this_classe.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Delete a class (only if empty)
// ─────────────────────────────────────────────────────────────
exports.removeClasse = async (req, res, next) => {
  req.assert('classe_id',   'Invalid data').isMongoId();
  req.assert('confirmPass', 'Super admin password is required to do this action').notEmpty();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const [course_number, user_number] = await Promise.all([
      Course.countDocuments({ class_id: req.body.classe_id }),
      User.countDocuments(  { class_id: req.body.classe_id }),
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

// ─────────────────────────────────────────────────────────────
// Update class settings (academic year / term)
// ─────────────────────────────────────────────────────────────
exports.updateSettings = async (req, res, next) => {
  req.assert('academic_year', 'Invalid academic year').isInt();
  req.assert('currentTerm',   'Invalid term').isInt();
  req.assert('class_id',      'Invalid class').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const school = await School.findOne({ _id: req.user.school_id });
    if (!school) return res.status(400).send("School not recognized");
    if (req.body.currentTerm > school.term_quantity) return res.status(400).send("Invalid data");

    const class_exists = await Classe.findOne({ _id: req.body.class_id, school_id: req.user.school_id });
    if (!class_exists) return res.status(400).send("Invalid data");
    if (req.body.academic_year <= 2000) return res.status(400).send("Invalid academic year");

    class_exists.academic_year = Number(req.body.academic_year) - 2000;
    class_exists.currentTerm   = req.body.currentTerm;
    await class_exists.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ─────────────────────────────────────────────────────────────
// Set a class teacher
// ─────────────────────────────────────────────────────────────
exports.setClassTeacher = async (req, res, next) => {
  req.assert('teacher_id', 'Invalid data').isMongoId();
  req.assert('class_id',   'Invalid data').isMongoId();
  req.assert('school_id',  'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  // Use school_id from body so Super Admin (no req.user.school_id) works too
  const school_id = req.body.school_id;

  try {
    const school = await School.findOne({ _id: school_id });
    if (!school) return res.status(400).send("School not recognized");

    // Block if this teacher is already class teacher in a DIFFERENT class
    const isClassTeacher = await Classe.findOne({
      school_id,
      class_teacher: req.body.teacher_id,
      _id: { $ne: req.body.class_id }
    });
    if (isClassTeacher)
      return res.status(400).send("Sorry, this teacher is already a class teacher in another class");

    const class_exists = await Classe.findOne({ _id: req.body.class_id, school_id });
    if (!class_exists) return res.status(400).send("Class not found");

    class_exists.class_teacher = req.body.teacher_id;
    await class_exists.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};