const fs = require('fs');
const path = require('path');
const async = require('async');
const User = require('./models/User');
const Classe = require('./models/Classe');
const School = require('./models/School');
const Course = require('./models/Course'); // Added missing import

/**
 * Return a unique identifier with the given `len`.
 *
 * utils.uid(10);
 * // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
/* Generate unique REGISTRATION NUMBER*/
exports.generate_URN = function(number) {
  var len = 4;
  var buf = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len; ++i) buf.push(chars[getRandomInt(0, charlen - 1)]);
  number = isNaN(number) ? 1 : number;
  var number_toString = String(number), sum = 0;
  for (var i = 0; i < number_toString.length; ++i) sum += Number(number_toString[i]);

  number_toString += String(sum % 13); // You have to improve it 
  buf.push("-" + String(number_toString));
  return buf.join('');
};

exports.generate_CourseCode = function(name, number) {
  var len = 4;
  var buf = [];
  var chars = name;
  var charlen = chars.length;

  buf.push(name.substring(0, len));
  number = isNaN(number) ? 1 : number;
  var number_toString = String(number), sum = 0;
  for (var i = 0; i < number_toString.length; ++i) sum += Number(number_toString[i]);

  number_toString += String(sum % 7); // You have to improve it 
  buf.push("-" + String(number_toString));
  return buf.join('');
};

exports.uid = function(len) {
  var buf = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;
  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }
  return buf.join('');
};

exports.getConv_id = function(id_a, id_b) {
  date_a = new Date(parseInt(id_a.toString().substring(0, 8), 16) * 1000).getTime()
  date_b = new Date(parseInt(id_b.toString().substring(0, 8), 16) * 1000).getTime()
  return date_a > date_b ? String(date_a + date_b) : String(date_b + date_a);
};

// Return shortened course name
exports.getShort = (name, length) => {
  var fWord = name.substr(0, length);
  var sWord = name.split(" ")[1];
  return sWord == null ? fWord : fWord + ' ' + sWord.charAt(0);
}

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */
// Get district 
/**
id: Province_ID or District_ID or Sector_ID
type: 1.Province, 2:District, 3:Sector
*/
exports.getLocalName = (id) => {
  var filePath = path.join(__dirname, './public/locals.json');
  var area_name = "";
  fs.readFile(filePath, 'utf8', (err, json_data) => {
    if (err) throw err;
    var object = JSON.parse(json_data)
    for (var i = 0; i < object.provinces.length; i++) {
      if (object.provinces[i].Province_ID == id) {
        area_name = object.provinces[i].Province_NAME;
      }
    }
  })
  return 'Akimana:' + area_name;
}

/**
 * ✅ FIXED FOR MONGOOSE v8+
 * List classes for a user (converted from callbacks to async/await)
 */
exports.listClasses = async (req, userId, callBack) => {
  try {
    var listClasses = [], allclasses = [], classes = [];
    var student = req.app.locals.access_level.STUDENT;
    var teacher = req.app.locals.access_level.TEACHER;
    var admin_teacher = req.app.locals.access_level.ADMIN_TEACHER;
    var hMaster = req.app.locals.access_level.SA_SCHOOL;
    var parametters = {}, userparams = {};

    // ✅ Converted to async/await
    const userExists = await User.findOne({ _id: userId });
    if (!userExists) return callBack("Unknown user");

    // ✅ For super admins, get school_id from request params
    const schoolId = userExists.school_id || req.params.school_id || req.body.school_id;
    
    if (!schoolId) {
      // Super admin without school - return empty array
      console.log('⚠️ Super admin accessing without school context');
      return callBack(null, []);
    }

    // ✅ Converted to async/await
    const school = await School.findOne({ _id: schoolId });
    if (!school) return callBack("Unknown school");

    // Build list of classes based on user role
    if (userExists.access_level == student) {
      var studentClasses = [];
      
      // Add previous classes
      if (userExists.prev_classes && userExists.prev_classes.length > 0) {
        userExists.prev_classes.forEach(current => {
          var classId = current.class_id ? current.class_id : current;
          var ay = current.academic_year ? current.academic_year : null;
          studentClasses.push({ class_id: classId, academic_year: ay });
        });
      }
      
      // Add current class
      if (userExists.class_id) {
        studentClasses.push({ class_id: userExists.class_id, academic_year: null });
      }
      
      listClasses = studentClasses;
      
    } else if (userExists.access_level == teacher || userExists.access_level == admin_teacher) {
      // ✅ Converted to async/await
      const class_courses = await Course.find({ teacher_list: userId })
        .distinct("class_id")
        .lean();

      var teacherClasses = [];
      class_courses.forEach(this_class => {
        teacherClasses.push({ class_id: this_class, academic_year: null });
      });
      
      listClasses = teacherClasses;
      
    } else if (userExists.access_level <= hMaster) {
      // ✅ SUPER ADMIN / HEAD OF SCHOOL - Can view ALL classes in the school
      console.log('🔓 Super admin/Head of school accessing school classes');
      
      const allClasses = await Classe.find({ school_id: schoolId })
        .select('_id name academic_year')
        .lean();
      
      var adminClasses = [];
      allClasses.forEach(classe => {
        adminClasses.push({ 
          class_id: classe._id, 
          academic_year: classe.academic_year 
        });
      });
      
      listClasses = adminClasses;
      
    } else {
      return callBack('You do not have permission to view this user');
    }

    // Get details for each class
    for (const thisClass of listClasses) {
      // ✅ Converted to async/await
      const class_details = await Classe.findOne({ _id: thisClass.class_id });
      
      if (!class_details) continue;

      // Set parameters based on user access level
      if (userExists.access_level == student) {
        parametters = { class_id: thisClass.class_id };
      } else if (userExists.access_level == teacher || userExists.access_level == admin_teacher) {
        parametters = { class_id: thisClass.class_id, teacher_list: userId };
      } else if (userExists.access_level <= hMaster) {
        // Super admin / Head of school can see all courses
        parametters = { class_id: thisClass.class_id };
      }

      // ✅ Converted to async/await (countDocuments instead of count)
      const number = await Course.countDocuments(parametters);
      
      var theAy = thisClass.academic_year ? thisClass.academic_year : class_details.academic_year;
      classes.push({
        class_id: thisClass.class_id,
        name: class_details.name,
        academic_year: theAy,
        number: number
      });
    }

    return callBack(null, classes);

  } catch (err) {
    console.error('Error in listClasses:', err);
    return callBack(err.message || "Invalid data");
  }
}

