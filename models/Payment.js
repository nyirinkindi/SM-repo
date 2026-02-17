'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Payment Schema
 * Records payment transactions for school programs.
 *
 * status: -1 = Unsuccessful | 0 = Pending | 1 = Successful
 */
const PaymentSchema = new Schema({
  student_URN:  { type: String, required: true,  maxlength: 100, lowercase: true, trim: true },
  school_name:  { type: String, required: true },
  amount:       { type: Number, required: true },
  status:       { type: Number, required: true,  default: 0, enum: [-1, 0, 1] },
  email:        { type: String, required: false, lowercase: true, trim: true,
                  match: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/ },
  phone_number: { type: String, required: false },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Payments', PaymentSchema);
