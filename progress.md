eShuri Super Admin Feature Implementation Roadmap
✅ COMPLETED FEATURES
Phase 0: Foundation & Authentication

 User Authentication - Login/Signup working
 Session Management - Passport.js with callback
 User Settings Page - Profile, password, email change
 Logout Functionality - Both GET and POST methods
 School List Dashboard - AngularJS integration working
 Base Layout - Pug templates with AngularJS


🚀 RECOMMENDED IMPLEMENTATION ORDER
Phase 1: Navigation & UI Foundation (NEXT - Priority 1)
Goal: Create consistent navigation and UI structure

Header/Navbar Component ⏳ IN PROGRESS

 Create reusable navbar partial
 Add user dropdown (Settings, Logout)
 Add role-based menu items
 Integrate into school.pug and other pages


Dashboard Layout Standardization

 Create consistent card layout system
 Standardize colors and spacing
 Create reusable components (buttons, modals, forms)



Estimated Time: 2-3 hours

Phase 2: University & Academic Structure (Priority 2)
Goal: Establish proper academic hierarchy
2.1 University Management

University Model & Schema

 Create University model (name, description, location, admin)
 Add relationships (has many faculties)


University CRUD Routes

 GET /dashboard/universities - List all universities
 GET /dashboard/universities/:id - View single university
 POST /dashboard/universities/add - Create university
 POST /dashboard/universities/update - Update university
 POST /dashboard/universities/delete - Delete university


University Dashboard UI

 Create /views/university/list.pug - University cards grid
 Create /views/university/detail.pug - Single university view
 Add CRUD forms with validation



2.2 Faculty Management

Faculty Model & Schema

 Create Faculty model (name, description, university_id)
 Add relationships (belongs to university, has many departments)


Faculty CRUD Routes

 GET /university/:uni_id/faculties - List faculties
 POST /faculty/add - Create faculty
 POST /faculty/update - Update faculty
 POST /faculty/delete - Delete faculty


Faculty UI

 Faculty management interface
 Assign faculty to university



2.3 Department Management

Department Model & Schema

 Create Department model (name, description, faculty_id)
 Add relationships (belongs to faculty, has many courses)


Department CRUD Routes

 GET /faculty/:faculty_id/departments - List departments
 POST /department/add - Create department
 POST /department/update - Update department
 POST /department/delete - Delete department


Department UI

 Department management interface
 Assign courses to departments



Estimated Time: 6-8 hours

Phase 3: School Management (Priority 3)
Goal: Complete school CRUD with proper UI
3.1 School Dashboard Enhancement

School List Improvements

 Display schools in card grid ✓ DONE
 Add filter by district
 Add filter by type (Primary, Secondary)
 Add search functionality enhancement
 Add pagination for large lists


School CRUD UI

 Create /views/school/add.pug - Add school form
 Create /views/school/edit.pug - Edit school form
 Add delete confirmation modal
 Add success/error notifications


School Detail Page

 View school profile
 Show statistics (students, teachers, classes)
 Display assigned admin
 Show classes list



Estimated Time: 4-5 hours

Phase 4: School Admin Management (Priority 4)
Goal: Assign and manage school administrators

School Admin Assignment

 Create route POST /school/:id/admin/assign
 Create route POST /school/:id/admin/remove
 Add validation (user must be admin or higher)


School Admin UI

 Add admin assignment form to school detail page
 Show current admin with profile
 Add "Change Admin" button
 List available admins dropdown



Estimated Time: 2-3 hours

Phase 5: Class Management (Priority 5)
Goal: Complete class CRUD for both schools and departments
5.1 School Classes

Class CRUD Routes

 GET /school/:school_id/classes - List classes
 POST /class/add - Create class
 POST /class/update - Update class
 POST /class/delete - Delete class


Class UI

 Classes grid view
 Add/Edit class modal
 Assign students to class
 Assign teachers to class



5.2 Department Classes

Similar CRUD for department classes

 Connect to department instead of school
 Handle university-specific logic



Estimated Time: 5-6 hours

Phase 6: Course Management (Priority 6)
Goal: Manage courses within classes

