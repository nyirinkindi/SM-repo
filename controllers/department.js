const Department = require('../models/Department');
const School = require('../models/School');
const User = require('../models/User');
const log_err = require('./manage/errorLogger');

// ========== CREATE DEPARTMENT ==========

exports.postNewDepartment = async (req, res, next) => {
  req.assert('name', 'The name is required').notEmpty();
  req.assert('univ_id', 'Data is invalid').isMongoId();
  req.assert('fac_id', 'Data is invalid').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    await new Department({
      name: req.body.name,
      fac_id: req.body.fac_id,
      univ_id: req.body.univ_id,
    }).save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== GET DEPARTMENTS (JSON) ==========

exports.getDepartment_JSON = async (req, res, next) => {
  req.assert('fac_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const fac_list = await Department.find({ fac_id: req.body.fac_id }, { __v: 0 });
    return res.json(fac_list);
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== REMOVE DEPARTMENT ==========

exports.removeDepartment = async (req, res, next) => {
  req.assert('department_id', 'Invalid data').isMongoId();
  req.assert('confirmPass', 'Super admin password is required to do this action').notEmpty();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const user_exists = await User.findOne({ _id: req.user._id });
    if (!user_exists) return res.status(400).send('Invalid data');

    const isMatch = await new Promise((resolve, reject) => {
      user_exists.comparePassword(req.body.confirmPass, req.user.email, (err, match) => {
        if (err) reject(err);
        else resolve(match);
      });
    });
    if (!isMatch) return res.status(400).send('Password is incorrect');

    const number = await School.countDocuments({ department_id: req.body.department_id });
    if (number > 0) return res.status(400).send('Please remove all options inside first');

    await Department.deleteOne({ _id: req.body.department_id });
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== GET CHOOSE OPTION PAGE ==========

exports.getPageChooseOption = async (req, res, next) => {
  req.assert('department_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const depart_exists = await Department.findOne({ _id: req.user.department_id });
    if (!depart_exists) return res.status(400).send('Invalid input');

    return res.render('dashboard/choose_option', {
      title: 'Choose your option',
      department_id: depart_exists._id,
      pic_id: req.user._id,
      pic_name: req.user.name.replace("'", "\\'"),
      access_lvl: req.user.access_level,
      csrf_token: res.locals.csrftoken,
    });
  } catch (err) {
    return log_err(err, false, req, res);
  }
};

// ========== SET NEW OPTION ==========

exports.setNewOption = async (req, res, next) => {
  req.assert('option_id', 'Invalid data').isMongoId();
  const errors = req.validationErrors();
  if (errors) return res.status(400).send(errors[0].msg);

  try {
    const option_exists = await School.findOne({ _id: req.params.option_id, department_id: req.user.department_id });
    if (!option_exists) return res.status(400).send('Invalid input');

    req.session.currentOption = option_exists._id;
    req.session.save();
    return res.end();
  } catch (err) {
    return log_err(err, false, req, res);
  }
};