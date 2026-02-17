'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * School Schema
 *
 * institution: 1=Option | 2=High School | 3=Primary | 4=Infant School
 * genderness:  1=Mixed  | 2=Boys        | 3=Girls
 * category:    1=All    | 2=Internal    | 3=External
 * partnership: 1=Private| 2=Public      | 3=Public-Private
 * curriculum:  1=REB    | 2=WDA         | 3=ANGL
 */
const SchoolSchema = new Schema({
  name:            { type: String, required: true,  maxlength: 100,  unique: true, lowercase: true, trim: true },
  cover_photo:     { type: String, required: true,  maxlength: 1000 },
  description:     { type: String, required: true,  maxlength: 140,  lowercase: true, trim: true },
  admin_mail:      { type: String, required: false, lowercase: true, trim: true,
                     match: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/ },
  term_name:       { type: String, required: true,  enum: ['S', 'T'],  uppercase: true, trim: true },
  term_quantity:   { type: Number, required: true,  min: 0 },
  retake_marks:    { type: Number, required: true,  min: 0, max: 100 },
  department_id:   { type: Schema.Types.ObjectId, required: false },

  /* Location / Classification */
  district_name:   { type: String, required: true,  maxlength: 50,  lowercase: true, trim: true },
  genderness:      { type: Number, required: true,  enum: [1, 2, 3] },
  category:        { type: Number, required: true,  enum: [1, 2, 3] },
  partnership:     { type: Number, required: true,  enum: [1, 2, 3] },
  institution:     { type: Number, required: true,  enum: [1, 2, 3, 4] },
  curriculum:      { type: Number, required: false, enum: [1, 2, 3] },

  /* Extra details */
  additional_information: { type: String, required: false },
  average_school_fees:    { type: Number, required: false },
  student_requirements:   { type: String, required: false },

  contact: {
    address:     { type: String, required: false },
    website:     { type: String, required: false },
    telephone:   { type: String, required: false },
    postal_code: { type: String, required: false },
  },

  stories: {
    success_stories: { type: String, required: false },
    icons:           { type: String, required: false },
  },

  gallery:        { type: [Schema.Types.Mixed], default: [] },
  other_programs: { type: String, required: false },
  years:          { type: Number, required: false },
  fees:           { type: Array,  required: false },
});

/**
 * Check whether a school with the given name already exists.
 * Returns a Promise — use with async/await or .then()/.catch()
 */
SchoolSchema.statics.checkSchoolExists = function (school) {
  return this.findOne({ name: school.name });
};

module.exports = mongoose.model('Schools', SchoolSchema);
