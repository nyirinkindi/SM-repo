// ========================================
// routes/library.routes.js
// ========================================
const express = require('express');
const router = express.Router();
const libraryCtrl = require('../controllers/library');
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Library main page
router.get('/', auth.isAuthenticated, libraryCtrl.getLibraryViewPage);

// Book operations
router.post('/book/list', auth.isAtLeastStudent, libraryCtrl.getLibraryBookList);
router.post('/do/upload', auth.isAtLeastTeacher, upload.single('file'), libraryCtrl.postLibraryFile);
router.get('/get/pdf/:bookId', auth.isAuthenticated, libraryCtrl.getPdfFile);
router.get('/get/photo/:bookId', auth.isAuthenticated, libraryCtrl.getPhoto);
router.delete('/delete/Book/:bookId', auth.isAtLeastTeacher, libraryCtrl.deleteBook);
router.put('/update/book/details', auth.isAtLeastTeacher, libraryCtrl.updateBookInfo);
router.post('/update/book/photo', auth.isAtLeastTeacher, libraryCtrl.updatePhoto);

// Level list
router.get('/level/list', auth.isAuthenticated, libraryCtrl.getLevelList);

module.exports = router;