# Model Refactoring Guide — Mongoose 7+ / 9.x Compatibility

## Root Cause

Mongoose **7.0** removed the ability to pass a callback as the last argument to query
methods such as `findOne()`, `find()`, `updateOne()`, etc.  
Any call like `Model.findOne({ ... }, (err, doc) => { ... })` now throws:

```
MongooseError: Model.findOne() no longer accepts a callback
```

---

## What Changed in Every File

### Pattern removed (old — broken on Mongoose 7+)

```js
MySchema.statics.checkExists = function (data, cb) {
  this.findOne({ name: data.name }, (err, doc) => {
    cb(err, doc);   // ← callback argument no longer supported
  });
};
```

### Pattern used (new — works on Mongoose 7 / 8 / 9)

```js
MySchema.statics.checkExists = function (data) {
  return this.findOne({ name: data.name }); // returns a Promise
};
```

All callers in your controllers **must** be updated to use `await` or `.then()`:

```js
// Old caller code
Model.checkExists(data, (err, existing) => {
  if (err) return next(err);
  if (existing) { /* ... */ }
});

// New caller code
const existing = await Model.checkExists(data);
if (existing) { /* ... */ }
```

### Empty `pre('save')` hooks removed

```js
// Removed — does nothing, just adds noise
MySchema.pre('save', function (next) { next(); });
```

Only `pre('save')` hooks that actually **do work** (e.g. hashing a password,
validating quotas) are kept.

---

## File-by-file Summary

| File | Change |
|------|--------|
| `Application.js` | `checkApplicationExists` static: removed callback param, now returns Promise |
| `Classe.js` | Removed empty `pre('save')`; cleaned up formatting |
| `Content.js` | Removed empty `pre('save')`; fixed duplicate `index: false` on `source_question` |
| `Course.js` | `checkCourseExists` static: removed callback, now returns Promise; `pre('save')` now calls `next(new Error(...))` instead of `throw` |
| `Department.js` | Already modern — cleaned up `created_at`/`updated_at` to use built-in `timestamps` option |
| `ErrorLog.js` | Removed empty `pre('save')`; cleaned up `Schema.Types.Object` → `Schema.Types.Mixed` |
| `Faculty.js` | Already modern — switched to `timestamps` option, removed manual date fields |
| `FailedMail.js` | Removed empty `pre('save')` |
| `Finalist.js` | Removed empty `pre('save')` |
| `Library.js` | Removed empty `pre('save')` |
| `MARKS.js` | Removed empty `pre('save')` |
| `Notification.js` | Removed empty `pre('save')` |
| `Parenting.js` | Removed empty `pre('save')`; added explicit `enum` on `allowed` field |
| `Payment.js` | Removed empty `pre('save')`; added `timestamps`; fixed email regex escape |
| `Publication.js` | Removed empty `pre('save')`; fixed `likes` default (`0` → `[]`); `category` type `String` → `Number` |
| `School.js` | `checkSchoolExists` static: removed callback, now returns Promise; removed empty `pre('save')` |
| `SchoolCourse.js` | `checkCourseExists` static: removed callback, now returns Promise |
| `SchoolProgram.js` | `checkProgramExists` static: removed callback, now returns Promise |
| `Token.js` | Removed empty `pre('save')` |
| `Unit.js` | `checkExistence` static: removed callback, now returns Promise |
| `University.js` | Already modern — switched to `timestamps` option |
| `User.js` | No query callbacks here; `comparePassword` keeps its bcrypt callback intentionally (Passport.js requires it) |

---

## How to Update Callers in Controllers

Search your controllers and routes for any call to the statics listed above and
update them.  A quick grep:

```bash
grep -rn "checkApplicationExists\|checkCourseExists\|checkSchoolExists\|checkProgramExists\|checkExistence" ./controllers ./routes
```

### Example — before

```js
Course.checkCourseExists(courseData, (err, existing) => {
  if (err) return res.status(500).json({ error: err });
  if (existing) return res.status(409).json({ error: 'Course already exists' });
  // ...create course...
});
```

### Example — after

```js
try {
  const existing = await Course.checkCourseExists(courseData);
  if (existing) return res.status(409).json({ error: 'Course already exists' });
  // ...create course...
} catch (err) {
  return res.status(500).json({ error: err.message });
}
```

---

## Notes

- **`Message.js`** was already fully modernised in your project — no changes needed.
- **`Department.js`**, **`Faculty.js`**, **`University.js`** were already modern — only minor clean-ups applied.
- The `User.comparePassword` method **keeps its bcrypt callback** on purpose: Passport.js's LocalStrategy expects this exact signature.
