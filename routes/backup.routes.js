// ========================================
// routes/backup.routes.js
// ========================================
const express = require('express');
const router = express.Router();
const backUpCtrl = require('../controllers/manage/backup');
const auth = require('../middlewares/auth.middleware');

// Backup pages and operations (Super Admin only)
router.get('/page', auth.isSuperAdmin, backUpCtrl.getBackupPage);
router.get('/create', auth.isSuperAdmin, backUpCtrl.createBackUp);
router.get('/list', auth.isSuperAdmin, backUpCtrl.getbackupListAvailable);
router.get('/errors/list', auth.isSuperAdmin, backUpCtrl.getErrorsList);
router.get('/download/:file', auth.isSuperAdmin, backUpCtrl.downloadBackup);

module.exports = router;