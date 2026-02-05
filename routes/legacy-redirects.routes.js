/**
 * routes/legacy-redirects.routes.js
 * Redirects for old route paths to new structure
 */

const express = require('express');
const router = express.Router();

// ========== USER/AUTH REDIRECTS ==========
// Old user auth routes → new auth routes
router.get('/user.signin', (req, res) => res.redirect('/auth/signin'));
router.post('/user.signin', (req, res) => res.redirect(307, '/auth/signin'));
router.get('/user.signup', (req, res) => res.redirect('/auth/signup'));
router.post('/user.signup', (req, res) => res.redirect(307, '/auth/signup'));
router.get('/user.logout', (req, res) => res.redirect('/auth/logout'));

// User settings routes
router.get('/user.settings', (req, res) => res.redirect('/user/settings'));
router.post('/user.renew_password', (req, res) => res.redirect(307, '/user/password/renew'));
router.post('/user.change_email', (req, res) => res.redirect(307, '/user/email/change'));
router.post('/user.update.profile', (req, res) => res.redirect(307, '/user/profile/update'));
router.post('/user.email_recover', (req, res) => res.redirect(307, '/auth/email_recover'));
router.post('/user.resendEmail_link', (req, res) => res.redirect(307, '/auth/resendEmail_link'));

// ========== SCHOOL REDIRECTS ==========
router.get('/school.list', (req, res) => res.redirect('/school/list'));
router.get('/school.list/:name', (req, res) => res.redirect(`/school/list/${req.params.name}`));
router.post('/school.add', (req, res) => res.redirect(307, '/school/add'));
router.post('/school.delete', (req, res) => res.redirect(307, '/school/delete'));
router.post('/school.update.profile', (req, res) => res.redirect(307, '/school/update/profile'));

// ========== CLASS/CLASSE REDIRECTS ==========
router.get('/classe.list/:school_id', (req, res) => res.redirect(`/classe/list/${req.params.school_id}`));
router.post('/class.add', (req, res) => res.redirect(307, '/classe/add'));
router.post('/classe.edit', (req, res) => res.redirect(307, '/classe/edit'));
router.post('/classe.delete', (req, res) => res.redirect(307, '/classe/delete'));
router.get('/classe/:classe_id', (req, res) => res.redirect(`/classe/${req.params.classe_id}`));

// ========== COURSE REDIRECTS ==========
router.get('/courses/:course_id', (req, res) => res.redirect(`/courses/${req.params.course_id}`));
router.post('/course.add', (req, res) => res.redirect(307, '/courses/add'));
router.post('/course.list', (req, res) => res.redirect(307, '/courses/list'));
router.post('/course.delete', (req, res) => res.redirect(307, '/courses/delete'));

// ========== CONTENT REDIRECTS ==========
router.get('/content.add.note/:unit_id', (req, res) => res.redirect(`/content/add/note/${req.params.unit_id}`));
router.get('/content.add.w_note/:unit_id', (req, res) => res.redirect(`/content/add/w_note/${req.params.unit_id}`));
router.get('/content.add.video/:unit_id', (req, res) => res.redirect(`/content/add/video/${req.params.unit_id}`));
router.get('/content.view/:content_id', (req, res) => res.redirect(`/content/view/${req.params.content_id}`));
router.post('/content.add.note', (req, res) => res.redirect(307, '/content/add/note'));
router.post('/content.list', (req, res) => res.redirect(307, '/content/list'));
router.post('/content.delete', (req, res) => res.redirect(307, '/content/delete'));

// ========== DASHBOARD REDIRECTS ==========
router.get('/dashboard.school', (req, res) => res.redirect('/dashboard/school'));
router.get('/dashboard.accounts.validation', (req, res) => res.redirect('/dashboard/accounts/validation'));
router.post('/dashboard.statistics', (req, res) => res.redirect(307, '/dashboard/statistics'));

// ========== REPORT REDIRECTS ==========
router.get('/report.teacher', (req, res) => res.redirect('/report/teacher'));
router.get('/statistics', (req, res) => res.redirect('/report/statistics'));

// ========== LIBRARY REDIRECTS ==========
router.post('/library.book.list', (req, res) => res.redirect(307, '/library/book/list'));

// ========== UNIT REDIRECTS ==========
router.post('/unit.add', (req, res) => res.redirect(307, '/unit/add'));
router.post('/unit.list', (req, res) => res.redirect(307, '/unit/list'));
router.post('/unit.delete', (req, res) => res.redirect(307, '/unit/delete'));

module.exports = router;