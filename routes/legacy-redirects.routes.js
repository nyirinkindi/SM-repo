/**
 * routes/legacy-redirects.routes.js
 *
 * TWO types of routes:
 * 1. REDIRECTS  - Page navigation only (GET requests, no body needed)
 * 2. DIRECT API - AngularJS $http calls (must handle directly - redirects lose POST body!)
 */

const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/school');
const auth = require('../middlewares/auth.middleware');

// ============================================================
// USER / AUTH - REDIRECTS
// ============================================================
router.get('/user.signin',             (req, res) => res.redirect('/auth/signin'));
router.post('/user.signin',            (req, res) => res.redirect(307, '/auth/signin'));
router.get('/user.signup',             (req, res) => res.redirect('/auth/signup'));
router.post('/user.signup',            (req, res) => res.redirect(307, '/auth/signup'));
router.get('/user.logout',             (req, res) => res.redirect('/auth/logout'));
router.get('/user.settings',           (req, res) => res.redirect('/user/settings'));
router.post('/user.renew_password',    (req, res) => res.redirect(307, '/user/password/renew'));
router.post('/user.change_email',      (req, res) => res.redirect(307, '/user/email/change'));
router.post('/user.update.profile',    (req, res) => res.redirect(307, '/user/profile/update'));
router.post('/user.email_recover',     (req, res) => res.redirect(307, '/auth/email_recover'));
router.post('/user.resendEmail_link',  (req, res) => res.redirect(307, '/auth/resendEmail_link'));
router.post('/user.edit.teacheremail', (req, res) => res.redirect(307, '/user/teacher/email/edit'));
router.get('/user.enable/:user_id',    (req, res) => res.redirect(`/user/enable/${req.params.user_id}`));

// ============================================================
// DASHBOARD - REDIRECTS
// ============================================================
router.get('/dashboard.school',              (req, res) => res.redirect('/dashboard/school'));
router.get('/dashboard.accounts.validation', (req, res) => res.redirect('/dashboard/accounts/validation'));
router.post('/dashboard.statistics',         (req, res) => res.redirect(307, '/dashboard/statistics'));
router.get('/dashboard.course/:classe_id',   (req, res) => res.redirect(`/dashboard/course/${req.params.classe_id}`));
router.get('/dashboard.students/:classe_id', (req, res) => res.redirect(`/dashboard/students/${req.params.classe_id}`));

// ============================================================
// REPORT - REDIRECTS
// ============================================================
router.get('/report.teacher', (req, res) => res.redirect('/report/teacher'));
router.get('/statistics',     (req, res) => res.redirect('/report/statistics'));

// ============================================================
// LIBRARY & UNIT - REDIRECTS
// ============================================================
router.post('/library.book.list', (req, res) => res.redirect(307, '/library/book/list'));
router.post('/unit.add',          (req, res) => res.redirect(307, '/unit/add'));
router.post('/unit.list',         (req, res) => res.redirect(307, '/unit/list'));
router.post('/unit.delete',       (req, res) => res.redirect(307, '/unit/delete'));

// ============================================================
// CONTENT - REDIRECTS
// ============================================================
router.get('/content.add.note/:unit_id',   (req, res) => res.redirect(`/content/add/note/${req.params.unit_id}`));
router.get('/content.add.w_note/:unit_id', (req, res) => res.redirect(`/content/add/w_note/${req.params.unit_id}`));
router.get('/content.add.video/:unit_id',  (req, res) => res.redirect(`/content/add/video/${req.params.unit_id}`));
router.get('/content.view/:content_id',    (req, res) => res.redirect(`/content/view/${req.params.content_id}`));
router.post('/content.add.note',           (req, res) => res.redirect(307, '/content/add/note'));
router.post('/content.list',               (req, res) => res.redirect(307, '/content/list'));
router.post('/content.delete',             (req, res) => res.redirect(307, '/content/delete'));

// ============================================================
// SCHOOL - DIRECT API HANDLERS
// ============================================================
router.get('/school.list',
  auth.isAuthenticated, schoolController.getSchool_JSON);

router.get('/school.list/:name',
  auth.isAuthenticated, schoolController.getSchool_BySearch);

router.get('/school.profile/:school_id',
  auth.isAuthenticated, schoolController.getSchoolProfile);

router.post('/school.add',
  auth.isSuperAdmin, schoolController.postNewSchool);

router.post('/school.delete',
  auth.isSuperAdmin, schoolController.removeSchool);

router.post('/school.update.profile',
  auth.isAtLeastAdmin, schoolController.changeSchoolProfile);

