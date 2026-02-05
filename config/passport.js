const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FbStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

const ConfigAuth = require('./auth');

module.exports = function(passport) {

  // Serialize and deserialize users (using async/await)
  passport.serializeUser((user, done) => {
    console.log('🔐 Serializing user:', user.email);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log('🔐 Deserializing user ID:', id);
    try {
      const user = await User.findById(id);
      if (user) console.log('✓ Deserialized user:', user.email);
      done(null, user);
    } catch (err) {
      console.log('❌ Deserialize error:', err);
      done(err, null);
    }
  });

  // ===================== LOCAL LOGIN =====================
  passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      console.log('\n🔍 ===== PASSPORT LOGIN ATTEMPT =====');
      console.log('Email received:', email);
      console.log('Password length:', password ? password.length : 0);
      
      const cleanEmail = email.toLowerCase().trim();
      console.log('Email (cleaned):', cleanEmail);
      
      // Use async/await instead of callbacks
      const user = await User.findOne({ email: cleanEmail });
      
      if (!user) {
        console.log('❌ User NOT FOUND with email:', cleanEmail);
        return done(null, false, { msg: 'Invalid email or password.' });
      }

      console.log('✓ User FOUND:');
      console.log('  - Name:', user.name);
      console.log('  - Email:', user.email);
      console.log('  - Access Level:', user.access_level);
      console.log('  - Enabled:', user.isEnabled);
      console.log('  - Validated:', user.isValidated);

      // Convert comparePassword callback to Promise
      const isMatch = await new Promise((resolve, reject) => {
        user.comparePassword(password, email, (err, match) => {
          if (err) reject(err);
          else resolve(match);
        });
      });

      console.log('🔑 Password match result:', isMatch);
      
      const guest = req.app.locals.access_level.GUEST;
      
      if (!user.isEnabled) {
        console.log('❌ User account is DISABLED');
        if (user.access_level == guest) {
          console.log('   Reason: Email not verified (GUEST account)');
          return done(null, false, { msg: 'Visit your email to confirm your account' });
        } else {
          console.log('   Reason: Account pending validation');
          return done(null, false, { msg: 'Please wait for your account validation' });
        }
      }
      
      if (isMatch) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('===== END PASSPORT LOGIN ATTEMPT =====\n');
        return done(null, user);
      }
      
      console.log('❌ PASSWORD MISMATCH');
      console.log('===== END PASSPORT LOGIN ATTEMPT =====\n');
      return done(null, false, { msg: 'Invalid email or password' });
      
    } catch (error) {
      console.log('❌ LOGIN ERROR:', error);
      console.log('===== END PASSPORT LOGIN ATTEMPT =====\n');
      return done(error, false, { msg: 'Service not available.' });
    }
  }));

  // ===================== LOCAL SIGNUP =====================
  passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      email = req.body.email.toLowerCase().trim();
      const name = req.body.name.toLowerCase().trim();
      const URN = req.body.URN.toLowerCase().trim();

      const results = await User.aggregate([
        { $match: { email: email } },
        { $group: { _id: { email: "$email" } } },
        { $limit: 1 }
      ]);

      if (results.length > 0 && results[0]._id.email === email) {
        return done(null, false, { msg: 'This email is already registered' });
      }

      const type = Number(req.body.type) + 2;
      if (type <= 2 || type > 7) {
        return done(null, false, { msg: 'You are not authorized to do this' });
      }

      let access_level = 100;
      let isEnabled = false;
      const class_id = req.body.class_id;

      switch(type){
        case 3: access_level = req.app.locals.access_level.TEACHER; break;
        case 4: access_level = req.app.locals.access_level.STUDENT; break;
        case 5: access_level = req.app.locals.access_level.PARENT; isEnabled = true; break;
        case 6: access_level = req.app.locals.access_level.GUEST; break;
      }

      if (access_level === 100) {
        return done(null, false, { msg: 'You are not authorized to do this' });
      }

      const newUser = new User({
        name: req.body.name,
        email,
        URN,
        password,
        school_id: req.body.school_id,
        department_id: req.body.department_id,
        phone_number: req.body.phone_number,
        access_level,
        gender: req.body.gender,
        isEnabled,
        class_id
      });

      await newUser.save();
      return done(null, newUser);
      
    } catch (error) {
      return done(error, false, { msg: 'Service not available' });
    }
  }));

  // ===================== GOOGLE LOGIN =====================
  if (!ConfigAuth.googleAuth || !ConfigAuth.googleAuth.clientID || !ConfigAuth.googleAuth.clientSecret) {
    console.error("Google OAuth credentials are missing in ConfigAuth.googleAuth");
  } else {
    passport.use(new GoogleStrategy({
      clientID: ConfigAuth.googleAuth.clientID,
      clientSecret: ConfigAuth.googleAuth.clientSecret,
      callbackURL: ConfigAuth.googleAuth.callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0].value;
        if (!email) {
          return done(null, false, { msg: 'No email found in Google profile' });
        }

        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { msg: 'This email is not registered' });
        }
        if (!user.isEnabled) {
          return done(null, false, { msg: 'Please wait for your account validation' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // ===================== FACEBOOK LOGIN =====================
  if (!ConfigAuth.facebookAuth || !ConfigAuth.facebookAuth.clientID || !ConfigAuth.facebookAuth.clientSecret) {
    console.error("Facebook OAuth credentials are missing in ConfigAuth.facebookAuth");
  } else {
    passport.use(new FbStrategy({
      clientID: ConfigAuth.facebookAuth.clientID,
      clientSecret: ConfigAuth.facebookAuth.clientSecret,
      callbackURL: ConfigAuth.facebookAuth.callbackURL,
      profileFields: ['id', 'emails', 'name']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0].value;
        if (!email) {
          return done(null, false, { msg: 'No email found in Facebook profile' });
        }

        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { msg: 'This email is not registered on eShuri platform' });
        }
        if (!user.isEnabled) {
          return done(null, false, { msg: 'Please wait for your account validation' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }
};