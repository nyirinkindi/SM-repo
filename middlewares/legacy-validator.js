/**
 * Legacy Express Validator Middleware
 * Implements req.assert() and req.validationErrors()
 * Compatible with express-validator v3.x API
 */

function legacyValidator(req, res, next) {
  // Initialize validation errors array
  req._validations = [];
  
  /**
   * req.assert() - Returns a chainable validator object
   * @param {string} field - The field to validate
   * @param {string} message - Error message if validation fails
   */
  req.assert = function(field, message) {
    const validator = {
      notEmpty: function() {
        let value = null;
        if (req.body && field in req.body) value = req.body[field];
        else if (req.params && field in req.params) value = req.params[field];
        else if (req.query && field in req.query) value = req.query[field];
        
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      len: function(min, max) {
        let value = '';
        if (req.body && field in req.body) value = req.body[field];
        else if (req.params && field in req.params) value = req.params[field];
        else if (req.query && field in req.query) value = req.query[field];
        
        const strValue = String(value);
        if (strValue.length < min || (max && strValue.length > max)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isEmail: function() {
        let value = '';
        if (req.body && field in req.body) value = req.body[field];
        else if (req.params && field in req.params) value = req.params[field];
        else if (req.query && field in req.query) value = req.query[field];
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isMongoId: function() {
        // Safely get value from any source
        let value = '';
        if (req.body && req.body[field]) value = req.body[field];
        else if (req.params && req.params[field]) value = req.params[field];
        else if (req.query && req.query[field]) value = req.query[field];
        
        const mongoIdRegex = /^[a-f\d]{24}$/i;
        if (!value || !mongoIdRegex.test(String(value))) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isIn: function(values) {
        let value = null;
        if (req.body && field in req.body) value = req.body[field];
        else if (req.params && field in req.params) value = req.params[field];
        else if (req.query && field in req.query) value = req.query[field];
        
        if (!values.includes(value) && !values.includes(Number(value))) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      },
      
      isInt: function(options = {}) {
        let value = null;
        if (req.body && field in req.body) value = req.body[field];
        else if (req.params && field in req.params) value = req.params[field];
        else if (req.query && field in req.query) value = req.query[field];
        
        const num = parseInt(value);
        if (isNaN(num)) {
          req._validations.push({ param: field, msg: message });
        } else {
          if (options.min !== undefined && num < options.min) {
            req._validations.push({ param: field, msg: message });
          }
          if (options.max !== undefined && num > options.max) {
            req._validations.push({ param: field, msg: message });
          }
        }
        return validator;
      },
      
      isFloat: function(options = {}) {
        let value = null;
        if (req.body && field in req.body) value = req.body[field];
        else if (req.params && field in req.params) value = req.params[field];
        else if (req.query && field in req.query) value = req.query[field];
        
        const num = parseFloat(value);
        if (isNaN(num)) {
          req._validations.push({ param: field, msg: message });
        } else {
          if (options.min !== undefined && num < options.min) {
            req._validations.push({ param: field, msg: message });
          }
          if (options.max !== undefined && num > options.max) {
            req._validations.push({ param: field, msg: message });
          }
        }
        return validator;
      },
      
      equals: function(comparison) {
        let value = null;
        if (req.body && field in req.body) value = req.body[field];
        else if (req.params && field in req.params) value = req.params[field];
        else if (req.query && field in req.query) value = req.query[field];
        
        if (value !== comparison && String(value) !== String(comparison)) {
          req._validations.push({ param: field, msg: message });
        }
        return validator;
      }
    };
    
    return validator;
  };
  
  /**
   * req.validationErrors() - Returns validation errors or false
   * @returns {Array|false} Array of errors or false if no errors
   */
  req.validationErrors = function() {
    return req._validations && req._validations.length > 0 ? req._validations : false;
  };
  
  next();
}

module.exports = { legacyValidator };