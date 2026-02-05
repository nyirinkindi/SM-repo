// ========================================
// routes/payment.routes.js
// ========================================
const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/payment');

// Payment routes (public)
router.get('/', paymentCtrl.getPaymentPage);
router.post('/post', paymentCtrl.postPayment);

module.exports = router;