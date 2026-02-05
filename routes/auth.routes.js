/**
 * routes/auth.routes.js
 * Authentication and account management routes
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../controllers/user');

// ========== PUBLIC AUTHENTICATION ROUTES ==========

// Sign in routes
router.get('/signin', userController.getPageSignIn);
router.post('/signin', userController.postSignIn);

// Sign up routes
router.get('/signup', userController.getPageSignUp);
router.post('/signup', userController.postSignUp);

// Email validation
router.get('/email/validation', userController.getValidateYourAccount);

// Resend verification email
router.post('/resendEmail_link', userController.postResendLink);

// Password recovery
router.post('/email_recover', userController.postForgotPassword);

// Password reset
router.get('/password/reset', userController.getResetPasswordPage);
router.post('/password/reset', userController.postResetPassword);

// ========== OAUTH ROUTES ==========

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['public_profile', 'email'] 
}));
router.get('/facebook/callback', userController.fbCallback);

// Google OAuth
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));
router.get('/google/callback', userController.googleCallback);

// ========== AUTHENTICATED USER ROUTES ==========

// Logout route - redirect to user logout
router.get('/logout', userController.logout);
router.post('/logout', userController.logout);


module.exports = router;