// ============================================================
// COURSES & PROGRAMS - DIRECT API HANDLERS
// ============================================================

// view_finalist_user.pug calls /school/finalist/list/:id (missing 's' + slash not dot)
// add_classe.pug calls /school.courseAndProgram.list/#{school_id} (broken interpolation)
// Both handled here:

router.get('/school/finalist/list/:school_id',
  auth.isAtLeastAdmin, schoolController.getAllFinalists);

router.get('/school.courseAndProgram.list/:school_id',
  auth.isAuthenticated, schoolController.getSchoolCourseAndProgram_JSON);

router.post('/school.add.course',
  auth.isAtLeastAdmin, schoolController.postSchoolCourse);

router.post('/school.delete.course',
  auth.isAtLeastAdmin, schoolController.deleteSchoolCourse);

router.post('/school.add.new_program',
  auth.isAtLeastAdmin, schoolController.postSchoolProgram);

router.post('/school.delete.program',
  auth.isAtLeastAdmin, schoolController.deleteSchoolProgram);

// ============================================================
// STUDENTS - DIRECT API HANDLERS
// ============================================================
router.post('/school.students.list',
  auth.isAtLeastAdmin, schoolController.getStudents_JSON);

router.post('/school.student.edit',
  auth.isAtLeastAdmin, schoolController.editStudent);

router.post('/school.student.delete',
  auth.isAtLeastAdmin, schoolController.removeStudent);

// ============================================================
// TEACHERS & ADMINS - DIRECT API HANDLERS
// ============================================================
router.get('/school.teachers.list/:school_id',
  auth.isAtLeastAdmin, schoolController.getTeachersList);

router.post('/school.admins.list',
  auth.isAtLeastAdmin, schoolController.getAdminsList);

