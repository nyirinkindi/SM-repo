const { promisify } = require('util');
const { spawn } = require('child_process');
const fs = require('fs');
const readdir = promisify(fs.readdir);

const ErrorLog = require('../../models/ErrorLog');
const log_err = require('../manage/errorLogger');

// ========== HELPER ==========

function isSuperAdmin(req) {
  return req.user.access_level === req.app.locals.access_level.SUPERADMIN;
}

// ========== BACKUP PAGE ==========

exports.getBackupPage = (req, res, next) => {
  if (!isSuperAdmin(req)) return res.redirect('back');

  res.render('dashboard/backup', {
    title: 'Create a backup',
    pic_id: req.user._id,
    pic_name: req.user.name.replace("'", "\\'"),
    access_lvl: req.user.access_level,
    csrf_token: res.locals.csrftoken,
  });
};

// ========== CREATE BACKUP ==========

exports.createBackUp = (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(400).send('Sorry you are not authorized');

  const time = Date.now();
  const output = process.env.BACKUP_ZONE + '/' + time;
  const compressedFILE = process.env.BACKUP_ZONE + '/' + 'Eshuri_' + time + '.tar.gz';

  const ls = spawn('mongodump', ['--out', output]);

  ls.on('close', (code) => {
    console.log(`mongodump exited with code ${code}`);
    if (code !== 0) return res.status(500).send('Backing up failed with code ' + code);

    console.log('Now starting ZIP...');
    const zip = spawn('tar', ['-zcvf', compressedFILE, output]);

    zip.stdout.on('data', (data) => console.log(`zip stdout: ${data}`));
    zip.stderr.on('data', (data) => console.log(`zip stderr: ${data}`));

    zip.on('close', (zipCode) => {
      console.log(`ZIP process exited with code ${zipCode}`);
      console.log('ZIP is Eshuri_' + time + '.tar.gz');
      res.send('Backup successfully created with code ' + zipCode);

      const deleteFolder = spawn('rm', ['-rf', output]);
      deleteFolder.stdout.on('data', (data) => console.log(`rm stdout: ${data}`));
      deleteFolder.stderr.on('data', (data) => console.log(`rm stderr: ${data}`));
      deleteFolder.on('close', (rmCode) => console.log(`DELETE FOLDER exited with code ${rmCode}`));
    });
  });
};

// ========== LIST AVAILABLE BACKUPS ==========

exports.getbackupListAvailable = async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(400).send('Sorry you are not authorized');

  try {
    const items = await readdir(process.env.BACKUP_ZONE);
    return res.json(items);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== GET ERROR LOGS LIST ==========

exports.getErrorsList = async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(400).send('Sorry you are not authorized');

  try {
    const errorList = await ErrorLog.find({}).sort({ created_at: 1 });
    return res.json(errorList);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== DOWNLOAD BACKUP ==========

exports.downloadBackup = (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(400).send('Sorry, this is not your duty');

  req.assert('file', 'Invalid input').notEmpty();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  return res.download(process.env.BACKUP_ZONE + '/' + req.params.file);
};