Course Model & Schema

 Create Course model (name, code, class_id, teacher_id)
 Add relationships


Course CRUD Routes

 GET /class/:class_id/courses - List courses
 POST /course/add - Create course
 POST /course/update - Update course
 POST /course/delete - Delete course


Course UI

 Course list with teacher assigned
 Add/Edit course form
 Assign teacher to course
 View course details



Estimated Time: 5-6 hours

Phase 7: Content Management System (Priority 7)
Goal: Upload and manage educational content
7.1 File Upload System

Content Model & Schema

 Create Content model (title, type, file_path, course_id)
 Support types: PDF, DOCX, PPT, TXT, Video, Audio, Images


File Upload Configuration

 Setup Multer for file uploads
 Configure storage (local/cloud)
 Set file size limits
 Validate file types


Content CRUD Routes

 POST /content/upload - Upload file
 GET /course/:course_id/contents - List contents
 POST /content/update - Update content metadata
 POST /content/delete - Delete content & file
 GET /content/download/:id - Download content


Content UI

 Drag-and-drop upload interface
 Content library grid view
 Preview for images/PDFs
 Video/audio player
 Download button



Estimated Time: 8-10 hours

Phase 8: User Account Management (Priority 8)
Goal: Approve/deny pending user accounts

Pending Users System

 Add isApproved field to User model
 Create route GET /dashboard/pending-users - List pending
 Create route POST /user/approve/:id - Approve user
 Create route POST /user/deny/:id - Deny user
 Send notification emails


Pending Users UI

 Dashboard card showing pending count
 Pending users list page
 User details modal
 Approve/Deny buttons
 Bulk approve functionality



Estimated Time: 4-5 hours

Phase 9: User Management (Priority 9)
Goal: Complete user CRUD and management

User CRUD Enhancement

 User list already exists ✓
 Enhanced user search/filter
 Edit user details
 Reset user password
 Enable/Disable user account
 Change user role


User Management UI

 User table with sorting
 User detail modal
 Edit user form
 Role change dropdown
 Action buttons (Edit, Reset, Delete)



Estimated Time: 4-5 hours

📊 SUGGESTED ARCHITECTURE
Database Schema Hierarchy
University
  ├── Faculty
  │     ├── Department
  │     │     ├── Classes
  │     │     │     └── Courses
  │     │     │           └── Contents
  │     │     └── Students
  │     └── Faculty Admin
  └── University Admin

School (Independent)
  ├── Classes
  │     ├── Courses
  │     │     └── Contents
  │     └── Students
  ├── Teachers
  └── School Admin
Recommended Model Relationships
javascript// University Model
{
  name: String,
  description: String,
  location: String,
  admin_id: ObjectId (ref: User),
  faculties: [ObjectId] (ref: Faculty),
  created_at: Date
}

// Faculty Model
{
  name: String,
  description: String,
  university_id: ObjectId (ref: University),
  departments: [ObjectId] (ref: Department),
  dean_id: ObjectId (ref: User)
}

// Department Model
{
  name: String,
  faculty_id: ObjectId (ref: Faculty),
  head_id: ObjectId (ref: User),
  classes: [ObjectId] (ref: Class)
}

// School Model (Already exists)
{
  name: String,
  type: String, // 'primary', 'secondary'
  district: String,
  admin_id: ObjectId (ref: User),
  classes: [ObjectId] (ref: Class)
}

// Class Model (Polymorphic - can belong to School or Department)
{
  name: String,
  owner_type: String, // 'School' or 'Department'
  owner_id: ObjectId,
  courses: [ObjectId] (ref: Course),
  students: [ObjectId] (ref: User)
}

// Course Model
{
  name: String,
  code: String,
  class_id: ObjectId (ref: Class),
  teacher_id: ObjectId (ref: User),
  contents: [ObjectId] (ref: Content)
}

// Content Model
{
  title: String,
  description: String,
  type: String, // 'pdf', 'docx', 'ppt', 'video', 'audio', 'image', 'txt'
  file_path: String,
  file_size: Number,
  course_id: ObjectId (ref: Course),
  uploaded_by: ObjectId (ref: User),
  created_at: Date
}

