// ========================================
// routes/timeline.routes.js
// ========================================
const express = require('express');
const router = express.Router();
const timelineCtrl = require('../controllers/timeline');
const auth = require('../middlewares/auth.middleware');

// Timeline page
router.get('/', auth.isAuthenticated, timelineCtrl.pageTimeline);

// Timeline operations
router.post('/create/post', auth.isAuthenticated, timelineCtrl.createPost);
router.post('/post/comment', auth.isAuthenticated, timelineCtrl.addComment);
router.get('/post/like/:post_id', auth.isAuthenticated, timelineCtrl.addLike);

// Get timeline data
router.get('/get', auth.isAuthenticated, timelineCtrl.getTimeline);
router.get('/get/adminpost', auth.isTeacherOrAdmin, timelineCtrl.getAdminPosts);

// Messages
router.get('/messages/get/:from_id', auth.isAuthenticated, timelineCtrl.getMEssageFromOne);
router.post('/messages/delete/unread', auth.isAuthenticated, timelineCtrl.deleteUnReads);

module.exports = router;