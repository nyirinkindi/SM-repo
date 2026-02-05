/**
 * routes/info.routes.js
 * Public information pages and static content
 */

const express = require('express');
const router = express.Router();

// Check if controller exists
let infoController;
try {
  infoController = require('../controllers/info');
} catch (err) {
  console.error('⚠️  Info controller not found, using fallback routes');
  infoController = {
    getMainPage: (req, res) => res.render('info/home', { title: 'eShuri', access_lvl: req.user }),
    getWelcomePage: (req, res) => res.render('info/home', { title: 'Welcome', access_lvl: req.user }),
    getPageAbout: (req, res) => res.render('info/about', { title: 'About' }),
    getTerms_Conditions: (req, res) => res.render('info/terms', { title: 'Terms & Conditions' }),
    getPage404: (req, res) => res.status(404).render('lost', { msg: 'Page not found' }),
  };
}

// Main landing page
router.get('/', infoController.getMainPage);

// Welcome/home page
router.get('/home', infoController.getWelcomePage);

// About page
router.get('/aboutme', infoController.getPageAbout);

// Terms and Conditions
router.get('/termsConditions', infoController.getTerms_Conditions);

module.exports = router;