/**
 * ✅ FIXED FOR MONGOOSE v8+
 * Virtual access level (converted from callbacks to async/await)
 */
exports.virtualAccessLevel = async (req, levelCallBack) => {
  try {
    var student = req.app.locals.access_level.STUDENT;
    var admin = req.app.locals.access_level.ADMIN;
    var teacher = req.app.locals.access_level.TEACHER;
    var admin_teacher = req.app.locals.access_level.ADMIN_TEACHER;
    var userId = req.query.u || req.user._id;
    var queryAccLvl = 100;

    if (req.user.access_level <= admin) {
      if (!req.query.u && !req.query.allow) {
        return levelCallBack('Unknown data');
      }
      
      // ✅ Converted to async/await
      const user = await User.findOne({ _id: req.query.u });
      if (!user) return levelCallBack('Unknown user');
      if (user.access_level < teacher) return levelCallBack('You do not have that privileges');
      
      queryAccLvl = user.access_level;
      
    } else if (req.user.access_level === admin_teacher) {
      if (req.query.u && req.query.allow) {
        // ✅ Converted to async/await
        const user = await User.findOne({ _id: req.query.u });
        if (!user) return levelCallBack('Unknown user');
        if (user.access_level < teacher) return levelCallBack('You do not have that privileges');
        
        var access = 100;
        if (user.access_level == student) access = student;
        else if (user.access_level == teacher || user.access_level == admin_teacher) access = teacher;
        queryAccLvl = access;
      } else {
        queryAccLvl = teacher;
      }
    } else if (req.user.access_level == teacher) {
      queryAccLvl = teacher;
    } else if (req.user.access_level == student) {
      queryAccLvl = student;
    } else {
      return levelCallBack('You do not have that access');
    }

    return levelCallBack(null, queryAccLvl);

  } catch (err) {
    console.error('Error in virtualAccessLevel:', err);
    return levelCallBack('Service not available');
  }
}

/**
 * ✅ FIXED FOR MONGOOSE v8+
 * List courses (converted from callbacks to async/await)
 */
exports.listCourses = async (req, courseCallBack) => {
  try {
    var student = req.app.locals.access_level.STUDENT;
    var admin = req.app.locals.access_level.ADMIN;
    var teacher = req.app.locals.access_level.TEACHER;
    var admin_teacher = req.app.locals.access_level.ADMIN_TEACHER;
    var userId = req.query.u || req.user._id;

    // ✅ Converted to async/await
    const classe = await Classe.findOne({ _id: req.params.class_id });
    if (!classe) return courseCallBack('Unknown classe');

    var queryAccLvl = 100;
    var queries = {};

    // Determine access level
    if (req.user.access_level <= admin) {
      if (!req.query.u && !req.query.allow) {
        return courseCallBack('Unknown data');
      }
      
      // ✅ Converted to async/await
      const user = await User.findOne({ _id: req.query.u });
      if (!user) return courseCallBack('Unknown user');
      if (user.access_level < teacher) return courseCallBack('You do not have that privileges');
      
      queryAccLvl = user.access_level;
      
    } else if (req.user.access_level === admin_teacher) {
      if (req.query.u && req.query.allow) {
        // ✅ Converted to async/await
        const user = await User.findOne({ _id: req.query.u });
        if (!user) return courseCallBack('Unknown user');
        if (user.access_level < teacher) return courseCallBack('You do not have that privileges');
        
        var access = 100;
        if (user.access_level == student) access = student;
        else if (user.access_level == teacher || user.access_level == admin_teacher) access = teacher;
        queryAccLvl = access;
      } else {
        queryAccLvl = teacher;
      }
    } else if (req.user.access_level == teacher) {
      queryAccLvl = teacher;
    } else if (req.user.access_level == student) {
      queryAccLvl = student;
    } else {
      return courseCallBack('You do not have that access');
    }

    // Build query based on access level
    switch (queryAccLvl) {
      case student:
        queries = { class_id: req.params.class_id };
        break;
      case teacher:
        queries = { class_id: req.params.class_id, teacher_list: userId };
        break;
      default:
        break;
    }

    if (!queries) return courseCallBack('Service not available');

    // ✅ Converted to async/await
    const courses = await Course.find(queries, { _id: 1, name: 1, code: 1 })
      .sort({ name: 1 })
      .lean();

    return courseCallBack(null, courses);

  } catch (err) {
    console.error('Error in listCourses:', err);
    return courseCallBack('Service not available');
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}