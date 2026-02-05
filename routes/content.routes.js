/**
 * routes/content.routes.js
 * All content-related routes (notes, videos, assessments)
 */

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Controllers
const noteController = require('../controllers/content/pdf_note');
const wNoteController = require('../controllers/content/written_note');
const videoController = require('../controllers/content/video');
const automatedController = require('../controllers/content/automated');
const uploadedController = require('../controllers/content/uploaded');
const writtenController = require('../controllers/content/written_test');
const offlineController = require('../controllers/content/offline_test');

// General content routes
router.post('/list', auth.isAuthenticated, wNoteController.get_Content_JSON);
router.get('/view/:content_id', auth.isAuthenticated, noteController.viewContent);
router.get('/list/tests/:course_id', auth.isAtLeastTeacher, wNoteController.getListContentPerCourse);
router.post('/publish', auth.isAtLeastTeacher, wNoteController.setPublish);

// Teacher-only content management
router.post('/set_CAT', auth.isAbsoluteTeacher, wNoteController.setCAT);
router.post('/set_Quoted', auth.isAbsoluteTeacher, wNoteController.set_Quoted);
router.post('/delete', auth.isAbsoluteTeacher, wNoteController.removeContent);
router.get('/edit_marks/:content_id', auth.isAbsoluteTeacher, offlineController.setSpecialMarks);

// ========== WRITTEN NOTES ==========
router.get('/add/w_note/:unit_id', auth.isAtLeastTeacher, wNoteController.pageNew_WrittenNote);
router.post('/add/w_note', auth.isAbsoluteTeacher, wNoteController.postNew_WrittenNote);
router.get('/edit/w_note/:content_id', auth.isAtLeastTeacher, wNoteController.pageEdit_WNotes);
router.post('/update/w_note', auth.isAbsoluteTeacher, wNoteController.postUpdateW_Note);
router.get('/do/w_note/:content_id', auth.isAuthenticated, noteController.viewContent);

// ========== PDF NOTES ==========
router.get('/add/note/:unit_id', auth.isAtLeastTeacher, noteController.pageNew_Note);
router.post('/add/note', auth.isAbsoluteTeacher, upload.single('file'), noteController.postNew_Note);
router.get('/edit/note/:content_id', auth.isAtLeastTeacher, noteController.pageEdit_Notes);
router.post('/update/note', auth.isAbsoluteTeacher, upload.single('file'), noteController.postUpdateNote);
router.get('/do/note/:content_id', auth.isAuthenticated, noteController.viewContent);

// PDF operations
router.get('/pdf/view/:content_id', auth.isAuthenticated, noteController.getPdf);
router.get('/pdf/download/:content_id', auth.isAuthenticated, noteController.downloadPdf);
router.get('/pdf/check/:content_id', auth.isAuthenticated, noteController.checkPDFName);

// ========== VIDEOS ==========
router.get('/add/video/:unit_id', auth.isAtLeastTeacher, videoController.pageNewVideo);
router.post('/add/video', auth.isAtLeastTeacher, videoController.postNew_Video);
router.get('/do/video/:content_id', auth.isAuthenticated, noteController.viewContent);

// ========== AUTOMATED TESTS ==========
router.get('/add/automated/:unit_id', auth.isAtLeastTeacher, automatedController.pageNewAutomated);
router.post('/add/automated', auth.isAtLeastTeacher, automatedController.postNew_Automated);
router.post('/update/automated', auth.isAtLeastTeacher, automatedController.postUpdate_Automated);
router.get('/edit/automated/:content_id', auth.isAtLeastTeacher, automatedController.pageEdit_Automated);
router.get('/edit/get/automated/:content_id', auth.isAtLeastTeacher, automatedController.pageGET_Automated);
router.get('/do/automated/:content_id', auth.isAuthenticated, automatedController.pageDO_Automated);
router.get('/questions/do/automated/:content_id', auth.isAuthenticated, automatedController.getQuestions);
router.post('/questions/do/automated/:content_id', auth.isAuthenticated, automatedController.postAnswers);

// ========== UPLOADED ASSESSMENTS (PDF ANSWERS) ==========
router.get('/add/uploaded/:unit_id', auth.isAtLeastTeacher, uploadedController.pageNew_Uploaded);
router.post('/add/uploaded', auth.isAtLeastTeacher, upload.single('file'), uploadedController.postNew_Uploaded);
router.get('/do/uploaded/:content_id', auth.isAuthenticated, uploadedController.do_Uploaded);
router.post('/do/uploaded', auth.isAuthenticated, upload.single('file'), uploadedController.uploadAnswer);
router.get('/uploaded/view/student/page/:marks_id', auth.isAuthenticated, uploadedController.getPageViewAnswer);
router.get('/pdf/view/answer/uploaded/:marks_id', auth.isAuthenticated, uploadedController.readAnswerUploadedPDF);
router.post('/uploaded/set_marks/:marks_id', auth.isAtLeastTeacher, uploadedController.setMarksToStudent);

// ========== WRITTEN TESTS ==========
router.get('/add/written/:unit_id', auth.isAtLeastTeacher, writtenController.pageNewWritten);
router.post('/add/written', auth.isAtLeastTeacher, writtenController.postNew_Written);
router.get('/edit/written/:content_id', auth.isAtLeastTeacher, writtenController.pageEdit_Written);
router.get('/edit/get/written/:content_id', auth.isAtLeastTeacher, writtenController.pageGET_Written);
router.post('/update/written', auth.isAtLeastTeacher, writtenController.postUpdate_Written);
router.get('/do/written/:content_id', auth.isAuthenticated, writtenController.pageDO_Written);
router.get('/questions/do/written/:content_id', auth.isAuthenticated, writtenController.pageGET_Written);
router.post('/questions/do/written/:content_id', auth.isAuthenticated, writtenController.postAnswers);
router.get('/written/view/student/page/:marks_id', auth.isAuthenticated, writtenController.getPageViewAnswer);
router.get('/written/view/student/json/:marks_id', auth.isAuthenticated, writtenController.getJSONViewAnswer);
router.post('/written/set_marks/:marks_id', auth.isAtLeastTeacher, writtenController.setMarksToStudent);

// Assessment answers management
router.get('/answers/page/:content_id', auth.isAtLeastTeacher, writtenController.getPageListAnswers);
router.get('/answers/list/json/:content_id', auth.isAtLeastTeacher, writtenController.getJSON_Answers);
router.post('/update/total_marks', auth.isAtLeastTeacher, writtenController.updateTotalMarks);

// ========== OFFLINE TESTS ==========
router.get('/add/offline/:unit_id', auth.isAtLeastTeacher, offlineController.pageNewOfflineTest);
router.post('/add/offline', auth.isAtLeastTeacher, offlineController.addOfflineTest);
router.get('/edit/offline/:content_id', auth.isAtLeastTeacher, offlineController.pageEditOfflineTest);
router.post('/update/offline', auth.isAtLeastTeacher, offlineController.updateOfflineTest);
router.get('/do/offline/:content_id', auth.isAuthenticated, noteController.viewContent);
router.post('/list/students/offline', auth.isAtLeastStudent, offlineController.getPageOfflineStudents);
router.post('/offline/set_marks', auth.isAtLeastTeacher, offlineController.setMarksStudent);
router.post('/offline/undo_marks', auth.isAtLeastTeacher, offlineController.undoMarksStudent);

module.exports = router;