router.post('/school.admin.add',
  auth.isAtLeastAdmin,
  async (req, res) => {
    try {
      const User = require('../models/User');
      const { teacher_id, school_id } = req.body;
      if (!teacher_id || !school_id) return res.status(400).send('Missing teacher_id or school_id');

      const teacher = await User.findOne({
        _id: teacher_id, school_id,
        access_level: req.app.locals.access_level.TEACHER
      });
      if (!teacher) return res.status(404).send('Teacher not found');

      teacher.access_level = req.app.locals.access_level.ADMIN_TEACHER;
      await teacher.save();
      console.log(`✅ Promoted teacher ${teacher.name} to admin`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error promoting teacher:', err);
      return res.status(500).send('Failed to promote teacher');
    }
  }
);

router.post('/school.teacher.to.admin',
  auth.isAtLeastAdmin,
  async (req, res) => {
    try {
      const User = require('../models/User');
      const { admin_id, school_id } = req.body;
      if (!admin_id || !school_id) return res.status(400).send('Missing fields');
      if (String(admin_id) === String(req.user._id)) return res.status(400).send('Cannot demote yourself');

      const admin = await User.findOne({ _id: admin_id, school_id });
      if (!admin) return res.status(404).send('Admin not found');
      if (admin.access_level <= req.user.access_level) return res.status(403).send('Insufficient permissions');

      admin.access_level = req.app.locals.access_level.TEACHER;
      await admin.save();
      console.log(`✅ Demoted admin ${admin.name} to teacher`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error demoting admin:', err);
      return res.status(500).send('Failed to demote admin');
    }
  }
);

router.post('/school.teacher.delete',
  auth.isAtLeastAdmin, schoolController.removeTeacher);

// ============================================================
// FINALISTS / ALUMNI - DIRECT API HANDLERS
// ============================================================
router.get('/school.finalist.list/:school_id',
  auth.isAtLeastAdmin, schoolController.getAllFinalists);

router.post('/school.change.to.previous',
  auth.isAtLeastAdmin,
  async (req, res) => {
    try {
      const User = require('../models/User');
      const { student_id, new_class } = req.body;
      if (!student_id || !new_class) return res.status(400).send('Missing student_id or new_class');

      await User.updateOne({ _id: student_id }, { $set: { class_id: new_class } });
      console.log(`✅ Reverted student ${student_id} to class ${new_class}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error reverting student:', err);
      return res.status(500).send('Failed to revert student');
    }
  }
);

// ============================================================
// CLASSES - DIRECT API HANDLERS
// ============================================================

// view_finalist_user.pug calls /classe/list/:id (slash not dot)
// add_classe.pug calls /classe.list/:id (dot notation)
// Both handled here:

router.get('/classe/list/:school_id',
  auth.isAuthenticated,
  async (req, res) => {
    try {
      const Classe = require('../models/Classe');
      const classes = await Classe.find({ school_id: req.params.school_id })
        .select('_id name level option academic_year')
        .sort({ level: 1 }).lean();
      return res.json(classes);
    } catch (err) {
      console.error('❌ Error getting classes:', err);
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }
  }
);

router.get('/classe.list/:school_id',
  auth.isAuthenticated,
  async (req, res) => {
    try {
      const Classe = require('../models/Classe');
      const classes = await Classe.find({ school_id: req.params.school_id })
        .select('_id name level option academic_year')
        .sort({ level: 1 }).lean();
      return res.json(classes);
    } catch (err) {
      console.error('❌ Error getting classes:', err);
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }
  }
);

router.post('/classe.delete',
  auth.isAtLeastAdmin,
  async (req, res) => {
    try {
      const Classe = require('../models/Classe');
      const { classe_id } = req.body;
      if (!classe_id) return res.status(400).send('Missing classe_id');

      await Classe.deleteOne({ _id: classe_id });
      console.log(`✅ Deleted class ${classe_id}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error deleting class:', err);
      return res.status(500).send('Failed to delete class');
    }
  }
);

// Class add/edit - these have no complex body so redirects are safe
router.post('/class.add',   (req, res) => res.redirect(307, '/classe/add'));
router.post('/classe.edit', (req, res) => res.redirect(307, '/classe/edit'));
router.get('/classe/:classe_id', (req, res) => res.redirect(`/classe/${req.params.classe_id}`));

// ============================================================
// SET CLASS TEACHER - DIRECT API HANDLER
// (add_classe.pug calls /set.class.teacher)
// ============================================================
router.post('/set.class.teacher',
  auth.isAtLeastAdmin,
  async (req, res) => {
    try {
      const Classe = require('../models/Classe');
      const { class_id, teacher_id, school_id } = req.body;
      if (!class_id || !teacher_id) return res.status(400).send('Missing class_id or teacher_id');

      await Classe.updateOne(
        { _id: class_id, school_id },
        { $set: { class_teacher: teacher_id } }
      );
      console.log(`✅ Set teacher ${teacher_id} for class ${class_id}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error setting class teacher:', err);
      return res.status(500).send('Failed to set class teacher');
    }
  }
);

// ============================================================
// OPTIONS - DIRECT API HANDLERS
// (add_classe.pug calls /option.list/:dept_id and /option.set/:school_id)
// ============================================================
router.get('/option.list/:department_id',
  auth.isAuthenticated,
  async (req, res) => {
    try {
      const School = require('../models/School');
      const options = await School.find({
        department_id: req.params.department_id,
        institution: 1
      }).select('_id name').lean();
      return res.json(options);
    } catch (err) {
      console.error('❌ Error getting options:', err);
      return res.status(500).json({ error: 'Failed to fetch options' });
    }
  }
);

router.get('/option.set/:school_id',
  auth.isAuthenticated,
  async (req, res) => {
    try {
      const School = require('../models/School');
      const school = await School.findById(req.params.school_id)
        .select('_id name term_name term_quantity department_id').lean();
      return res.json(school);
    } catch (err) {
      console.error('❌ Error getting option school:', err);
      return res.status(500).json({ error: 'Failed to fetch school option' });
    }
  }
);

// ============================================================
// SCHOOL CONTENT - DIRECT API HANDLER
// ============================================================
router.get('/school.content.list/:school_id',
  auth.isAuthenticated,
  async (req, res) => {
    try {
      const SchoolCourse = require('../models/Course');
      const contents = await SchoolCourse.find({ school_id: req.params.school_id }).lean();
      return res.json(contents);
    } catch (err) {
      console.error('❌ Error getting content:', err);
      return res.status(500).json({ error: 'Failed to fetch content' });
    }
  }
);


// ============================================================
// COURSE LIST - DIRECT API HANDLER
// (add_course.pug calls POST /course.list)
// ============================================================
router.post("/course.list",
  auth.isAuthenticated,
  async (req, res) => {
    try {
      const Classe = require("../models/Classe");
      const { school_id, class_id } = req.body;
      if (!school_id || !class_id) return res.status(400).send("Missing school_id or class_id");
      const classe = await Classe.findOne({ _id: class_id, school_id }).lean();
      if (!classe) return res.status(404).json([]);
      return res.json(classe.courses || []);
    } catch (err) {
      console.error("❌ Error getting course list:", err);
      return res.status(500).json({ error: "Failed to fetch courses" });
    }
  }
);

module.exports = router;