// User Model (Enhanced)
{
  name: String,
  email: String,
  role: Number, // 1=SuperAdmin, 2=Admin, 3=Teacher, 4=Student, 5=Parent
  school_id: ObjectId (ref: School),
  department_id: ObjectId (ref: Department),
  class_id: ObjectId (ref: Class),
  isApproved: Boolean, // For account approval
  isEnabled: Boolean,
  isValidated: Boolean
}

🎯 PERFORMANCE OPTIMIZATION STRATEGIES
1. Database Indexing
javascript// Add indexes to frequently queried fields
User.index({ email: 1, school_id: 1 });
School.index({ district: 1, type: 1 });
Class.index({ owner_id: 1, owner_type: 1 });
Course.index({ class_id: 1, teacher_id: 1 });
Content.index({ course_id: 1, type: 1 });
2. Pagination

Implement pagination for all lists (schools, users, classes, courses, content)
Use skip/limit with proper indexing
Display 20-50 items per page

3. Caching

Cache school lists, statistics
Use Redis for session storage
Cache user permissions

4. File Optimization

Compress uploaded files
Generate thumbnails for images
Use CDN for static content
Implement lazy loading for content

5. Query Optimization

Use .lean() for read-only operations
Select only needed fields
Use aggregation for statistics
Avoid N+1 queries with proper population


📁 RECOMMENDED FOLDER STRUCTURE
controllers/
  ├── user.js ✓
  ├── school.js ✓
  ├── university.js (NEW)
  ├── faculty.js (NEW)
  ├── department.js (NEW)
  ├── class.js ✓
  ├── course.js ✓
  ├── content.js ✓
  └── dashboard.js ✓

routes/
  ├── user.routes.js ✓
  ├── school.routes.js ✓
  ├── university.routes.js (NEW)
  ├── faculty.routes.js (NEW)
  ├── department.routes.js (NEW)
  ├── class.routes.js ✓
  ├── course.routes.js ✓
  ├── content.routes.js ✓
  └── dashboard.routes.js ✓

models/
  ├── User.js ✓
  ├── School.js ✓
  ├── University.js (NEW)
  ├── Faculty.js (NEW)
  ├── Department.js (NEW)
  ├── Class.js ✓
  ├── Course.js ✓
  └── Content.js ✓

views/
  ├── layout.pug ✓
  ├── partials/
  │   ├── header.pug (NEEDS UPDATE)
  │   ├── sidebar.pug (NEW)
  │   └── footer.pug
  ├── dashboard/
  │   └── index.pug ✓
  ├── school/
  │   ├── list.pug ✓ (school.pug)
  │   ├── add.pug (NEW)
  │   ├── edit.pug (NEW)
  │   └── detail.pug (NEW)
  ├── university/
  │   ├── list.pug (NEW)
  │   ├── detail.pug (NEW)
  │   └── manage.pug (NEW)
  ├── user/
  │   ├── settings.pug ✓
  │   ├── list.pug (ENHANCE)
  │   └── pending.pug (NEW)
  └── content/
      ├── library.pug (NEW)
      └── upload.pug (NEW)

✅ CHECKPOINT TRACKING
Legend

✅ Completed & Tested
⏳ In Progress
⚠️ Needs Review
❌ Blocked/Issue
⏸️ Paused
📝 Planned

Current Status: Phase 1 - Navigation & UI Foundation
Last Updated: January 8, 2026
Current Phase: Phase 1 (Navigation)
Next Milestone: Complete Header/Navbar Component

🎯 IMMEDIATE NEXT STEPS (Today)

⏳ Create reusable navbar component with:

User dropdown (Settings, Logout)
Super Admin menu (Schools, Universities, Users, Content)
Responsive design


⏳ Integrate navbar into school.pug
⏳ Test navbar functionality

Estimated Time: 1-2 hours

📞 NEED HELP?
Mark items with:

❓ Need clarification
🐛 Bug found
💡 Improvement idea
🔥 Critical issue


This checkpoint file will be updated after each completed phase.